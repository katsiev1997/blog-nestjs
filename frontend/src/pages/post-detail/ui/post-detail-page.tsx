import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { CommentComposer, CommentItem } from "@/entities/comment";
import { UserAvatar, UserName } from "@/entities/user";
import {
  COMMENT_QUERIES,
  createComment,
  POST_QUERIES,
  type Comment,
} from "@/shared/api";
import { useSession } from "@/shared/auth";
import { estimateReadMinutes, formatPostDate } from "@/shared/lib/format";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import { Skeleton } from "@/shared/ui/skeleton";

function buildCommentTree(items: Comment[]) {
  const byParent = new Map<number | null, Comment[]>();
  for (const item of items) {
    const key = item.parentId;
    const list = byParent.get(key) ?? [];
    list.push(item);
    byParent.set(key, list);
  }
  return byParent;
}

function CommentBranch({
  parentId,
  byParent,
  depth,
  onReply,
}: {
  parentId: number | null;
  byParent: Map<number | null, Comment[]>;
  depth: number;
  onReply: (id: number) => void;
}) {
  const children = byParent.get(parentId) ?? [];
  return (
    <>
      {children.map((comment) => (
        <div key={comment.id} className="flex flex-col gap-4">
          <CommentItem comment={comment} depth={depth} onReply={onReply} />
          <CommentBranch
            parentId={comment.id}
            byParent={byParent}
            depth={depth + 1}
            onReply={onReply}
          />
        </div>
      ))}
    </>
  );
}

export function PostDetailPage() {
  const { id } = useParams();
  const postId = Number(id);
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [commentPage, setCommentPage] = useState(1);

  const postQuery = useQuery({
    ...POST_QUERIES.detail(postId),
    enabled: Number.isFinite(postId),
  });

  const commentsQuery = useQuery({
    ...COMMENT_QUERIES.list(postId, commentPage),
    enabled: Number.isFinite(postId),
  });

  const createMutation = useMutation({
    mutationFn: createComment,
    onSuccess: async () => {
      setReplyTo(null);
      await queryClient.invalidateQueries({ queryKey: COMMENT_QUERIES.all() });
    },
  });

  const tree = useMemo(
    () => buildCommentTree(commentsQuery.data?.items ?? []),
    [commentsQuery.data?.items],
  );

  if (!Number.isFinite(postId)) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Invalid post</AlertTitle>
        <AlertDescription>The post id in the URL is invalid.</AlertDescription>
      </Alert>
    );
  }

  if (postQuery.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!postQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Post not found</AlertTitle>
        <AlertDescription>This post may have been deleted.</AlertDescription>
      </Alert>
    );
  }

  const post = postQuery.data;
  const isOwner = user?.id === post.userId;

  return (
    <article className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <UserAvatar userId={post.userId} />
            <div className="flex flex-col">
              <UserName userId={post.userId} />
              <p className="text-muted-foreground text-sm">
                {formatPostDate(post.createdAt)} ·{" "}
                {estimateReadMinutes(post.content)} min read
              </p>
            </div>
          </div>
          {isOwner ? (
            <Button
              variant="outline"
              size="sm"
              render={<Link to={`/posts/${post.id}/edit`} />}
              nativeButton={false}
            >
              Edit
            </Button>
          ) : null}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{post.title}</h1>
        {post.imageUrl ? (
          <img
            src={post.imageUrl}
            alt=""
            className="max-h-80 w-full rounded-lg object-cover"
          />
        ) : null}
        <div className="prose prose-neutral max-w-none whitespace-pre-wrap text-base leading-relaxed">
          {post.content}
        </div>
      </div>

      <Separator />

      <section className="flex flex-col gap-6">
        <h2 className="text-xl font-semibold">Comments</h2>

        {user ? (
          <CommentComposer
            postId={postId}
            parentId={replyTo}
            onCancelReply={() => setReplyTo(null)}
            isPending={createMutation.isPending}
            onSubmit={async (content) => {
              await createMutation.mutateAsync({
                content,
                postId,
                parentId: replyTo ?? undefined,
              });
            }}
          />
        ) : (
          <p className="text-muted-foreground text-sm">
            <Link to="/login" className="font-medium underline">
              Log in
            </Link>{" "}
            to leave a comment.
          </p>
        )}

        {commentsQuery.isLoading ? <Skeleton className="h-24 w-full" /> : null}

        <div className="flex flex-col gap-4">
          <CommentBranch
            parentId={null}
            byParent={tree}
            depth={0}
            onReply={setReplyTo}
          />
        </div>

        {commentsQuery.data &&
        (commentsQuery.data.hasMore || commentPage > 1) ? (
          <div className="flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={commentPage <= 1}
              onClick={() => setCommentPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm">{commentPage}</span>
            <Button
              type="button"
              variant="outline"
              disabled={!commentsQuery.data.hasMore}
              onClick={() => setCommentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </section>
    </article>
  );
}

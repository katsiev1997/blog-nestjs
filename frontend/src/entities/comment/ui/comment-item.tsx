import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { deleteComment, COMMENT_QUERIES, type Comment } from "@/shared/api";
import { useSession } from "@/shared/auth";
import { formatPostDate } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { UserAvatar, UserName } from "@/entities/user";

type CommentItemProps = {
  comment: Comment;
  depth?: number;
  onReply?: (parentId: number) => void;
};

export function CommentItem({
  comment,
  depth = 0,
  onReply,
}: CommentItemProps) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const remove = useMutation({
    mutationFn: () => deleteComment(comment.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: COMMENT_QUERIES.all() });
    },
  });

  const isOwner = user?.id === comment.userId;

  return (
    <div
      className="flex flex-col gap-2 border-l border-border pl-4"
      style={{ marginLeft: depth * 16 }}
    >
      <div className="flex items-center gap-2">
        <UserAvatar userId={comment.userId} className="size-7" />
        <UserName userId={comment.userId} className="text-sm" />
        <span className="text-muted-foreground text-xs">
          {formatPostDate(comment.createdAt)}
        </span>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {comment.content}
      </p>
      <div className="flex items-center gap-2">
        {user && onReply ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onReply(comment.id)}
          >
            Reply
          </Button>
        ) : null}
        {isOwner ? (
          confirmDelete ? (
            <>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={remove.isPending}
                onClick={() => remove.mutate()}
              >
                Confirm
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          )
        ) : null}
      </div>
    </div>
  );
}

type CommentComposerProps = {
  postId: number;
  parentId?: number | null;
  onCancelReply?: () => void;
  onSubmit: (content: string) => Promise<void> | void;
  isPending?: boolean;
};

export function CommentComposer({
  parentId,
  onCancelReply,
  onSubmit,
  isPending,
}: CommentComposerProps) {
  const [content, setContent] = useState("");

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const value = content.trim();
        if (!value) return;
        void Promise.resolve(onSubmit(value)).then(() => setContent(""));
      }}
    >
      {parentId ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Replying to comment #{parentId}</span>
          {onCancelReply ? (
            <Button type="button" variant="ghost" size="sm" onClick={onCancelReply}>
              Cancel
            </Button>
          ) : null}
        </div>
      ) : null}
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Write a comment…"
        rows={3}
        required
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || !content.trim()}>
          Post comment
        </Button>
      </div>
    </form>
  );
}

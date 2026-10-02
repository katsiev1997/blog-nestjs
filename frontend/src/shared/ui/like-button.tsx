import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HeartIcon } from "lucide-react";
import {
  COMMENT_QUERIES,
  POST_QUERIES,
  toggleCommentLike,
  togglePostLike,
  type Paginated,
  type Post,
  type Comment,
} from "@/shared/api";
import { useSession } from "@/shared/auth";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

type LikeButtonProps = {
  target: "post" | "comment";
  id: number;
  likeCount: number;
  likedByMe: boolean;
  className?: string;
};

export function LikeButton({
  target,
  id,
  likeCount,
  likedByMe,
  className,
}: LikeButtonProps) {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      target === "post" ? togglePostLike(id) : toggleCommentLike(id),
    onMutate: async () => {
      if (target === "post") {
        await queryClient.cancelQueries({ queryKey: POST_QUERIES.all() });
        const previousDetail = queryClient.getQueryData<Post>(
          POST_QUERIES.detail(id).queryKey,
        );
        const previousLists = queryClient.getQueriesData<Paginated<Post>>({
          queryKey: POST_QUERIES.lists(),
        });

        const nextLiked = !likedByMe;
        const nextCount = Math.max(0, likeCount + (nextLiked ? 1 : -1));

        if (previousDetail) {
          queryClient.setQueryData<Post>(POST_QUERIES.detail(id).queryKey, {
            ...previousDetail,
            likedByMe: nextLiked,
            likeCount: nextCount,
          });
        }

        for (const [key, data] of previousLists) {
          if (!data) continue;
          queryClient.setQueryData<Paginated<Post>>(key, {
            ...data,
            items: data.items.map((post) =>
              post.id === id
                ? { ...post, likedByMe: nextLiked, likeCount: nextCount }
                : post,
            ),
          });
        }

        return { previousDetail, previousLists };
      }

      await queryClient.cancelQueries({ queryKey: COMMENT_QUERIES.all() });
      const previousComments = queryClient.getQueriesData<Paginated<Comment>>({
        queryKey: COMMENT_QUERIES.all(),
      });
      const nextLiked = !likedByMe;
      const nextCount = Math.max(0, likeCount + (nextLiked ? 1 : -1));

      for (const [key, data] of previousComments) {
        if (!data) continue;
        queryClient.setQueryData<Paginated<Comment>>(key, {
          ...data,
          items: data.items.map((comment) =>
            comment.id === id
              ? { ...comment, likedByMe: nextLiked, likeCount: nextCount }
              : comment,
          ),
        });
      }

      return { previousComments };
    },
    onError: (_error, _vars, context) => {
      if (target === "post" && context && "previousDetail" in context) {
        if (context.previousDetail) {
          queryClient.setQueryData(
            POST_QUERIES.detail(id).queryKey,
            context.previousDetail,
          );
        }
        for (const [key, data] of context.previousLists ?? []) {
          queryClient.setQueryData(key, data);
        }
        return;
      }

      if (context && "previousComments" in context) {
        for (const [key, data] of context.previousComments ?? []) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: async () => {
      if (target === "post") {
        await queryClient.invalidateQueries({ queryKey: POST_QUERIES.all() });
      } else {
        await queryClient.invalidateQueries({
          queryKey: COMMENT_QUERIES.all(),
        });
      }
    },
  });

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={!user || mutation.isPending}
      className={cn(className)}
      onClick={() => {
        if (!user) return;
        mutation.mutate();
      }}
      aria-pressed={likedByMe}
      aria-label={likedByMe ? "Unlike" : "Like"}
    >
      <HeartIcon
        data-icon="inline-start"
        className={cn(likedByMe && "fill-current text-red-500")}
      />
      {likeCount}
    </Button>
  );
}

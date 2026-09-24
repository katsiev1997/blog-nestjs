import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { PostCard } from "@/entities/post";
import { POST_QUERIES } from "@/shared/api";
import { Button } from "@/shared/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/shared/ui/empty";
import { Skeleton } from "@/shared/ui/skeleton";

export function PostsFeedPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const { data, isLoading, isFetching } = useQuery(POST_QUERIES.list(page));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">Posts</h1>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : null}

      {!isLoading && data?.items.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No posts yet</EmptyTitle>
            <EmptyDescription>
              Be the first to publish something.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      <div className="flex flex-col gap-4">
        {data?.items.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {data && (data.hasMore || page > 1) ? (
        <div className="flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={page <= 1 || isFetching}
            onClick={() => setParams({ page: String(page - 1) })}
          >
            Previous
          </Button>
          <span className="inline-flex size-8 items-center justify-center rounded-md border border-border text-sm font-medium">
            {page}
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={!data.hasMore || isFetching}
            onClick={() => setParams({ page: String(page + 1) })}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}

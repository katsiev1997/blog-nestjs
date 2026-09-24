import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { PostCard } from "@/entities/post";
import { POST_QUERIES, USER_QUERIES } from "@/shared/api";
import { getInitials } from "@/shared/lib/format";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Skeleton } from "@/shared/ui/skeleton";

export function ProfileUserPage() {
  const { id } = useParams();
  const userId = Number(id);
  const userQuery = useQuery({
    ...USER_QUERIES.detail(userId),
    enabled: Number.isFinite(userId),
  });
  const postsQuery = useQuery(POST_QUERIES.list(1));

  if (!Number.isFinite(userId)) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Invalid user</AlertTitle>
        <AlertDescription>The user id in the URL is invalid.</AlertDescription>
      </Alert>
    );
  }

  if (userQuery.isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (!userQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>User not found</AlertTitle>
        <AlertDescription>This profile does not exist.</AlertDescription>
      </Alert>
    );
  }

  const user = userQuery.data;
  const posts =
    postsQuery.data?.items.filter((post) => post.userId === user.id) ?? [];

  return (
    <div className="flex flex-col gap-8">
      <section className="flex items-center gap-4">
        <Avatar className="size-16">
          {user.imageUrl ? (
            <AvatarImage src={user.imageUrl} alt={user.name} />
          ) : null}
          <AvatarFallback className="text-lg">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">{user.name}</h1>
          <p className="text-muted-foreground text-sm">@{user.username}</p>
          <p className="text-muted-foreground text-sm">Age {user.age}</p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Posts</h2>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {!postsQuery.isLoading && posts.length === 0 ? (
          <p className="text-muted-foreground text-sm">No posts yet.</p>
        ) : null}
      </section>
    </div>
  );
}

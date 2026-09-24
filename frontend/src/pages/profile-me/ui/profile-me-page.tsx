import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { PostCard } from "@/entities/post";
import { POST_QUERIES } from "@/shared/api";
import { useSession } from "@/shared/auth";
import { getInitials } from "@/shared/lib/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

export function ProfileMePage() {
  const { user, isLoading } = useSession();
  const postsQuery = useQuery(POST_QUERIES.list(1));

  if (isLoading || !user) {
    return <Skeleton className="h-48 w-full" />;
  }

  const myPosts =
    postsQuery.data?.items.filter((post) => post.userId === user.id) ?? [];

  return (
    <div className="flex flex-col gap-8">
      <section className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
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
            <p className="text-muted-foreground text-sm">
              {user.email} · age {user.age}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          render={<Link to="/profile/edit" />}
          nativeButton={false}
        >
          Edit profile
        </Button>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Your posts</h2>
        {postsQuery.isLoading ? <Skeleton className="h-32 w-full" /> : null}
        {myPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {!postsQuery.isLoading && myPosts.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            You have not published any posts on this page yet.
          </p>
        ) : null}
      </section>
    </div>
  );
}

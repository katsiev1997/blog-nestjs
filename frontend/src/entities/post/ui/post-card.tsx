import { Link } from "react-router";
import type { Post } from "@/shared/api";
import { estimateReadMinutes, formatPostDate } from "@/shared/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { UserAvatar, UserName } from "@/entities/user";

type PostCardProps = {
  post: Post;
};

export function PostCard({ post }: PostCardProps) {
  const excerpt =
    post.content.length > 160
      ? `${post.content.slice(0, 160).trimEnd()}…`
      : post.content;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <UserAvatar userId={post.userId} />
          <div className="flex min-w-0 flex-col">
            <UserName userId={post.userId} />
            <CardDescription>
              {formatPostDate(post.createdAt)} · {estimateReadMinutes(post.content)}{" "}
              min read
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <CardTitle className="text-xl">
          <Link to={`/posts/${post.id}`} className="hover:underline">
            {post.title}
          </Link>
        </CardTitle>
        <p className="text-muted-foreground text-sm leading-relaxed">{excerpt}</p>
      </CardContent>
      <CardFooter className="justify-end">
        <Link
          to={`/posts/${post.id}`}
          className="text-sm font-medium hover:underline"
        >
          Read more
        </Link>
      </CardFooter>
    </Card>
  );
}

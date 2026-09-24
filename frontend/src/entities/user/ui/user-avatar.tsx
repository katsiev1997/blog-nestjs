import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { USER_QUERIES } from "@/shared/api";
import { getInitials } from "@/shared/lib/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/lib/utils";

type UserAvatarProps = {
  userId: number;
  className?: string;
  link?: boolean;
};

export function UserAvatar({ userId, className, link = true }: UserAvatarProps) {
  const { data: user, isLoading } = useQuery(USER_QUERIES.detail(userId));

  if (isLoading) {
    return <Skeleton className={cn("size-8 rounded-full", className)} />;
  }

  const content = (
    <Avatar className={cn("size-8", className)}>
      {user?.imageUrl ? <AvatarImage src={user.imageUrl} alt={user.name} /> : null}
      <AvatarFallback>{getInitials(user?.name ?? "?")}</AvatarFallback>
    </Avatar>
  );

  if (!link || !user) return content;

  return (
    <Link to={`/users/${user.id}`} className="inline-flex shrink-0">
      {content}
    </Link>
  );
}

type UserNameProps = {
  userId: number;
  className?: string;
};

export function UserName({ userId, className }: UserNameProps) {
  const { data: user, isLoading } = useQuery(USER_QUERIES.detail(userId));

  if (isLoading) {
    return <Skeleton className="h-4 w-24" />;
  }

  if (!user) return <span className={className}>Unknown</span>;

  return (
    <Link
      to={`/users/${user.id}`}
      className={cn("font-medium hover:underline", className)}
    >
      {user.name}
    </Link>
  );
}

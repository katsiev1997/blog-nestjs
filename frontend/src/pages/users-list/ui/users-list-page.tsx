import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";
import { USER_QUERIES } from "@/shared/api";
import { getInitials } from "@/shared/lib/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/shared/ui/empty";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";

export function UsersListPage() {
  const [username, setUsername] = useState("");
  const query = useQuery(USER_QUERIES.search(username.trim()));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">Users</h1>
      <Input
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        placeholder="Search by username…"
      />

      {username.trim().length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Search users</EmptyTitle>
            <EmptyDescription>
              Type a username to find people on Blog.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      {query.isFetching ? <Skeleton className="h-24 w-full" /> : null}

      {!query.isFetching && username.trim() && query.data?.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No matches</EmptyTitle>
            <EmptyDescription>
              Try a different username fragment.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      <ul className="flex flex-col gap-3">
        {query.data?.map((user) => (
          <li key={user.id}>
            <Link
              to={`/users/${user.id}`}
              className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/40"
            >
              <Avatar>
                {user.imageUrl ? (
                  <AvatarImage src={user.imageUrl} alt={user.name} />
                ) : null}
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="font-medium">{user.name}</span>
                <span className="text-muted-foreground text-sm">
                  @{user.username}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

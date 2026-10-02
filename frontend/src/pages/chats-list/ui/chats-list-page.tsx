import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link } from "react-router";
import { CHAT_QUERIES, getChatSocket } from "@/shared/api";
import { formatPostDate, getInitials } from "@/shared/lib/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Skeleton } from "@/shared/ui/skeleton";

export function ChatsListPage() {
  const queryClient = useQueryClient();
  const chatsQuery = useQuery(CHAT_QUERIES.list());

  useEffect(() => {
    const socket = getChatSocket();
    const onUpdated = () => {
      void queryClient.invalidateQueries({ queryKey: CHAT_QUERIES.all() });
    };
    socket.on("chat:updated", onUpdated);
    return () => {
      socket.off("chat:updated", onUpdated);
    };
  }, [queryClient]);

  if (chatsQuery.isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  const chats = chatsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Messages</h1>
        <p className="text-muted-foreground text-sm">
          Your direct conversations.
        </p>
      </div>

      {chats.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No chats yet. Open a user profile and tap Message to start one.
        </p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {chats.map((chat) => (
            <li key={chat.id}>
              <Link
                to={`/chats/${chat.id}`}
                className="flex items-center gap-3 py-4 hover:bg-muted/40"
              >
                <Avatar className="size-10">
                  {chat.peer.imageUrl ? (
                    <AvatarImage
                      src={chat.peer.imageUrl}
                      alt={chat.peer.name}
                    />
                  ) : null}
                  <AvatarFallback>
                    {getInitials(chat.peer.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate font-medium">{chat.peer.name}</p>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {formatPostDate(chat.updatedAt)}
                    </span>
                  </div>
                  <p className="text-muted-foreground truncate text-sm">
                    {chat.lastMessage?.content ?? "No messages yet"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

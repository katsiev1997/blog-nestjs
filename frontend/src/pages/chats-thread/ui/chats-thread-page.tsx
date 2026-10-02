import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import {
  CHAT_QUERIES,
  getChatSocket,
  joinChatRoom,
  sendChatMessage,
  type ChatMessage,
} from "@/shared/api";
import { useSession } from "@/shared/auth";
import { formatPostDate, getInitials } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Textarea } from "@/shared/ui/textarea";

export function ChatsThreadPage() {
  const { id } = useParams();
  const chatId = Number(id);
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [content, setContent] = useState("");
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);

  const chatsQuery = useQuery(CHAT_QUERIES.list());
  const messagesQuery = useQuery({
    ...CHAT_QUERIES.messages(chatId, page),
    enabled: Number.isFinite(chatId),
  });

  const chat = useMemo(
    () => chatsQuery.data?.find((item) => item.id === chatId),
    [chatsQuery.data, chatId],
  );

  useEffect(() => {
    setLiveMessages([]);
    setPage(1);
  }, [chatId]);

  useEffect(() => {
    if (!Number.isFinite(chatId) || chatId <= 0) return;

    const socket = getChatSocket();
    joinChatRoom(chatId);

    const onMessage = (message: ChatMessage) => {
      if (message.chatId !== chatId) return;
      setLiveMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) return prev;
        return [...prev, message];
      });
      void queryClient.invalidateQueries({ queryKey: CHAT_QUERIES.all() });
    };

    socket.on("message:new", onMessage);
    return () => {
      socket.off("message:new", onMessage);
    };
  }, [chatId, queryClient]);

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await sendChatMessage(chatId, text);
      if (!response.ok || !response.message) {
        throw new Error(response.error ?? "Failed to send message");
      }
      return response.message;
    },
    onSuccess: (message) => {
      setContent("");
      setLiveMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) return prev;
        return [...prev, message];
      });
      void queryClient.invalidateQueries({ queryKey: CHAT_QUERIES.all() });
    },
  });

  const history = messagesQuery.data?.items ?? [];
  const messages = useMemo(() => {
    const byId = new Map<number, ChatMessage>();
    for (const message of history) byId.set(message.id, message);
    for (const message of liveMessages) byId.set(message.id, message);
    return [...byId.values()].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [history, liveMessages]);

  if (!Number.isFinite(chatId)) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Invalid chat</AlertTitle>
        <AlertDescription>The chat id in the URL is invalid.</AlertDescription>
      </Alert>
    );
  }

  if (chatsQuery.isLoading || messagesQuery.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            render={<Link to="/chats" />}
            nativeButton={false}
          >
            Back
          </Button>
          {chat ? (
            <Link
              to={`/users/${chat.peer.id}`}
              className="flex items-center gap-3"
            >
              <Avatar className="size-9">
                {chat.peer.imageUrl ? (
                  <AvatarImage src={chat.peer.imageUrl} alt={chat.peer.name} />
                ) : null}
                <AvatarFallback>{getInitials(chat.peer.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{chat.peer.name}</p>
                <p className="text-muted-foreground text-xs">
                  @{chat.peer.username}
                </p>
              </div>
            </Link>
          ) : (
            <h1 className="text-xl font-semibold">Chat #{chatId}</h1>
          )}
        </div>
      </div>

      <div className="flex min-h-80 flex-col gap-3 rounded-lg border border-border p-4">
        {messages.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No messages yet. Say hello.
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.senderId === user?.id;
            return (
              <div
                key={message.id}
                className={cn(
                  "flex max-w-[85%] flex-col gap-1 rounded-lg px-3 py-2 text-sm",
                  mine
                    ? "ms-auto bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <span
                  className={cn(
                    "text-[10px]",
                    mine
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground",
                  )}
                >
                  {formatPostDate(message.createdAt)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {messagesQuery.data && (messagesQuery.data.hasMore || page > 1) ? (
        <div className="flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Newer
          </Button>
          <span className="text-sm">{page}</span>
          <Button
            type="button"
            variant="outline"
            disabled={!messagesQuery.data.hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            Older
          </Button>
        </div>
      ) : null}

      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const value = content.trim();
          if (!value) return;
          sendMutation.mutate(value);
        }}
      >
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write a message…"
          rows={3}
          required
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={sendMutation.isPending || !content.trim()}
          >
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}

import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/shared/auth";
import { API_URL } from "@/shared/config/env";
import type { ChatMessage } from "./types";

const WS_BASE = API_URL.replace(/\/api\/?$/, "");

let socket: Socket | null = null;

export const getChatSocket = (): Socket => {
  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.auth = { token: getAccessToken() ?? "" };
    socket.connect();
    return socket;
  }

  socket = io(`${WS_BASE}/chat`, {
    autoConnect: false,
    withCredentials: true,
    auth: {
      token: getAccessToken() ?? "",
    },
  });

  socket.connect();
  return socket;
};

export const disconnectChatSocket = (): void => {
  if (!socket) return;
  socket.disconnect();
  socket = null;
};

export const joinChatRoom = (chatId: number): void => {
  getChatSocket().emit("chat:join", { chatId });
};

export const sendChatMessage = (
  chatId: number,
  content: string,
): Promise<{ ok: boolean; message?: ChatMessage; error?: string }> => {
  return new Promise((resolve) => {
    getChatSocket().emit(
      "message:send",
      { chatId, content },
      (response: { ok: boolean; message?: ChatMessage; error?: string }) => {
        resolve(response ?? { ok: false, error: "No response" });
      },
    );
  });
};

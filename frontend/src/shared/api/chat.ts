import { apiClient } from "./client";
import type { ChatListItem, ChatMessage, Paginated } from "./types";

export const getChats = async (): Promise<ChatListItem[]> => {
  const { data } = await apiClient.get<ChatListItem[]>("/chat");
  return data;
};

export const createChat = async (userId: number): Promise<ChatListItem> => {
  const { data } = await apiClient.post<ChatListItem>("/chat", { userId });
  return data;
};

export const getChatMessages = async (
  chatId: number,
  page = 1,
): Promise<Paginated<ChatMessage>> => {
  const { data } = await apiClient.get<Paginated<ChatMessage>>(
    `/chat/${chatId}/messages`,
    { params: { page } },
  );
  return data;
};

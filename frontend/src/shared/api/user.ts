import { apiClient } from "./client";
import type { PublicUser, UpdateUserBody } from "./types";

export const searchUsers = async (username: string): Promise<PublicUser[]> => {
  const { data } = await apiClient.get<PublicUser[]>("/user", {
    params: { username },
  });
  return data;
};

export const getUser = async (id: number): Promise<PublicUser> => {
  const { data } = await apiClient.get<PublicUser>(`/user/${id}`);
  return data;
};

export const updateUser = async (
  id: number,
  body: UpdateUserBody,
): Promise<PublicUser> => {
  const { data } = await apiClient.patch<PublicUser>(`/user/${id}`, body);
  return data;
};

export const deleteUser = async (id: number): Promise<PublicUser> => {
  const { data } = await apiClient.delete<PublicUser>(`/user/${id}`);
  return data;
};

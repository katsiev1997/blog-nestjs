import { apiClient } from "./client";
import type {
  Comment,
  CreateCommentBody,
  Paginated,
  UpdateCommentBody,
} from "./types";

export const getComments = async (
  postId: number,
  page = 1,
): Promise<Paginated<Comment>> => {
  const { data } = await apiClient.get<Paginated<Comment>>("/comment", {
    params: { postId, page },
  });
  return data;
};

export const createComment = async (
  body: CreateCommentBody,
): Promise<Comment> => {
  const { data } = await apiClient.post<Comment>("/comment", body);
  return data;
};

export const updateComment = async (
  id: number,
  body: UpdateCommentBody,
): Promise<Comment> => {
  const { data } = await apiClient.patch<Comment>(`/comment/${id}`, body);
  return data;
};

export const deleteComment = async (id: number): Promise<Comment> => {
  const { data } = await apiClient.delete<Comment>(`/comment/${id}`);
  return data;
};

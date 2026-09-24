import { apiClient } from "./client";
import type {
  CreatePostBody,
  Paginated,
  Post,
  UpdatePostBody,
} from "./types";

export const getPosts = async (page = 1): Promise<Paginated<Post>> => {
  const { data } = await apiClient.get<Paginated<Post>>("/post", {
    params: { page },
  });
  return data;
};

export const getPost = async (id: number): Promise<Post> => {
  const { data } = await apiClient.get<Post>(`/post/${id}`);
  return data;
};

export const createPost = async (body: CreatePostBody): Promise<Post> => {
  const { data } = await apiClient.post<Post>("/post", body);
  return data;
};

export const updatePost = async (
  id: number,
  body: UpdatePostBody,
): Promise<Post> => {
  const { data } = await apiClient.patch<Post>(`/post/${id}`, body);
  return data;
};

export const deletePost = async (id: number): Promise<Post> => {
  const { data } = await apiClient.delete<Post>(`/post/${id}`);
  return data;
};

import { apiClient } from "./client";
import type { LikeToggleResult } from "./types";

export const togglePostLike = async (
  postId: number,
): Promise<LikeToggleResult> => {
  const { data } = await apiClient.post<LikeToggleResult>(
    `/like/post/${postId}`,
  );
  return data;
};

export const toggleCommentLike = async (
  commentId: number,
): Promise<LikeToggleResult> => {
  const { data } = await apiClient.post<LikeToggleResult>(
    `/like/comment/${commentId}`,
  );
  return data;
};

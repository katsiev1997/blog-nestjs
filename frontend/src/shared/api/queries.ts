import { queryOptions } from "@tanstack/react-query";
import { getMe } from "./auth";
import { getComments } from "./comment";
import { getPost, getPosts } from "./post";
import { getUser, searchUsers } from "./user";

export const AUTH_QUERIES = {
  me: () =>
    queryOptions({
      queryKey: ["auth", "me"],
      queryFn: getMe,
      retry: false,
    }),
};

export const POST_QUERIES = {
  all: () => ["posts"] as const,
  lists: () => [...POST_QUERIES.all(), "list"] as const,
  list: (page: number) =>
    queryOptions({
      queryKey: [...POST_QUERIES.lists(), page],
      queryFn: () => getPosts(page),
      placeholderData: (prev) => prev,
    }),
  detail: (id: number) =>
    queryOptions({
      queryKey: [...POST_QUERIES.all(), "detail", id],
      queryFn: () => getPost(id),
    }),
};

export const COMMENT_QUERIES = {
  all: () => ["comments"] as const,
  list: (postId: number, page: number) =>
    queryOptions({
      queryKey: [...COMMENT_QUERIES.all(), "list", postId, page],
      queryFn: () => getComments(postId, page),
    }),
};

export const USER_QUERIES = {
  all: () => ["users"] as const,
  search: (username: string) =>
    queryOptions({
      queryKey: [...USER_QUERIES.all(), "search", username],
      queryFn: () => searchUsers(username),
      enabled: username.length > 0,
    }),
  detail: (id: number) =>
    queryOptions({
      queryKey: [...USER_QUERIES.all(), "detail", id],
      queryFn: () => getUser(id),
      enabled: Number.isFinite(id) && id > 0,
    }),
};

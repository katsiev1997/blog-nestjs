export type PublicUser = {
  id: number;
  name: string;
  age: number;
  email: string;
  username: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  accessToken: string;
  user: PublicUser;
};

export type LoginBody = {
  email: string;
  password: string;
};

export type RegisterBody = {
  name: string;
  age: number;
  email: string;
  username: string;
  password: string;
  imageUrl?: string;
};

export type Post = {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  likedByMe: boolean;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  hasMore: boolean;
};

export type CreatePostBody = {
  title: string;
  content: string;
  imageUrl?: string;
};

export type UpdatePostBody = Partial<CreatePostBody>;

export type GeneratePostBody = {
  topic: string;
};

export type GeneratedPostDraft = {
  title: string;
  content: string;
};

export type Comment = {
  id: number;
  content: string;
  postId: number;
  userId: number;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  likedByMe: boolean;
};

export type CreateCommentBody = {
  content: string;
  postId: number;
  parentId?: number;
};

export type UpdateCommentBody = {
  content: string;
};

export type UpdateUserBody = {
  name?: string;
  age?: number;
  email?: string;
  username?: string;
  password?: string;
  imageUrl?: string | null;
};

export type LikeToggleResult = {
  liked: boolean;
  likeCount: number;
};

export type ChatMessage = {
  id: number;
  chatId: number;
  senderId: number;
  content: string;
  createdAt: string;
};

export type ChatListItem = {
  id: number;
  createdAt: string;
  updatedAt: string;
  peer: PublicUser;
  lastMessage: ChatMessage | null;
};

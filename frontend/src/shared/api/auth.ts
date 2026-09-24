import { apiClient } from "./client";
import type { AuthResponse, LoginBody, PublicUser, RegisterBody } from "./types";

export const login = async (body: LoginBody): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", body);
  return data;
};

export const register = async (body: RegisterBody): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", body);
  return data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post("/auth/logout");
};

export const getMe = async (): Promise<PublicUser> => {
  const { data } = await apiClient.get<PublicUser>("/auth/me");
  return data;
};

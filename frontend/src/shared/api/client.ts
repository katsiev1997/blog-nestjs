import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/shared/auth";
import { API_URL } from "@/shared/config/env";

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post<{ accessToken: string }>(
      `${API_URL}/auth/refresh`,
      null,
      { withCredentials: true },
    );
    setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    clearAccessToken();
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      original.url?.includes("/auth/login") ||
      original.url?.includes("/auth/register") ||
      original.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    original._retry = true;
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });

    const token = await refreshPromise;
    if (!token) {
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${token}`;
    return apiClient(original);
  },
);

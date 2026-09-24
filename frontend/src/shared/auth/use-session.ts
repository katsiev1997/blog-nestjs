import { useQuery } from "@tanstack/react-query";
import { AUTH_QUERIES } from "@/shared/api";
import { getAccessToken } from "@/shared/auth";

export function useSession() {
  const hasToken = Boolean(getAccessToken());
  const query = useQuery({
    ...AUTH_QUERIES.me(),
    enabled: hasToken,
  });

  return {
    user: query.data ?? null,
    isAuthenticated: Boolean(query.data),
    isLoading: hasToken && query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

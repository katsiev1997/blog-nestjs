import { Navigate, Outlet } from "react-router";
import { useSession } from "@/shared/auth";
import { Spinner } from "@/shared/ui/spinner";
import { AppHeaderAuth } from "@/widgets/header-auth";
import { AppHeaderGuest } from "@/widgets/header-guest";

export function AppShell() {
  const { isAuthenticated, isLoading } = useSession();

  return (
    <div className="min-h-svh bg-background text-foreground">
      {isAuthenticated ? <AppHeaderAuth /> : <AppHeaderGuest />}
      <main className="mx-auto max-w-3xl px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}

export function RequireAuth() {
  const { isAuthenticated, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function GuestOnly() {
  const { isAuthenticated, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/posts" replace />;
  }

  return <Outlet />;
}

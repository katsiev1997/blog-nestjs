import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, NavLink, useNavigate } from "react-router";
import { PlusIcon } from "lucide-react";
import { AUTH_QUERIES, logout } from "@/shared/api";
import { clearAccessToken, useSession } from "@/shared/auth";
import { getInitials } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "text-sm font-medium text-muted-foreground hover:text-foreground",
    isActive && "text-foreground",
  );

export function AppHeaderAuth() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: async () => {
      clearAccessToken();
      await queryClient.removeQueries({ queryKey: AUTH_QUERIES.me().queryKey });
      navigate("/login");
    },
  });

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            Blog
          </Link>
          <nav className="flex items-center gap-4">
            <NavLink to="/posts" className={navClass}>
              Posts
            </NavLink>
            <NavLink to="/users" className={navClass}>
              Users
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Button render={<Link to="/posts/new" />} nativeButton={false}>
            <PlusIcon data-icon="inline-start" />
            New post
          </Button>
          <Link to="/profile/me" className="inline-flex">
            <Avatar className="size-8">
              {user?.imageUrl ? (
                <AvatarImage src={user.imageUrl} alt={user.name} />
              ) : null}
              <AvatarFallback>{getInitials(user?.name ?? "?")}</AvatarFallback>
            </Avatar>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
          >
            Log out
          </Button>
        </div>
      </div>
    </header>
  );
}

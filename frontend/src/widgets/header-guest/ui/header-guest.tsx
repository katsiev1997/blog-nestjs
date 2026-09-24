import { Link, NavLink } from "react-router";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "text-sm font-medium text-muted-foreground hover:text-foreground",
    isActive && "text-foreground",
  );

export function AppHeaderGuest() {
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
        <div className="flex items-center gap-2">
          <Button variant="ghost" render={<Link to="/login" />} nativeButton={false}>
            Log in
          </Button>
          <Button render={<Link to="/register" />} nativeButton={false}>
            Sign up
          </Button>
        </div>
      </div>
    </header>
  );
}

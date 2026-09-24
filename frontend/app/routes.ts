import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/shell.tsx", [
    index("routes/posts._index.tsx"),
    route("posts", "routes/posts.list.tsx"),
    layout("routes/auth-required.tsx", [
      route("posts/new", "routes/posts.new.tsx"),
      route("posts/:id/edit", "routes/posts.$id.edit.tsx"),
      route("profile/me", "routes/profile.me.tsx"),
      route("profile/edit", "routes/profile.edit.tsx"),
    ]),
    route("posts/:id", "routes/posts.$id.tsx"),
    route("users", "routes/users._index.tsx"),
    route("users/:id", "routes/users.$id.tsx"),
    layout("routes/guest-only.tsx", [
      route("login", "routes/login.tsx"),
      route("register", "routes/register.tsx"),
    ]),
  ]),
] satisfies RouteConfig;

---
name: blog-pen-design
description: >-
  Designs NestJS blog UI screens in pen.dev using the shadcn library, driven by
  Cursor via pen interactive (not pen --prompt / Claude Code). Use when the user
  asks for pen designs, .pen files, shadcn UI kit screens, blog pages UI, or
  Cursor-driven design for this blog API.
---

# Blog pen.dev Design (Cursor + shadcn)

## Rules

1. **Driver = Cursor.** Do **not** run `pen --prompt` / Claude / Codex / Gemini agents unless the user explicitly asks.
2. **Library = shadcn.** Always import `pencil:shadcn.lib.pen` before composing screens.
3. **Source of truth = API.** Only design pages backed by `src/auth`, `src/post`, `src/comment`, `src/user`. See [pages.md](pages.md).
4. **Output = `designs/`.** Save `.pen` and PNG exports under `designs/`. Follow [DESIGN_PLAN.md](../../../designs/DESIGN_PLAN.md).

## Prerequisites

```bash
pen version
pen status   # must show Active
```

If not authenticated: tell the user to run `pen login`.

If PNG export fails after blocked install scripts, tell the user to run:

```bash
npm install -g --allow-scripts=sharp,esbuild,@google/genai,protobufjs @pen.dev/cli
```

## Workflow (Cursor-driven)

Use headless interactive mode. Pipe tool calls; always `save()` before `exit()`.

```bash
pen interactive --out designs/blog.pen [--in designs/blog.pen]
```

### Session bootstrap (every session)

1. `read_skill()`
2. `read_skill({ path: "guide/design-system.md" })`
3. `read_skill({ path: "execute.md" })`
4. `read_skill({ path: "pen-schema.md" })`
5. `import_library({ path: "pencil:shadcn.lib.pen" })`
6. `list_libraries()` — confirm import
7. `get_app_state()`
8. Discover components: `execute({ input: 'Get(n=>n.reusable&&Print(n.id,n.name))' })`

### Compose screens

1. One **top-level frame per page** under `document` (desktop `1440×900`, `clip: true`, vertical layout).
2. Prefer **shadcn refs** (`type: "ref"`) over hand-built frames for Button, Input, Card, Avatar, Badge, Separator, Tabs, Dialog, Textarea.
3. Shared chrome first (AppHeader / AppNav), then instance on authenticated pages.
4. Place reusable components at the top of the canvas; screens below, growing right/down.
5. After each screen: `TakeScreenshot([frameId])`, fix layout/contrast issues, then next screen.
6. `save()` often. Final: `Export([...ids], "png", "./designs")` then `save()` + `exit()`.

### PowerShell piping example

```powershell
@"
read_skill()
import_library({ path: "pencil:shadcn.lib.pen" })
get_app_state()
save()
exit()
"@ | pen interactive --out designs/blog.pen
```

## Hard constraints (pen schema)

- Do **not** think in CSS/HTML. No `margin`, percentage sizes, or `alignItems: baseline|stretch`.
- Never put loose text/icons/buttons directly under `document` — only page/component frames.
- Prefer Lucide icons via `type: "icon", library: "lucide"`.
- Use design tokens / `$--*` variables from the shadcn library when present.

## Do not

- Invent pages with no API (settings billing, social OAuth, etc.) unless asked.
- Over-style with heavy shadows/gradients; stay in shadcn visual language.
- Expand prompts for `pen --prompt` — that path is out of scope for this skill.

## References

- Page inventory & fields: [pages.md](pages.md)
- Interactive command cheat sheet: [workflow.md](workflow.md)
- Phased delivery: [DESIGN_PLAN.md](../../../designs/DESIGN_PLAN.md)

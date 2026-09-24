# Blog UI — Design Development Plan

**Stack:** NestJS blog API → pen.dev `.pen` designs → shadcn UI kit (`pencil:shadcn.lib.pen`)  
**Driver:** Cursor agent via `pen interactive` (no Claude Code / `pen --prompt`)  
**Skill:** `.cursor/skills/blog-pen-design/`

---

## 1. Goals

1. Produce desktop UI screens for every user-facing flow backed by the current API.
2. Keep one visual system (shadcn components + tokens) across all pages.
3. Keep designs in-repo under `designs/` so they can later drive frontend code.

**Out of scope (unless requested):** mobile variants, dark-theme pass, marketing landing, admin CMS, OAuth.

---

## 2. Product summary (from API)

| Domain | Capabilities |
|--------|----------------|
| Auth | Register, login, refresh (cookie), logout, `GET /me` |
| Posts | CRUD; list paginated 10/page; optional `imageUrl` |
| Comments | CRUD; nesting via `parentId` |
| Users | List, get, patch, delete; profile fields: name, age, email, username, imageUrl |

---

## 3. Screen backlog (priority)

| P | Page ID | Screen | Depends on |
|---|---------|--------|------------|
| P0 | `login` | Login | — |
| P0 | `register` | Register | — |
| P0 | `posts-feed` | Posts feed | Auth chrome |
| P0 | `post-detail` | Post + nested comments | Feed |
| P1 | `post-create` | Create post | Auth |
| P1 | `post-edit` | Edit post | Create |
| P1 | `profile-me` | My profile | Auth |
| P1 | `profile-edit` | Edit profile | Me |
| P2 | `profile-user` | Public user profile | Feed |
| P2 | `users-list` | Users directory | Optional |

**Shared building blocks (build first):** `AppHeaderGuest`, `AppHeaderAuth`, `PostCard`, `CommentItem`, `EmptyState`.

---

## 4. Phases

### Phase 0 — Setup (done when green)

- [x] `pen` CLI installed (`@pen.dev/cli`)
- [x] `pen login` / Active session
- [x] Cursor skill `blog-pen-design`
- [ ] Sharp/export scripts allowed if PNG export fails
- [ ] `designs/blog.pen` created; shadcn library imported and listed

### Phase 1 — Foundations

- [ ] Import `pencil:shadcn.lib.pen`
- [ ] Inventory reusable component IDs (Button, Input, Card, Avatar, Badge, Textarea, Separator, Dropdown)
- [ ] Build `AppHeaderGuest` + `AppHeaderAuth`
- [ ] Build `PostCard` + `CommentItem` components
- [ ] Set canvas layout: components row on top, screens below

### Phase 2 — Auth (P0)

- [ ] `Login` — email/username + password, primary CTA, link to register
- [ ] `Register` — name, age, email, username, password, optional avatar URL
- [ ] Screenshot + contrast/spacing pass

### Phase 3 — Reading (P0)

- [ ] `Posts feed` — header, list of `PostCard`, pagination control
- [ ] `Post detail` — article body, author meta, comment thread (nested), composer
- [ ] Screenshot + clip/overflow pass

### Phase 4 — Writing (P1)

- [ ] `Create post` — title, content, imageUrl, submit/cancel
- [ ] `Edit post` — prefilled same form + delete affordance
- [ ] Screenshot pass

### Phase 5 — Profiles (P1–P2)

- [ ] `My profile` — avatar, fields, link to edit + user’s posts
- [ ] `Edit profile` — form for UpdateUserDto fields
- [ ] `Public profile` — read-only + posts
- [ ] `Users list` (optional)

### Phase 6 — Delivery

- [ ] Export PNGs per screen to `designs/exports/`
- [ ] Open `designs/blog.pen` in pen.dev / Cursor extension for visual review
- [ ] Mark plan checkboxes; note follow-ups (mobile, dark mode)

---

## 5. File layout

```
designs/
  DESIGN_PLAN.md          ← this file
  blog.pen                ← single source canvas (all screens)
  exports/                ← PNG exports per page
    login.png
    register.png
    posts-feed.png
    ...
.cursor/skills/blog-pen-design/
  SKILL.md
  pages.md
  workflow.md
```

Prefer **one** `.pen` file for token/component consistency. Split only if the file becomes unwieldy.

---

## 6. Design rules

| Rule | Detail |
|------|--------|
| Desktop first | 1440×900 frames, `clip: true` |
| shadcn only | Compose with library `ref`s; Lucide icons |
| One job per screen | Match API; no fake features |
| Auth states | Guest vs authenticated header |
| Comments | Show nesting (indent / reply) to match `parentId` |
| Empty / error | Use Empty / Alert patterns where the kit provides them |

---

## 7. Acceptance criteria

A phase is done when:

1. Screens exist as named top-level frames in `blog.pen`.
2. Screenshots show no clipped text, broken layout, or low-contrast labels.
3. Field lists match [pages.md](../.cursor/skills/blog-pen-design/pages.md).
4. `save()` completed; PNGs written under `designs/exports/` for that phase.

---

## 8. How to continue (agent)

1. Read `.cursor/skills/blog-pen-design/SKILL.md`.
2. Start Phase 0 leftover + Phase 1.
3. Work P0 → P1 → P2; screenshot after each screen.
4. Update checkboxes in this file as work lands.

**Kickoff command:**

```bash
pen interactive --out designs/blog.pen
```

Then: bootstrap skills → `import_library({ path: "pencil:shadcn.lib.pen" })` → build shared chrome → P0 screens.

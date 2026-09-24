# Blog UI — Design Development Plan

**Stack:** NestJS blog API → pen.dev `.pen` designs → shadcn UI kit (`pencil:shadcn.lib.pen`)  
**Driver:** Cursor agent via `pen interactive` (no Claude Code / `pen --prompt`)  
**Canvas:** [`design/design.pen`](design.pen)

---

## 1. Goals

1. Produce desktop UI screens for every user-facing flow backed by the current API.
2. Keep one visual system (shadcn components + tokens) across all pages.
3. Keep designs in-repo under `design/` so they can later drive frontend code.

**Out of scope (unless requested):** mobile variants, dark-theme pass, marketing landing, admin CMS, OAuth.

---

## 2. Product summary (from API)

| Domain   | Capabilities                                                                   |
| -------- | ------------------------------------------------------------------------------ |
| Auth     | Register, login, refresh (cookie), logout, `GET /me`                           |
| Posts    | CRUD; list paginated 10/page; optional `imageUrl`                              |
| Comments | CRUD; nesting via `parentId`                                                   |
| Users    | List, get, patch, delete; profile fields: name, age, email, username, imageUrl |

---

## 3. Screen backlog (priority)

| P   | Page ID        | Screen                 | Depends on  | Status |
| --- | -------------- | ---------------------- | ----------- | ------ |
| P0  | `login`        | Login                  | —           | Done   |
| P0  | `register`     | Register               | —           | Done   |
| P0  | `posts-feed`   | Posts feed             | Auth chrome | Done   |
| P0  | `post-detail`  | Post + nested comments | Feed        | Done   |
| P1  | `post-create`  | Create post            | Auth        | Done   |
| P1  | `post-edit`    | Edit post              | Create      | Done   |
| P1  | `profile-me`   | My profile             | Auth        | Done   |
| P1  | `profile-edit` | Edit profile           | Me          | Done   |
| P2  | `profile-user` | Public user profile    | Feed        | Done   |
| P2  | `users-list`   | Users directory        | Optional    | Done   |

**Shared building blocks (build first):** `AppHeaderGuest`, `AppHeaderAuth`, `PostCard`, `CommentItem`, `EmptyState`.

---

## 4. Phases

### Phase 0 — Setup (done when green)

- [x] `pen` CLI installed (`@pen.dev/cli`)
- [x] `pen login` / Active session
- [x] Cursor skill / `pen_skills.txt` composition guidelines
- [x] PNG export working (`design/exports/`)
- [x] `design/design.pen` created; shadcn library imported (`pencil:shadcn.lib.pen` as `X`)

### Phase 1 — Foundations

- [x] Import `pencil:shadcn.lib.pen`
- [x] Inventory reusable component IDs (Button, Input, Card, Avatar, Badge, Textarea, Pagination)
- [x] Build `AppHeaderGuest` + `AppHeaderAuth`
- [x] Build `PostCard` + `CommentItem` + `EmptyState` components
- [x] Set canvas layout: components row on top, screens below

### Phase 2 — Auth (P0)

- [x] `Login` — email + password (API LoginDto), primary CTA, link to register
- [x] `Register` — name, age, email, username, password, optional avatar URL
- [x] Screenshot + contrast/spacing pass

### Phase 3 — Reading (P0)

- [x] `Posts feed` — header, list of `PostCard`, pagination control
- [x] `Post detail` — article body, author meta, comment thread (nested), composer
- [x] Screenshot + clip/overflow pass

### Phase 4 — Writing (P1)

- [x] `Create post` — title, content, imageUrl, submit/cancel
- [x] `Edit post` — prefilled same form + delete affordance
- [x] Screenshot pass

### Phase 5 — Profiles (P1–P2)

- [x] `My profile` — avatar, fields, link to edit + user’s posts
- [x] `Edit profile` — form for UpdateUserDto fields
- [x] `Public profile` — read-only + posts
- [x] `Users list`

### Phase 6 — Delivery

- [x] Export PNGs per screen to `design/exports/`
- [ ] Open `design/design.pen` in pen.dev / Cursor extension for visual review
- [x] Mark plan checkboxes; note follow-ups (mobile, dark mode)

---

## 5. File layout

```
design/
  DESIGN_PLAN.md          ← this file
  design.pen              ← single source canvas (all screens)
  exports/                ← PNG exports per page
    login.png
    register.png
    posts-feed.png
    post-detail.png
    post-create.png
    post-edit.png
    profile-me.png
    profile-edit.png
    profile-user.png
    users-list.png
  pen_skills.txt          ← pen.dev composition + execute skills dump
```

Prefer **one** `.pen` file for token/component consistency. Split only if the file becomes unwieldy.

---

## 6. Design rules

| Rule               | Detail                                                 |
| ------------------ | ------------------------------------------------------ |
| Desktop first      | 1440×900 frames, `clip: true`                          |
| shadcn only        | Compose with library `ref`s; Lucide icons              |
| One job per screen | Match API; no fake features                            |
| Auth states        | Guest vs authenticated header                          |
| Comments           | Show nesting (indent / reply) to match `parentId`      |
| Empty / error      | Use Empty / Alert patterns where the kit provides them |

---

## 7. Acceptance criteria

A phase is done when:

1. Screens exist as named top-level frames in `design.pen`.
2. Screenshots show no clipped text, broken layout, or low-contrast labels.
3. Field lists match API DTOs.
4. `save()` completed; PNGs written under `design/exports/` for that phase.

---

## 8. Follow-ups

- Mobile variants
- Dark-theme pass
- Visual review in pen.dev / Cursor extension (Phase 6 open item)
- Fix legacy `textGrowth` warnings on Phase 1 reusable text nodes if schema rejects them on load

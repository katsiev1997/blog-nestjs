# Blog UI page inventory

Mapped from NestJS modules. Design only these unless the user adds scope.

## Auth (public)

| Page ID | Screen | API | Fields / notes |
|---------|--------|-----|----------------|
| `login` | Login | `POST /api/auth/login` | email or username + password; link to register |
| `register` | Register | `POST /api/auth/register` | name, age, email, username, password (≥8), optional imageUrl |
| — | (no UI) | `POST /api/auth/refresh` | silent; refresh cookie |
| — | (action) | `POST /api/auth/logout` | clear session; from header menu |

## Posts (core)

| Page ID | Screen | API | Fields / notes |
|---------|--------|-----|----------------|
| `posts-feed` | Home / feed | `GET /api/post?page=` | paginated (10/page); title, excerpt, image, author, date |
| `post-detail` | Post | `GET /api/post/:id` | full content, image, author; ownership actions edit/delete |
| `post-create` | New post | `POST /api/post` | title, content, optional imageUrl (auth) |
| `post-edit` | Edit post | `PATCH /api/post/:id` | same fields; owner only |

## Comments (on post-detail)

| UI block | API | Fields / notes |
|----------|-----|----------------|
| Comment list | `GET /api/comment` (by post) | nested via `parentId` |
| Add comment | `POST /api/comment` | content, postId, optional parentId |
| Edit / delete | `PATCH` / `DELETE /api/comment/:id` | author only |

## Users

| Page ID | Screen | API | Fields / notes |
|---------|--------|-----|----------------|
| `profile-me` | My profile | `GET /api/auth/me` | name, age, email, username, imageUrl |
| `profile-edit` | Edit profile | `PATCH /api/user/:id` | optional name, age, email, username, password, imageUrl |
| `profile-user` | Public profile | `GET /api/user/:id` | public fields + user's posts |
| `users-list` | Users (optional) | `GET /api/user` | directory; lower priority |

## Auth chrome

Authenticated screens share: brand, Feed, New post, Profile, Logout.  
Guest screens share: brand, Login, Register.

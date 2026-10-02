import { integer, pgTable, timestamp, unique } from 'drizzle-orm/pg-core';
import { postsTable } from './posts';
import { usersTable } from './users';

export const postLikesTable = pgTable(
  'post_likes',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    postId: integer()
      .notNull()
      .references(() => postsTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [unique('post_likes_user_post_unique').on(t.userId, t.postId)],
);

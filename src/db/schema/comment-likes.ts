import { integer, pgTable, timestamp, unique } from 'drizzle-orm/pg-core';
import { commentsTable } from './comments';
import { usersTable } from './users';

export const commentLikesTable = pgTable(
  'comment_likes',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    commentId: integer()
      .notNull()
      .references(() => commentsTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [unique('comment_likes_user_comment_unique').on(t.userId, t.commentId)],
);

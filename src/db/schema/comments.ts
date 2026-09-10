import {
  AnyPgColumn,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { postsTable } from './posts';
import { usersTable } from './users';

export const commentsTable = pgTable('comments', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  content: text().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  postId: integer()
    .notNull()
    .references(() => postsTable.id, { onDelete: 'cascade' }),
  userId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  parentId: integer().references((): AnyPgColumn => commentsTable.id, {
    onDelete: 'cascade',
  }),
});

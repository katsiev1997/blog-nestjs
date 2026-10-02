import { integer, pgTable, timestamp, unique } from 'drizzle-orm/pg-core';
import { usersTable } from './users';

export const chatsTable = pgTable(
  'chats',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userLowId: integer()
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    userHighId: integer()
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [unique('chats_user_pair_unique').on(t.userLowId, t.userHighId)],
);

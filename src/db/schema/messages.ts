import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { chatsTable } from './chats';
import { usersTable } from './users';

export const messagesTable = pgTable('messages', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  chatId: integer()
    .notNull()
    .references(() => chatsTable.id, { onDelete: 'cascade' }),
  senderId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  content: text().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

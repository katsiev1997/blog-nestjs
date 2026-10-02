import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, or } from 'drizzle-orm';
import { DRIZZLE } from '../db/db.module';
import type { DrizzleDB } from '../db/drizzle.types';
import { chatsTable, messagesTable, usersTable } from '../db/schema';
import type { PublicUser } from '../auth/types';

const MESSAGES_PAGE_SIZE = 30;

type ChatRow = typeof chatsTable.$inferSelect;
type MessageRow = typeof messagesTable.$inferSelect;

export type ChatListItem = {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  peer: PublicUser;
  lastMessage: MessageRow | null;
};

export type PaginatedMessages = {
  items: MessageRow[];
  page: number;
  hasMore: boolean;
};

@Injectable()
export class ChatService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async listForUser(userId: number): Promise<ChatListItem[]> {
    const chats = await this.db
      .select()
      .from(chatsTable)
      .where(
        or(eq(chatsTable.userLowId, userId), eq(chatsTable.userHighId, userId)),
      )
      .orderBy(desc(chatsTable.updatedAt));

    const items: ChatListItem[] = [];
    for (const chat of chats) {
      const peerId =
        chat.userLowId === userId ? chat.userHighId : chat.userLowId;
      const peer = await this.findPublicUserOrFail(peerId);
      const lastMessage = await this.findLastMessage(chat.id);
      items.push({
        id: chat.id,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        peer,
        lastMessage,
      });
    }

    return items;
  }

  async findOrCreate(
    userId: number,
    peerUserId: number,
  ): Promise<ChatListItem> {
    if (userId === peerUserId) {
      throw new BadRequestException('Cannot start a chat with yourself');
    }

    const peer = await this.findPublicUserOrFail(peerUserId);
    const userLowId = Math.min(userId, peerUserId);
    const userHighId = Math.max(userId, peerUserId);

    const [existing] = await this.db
      .select()
      .from(chatsTable)
      .where(
        and(
          eq(chatsTable.userLowId, userLowId),
          eq(chatsTable.userHighId, userHighId),
        ),
      )
      .limit(1);

    if (existing) {
      return {
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: existing.updatedAt,
        peer,
        lastMessage: await this.findLastMessage(existing.id),
      };
    }

    const [chat] = await this.db
      .insert(chatsTable)
      .values({ userLowId, userHighId })
      .returning();

    if (!chat) {
      throw new InternalServerErrorException('Failed to create chat');
    }

    return {
      id: chat.id,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      peer,
      lastMessage: null,
    };
  }

  async getMessages(
    chatId: number,
    userId: number,
    page = 1,
  ): Promise<PaginatedMessages> {
    await this.assertParticipant(chatId, userId);

    const offset = (page - 1) * MESSAGES_PAGE_SIZE;
    const rows = await this.db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.chatId, chatId))
      .orderBy(desc(messagesTable.createdAt))
      .limit(MESSAGES_PAGE_SIZE + 1)
      .offset(offset);

    const hasMore = rows.length > MESSAGES_PAGE_SIZE;
    const pageRows = hasMore ? rows.slice(0, MESSAGES_PAGE_SIZE) : rows;

    return {
      items: pageRows.reverse(),
      page,
      hasMore,
    };
  }

  async sendMessage(
    userId: number,
    chatId: number,
    content: string,
  ): Promise<MessageRow> {
    const chat = await this.assertParticipant(chatId, userId);
    const trimmed = content.trim();
    if (!trimmed) {
      throw new BadRequestException('Message content cannot be empty');
    }

    const [message] = await this.db
      .insert(messagesTable)
      .values({
        chatId,
        senderId: userId,
        content: trimmed,
      })
      .returning();

    if (!message) {
      throw new InternalServerErrorException('Failed to send message');
    }

    await this.db
      .update(chatsTable)
      .set({ updatedAt: new Date() })
      .where(eq(chatsTable.id, chatId));

    return message;
  }

  async getParticipantIds(chatId: number): Promise<[number, number]> {
    const chat = await this.findChatOrFail(chatId);
    return [chat.userLowId, chat.userHighId];
  }

  async isParticipant(chatId: number, userId: number): Promise<boolean> {
    const [chat] = await this.db
      .select({ id: chatsTable.id })
      .from(chatsTable)
      .where(
        and(
          eq(chatsTable.id, chatId),
          or(eq(chatsTable.userLowId, userId), eq(chatsTable.userHighId, userId)),
        ),
      )
      .limit(1);

    return Boolean(chat);
  }

  private async assertParticipant(
    chatId: number,
    userId: number,
  ): Promise<ChatRow> {
    const chat = await this.findChatOrFail(chatId);
    if (chat.userLowId !== userId && chat.userHighId !== userId) {
      throw new ForbiddenException('You are not a participant of this chat');
    }
    return chat;
  }

  private async findChatOrFail(chatId: number): Promise<ChatRow> {
    const [chat] = await this.db
      .select()
      .from(chatsTable)
      .where(eq(chatsTable.id, chatId))
      .limit(1);

    if (!chat) {
      throw new NotFoundException(`Chat #${chatId} not found`);
    }

    return chat;
  }

  private async findLastMessage(chatId: number): Promise<MessageRow | null> {
    const [message] = await this.db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.chatId, chatId))
      .orderBy(desc(messagesTable.createdAt))
      .limit(1);

    return message ?? null;
  }

  private async findPublicUserOrFail(userId: number): Promise<PublicUser> {
    const [user] = await this.db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        age: usersTable.age,
        email: usersTable.email,
        username: usersTable.username,
        imageUrl: usersTable.imageUrl,
        createdAt: usersTable.createdAt,
        updatedAt: usersTable.updatedAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException(`User #${userId} not found`);
    }

    return user;
  }
}

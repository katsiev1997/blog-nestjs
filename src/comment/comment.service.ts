import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { DRIZZLE } from '../db/db.module';
import type { DrizzleDB } from '../db/drizzle.types';
import { commentsTable, postsTable } from '../db/schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

const COMMENTS_PAGE_SIZE = 10;

type CommentRow = typeof commentsTable.$inferSelect;

export type PaginatedComments = {
  items: CommentRow[];
  page: number;
  hasMore: boolean;
};

@Injectable()
export class CommentService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async create(userId: number, dto: CreateCommentDto): Promise<CommentRow> {
    await this.assertPostExists(dto.postId);

    if (dto.parentId != null) {
      await this.assertValidParent(dto.parentId, dto.postId);
    }

    const [comment] = await this.db
      .insert(commentsTable)
      .values({
        content: dto.content,
        postId: dto.postId,
        parentId: dto.parentId,
        userId,
      })
      .returning();

    if (!comment) {
      throw new InternalServerErrorException('Failed to create comment');
    }

    return comment;
  }

  /** Oldest first for a given post, 10 per page. */
  async findAll(postId: number, page = 1): Promise<PaginatedComments> {
    await this.assertPostExists(postId);

    const offset = (page - 1) * COMMENTS_PAGE_SIZE;

    const rows = await this.db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.postId, postId))
      .orderBy(asc(commentsTable.createdAt))
      .limit(COMMENTS_PAGE_SIZE + 1)
      .offset(offset);

    const hasMore = rows.length > COMMENTS_PAGE_SIZE;

    return {
      items: hasMore ? rows.slice(0, COMMENTS_PAGE_SIZE) : rows,
      page,
      hasMore,
    };
  }

  async findOne(id: number): Promise<CommentRow> {
    return this.findOneOrFail(id);
  }

  async update(
    id: number,
    userId: number,
    dto: UpdateCommentDto,
  ): Promise<CommentRow> {
    const existing = await this.findOneOrFail(id);
    this.assertOwner(existing, userId);

    const [comment] = await this.db
      .update(commentsTable)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(commentsTable.id, id))
      .returning();

    if (!comment) {
      throw new InternalServerErrorException('Failed to update comment');
    }

    return comment;
  }

  async remove(id: number, userId: number): Promise<CommentRow> {
    const existing = await this.findOneOrFail(id);
    this.assertOwner(existing, userId);

    const [comment] = await this.db
      .delete(commentsTable)
      .where(eq(commentsTable.id, id))
      .returning();

    if (!comment) {
      throw new InternalServerErrorException('Failed to delete comment');
    }

    return comment;
  }

  private async findOneOrFail(id: number): Promise<CommentRow> {
    const [comment] = await this.db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.id, id))
      .limit(1);

    if (!comment) {
      throw new NotFoundException(`Comment #${id} not found`);
    }

    return comment;
  }

  private async assertPostExists(postId: number): Promise<void> {
    const [post] = await this.db
      .select({ id: postsTable.id })
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .limit(1);

    if (!post) {
      throw new NotFoundException(`Post #${postId} not found`);
    }
  }

  private async assertValidParent(
    parentId: number,
    postId: number,
  ): Promise<void> {
    const [parent] = await this.db
      .select()
      .from(commentsTable)
      .where(
        and(eq(commentsTable.id, parentId), eq(commentsTable.postId, postId)),
      )
      .limit(1);

    if (!parent) {
      throw new BadRequestException(
        `Parent comment #${parentId} not found on post #${postId}`,
      );
    }
  }

  private assertOwner(comment: CommentRow, userId: number): void {
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only modify your own comments');
    }
  }
}

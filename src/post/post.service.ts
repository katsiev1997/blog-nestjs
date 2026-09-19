import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DRIZZLE } from '../db/db.module';
import type { DrizzleDB } from '../db/drizzle.types';
import { postsTable } from '../db/schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

const POSTS_PAGE_SIZE = 10;

type PostRow = typeof postsTable.$inferSelect;

export type PaginatedPosts = {
  items: PostRow[];
  page: number;
  hasMore: boolean;
};

@Injectable()
export class PostService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async create(userId: number, dto: CreatePostDto): Promise<PostRow> {
    const [post] = await this.db
      .insert(postsTable)
      .values({
        title: dto.title,
        content: dto.content,
        imageUrl: dto.imageUrl,
        userId,
      })
      .returning();

    if (!post) {
      throw new InternalServerErrorException('Failed to create post');
    }

    return post;
  }

  /** Latest posts first, 10 per page. */
  async findAll(page = 1): Promise<PaginatedPosts> {
    const offset = (page - 1) * POSTS_PAGE_SIZE;

    const rows = await this.db
      .select()
      .from(postsTable)
      .orderBy(desc(postsTable.createdAt))
      .limit(POSTS_PAGE_SIZE + 1)
      .offset(offset);

    const hasMore = rows.length > POSTS_PAGE_SIZE;

    return {
      items: hasMore ? rows.slice(0, POSTS_PAGE_SIZE) : rows,
      page,
      hasMore,
    };
  }

  async findOne(id: number): Promise<PostRow> {
    return this.findOneOrFail(id);
  }

  async update(
    id: number,
    userId: number,
    dto: UpdatePostDto,
  ): Promise<PostRow> {
    const existing = await this.findOneOrFail(id);
    this.assertOwner(existing, userId);

    const [post] = await this.db
      .update(postsTable)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(postsTable.id, id))
      .returning();

    if (!post) {
      throw new InternalServerErrorException('Failed to update post');
    }

    return post;
  }

  async remove(id: number, userId: number): Promise<PostRow> {
    const existing = await this.findOneOrFail(id);
    this.assertOwner(existing, userId);

    const [post] = await this.db
      .delete(postsTable)
      .where(eq(postsTable.id, id))
      .returning();

    if (!post) {
      throw new InternalServerErrorException('Failed to delete post');
    }

    return post;
  }

  private async findOneOrFail(id: number): Promise<PostRow> {
    const [post] = await this.db
      .select()
      .from(postsTable)
      .where(eq(postsTable.id, id))
      .limit(1);

    if (!post) {
      throw new NotFoundException(`Post #${id} not found`);
    }

    return post;
  }

  private assertOwner(post: PostRow, userId: number): void {
    if (post.userId !== userId) {
      throw new ForbiddenException('You can only modify your own posts');
    }
  }
}

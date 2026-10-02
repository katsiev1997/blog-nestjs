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
import { LikeService } from '../like/like.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

const POSTS_PAGE_SIZE = 10;

type PostRow = typeof postsTable.$inferSelect;

export type PostWithLikes = PostRow & {
  likeCount: number;
  likedByMe: boolean;
};

export type PaginatedPosts = {
  items: PostWithLikes[];
  page: number;
  hasMore: boolean;
};

@Injectable()
export class PostService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly likeService: LikeService,
  ) {}

  async create(userId: number, dto: CreatePostDto): Promise<PostWithLikes> {
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

    return this.withLikes(post, userId);
  }

  /** Latest posts first, 10 per page. */
  async findAll(page = 1, viewerId?: number): Promise<PaginatedPosts> {
    const offset = (page - 1) * POSTS_PAGE_SIZE;

    const rows = await this.db
      .select()
      .from(postsTable)
      .orderBy(desc(postsTable.createdAt))
      .limit(POSTS_PAGE_SIZE + 1)
      .offset(offset);

    const hasMore = rows.length > POSTS_PAGE_SIZE;
    const items = hasMore ? rows.slice(0, POSTS_PAGE_SIZE) : rows;

    return {
      items: await this.withLikesMany(items, viewerId),
      page,
      hasMore,
    };
  }

  async findOne(id: number, viewerId?: number): Promise<PostWithLikes> {
    const post = await this.findOneOrFail(id);
    return this.withLikes(post, viewerId);
  }

  async update(
    id: number,
    userId: number,
    dto: UpdatePostDto,
  ): Promise<PostWithLikes> {
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

    return this.withLikes(post, userId);
  }

  async remove(id: number, userId: number): Promise<PostWithLikes> {
    const existing = await this.findOneOrFail(id);
    this.assertOwner(existing, userId);

    const [post] = await this.db
      .delete(postsTable)
      .where(eq(postsTable.id, id))
      .returning();

    if (!post) {
      throw new InternalServerErrorException('Failed to delete post');
    }

    return { ...post, likeCount: 0, likedByMe: false };
  }

  private async withLikes(
    post: PostRow,
    viewerId?: number,
  ): Promise<PostWithLikes> {
    const [enriched] = await this.withLikesMany([post], viewerId);
    return enriched!;
  }

  private async withLikesMany(
    posts: PostRow[],
    viewerId?: number,
  ): Promise<PostWithLikes[]> {
    const ids = posts.map((post) => post.id);
    const counts = await this.likeService.getPostLikeCounts(ids);
    const liked =
      viewerId != null
        ? await this.likeService.getLikedPostIds(viewerId, ids)
        : new Set<number>();

    return posts.map((post) => ({
      ...post,
      likeCount: counts.get(post.id) ?? 0,
      likedByMe: liked.has(post.id),
    }));
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

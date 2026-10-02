import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, inArray } from 'drizzle-orm';
import { DRIZZLE } from '../db/db.module';
import type { DrizzleDB } from '../db/drizzle.types';
import {
  commentLikesTable,
  commentsTable,
  postLikesTable,
  postsTable,
} from '../db/schema';
import type { LikeToggleResult } from './like.types';

@Injectable()
export class LikeService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async togglePostLike(
    userId: number,
    postId: number,
  ): Promise<LikeToggleResult> {
    await this.assertPostExists(postId);

    const [existing] = await this.db
      .select({ id: postLikesTable.id })
      .from(postLikesTable)
      .where(
        and(
          eq(postLikesTable.userId, userId),
          eq(postLikesTable.postId, postId),
        ),
      )
      .limit(1);

    if (existing) {
      await this.db
        .delete(postLikesTable)
        .where(eq(postLikesTable.id, existing.id));
      return {
        liked: false,
        likeCount: await this.countPostLikes(postId),
      };
    }

    await this.db.insert(postLikesTable).values({ userId, postId });
    return {
      liked: true,
      likeCount: await this.countPostLikes(postId),
    };
  }

  async toggleCommentLike(
    userId: number,
    commentId: number,
  ): Promise<LikeToggleResult> {
    await this.assertCommentExists(commentId);

    const [existing] = await this.db
      .select({ id: commentLikesTable.id })
      .from(commentLikesTable)
      .where(
        and(
          eq(commentLikesTable.userId, userId),
          eq(commentLikesTable.commentId, commentId),
        ),
      )
      .limit(1);

    if (existing) {
      await this.db
        .delete(commentLikesTable)
        .where(eq(commentLikesTable.id, existing.id));
      return {
        liked: false,
        likeCount: await this.countCommentLikes(commentId),
      };
    }

    await this.db.insert(commentLikesTable).values({ userId, commentId });
    return {
      liked: true,
      likeCount: await this.countCommentLikes(commentId),
    };
  }

  async getPostLikeCounts(postIds: number[]): Promise<Map<number, number>> {
    const result = new Map<number, number>();
    for (const id of postIds) result.set(id, 0);
    if (postIds.length === 0) return result;

    const rows = await this.db
      .select({
        id: postLikesTable.postId,
        likeCount: count(),
      })
      .from(postLikesTable)
      .where(inArray(postLikesTable.postId, postIds))
      .groupBy(postLikesTable.postId);

    for (const row of rows) {
      result.set(row.id, Number(row.likeCount));
    }
    return result;
  }

  async getCommentLikeCounts(
    commentIds: number[],
  ): Promise<Map<number, number>> {
    const result = new Map<number, number>();
    for (const id of commentIds) result.set(id, 0);
    if (commentIds.length === 0) return result;

    const rows = await this.db
      .select({
        id: commentLikesTable.commentId,
        likeCount: count(),
      })
      .from(commentLikesTable)
      .where(inArray(commentLikesTable.commentId, commentIds))
      .groupBy(commentLikesTable.commentId);

    for (const row of rows) {
      result.set(row.id, Number(row.likeCount));
    }
    return result;
  }

  async getLikedPostIds(
    userId: number,
    postIds: number[],
  ): Promise<Set<number>> {
    if (postIds.length === 0) return new Set();

    const rows = await this.db
      .select({ postId: postLikesTable.postId })
      .from(postLikesTable)
      .where(
        and(
          eq(postLikesTable.userId, userId),
          inArray(postLikesTable.postId, postIds),
        ),
      );

    return new Set(rows.map((row) => row.postId));
  }

  async getLikedCommentIds(
    userId: number,
    commentIds: number[],
  ): Promise<Set<number>> {
    if (commentIds.length === 0) return new Set();

    const rows = await this.db
      .select({ commentId: commentLikesTable.commentId })
      .from(commentLikesTable)
      .where(
        and(
          eq(commentLikesTable.userId, userId),
          inArray(commentLikesTable.commentId, commentIds),
        ),
      );

    return new Set(rows.map((row) => row.commentId));
  }

  private async countPostLikes(postId: number): Promise<number> {
    const [row] = await this.db
      .select({ likeCount: count() })
      .from(postLikesTable)
      .where(eq(postLikesTable.postId, postId));
    return Number(row?.likeCount ?? 0);
  }

  private async countCommentLikes(commentId: number): Promise<number> {
    const [row] = await this.db
      .select({ likeCount: count() })
      .from(commentLikesTable)
      .where(eq(commentLikesTable.commentId, commentId));
    return Number(row?.likeCount ?? 0);
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

  private async assertCommentExists(commentId: number): Promise<void> {
    const [comment] = await this.db
      .select({ id: commentsTable.id })
      .from(commentsTable)
      .where(eq(commentsTable.id, commentId))
      .limit(1);

    if (!comment) {
      throw new NotFoundException(`Comment #${commentId} not found`);
    }
  }
}

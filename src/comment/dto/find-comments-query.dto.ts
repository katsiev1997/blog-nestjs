import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

/** Query for GET /api/comment — comments for a post (10 per page). */
export class FindCommentsQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  postId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;
}

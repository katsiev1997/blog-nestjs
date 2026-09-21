import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/** Body for POST /api/comment. */
export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  postId!: number;

  /** Reply to another comment; omit for a top-level comment. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parentId?: number;
}

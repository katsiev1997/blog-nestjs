import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateCommentDto } from './create-comment.dto';

/** Body for PATCH /api/comment/:id — only content can change. */
export class UpdateCommentDto extends PartialType(
  OmitType(CreateCommentDto, ['postId', 'parentId'] as const),
) {}

import {
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LikeService } from './like.service';

@ApiTags('like')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('like')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post('post/:postId')
  @ApiOperation({ summary: 'Toggle like on a post' })
  togglePost(
    @CurrentUser('sub') userId: number,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return this.likeService.togglePostLike(userId, postId);
  }

  @Post('comment/:commentId')
  @ApiOperation({ summary: 'Toggle like on a comment' })
  toggleComment(
    @CurrentUser('sub') userId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
  ) {
    return this.likeService.toggleCommentLike(userId, commentId);
  }
}

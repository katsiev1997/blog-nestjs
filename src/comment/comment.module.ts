import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LikeModule } from '../like/like.module';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

@Module({
  imports: [AuthModule, LikeModule],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LikeModule } from '../like/like.module';
import { PostController } from './post.controller';
import { PostService } from './post.service';

@Module({
  imports: [AuthModule, LikeModule],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}

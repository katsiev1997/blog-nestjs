import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { PostController } from './post.controller';
import { PostService } from './post.service';

@Module({
  imports: [AuthModule, AiModule],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}

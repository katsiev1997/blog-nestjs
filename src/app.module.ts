import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { CommentModule } from './comment/comment.module';
import { DatabaseModule } from './db/db.module';
import { LikeModule } from './like/like.module';
import { PostModule } from './post/post.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AiModule,
    UserModule,
    PostModule,
    CommentModule,
    AuthModule,
    LikeModule,
    ChatModule,
  ],
})
export class AppModule {}

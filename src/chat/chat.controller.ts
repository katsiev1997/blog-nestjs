import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { FindMessagesQueryDto } from './dto/find-messages-query.dto';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @ApiOperation({ summary: 'List my chats' })
  list(@CurrentUser('sub') userId: number) {
    return this.chatService.listForUser(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Find or create a 1:1 chat with a user' })
  create(
    @CurrentUser('sub') userId: number,
    @Body() dto: CreateChatDto,
  ) {
    return this.chatService.findOrCreate(userId, dto.userId);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'List messages in a chat (30 per page)' })
  messages(
    @Param('id', ParseIntPipe) chatId: number,
    @CurrentUser('sub') userId: number,
    @Query() query: FindMessagesQueryDto,
  ) {
    return this.chatService.getMessages(chatId, userId, query.page ?? 1);
  }
}

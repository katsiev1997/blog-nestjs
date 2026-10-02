import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../auth/types';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

type AuthedSocket = Socket & {
  data: {
    user?: JwtPayload;
  };
};

const corsOrigin = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
})
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthedSocket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      client.data.user = payload;
      await client.join(this.userRoom(payload.sub));
    } catch (error) {
      this.logger.warn(`WS auth failed: ${String(error)}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthedSocket): void {
    const userId = client.data.user?.sub;
    if (userId != null) {
      this.logger.debug(`User ${userId} disconnected from chat WS`);
    }
  }

  @SubscribeMessage('chat:join')
  async joinChat(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { chatId: number },
  ) {
    const user = this.requireUser(client);
    const chatId = Number(body?.chatId);
    if (!Number.isFinite(chatId)) {
      return { ok: false, error: 'Invalid chatId' };
    }

    const allowed = await this.chatService.isParticipant(chatId, user.sub);
    if (!allowed) {
      return { ok: false, error: 'Forbidden' };
    }

    await client.join(this.chatRoom(chatId));
    return { ok: true };
  }

  @SubscribeMessage('message:send')
  async sendMessage(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: SendMessageDto,
  ) {
    const user = this.requireUser(client);
    const message = await this.chatService.sendMessage(
      user.sub,
      body.chatId,
      body.content,
    );

    this.server
      .to(this.chatRoom(body.chatId))
      .emit('message:new', message);

    const participantIds = await this.chatService.getParticipantIds(body.chatId);
    for (const participantId of participantIds) {
      this.server.to(this.userRoom(participantId)).emit('chat:updated', {
        chatId: body.chatId,
        lastMessage: message,
      });
    }

    return { ok: true, message };
  }

  private requireUser(client: AuthedSocket): JwtPayload {
    const user = client.data.user;
    if (!user) {
      client.disconnect(true);
      throw new Error('Unauthorized');
    }
    return user;
  }

  private extractToken(client: Socket): string | undefined {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string') {
      const [type, token] = header.split(' ');
      if (type === 'Bearer' && token) return token;
    }

    return undefined;
  }

  private chatRoom(chatId: number): string {
    return `chat:${chatId}`;
  }

  private userRoom(userId: number): string {
    return `user:${userId}`;
  }
}

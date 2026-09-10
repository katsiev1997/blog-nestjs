import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { JwtPayload } from '../types';

/**
 * Guard маршрута: пропускает запрос только с валидным JWT access-токеном.
 *
 * NestJS вызывает `canActivate` до метода контроллера. `true` — запрос идёт дальше.
 * Исключение — ответ 401 Unauthorized.
 *
 * Использование: `@UseGuards(JwtAuthGuard)` на контроллере или хендлере.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ExecutionContext оборачивает текущий запрос; switchToHttp() — для REST
    // (не GraphQL и не WebSockets).
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractAccessToken(request);

    if (!token) {
      throw new UnauthorizedException('Access token is missing');
    }

    try {
      // verifyAsync проверяет подпись и срок жизни секретом из JwtModule.
      // При успехе возвращает payload (sub, email, username).
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      // Кладём payload в request, чтобы его мог прочитать @CurrentUser().
      request.user = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    return true;
  }

  /** Берёт токен из `Authorization: Bearer <token>`, иначе undefined. */
  private extractAccessToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

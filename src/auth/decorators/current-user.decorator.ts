import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '../types';

/**
 * Достаёт пользователя, которого JwtAuthGuard положил в `request.user`.
 *
 * @example
 * me(@CurrentUser() user: JwtPayload)
 * me(@CurrentUser('sub') userId: number)
 *
 * Без предшествующего JwtAuthGuard `request.user` пустой → 401.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException();
    }

    return data ? user[data] : user;
  },
);

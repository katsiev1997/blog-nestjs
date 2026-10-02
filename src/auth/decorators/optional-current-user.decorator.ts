import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '../types';

/**
 * Like `@CurrentUser`, but returns `undefined` when no user is attached
 * (for routes with OptionalJwtAuthGuard).
 */
export const OptionalCurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      return undefined;
    }

    return data ? user[data] : user;
  },
);

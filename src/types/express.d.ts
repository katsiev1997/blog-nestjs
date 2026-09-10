import type { JwtPayload } from '../auth/types';

/**
 * Расширяет типы Express: после JwtAuthGuard на `request.user` лежит JWT payload.
 * Без этого TypeScript не знает поле `user` у Request.
 */
declare global {
  namespace Express {
    interface User extends JwtPayload {}

    interface Request {
      user?: JwtPayload;
      cookies?: Record<string, string | undefined>;
    }
  }
}

export {};

import type { CookieOptions, Response } from 'express';
import {
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_MAX_AGE_MS,
} from './auth.constants';

/**
 * Опции httpOnly-cookie для refresh-токена.
 * httpOnly — JS в браузере cookie не читает (защита от XSS).
 * secure — только HTTPS в production.
 * sameSite: 'lax' — cookie уходит при переходах с другого сайта, но не при CSRF POST.
 */
function getRefreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  };
}

export function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
}

/** Сбрасывает cookie теми же опциями, иначе браузер её не удалит. */
export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
}

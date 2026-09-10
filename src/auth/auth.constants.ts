/** Имя cookie, куда кладётся refresh-токен. */
export const REFRESH_COOKIE_NAME = 'refreshToken';

/** Срок жизни access-токена по умолчанию (короткий). */
export const ACCESS_TOKEN_EXPIRES_IN = '15m';

/** Срок жизни refresh-токена по умолчанию (длинный). */
export const REFRESH_TOKEN_EXPIRES_IN = '7d';

/** maxAge cookie в мс — должен совпадать с REFRESH_TOKEN_EXPIRES_IN. */
export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

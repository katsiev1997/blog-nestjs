/** Payload access-токена: кто пользователь. `sub` — id из таблицы users. */
export type JwtPayload = {
  sub: number;
  email: string;
  username: string;
};

/** Payload refresh-токена: только id. Email/username здесь не нужны. */
export type RefreshJwtPayload = {
  sub: number;
};

/** Пользователь без хеша пароля — то, что можно отдать клиенту. */
export type PublicUser = {
  id: number;
  name: string;
  age: number;
  email: string;
  username: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Результат register/login/refresh до того, как контроллер спрячет refresh в cookie. */
export type AuthResult = {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
};

# Как самостоятельно написать авторизацию

План под этот блог: NestJS, Drizzle, PostgreSQL, JWT access + refresh.

Идея: **короткий access-токен** в `Authorization: Bearer …`, **длинный refresh-токен** в httpOnly cookie. Клиент не кладёт refresh в JS — так меньше риск XSS.

```
register / login
    → хеш пароля (argon2)
    → пара JWT
    → access в JSON, refresh в cookie

защищённый маршрут
    → JwtAuthGuard читает Bearer
    → кладёт payload в request.user

access истёк
    → POST /api/auth/refresh читает cookie
    → новая пара токенов

logout
    → стереть refresh-cookie
    → клиент забывает access сам
```

---

## 0. Перед кодом: решения, которые нельзя менять на ходу

Зафиксируй это на бумаге:

| Вопрос | Решение в этом проекте |
|---|---|
| Где живёт access? | JSON-ответ, клиент шлёт в заголовке |
| Где живёт refresh? | httpOnly cookie `refreshToken` |
| Чем подписывать? | Два разных секрета: `JWT_ACCESS_SECRET` и `JWT_REFRESH_SECRET` |
| Сроки | Access ~15 минут, refresh ~7 дней |
| Пароль | Только хеш argon2, никогда plaintext и никогда в JSON |
| Логин | Одно сообщение `Invalid credentials` и для «нет пользователя», и для «неверный пароль» |

Если access и refresh подписать одним секретом, украденный refresh можно выдать за access.

---

## 1. Пользователь в БД

В таблице `users` нужны как минимум:

- `email` unique
- `username` unique
- `password` — **хеш**, не пароль
- обычные поля профиля (`name`, `age`, …)

Схема — только в ORM (`src/db/schema/users.ts`), миграцию генерирует `pnpm db:generate`, руками SQL не писать.

Проверка: регистрация не должна сохранить строку `qwerty123` как есть.

---

## 2. Инфраструктура приложения

В `main.ts`:

1. `setGlobalPrefix('api')` — все пути вида `/api/...`
2. `cookieParser()` — иначе `req.cookies.refreshToken` пустой
3. CORS с `credentials: true` — иначе браузер не отправит cookie
4. `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) — DTO отсекают мусор из тела запроса

В `.env`:

```
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

Секреты — длинные случайные строки, не `secret` и не одинаковые.

Пакеты: `@nestjs/jwt`, `@nestjs/config`, `argon2`, `cookie-parser`.  
Команду установки пишешь в чат и ставишь сам.

---

## 3. Каркас модуля `auth`

Создай `AuthModule` и подключи в `AppModule`.

Файлы, которые появятся по ходу:

```
src/auth/
  auth.module.ts
  auth.controller.ts
  auth.service.ts
  auth.constants.ts
  types.ts
  cookies.ts
  dto/login.dto.ts
  dto/register.dto.ts
  guards/jwt-auth.guard.ts
  decorators/current-user.decorator.ts
src/types/express.d.ts
```

`JwtModule.registerAsync`: секрет **access**, `global: true`, чтобы `JwtService` видели guard и другие модули. Refresh всегда подписывай явно вторым секретом в сервисе.

---

## 4. Типы и константы

Сначала типы, потом код.

- `JwtPayload` — `{ sub, email, username }`. `sub` = `users.id`
- `RefreshJwtPayload` — только `{ sub }`
- `PublicUser` — пользователь **без** `password`
- `AuthResult` — `{ accessToken, refreshToken, user }`

Константы: имя cookie, сроки JWT, `maxAge` cookie в миллисекундах (должен совпадать с сроком refresh, иначе cookie умрёт раньше токена).

---

## 5. DTO

`RegisterDto`: name, age, email, username, password (минимум 8 символов), опциональный `imageUrl`.  
`LoginDto`: email + password.

Не принимай `id` и `password` хеш с клиента. Pipe уже включён глобально — декораторы `class-validator` сработают сами.

---

## 6. Сервис: пароль и пользователь

Пиши `AuthService` снизу вверх.

**Регистрация**

1. Проверить, что email/username свободны → иначе `409 Conflict`
2. `email.toLowerCase()`
3. `argon2.hash(password)`
4. `insert` + `returning`
5. Выдать токены

**Логин**

1. Найти по email
2. Нет пользователя или `argon2.verify` false → один и тот же `401`
3. Выдать токены

**Профиль**

- Найти по `id` из JWT
- Вернуть `PublicUser` (вырезать `password` перед ответом)

`argon2.verify` может кинуть на битом хеше — лови и считай пароль неверным.

---

## 7. Сервис: пара JWT

Две подписи параллельно (`Promise.all`):

| Токен | Секрет | Срок | Payload |
|---|---|---|---|
| access | `JWT_ACCESS_SECRET` | 15m | `sub`, `email`, `username` |
| refresh | `JWT_REFRESH_SECRET` | 7d | только `sub` |

Общая функция `issueAuth(user)`: токены + `toPublicUser`. Её вызывают register, login и refresh — не копируй выдачу три раза.

Проверка refresh:

1. Нет строки → `401 Refresh token is missing`
2. `verifyAsync` с **refresh**-секретом
3. Пользователь по `sub` ещё есть в БД
4. Снова `issueAuth` (ротация: новая пара)

Удалённый пользователь не должен обновлять сессию.

---

## 8. Cookie для refresh

Отдельный файл `cookies.ts`, не размазывать `res.cookie` по контроллеру.

Опции:

- `httpOnly: true` — JS в браузере cookie не читает
- `secure: true` только в production (HTTPS)
- `sameSite: 'lax'`
- `path: '/'`
- `maxAge` = 7 дней

`clearCookie` вызывай **с теми же опциями**, иначе браузер cookie не снимет.

Контроллер: `@Res({ passthrough: true })` — сам пишешь cookie, тело ответа отдаёт Nest.

---

## 9. Контроллер

| Метод | Путь | Что делает |
|---|---|---|
| POST | `/api/auth/register` | создать пользователя, cookie + JSON без refresh |
| POST | `/api/auth/login` | то же, статус 200 |
| POST | `/api/auth/refresh` | взять cookie, новая пара |
| POST | `/api/auth/logout` | стереть cookie |
| GET | `/api/auth/me` | guard + профиль |

Из `AuthResult` вырежи `refreshToken` до `return`. Refresh только в cookie.

Logout **не** инвалидирует access на сервере (JWT stateless). Клиент просто перестаёт его слать. Если нужна мгновенная отмена — это уже blacklist/версия токена, отдельный шаг после базовой схемы.

---

## 10. Guard и «кто я»

`JwtAuthGuard implements CanActivate`:

1. `Authorization` → схема `Bearer`, иначе 401
2. `jwtService.verifyAsync` (секрет access из `JwtModule`)
3. `request.user = payload`
4. ошибка verify → 401 «Invalid or expired»

Guard **не** читает cookie. Cookie только у `/refresh`.

Декоратор `@CurrentUser()` читает `request.user`. Без guard поле пустое → 401.

Чтобы TypeScript знал `request.user`, расширь Express в `src/types/express.d.ts`:

```ts
interface Request {
  user?: JwtPayload;
  cookies?: Record<string, string | undefined>;
}
```

На мутациях (`POST`/`PATCH`/`DELETE` у user/post/comment) повесь `@UseGuards(JwtAuthGuard)`. Чтение списка можно оставить публичным.

---

## 11. Как проверять руками

1. `POST /api/auth/register` — в JSON есть `accessToken` и `user`, **нет** `refreshToken`; в Set-Cookie есть `refreshToken` с HttpOnly.
2. Повторный register с тем же email → 409.
3. `POST /api/auth/login` с неверным паролем → 401, текст не говорит «пользователь существует».
4. `GET /api/auth/me` без заголовка → 401.
5. `GET /api/auth/me` с `Authorization: Bearer <access>` → профиль без `password`.
6. `POST /api/auth/refresh` с cookie, без Bearer → новая пара.
7. `POST /api/auth/logout` → cookie исчезла; следующий refresh → 401.
8. Подделать access с refresh-секретом → guard не должен пустить.

С фронта: `credentials: 'include'` (fetch) / `withCredentials: true` (axios), иначе cookie не уедет.

---

## 12. Порядок работы, если пишешь с нуля

Делай по одному вертикальному срезу, не все файлы сразу:

1. Схема пользователя + миграция  
2. `AuthModule` + пустой контроллер `POST /api/auth/register` без JWT (хеш + insert)  
3. DTO + уникальность email/username  
4. Выдача access (пока без refresh) + `GET /me` + guard  
5. Refresh-секрет, cookie, `/refresh`, `/logout`  
6. CORS + cookie-parser  
7. Guard на create/update/delete постов и комментариев  
8. Тесты сервиса: хеш, конфликт, неверный логин, refresh без пользователя  

Если на шаге 4 `/me` уже работает с Bearer — фундамент верный. Cookie — надстройка.

---

## 13. Чего в этой схеме ещё нет (следующий уровень)

Имеет смысл добавлять **после** того, как текущий поток зелёный:

- хранить хеш refresh в БД и отзывать его при logout (сейчас logout только чистит cookie)
- refresh token rotation + reuse detection
- rate limit на login/register
- роли / права (authorization, не authentication)
- подтверждение email

Не смешивай это с первым рабочим JWT.

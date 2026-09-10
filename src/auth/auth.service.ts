import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { eq, or } from 'drizzle-orm';
import * as argon2 from 'argon2';
import { DRIZZLE } from '../db/db.module';
import type { DrizzleDB } from '../db/drizzle.types';
import { usersTable } from '../db/schema';
import {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
} from './auth.constants';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type {
  AuthResult,
  JwtPayload,
  PublicUser,
  RefreshJwtPayload,
} from './types';

type UserRow = typeof usersTable.$inferSelect;

/** Бизнес-логика регистрации, логина и выдачи JWT-пары. */
@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /** Создаёт пользователя, хеширует пароль и сразу выдаёт токены. */
  async register(dto: RegisterDto): Promise<AuthResult> {
    await this.assertUniqueCredentials(dto.email, dto.username);

    const password = await argon2.hash(dto.password);
    const [user] = await this.db
      .insert(usersTable)
      .values({
        name: dto.name,
        age: dto.age,
        email: dto.email.toLowerCase(),
        username: dto.username,
        password,
        imageUrl: dto.imageUrl,
      })
      .returning();

    if (!user) {
      throw new InternalServerErrorException('Failed to create user');
    }

    return this.issueAuth(user);
  }

  /**
   * Проверяет email + пароль и выдаёт новую пару токенов.
   * Одинаковое сообщение при любой ошибке, чтобы не раскрывать, существует ли аккаунт.
   */
  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.findUserByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await this.verifyPassword(
      dto.password,
      user.password,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueAuth(user);
  }

  /**
   * Обновляет пару токенов по refresh-токену из cookie.
   * Access-токен здесь не нужен: refresh живёт дольше и подписан другим секретом.
   */
  async refresh(refreshToken: string | undefined): Promise<AuthResult> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.findUserById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issueAuth(user);
  }

  /** Профиль по id из JWT (`sub`). Пароль в ответ не попадает. */
  async getProfile(userId: number): Promise<PublicUser> {
    const user = await this.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException();
    }

    return this.toPublicUser(user);
  }

  /** Собирает access + refresh и публичные данные пользователя. */
  private async issueAuth(user: UserRow): Promise<AuthResult> {
    const tokens = await this.createTokenPair(user);

    return {
      ...tokens,
      user: this.toPublicUser(user),
    };
  }

  /**
   * Access и refresh — разные JWT: разный секрет, срок жизни и payload.
   * Access несёт email/username для guard; refresh — только `sub`.
   */
  private async createTokenPair(user: UserRow) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.getExpiresIn(
          'JWT_ACCESS_EXPIRES_IN',
          ACCESS_TOKEN_EXPIRES_IN,
        ),
      }),
      this.jwtService.signAsync({ sub: user.id } satisfies RefreshJwtPayload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.getExpiresIn(
          'JWT_REFRESH_EXPIRES_IN',
          REFRESH_TOKEN_EXPIRES_IN,
        ),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /** Проверяет подпись refresh-токена отдельным секретом, не access. */
  private async verifyRefreshToken(
    refreshToken: string | undefined,
  ): Promise<RefreshJwtPayload> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    try {
      return await this.jwtService.verifyAsync<RefreshJwtPayload>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async findUserByEmail(email: string): Promise<UserRow | undefined> {
    const [user] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

    return user;
  }

  private async findUserById(id: number): Promise<UserRow | undefined> {
    const [user] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    return user;
  }

  private async assertUniqueCredentials(
    email: string,
    username: string,
  ): Promise<void> {
    const [existing] = await this.db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(
        or(
          eq(usersTable.email, email.toLowerCase()),
          eq(usersTable.username, username),
        ),
      )
      .limit(1);

    if (existing) {
      throw new ConflictException('Email or username is already taken');
    }
  }

  private getExpiresIn(
    envKey: string,
    fallback: string,
  ): JwtSignOptions['expiresIn'] {
    return (this.configService.get<string>(envKey) ??
      fallback) as JwtSignOptions['expiresIn'];
  }

  /** argon2.verify бросает, если хеш битый — считаем это неверным паролем. */
  private async verifyPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  /** Убирает хеш пароля, чтобы он не ушёл в JSON-ответ. */
  private toPublicUser(user: UserRow): PublicUser {
    const { password, ...publicUser } = user;
    void password;
    return publicUser;
  }
}

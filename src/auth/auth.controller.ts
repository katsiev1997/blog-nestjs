import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { REFRESH_COOKIE_NAME } from './auth.constants';
import { clearRefreshCookie, setRefreshCookie } from './cookies';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { JwtPayload } from './types';

/**
 * HTTP-слой авторизации: `/api/auth/register`, `/login`, `/refresh`, `/logout`, `/me`.
 *
 * Access-токен уходит в JSON-теле (клиент кладёт его в `Authorization`).
 * Refresh-токен — только в httpOnly cookie, JS его прочитать не может.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    // passthrough: сами пишем cookie, тело ответа отдаёт NestJS как обычно.
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, ...result } = await this.authService.register(dto);
    setRefreshCookie(res, refreshToken);
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, ...result } = await this.authService.login(dto);
    setRefreshCookie(res, refreshToken);
    return result;
  }

  /** Берёт refresh из cookie, выдаёт новую пару токенов и обновляет cookie. */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, ...result } = await this.authService.refresh(
      req.cookies?.[REFRESH_COOKIE_NAME],
    );
    setRefreshCookie(res, refreshToken);
    return result;
  }

  /** Удаляет refresh-cookie. Access-токен клиент забывает сам. */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    clearRefreshCookie(res);
    return { success: true };
  }

  /** Текущий пользователь. Без валидного access-токена guard вернёт 401. */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub);
  }
}

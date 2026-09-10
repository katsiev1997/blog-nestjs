import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/** Тело POST /api/auth/login. ValidationPipe проверяет декораторы до контроллера. */
export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/** Тело POST /api/auth/login. ValidationPipe проверяет декораторы до контроллера. */
export class LoginDto {
  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123', format: 'password' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

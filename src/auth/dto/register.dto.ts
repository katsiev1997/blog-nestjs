import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

/** Тело POST /api/auth/register. ValidationPipe отсекает лишние поля (whitelist). */
export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  /** @Type превращает строку из JSON в number до проверки @IsInt. */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(150)
  age: number;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

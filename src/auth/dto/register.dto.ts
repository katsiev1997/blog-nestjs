import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'Ada Lovelace', description: 'Display name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  /** @Type превращает строку из JSON в number до проверки @IsInt. */
  @ApiProperty({ example: 28, minimum: 1, maximum: 150 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(150)
  age!: number;

  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'ada', minLength: 3 })
  @IsString()
  @MinLength(3)
  username!: string;

  @ApiProperty({ example: 'password123', minLength: 8, format: 'password' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/avatar.png',
    description: 'Optional avatar URL',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

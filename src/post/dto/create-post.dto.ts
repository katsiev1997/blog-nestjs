import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** Body for POST /api/post. */
export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  imageUrl?: string;
}

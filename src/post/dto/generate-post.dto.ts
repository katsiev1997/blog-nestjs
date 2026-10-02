import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Body for POST /api/post/generate. */
export class GeneratePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  topic: string;
}

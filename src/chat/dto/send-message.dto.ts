import { IsInt, IsPositive, IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsInt()
  @IsPositive()
  chatId: number;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content: string;
}

import { IsInt, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChatDto {
  @ApiProperty({ description: 'User id to start a 1:1 chat with' })
  @IsInt()
  @IsPositive()
  userId: number;
}

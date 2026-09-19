import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/** Query for GET /api/user?username=... */
export class FindUserQueryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  username: string;
}

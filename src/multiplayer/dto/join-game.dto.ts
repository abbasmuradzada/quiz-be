import { IsString } from 'class-validator';

export class JoinGameDto {
  @IsString()
  inviteCode: string;
}

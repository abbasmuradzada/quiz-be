import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class GameAnswerDto {
  @IsString()
  sessionId: string;

  @IsString()
  questionId: string;

  answer: string | string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  timeTaken?: number;
}

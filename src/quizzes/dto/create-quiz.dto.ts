import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { QuizVisibility, Difficulty } from '@prisma/client';

export class CreateQuizDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(QuizVisibility)
  visibility?: QuizVisibility;

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional()
  @IsInt()
  @Min(5)
  timeLimit?: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

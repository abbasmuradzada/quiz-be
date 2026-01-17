import { Injectable } from '@nestjs/common';
import { QuestionType } from '@prisma/client';
import { QuestionTypeFactory } from '../questions/strategies';

@Injectable()
export class ScoringService {
  constructor(private questionTypeFactory: QuestionTypeFactory) {}

  validateAndScore(
    questionType: QuestionType,
    answer: any,
    options: any[],
    correctAnswer: string | null,
    basePoints: number,
    timeTaken?: number,
    timeLimit?: number,
  ): { isCorrect: boolean; points: number } {
    const strategy = this.questionTypeFactory.getStrategy(questionType);

    const isCorrect = strategy.validateAnswer(answer, options, correctAnswer ?? undefined);
    const points = strategy.calculateScore(
      isCorrect,
      basePoints,
      timeTaken,
      timeLimit,
    );

    return { isCorrect, points };
  }
}

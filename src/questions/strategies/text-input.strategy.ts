import { Injectable } from '@nestjs/common';
import { QuestionValidatorInterface } from './question-validator.interface';

@Injectable()
export class TextInputStrategy implements QuestionValidatorInterface {
  validateOptions(): boolean {
    return true;
  }

  validateAnswer(
    answer: string | string[],
    _options: any,
    correctAnswer?: string,
  ): boolean {
    if (!correctAnswer) return false;

    const answerStr = Array.isArray(answer) ? answer[0] : answer;
    if (!answerStr) return false;

    const normalizedAnswer = answerStr.trim().toLowerCase();
    const normalizedCorrect = correctAnswer.trim().toLowerCase();

    return normalizedAnswer === normalizedCorrect;
  }

  calculateScore(
    isCorrect: boolean,
    basePoints: number,
    timeTaken?: number,
    timeLimit?: number,
  ): number {
    if (!isCorrect) return 0;

    if (timeTaken && timeLimit) {
      const timeBonus = Math.max(0, 1 - timeTaken / (timeLimit * 1000));
      return Math.round(basePoints * (0.5 + 0.5 * timeBonus));
    }

    return basePoints;
  }
}

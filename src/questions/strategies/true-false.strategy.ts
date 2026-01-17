import { Injectable } from '@nestjs/common';
import {
  QuestionValidatorInterface,
  QuestionOption,
} from './question-validator.interface';

@Injectable()
export class TrueFalseStrategy implements QuestionValidatorInterface {
  validateOptions(options: QuestionOption[]): boolean {
    if (!options || options.length !== 2) return false;

    const texts = options.map((o) => o.text.toLowerCase());
    const hasTrue = texts.includes('true');
    const hasFalse = texts.includes('false');
    const correctCount = options.filter((o) => o.isCorrect).length;

    return hasTrue && hasFalse && correctCount === 1;
  }

  validateAnswer(
    answer: string | string[],
    options: QuestionOption[],
  ): boolean {
    const answerStr = Array.isArray(answer) ? answer[0] : answer;
    const selectedOption = options.find((o) => o.id === answerStr);
    return selectedOption?.isCorrect ?? false;
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

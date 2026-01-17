import { Injectable } from '@nestjs/common';
import {
  QuestionValidatorInterface,
  QuestionOption,
} from './question-validator.interface';

@Injectable()
export class MultipleChoiceStrategy implements QuestionValidatorInterface {
  validateOptions(options: QuestionOption[]): boolean {
    if (!options || options.length < 2) return false;
    const correctCount = options.filter((o) => o.isCorrect).length;
    return correctCount >= 1;
  }

  validateAnswer(
    answer: string | string[],
    options: QuestionOption[],
  ): boolean {
    const answerArr = Array.isArray(answer) ? answer : [answer];

    const correctIds = options.filter((o) => o.isCorrect).map((o) => o.id);
    const sortedAnswer = [...answerArr].sort();
    const sortedCorrect = [...correctIds].sort();

    return (
      sortedAnswer.length === sortedCorrect.length &&
      sortedAnswer.every((id, index) => id === sortedCorrect[index])
    );
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

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuestionValidatorInterface {
  validateOptions(options: QuestionOption[]): boolean;
  validateAnswer(
    answer: string | string[],
    options: QuestionOption[],
    correctAnswer?: string,
  ): boolean;
  calculateScore(
    isCorrect: boolean,
    basePoints: number,
    timeTaken?: number,
    timeLimit?: number,
  ): number;
}

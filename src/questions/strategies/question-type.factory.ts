import { Injectable } from '@nestjs/common';
import { QuestionType } from '@prisma/client';
import { QuestionValidatorInterface } from './question-validator.interface';
import { SingleChoiceStrategy } from './single-choice.strategy';
import { MultipleChoiceStrategy } from './multiple-choice.strategy';
import { TrueFalseStrategy } from './true-false.strategy';
import { TextInputStrategy } from './text-input.strategy';

@Injectable()
export class QuestionTypeFactory {
  private strategies: Map<QuestionType, QuestionValidatorInterface>;

  constructor(
    private singleChoice: SingleChoiceStrategy,
    private multipleChoice: MultipleChoiceStrategy,
    private trueFalse: TrueFalseStrategy,
    private textInput: TextInputStrategy,
  ) {
    this.strategies = new Map([
      [QuestionType.SINGLE_CHOICE, singleChoice],
      [QuestionType.MULTIPLE_CHOICE, multipleChoice],
      [QuestionType.TRUE_FALSE, trueFalse],
      [QuestionType.TEXT_INPUT, textInput],
    ]);
  }

  getStrategy(type: QuestionType): QuestionValidatorInterface {
    const strategy = this.strategies.get(type);
    if (!strategy) {
      throw new Error(`No strategy found for question type: ${type}`);
    }
    return strategy;
  }
}

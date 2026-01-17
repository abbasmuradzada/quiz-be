import { Module } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import {
  QuestionTypeFactory,
  SingleChoiceStrategy,
  MultipleChoiceStrategy,
  TrueFalseStrategy,
  TextInputStrategy,
} from './strategies';

@Module({
  controllers: [QuestionsController],
  providers: [
    QuestionsService,
    QuestionTypeFactory,
    SingleChoiceStrategy,
    MultipleChoiceStrategy,
    TrueFalseStrategy,
    TextInputStrategy,
  ],
  exports: [QuestionsService, QuestionTypeFactory],
})
export class QuestionsModule {}

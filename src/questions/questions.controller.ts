import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto, UpdateQuestionDto, ReorderQuestionsDto } from './dto';
import { CurrentUser } from '../auth/decorators';

@Controller('quizzes/:quizId/questions')
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

  @Post()
  create(
    @Param('quizId') quizId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.questionsService.create(quizId, userId, userRole, dto);
  }

  @Patch(':id')
  update(
    @Param('quizId') quizId: string,
    @Param('id') questionId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(quizId, questionId, userId, userRole, dto);
  }

  @Delete(':id')
  delete(
    @Param('quizId') quizId: string,
    @Param('id') questionId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.questionsService.delete(quizId, questionId, userId, userRole);
  }

  @Patch('reorder')
  reorder(
    @Param('quizId') quizId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() dto: ReorderQuestionsDto,
  ) {
    return this.questionsService.reorder(quizId, userId, userRole, dto);
  }
}

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { UserRole, QuestionType } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';
import { QuestionTypeFactory } from './strategies';
import { CreateQuestionDto, UpdateQuestionDto, ReorderQuestionsDto } from './dto';

@Injectable()
export class QuestionsService {
  constructor(
    private prisma: PrismaService,
    private questionTypeFactory: QuestionTypeFactory,
  ) {}

  async create(
    quizId: string,
    userId: string,
    userRole: UserRole,
    dto: CreateQuestionDto,
  ) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (quiz.authorId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You cannot add questions to this quiz');
    }

    const strategy = this.questionTypeFactory.getStrategy(dto.type);

    if (dto.type !== QuestionType.TEXT_INPUT) {
      if (!dto.options || !strategy.validateOptions(dto.options)) {
        throw new BadRequestException('Invalid options for question type');
      }
    }

    if (dto.type === QuestionType.TEXT_INPUT && !dto.correctAnswer) {
      throw new BadRequestException('Text input questions require a correct answer');
    }

    const lastQuestion = await this.prisma.question.findFirst({
      where: { quizId },
      orderBy: { order: 'desc' },
    });

    const order = (lastQuestion?.order ?? -1) + 1;

    return this.prisma.question.create({
      data: {
        quizId,
        type: dto.type,
        text: dto.text,
        options: dto.options as any,
        correctAnswer: dto.correctAnswer,
        points: dto.points ?? 10,
        timeLimit: dto.timeLimit,
        explanation: dto.explanation,
        order,
      },
    });
  }

  async update(
    quizId: string,
    questionId: string,
    userId: string,
    userRole: UserRole,
    dto: UpdateQuestionDto,
  ) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (quiz.authorId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You cannot update questions in this quiz');
    }

    const question = await this.prisma.question.findFirst({
      where: { id: questionId, quizId },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const type = dto.type ?? question.type;

    if (dto.options) {
      const strategy = this.questionTypeFactory.getStrategy(type);
      if (!strategy.validateOptions(dto.options)) {
        throw new BadRequestException('Invalid options for question type');
      }
    }

    return this.prisma.question.update({
      where: { id: questionId },
      data: {
        ...(dto.type && { type: dto.type }),
        ...(dto.text && { text: dto.text }),
        ...(dto.options && { options: dto.options as any }),
        ...(dto.correctAnswer !== undefined && { correctAnswer: dto.correctAnswer }),
        ...(dto.points && { points: dto.points }),
        ...(dto.timeLimit !== undefined && { timeLimit: dto.timeLimit }),
        ...(dto.explanation !== undefined && { explanation: dto.explanation }),
      },
    });
  }

  async delete(
    quizId: string,
    questionId: string,
    userId: string,
    userRole: UserRole,
  ) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (quiz.authorId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You cannot delete questions from this quiz');
    }

    const question = await this.prisma.question.findFirst({
      where: { id: questionId, quizId },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return this.prisma.question.delete({ where: { id: questionId } });
  }

  async reorder(
    quizId: string,
    userId: string,
    userRole: UserRole,
    dto: ReorderQuestionsDto,
  ) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (quiz.authorId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You cannot reorder questions in this quiz');
    }

    const updates = dto.questions.map((q) =>
      this.prisma.question.update({
        where: { id: q.id },
        data: { order: q.order },
      }),
    );

    await this.prisma.$transaction(updates);

    return this.prisma.question.findMany({
      where: { quizId },
      orderBy: { order: 'asc' },
    });
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { GameMode, GameStatus, QuizVisibility } from '@prisma/client';
import { nanoid } from 'nanoid';
import { PrismaService } from '../core/prisma/prisma.service';
import { ScoringService } from './scoring.service';
import { SubmitAnswerDto } from './dto';

@Injectable()
export class GameplayService {
  constructor(
    private prisma: PrismaService,
    private scoringService: ScoringService,
  ) {}

  async startSoloGame(quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            type: true,
            text: true,
            options: true,
            points: true,
            timeLimit: true,
            order: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (quiz.visibility === QuizVisibility.PRIVATE) {
      throw new BadRequestException('This quiz is private');
    }

    if (quiz.questions.length === 0) {
      throw new BadRequestException('Quiz has no questions');
    }

    const session = await this.prisma.gameSession.create({
      data: {
        quizId,
        inviteCode: nanoid(8),
        mode: GameMode.SOLO,
        status: GameStatus.IN_PROGRESS,
        hostId: 'anonymous',
        startedAt: new Date(),
      },
    });

    return {
      sessionId: session.id,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        timeLimit: quiz.timeLimit,
      },
      questions: quiz.questions.map((q) => ({
        ...q,
        options: q.options as string[],
      })),
      totalQuestions: quiz.questions.length,
    };
  }

  async submitAnswer(dto: SubmitAnswerDto) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: dto.sessionId },
      include: {
        quiz: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Game session not found');
    }

    if (session.status !== GameStatus.IN_PROGRESS) {
      throw new BadRequestException('Game is not in progress');
    }

    const question = await this.prisma.question.findUnique({
      where: { id: dto.questionId },
    });

    if (!question || question.quizId !== session.quizId) {
      throw new NotFoundException('Question not found');
    }

    const existingAnswer = await this.prisma.answer.findUnique({
      where: {
        sessionId_questionId: {
          sessionId: dto.sessionId,
          questionId: dto.questionId,
        },
      },
    });

    if (existingAnswer) {
      throw new BadRequestException('You have already answered this question');
    }

    const timeLimit = question.timeLimit ?? session.quiz.timeLimit ?? undefined;

    const { isCorrect, points } = this.scoringService.validateAndScore(
      question.type,
      dto.answer,
      question.options as string[],
      question.correctAnswer,
      question.points,
      dto.timeTaken,
      timeLimit ? timeLimit * 1000 : undefined,
    );

    await this.prisma.answer.create({
      data: {
        sessionId: dto.sessionId,
        questionId: dto.questionId,
        answer: dto.answer as any,
        isCorrect,
        points,
        timeTaken: dto.timeTaken,
      },
    });

    return {
      isCorrect,
      points,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    };
  }

  async finishGame(sessionId: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Game session not found');
    }

    await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status: GameStatus.FINISHED,
        finishedAt: new Date(),
      },
    });

    return this.getResults(sessionId);
  }

  async getResults(sessionId: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        quiz: {
          select: { id: true, title: true },
        },
        answers: {
          include: {
            question: {
              select: { id: true, text: true, points: true },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Game session not found');
    }

    const totalQuestions = await this.prisma.question.count({
      where: { quizId: session.quizId },
    });

    const maxPossibleScore = await this.prisma.question.aggregate({
      where: { quizId: session.quizId },
      _sum: { points: true },
    });

    const totalScore = session.answers.reduce((sum, a) => sum + a.points, 0);
    const correctAnswers = session.answers.filter((a) => a.isCorrect).length;

    return {
      sessionId: session.id,
      quiz: session.quiz,
      status: session.status,
      score: totalScore,
      correctAnswers,
      totalQuestions,
      maxPossibleScore: maxPossibleScore._sum.points || 0,
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,
      answers: session.answers.map((a) => ({
        questionId: a.questionId,
        questionText: a.question.text,
        isCorrect: a.isCorrect,
        points: a.points,
        timeTaken: a.timeTaken,
      })),
    };
  }
}

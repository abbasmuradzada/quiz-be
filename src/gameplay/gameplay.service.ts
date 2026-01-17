import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { GameMode, GameStatus, QuizVisibility, UserRole } from '@prisma/client';
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

  async startSoloGame(quizId: string, userId: string, userRole: UserRole) {
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

    if (
      quiz.visibility === QuizVisibility.PRIVATE &&
      quiz.authorId !== userId &&
      userRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('You cannot access this quiz');
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
        hostId: userId,
        startedAt: new Date(),
      },
    });

    await this.prisma.gamePlayer.create({
      data: {
        sessionId: session.id,
        userId,
      },
    });

    const questionsWithoutAnswers = quiz.questions.map((q) => ({
      ...q,
      options: (q.options as any[])?.map((o: any) => ({
        id: o.id,
        text: o.text,
      })),
    }));

    return {
      sessionId: session.id,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        timeLimit: quiz.timeLimit,
      },
      questions: questionsWithoutAnswers,
      totalQuestions: quiz.questions.length,
    };
  }

  async submitAnswer(userId: string, dto: SubmitAnswerDto) {
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

    const player = await this.prisma.gamePlayer.findUnique({
      where: {
        sessionId_userId: {
          sessionId: dto.sessionId,
          userId,
        },
      },
    });

    if (!player) {
      throw new ForbiddenException('You are not part of this game');
    }

    const existingAnswer = await this.prisma.answer.findUnique({
      where: {
        sessionId_playerId_questionId: {
          sessionId: dto.sessionId,
          playerId: player.id,
          questionId: dto.questionId,
        },
      },
    });

    if (existingAnswer) {
      throw new BadRequestException('You have already answered this question');
    }

    const question = await this.prisma.question.findUnique({
      where: { id: dto.questionId },
    });

    if (!question || question.quizId !== session.quizId) {
      throw new NotFoundException('Question not found');
    }

    const timeLimit = question.timeLimit ?? session.quiz.timeLimit ?? undefined;

    const { isCorrect, points } = this.scoringService.validateAndScore(
      question.type,
      dto.answer,
      question.options as any[],
      question.correctAnswer,
      question.points,
      dto.timeTaken,
      timeLimit ? timeLimit * 1000 : undefined,
    );

    await this.prisma.answer.create({
      data: {
        sessionId: dto.sessionId,
        playerId: player.id,
        questionId: dto.questionId,
        answer: dto.answer as any,
        isCorrect,
        points,
        timeTaken: dto.timeTaken,
      },
    });

    await this.prisma.gamePlayer.update({
      where: { id: player.id },
      data: {
        score: { increment: points },
      },
    });

    return {
      isCorrect,
      points,
      correctAnswer: this.getCorrectAnswer(question),
      explanation: question.explanation,
    };
  }

  async finishGame(sessionId: string, userId: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Game session not found');
    }

    if (session.hostId !== userId) {
      throw new ForbiddenException('Only the host can finish the game');
    }

    await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status: GameStatus.FINISHED,
        finishedAt: new Date(),
      },
    });

    return this.getResults(sessionId, userId);
  }

  async getResults(sessionId: string, userId: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        quiz: {
          select: { id: true, title: true },
        },
        players: {
          include: {
            user: {
              select: { id: true, username: true },
            },
            answers: {
              include: {
                question: {
                  select: { id: true, text: true, points: true },
                },
              },
            },
          },
          orderBy: { score: 'desc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Game session not found');
    }

    const player = session.players.find((p) => p.userId === userId);

    if (!player) {
      throw new ForbiddenException('You are not part of this game');
    }

    const totalQuestions = await this.prisma.question.count({
      where: { quizId: session.quizId },
    });

    const maxPossibleScore = await this.prisma.question.aggregate({
      where: { quizId: session.quizId },
      _sum: { points: true },
    });

    return {
      sessionId: session.id,
      quiz: session.quiz,
      status: session.status,
      player: {
        score: player.score,
        rank: session.players.findIndex((p) => p.id === player.id) + 1,
        correctAnswers: player.answers.filter((a) => a.isCorrect).length,
        totalQuestions,
      },
      maxPossibleScore: maxPossibleScore._sum.points || 0,
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,
      answers: player.answers.map((a) => ({
        questionId: a.questionId,
        questionText: a.question.text,
        isCorrect: a.isCorrect,
        points: a.points,
        timeTaken: a.timeTaken,
      })),
    };
  }

  private getCorrectAnswer(question: any): any {
    if (question.correctAnswer) {
      return question.correctAnswer;
    }

    const options = question.options as any[];
    if (!options) return null;

    const correct = options.filter((o) => o.isCorrect);
    return correct.length === 1 ? correct[0].id : correct.map((o) => o.id);
  }
}

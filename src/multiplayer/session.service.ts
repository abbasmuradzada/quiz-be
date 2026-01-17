import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { GameMode, GameStatus, QuizVisibility, UserRole } from '@prisma/client';
import { nanoid } from 'nanoid';
import { PrismaService } from '../core/prisma/prisma.service';

@Injectable()
export class SessionService {
  constructor(private prisma: PrismaService) {}

  async createSession(quizId: string, userId: string, userRole: UserRole) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: { orderBy: { order: 'asc' } },
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
        mode: GameMode.MULTIPLAYER,
        status: GameStatus.WAITING,
        hostId: userId,
      },
      include: {
        quiz: {
          select: { id: true, title: true, timeLimit: true },
        },
      },
    });

    await this.prisma.gamePlayer.create({
      data: {
        sessionId: session.id,
        userId,
      },
    });

    return {
      sessionId: session.id,
      inviteCode: session.inviteCode,
      quiz: session.quiz,
      totalQuestions: quiz.questions.length,
    };
  }

  async joinSession(inviteCode: string, userId: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { inviteCode },
      include: {
        quiz: {
          select: { id: true, title: true },
        },
        players: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Game not found');
    }

    if (session.status !== GameStatus.WAITING) {
      throw new BadRequestException('Game has already started');
    }

    const existingPlayer = session.players.find((p) => p.userId === userId);
    if (existingPlayer) {
      return {
        sessionId: session.id,
        quiz: session.quiz,
        players: session.players.map((p) => ({
          id: p.userId,
          username: p.user.username,
        })),
        isHost: session.hostId === userId,
      };
    }

    await this.prisma.gamePlayer.create({
      data: {
        sessionId: session.id,
        userId,
      },
    });

    const updatedPlayers = await this.prisma.gamePlayer.findMany({
      where: { sessionId: session.id },
      include: {
        user: {
          select: { id: true, username: true },
        },
      },
    });

    return {
      sessionId: session.id,
      quiz: session.quiz,
      players: updatedPlayers.map((p) => ({
        id: p.userId,
        username: p.user.username,
      })),
      isHost: session.hostId === userId,
    };
  }

  async getSessionPlayers(sessionId: string) {
    return this.prisma.gamePlayer.findMany({
      where: { sessionId },
      include: {
        user: {
          select: { id: true, username: true },
        },
      },
      orderBy: { score: 'desc' },
    });
  }

  async startGame(sessionId: string, userId: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Game not found');
    }

    if (session.hostId !== userId) {
      throw new ForbiddenException('Only the host can start the game');
    }

    if (session.status !== GameStatus.WAITING) {
      throw new BadRequestException('Game has already started');
    }

    await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status: GameStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });

    const firstQuestion = session.quiz.questions[0];

    return {
      question: this.sanitizeQuestion(firstQuestion),
      index: 0,
      total: session.quiz.questions.length,
      timeLimit: firstQuestion.timeLimit ?? session.quiz.timeLimit,
    };
  }

  async getNextQuestion(sessionId: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Game not found');
    }

    const nextIndex = session.currentIndex + 1;

    if (nextIndex >= session.quiz.questions.length) {
      return null;
    }

    await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: { currentIndex: nextIndex },
    });

    const question = session.quiz.questions[nextIndex];

    return {
      question: this.sanitizeQuestion(question),
      index: nextIndex,
      total: session.quiz.questions.length,
      timeLimit: question.timeLimit ?? session.quiz.timeLimit,
    };
  }

  async finishSession(sessionId: string) {
    const session = await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status: GameStatus.FINISHED,
        finishedAt: new Date(),
      },
    });

    const players = await this.prisma.gamePlayer.findMany({
      where: { sessionId },
      include: {
        user: {
          select: { id: true, username: true },
        },
      },
      orderBy: { score: 'desc' },
    });

    for (let i = 0; i < players.length; i++) {
      await this.prisma.gamePlayer.update({
        where: { id: players[i].id },
        data: { rank: i + 1 },
      });
    }

    return {
      sessionId: session.id,
      rankings: players.map((p, index) => ({
        rank: index + 1,
        id: p.userId,
        username: p.user.username,
        score: p.score,
      })),
    };
  }

  async leaveSession(sessionId: string, userId: string) {
    const player = await this.prisma.gamePlayer.findUnique({
      where: {
        sessionId_userId: { sessionId, userId },
      },
    });

    if (player) {
      await this.prisma.gamePlayer.delete({
        where: { id: player.id },
      });
    }

    return { success: true };
  }

  async getSession(sessionId: string) {
    return this.prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        quiz: {
          select: { id: true, title: true, timeLimit: true },
        },
        players: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
          orderBy: { score: 'desc' },
        },
      },
    });
  }

  private sanitizeQuestion(question: any) {
    return {
      id: question.id,
      type: question.type,
      text: question.text,
      points: question.points,
      options: (question.options as any[])?.map((o: any) => ({
        id: o.id,
        text: o.text,
      })),
    };
  }
}

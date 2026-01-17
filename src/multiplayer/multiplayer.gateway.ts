import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SessionService } from './session.service';
import { ScoringService } from '../gameplay/scoring.service';
import { PrismaService } from '../core/prisma/prisma.service';
import { GameEvents } from './events/game.events';
import { JoinGameDto, GameAnswerDto } from './dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  currentSession?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/game',
})
export class MultiplayerGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, string> = new Map();

  constructor(
    private sessionService: SessionService,
    private scoringService: ScoringService,
    private prisma: PrismaService,
  ) {}

  handleConnection(client: AuthenticatedSocket) {
    const userId = client.handshake.auth?.userId;
    const username = client.handshake.auth?.username;

    if (userId) {
      client.userId = userId;
      client.username = username;
      this.userSockets.set(userId, client.id);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.userSockets.delete(client.userId);

      if (client.currentSession) {
        this.server.to(client.currentSession).emit(GameEvents.PLAYER_LEFT, {
          playerId: client.userId,
          username: client.username,
        });
      }
    }
  }

  @SubscribeMessage(GameEvents.JOIN_GAME)
  async handleJoinGame(
    @MessageBody() dto: JoinGameDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        return { error: 'Unauthorized' };
      }

      const result = await this.sessionService.joinSession(
        dto.inviteCode,
        client.userId,
      );

      client.currentSession = result.sessionId;
      client.join(result.sessionId);

      this.server.to(result.sessionId).emit(GameEvents.PLAYER_JOINED, {
        playerId: client.userId,
        username: client.username,
        playerCount: result.players.length,
        players: result.players,
      });

      return result;
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage(GameEvents.START_GAME)
  async handleStartGame(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        return { error: 'Unauthorized' };
      }

      const result = await this.sessionService.startGame(
        data.sessionId,
        client.userId,
      );

      this.server.to(data.sessionId).emit(GameEvents.GAME_STARTED, result);

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage(GameEvents.SUBMIT_ANSWER)
  async handleSubmitAnswer(
    @MessageBody() dto: GameAnswerDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        return { error: 'Unauthorized' };
      }

      const session = await this.prisma.gameSession.findUnique({
        where: { id: dto.sessionId },
        include: { quiz: true },
      });

      if (!session) {
        return { error: 'Game not found' };
      }

      const player = await this.prisma.gamePlayer.findUnique({
        where: {
          sessionId_userId: {
            sessionId: dto.sessionId,
            userId: client.userId,
          },
        },
      });

      if (!player) {
        return { error: 'Player not found' };
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
        return { error: 'Already answered' };
      }

      const question = await this.prisma.question.findUnique({
        where: { id: dto.questionId },
      });

      if (!question) {
        return { error: 'Question not found' };
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
        data: { score: { increment: points } },
      });

      this.server.to(dto.sessionId).emit(GameEvents.PLAYER_ANSWERED, {
        playerId: client.userId,
        username: client.username,
      });

      const players = await this.sessionService.getSessionPlayers(dto.sessionId);
      this.server.to(dto.sessionId).emit(GameEvents.LEADERBOARD_UPDATE, {
        rankings: players.map((p, index) => ({
          rank: index + 1,
          id: p.userId,
          username: p.user.username,
          score: p.score,
        })),
      });

      return {
        isCorrect,
        points,
        correctAnswer: this.getCorrectAnswer(question),
        explanation: question.explanation,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('next_question')
  async handleNextQuestion(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const session = await this.prisma.gameSession.findUnique({
        where: { id: data.sessionId },
      });

      if (!session || session.hostId !== client.userId) {
        return { error: 'Unauthorized' };
      }

      const result = await this.sessionService.getNextQuestion(data.sessionId);

      if (!result) {
        const finishResult = await this.sessionService.finishSession(data.sessionId);
        this.server.to(data.sessionId).emit(GameEvents.GAME_FINISHED, finishResult);
        return { finished: true, ...finishResult };
      }

      this.server.to(data.sessionId).emit(GameEvents.NEXT_QUESTION, result);
      return result;
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage(GameEvents.LEAVE_GAME)
  async handleLeaveGame(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        return { error: 'Unauthorized' };
      }

      await this.sessionService.leaveSession(data.sessionId, client.userId);

      client.leave(data.sessionId);
      client.currentSession = undefined;

      this.server.to(data.sessionId).emit(GameEvents.PLAYER_LEFT, {
        playerId: client.userId,
        username: client.username,
      });

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
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

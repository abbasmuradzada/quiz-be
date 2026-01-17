import {
  Controller,
  Post,
  Get,
  Param,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { SessionService } from './session.service';
import { CurrentUser } from '../auth/decorators';

@Controller('multiplayer')
export class MultiplayerController {
  constructor(private sessionService: SessionService) {}

  @Post('create/:quizId')
  createSession(
    @Param('quizId') quizId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.sessionService.createSession(quizId, userId, userRole);
  }

  @Post('join/:inviteCode')
  joinSession(
    @Param('inviteCode') inviteCode: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.sessionService.joinSession(inviteCode, userId);
  }

  @Get(':sessionId')
  getSession(@Param('sessionId') sessionId: string) {
    return this.sessionService.getSession(sessionId);
  }
}

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { GameplayService } from './gameplay.service';
import { SubmitAnswerDto } from './dto';
import { CurrentUser } from '../auth/decorators';

@Controller('play')
export class GameplayController {
  constructor(private gameplayService: GameplayService) {}

  @Post('solo/:quizId')
  startSoloGame(
    @Param('quizId') quizId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.gameplayService.startSoloGame(quizId, userId, userRole);
  }

  @Post('answer')
  submitAnswer(
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.gameplayService.submitAnswer(userId, dto);
  }

  @Post(':sessionId/finish')
  finishGame(
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.gameplayService.finishGame(sessionId, userId);
  }

  @Get(':sessionId/results')
  getResults(
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.gameplayService.getResults(sessionId, userId);
  }
}

import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { GameplayService } from './gameplay.service';
import { SubmitAnswerDto } from './dto';
import { Public } from '../auth/decorators';

@Controller('play')
export class GameplayController {
  constructor(private gameplayService: GameplayService) {}

  @Public()
  @Post('solo/:quizId')
  startSoloGame(@Param('quizId') quizId: string) {
    return this.gameplayService.startSoloGame(quizId);
  }

  @Public()
  @Post('answer')
  submitAnswer(@Body() dto: SubmitAnswerDto) {
    return this.gameplayService.submitAnswer(dto);
  }

  @Public()
  @Post(':sessionId/finish')
  finishGame(@Param('sessionId') sessionId: string) {
    return this.gameplayService.finishGame(sessionId);
  }

  @Public()
  @Get(':sessionId/results')
  getResults(@Param('sessionId') sessionId: string) {
    return this.gameplayService.getResults(sessionId);
  }
}

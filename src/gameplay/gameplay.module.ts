import { Module } from '@nestjs/common';
import { GameplayService } from './gameplay.service';
import { GameplayController } from './gameplay.controller';
import { ScoringService } from './scoring.service';
import { QuestionsModule } from '../questions/questions.module';

@Module({
  imports: [QuestionsModule],
  controllers: [GameplayController],
  providers: [GameplayService, ScoringService],
  exports: [GameplayService, ScoringService],
})
export class GameplayModule {}

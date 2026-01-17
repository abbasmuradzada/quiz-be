import { Module } from '@nestjs/common';
import { MultiplayerGateway } from './multiplayer.gateway';
import { MultiplayerController } from './multiplayer.controller';
import { SessionService } from './session.service';
import { GameplayModule } from '../gameplay/gameplay.module';

@Module({
  imports: [GameplayModule],
  controllers: [MultiplayerController],
  providers: [MultiplayerGateway, SessionService],
  exports: [SessionService],
})
export class MultiplayerModule {}

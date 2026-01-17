import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CoreModule } from './core/core.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { QuestionsModule } from './questions/questions.module';
import { GameplayModule } from './gameplay/gameplay.module';
import { MultiplayerModule } from './multiplayer/multiplayer.module';
import { JwtAuthGuard } from './auth/guards';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // VERY IMPORTANT
    }),
    CoreModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    QuizzesModule,
    QuestionsModule,
    GameplayModule,
    MultiplayerModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

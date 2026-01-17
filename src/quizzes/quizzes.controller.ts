import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto, UpdateQuizDto, QueryQuizDto } from './dto';
import { CurrentUser, Public } from '../auth/decorators';

@Controller('quizzes')
export class QuizzesController {
  constructor(private quizzesService: QuizzesService) {}

  @Public()
  @Get()
  findPublic(@Query() query: QueryQuizDto) {
    return this.quizzesService.findPublic(query);
  }

  @Get('my')
  findMy(
    @CurrentUser('id') userId: string,
    @Query() query: QueryQuizDto,
  ) {
    return this.quizzesService.findUserQuizzes(userId, query);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.quizzesService.findById(id, userId, userRole);
  }

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateQuizDto,
  ) {
    return this.quizzesService.create(userId, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() dto: UpdateQuizDto,
  ) {
    return this.quizzesService.update(id, userId, userRole, dto);
  }

  @Delete(':id')
  delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.quizzesService.delete(id, userId, userRole);
  }
}

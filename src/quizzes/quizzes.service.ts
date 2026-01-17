import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { QuizVisibility, UserRole } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateQuizDto, UpdateQuizDto, QueryQuizDto } from './dto';

@Injectable()
export class QuizzesService {
  constructor(private prisma: PrismaService) {}

  async findPublic(query: QueryQuizDto) {
    const { categoryId, difficulty, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = {
      visibility: QuizVisibility.PUBLIC,
      ...(categoryId && { categoryId }),
      ...(difficulty && { difficulty }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [quizzes, total] = await Promise.all([
      this.prisma.quiz.findMany({
        where,
        include: {
          author: {
            select: { id: true, username: true },
          },
          category: true,
          _count: { select: { questions: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.quiz.count({ where }),
    ]);

    return {
      data: quizzes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findUserQuizzes(userId: string, query: QueryQuizDto) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = { authorId: userId };

    const [quizzes, total] = await Promise.all([
      this.prisma.quiz.findMany({
        where,
        include: {
          category: true,
          _count: { select: { questions: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.quiz.count({ where }),
    ]);

    return {
      data: quizzes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, userId?: string, userRole?: UserRole) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true },
        },
        category: true,
        questions: {
          orderBy: { order: 'asc' },
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

    return quiz;
  }

  async create(userId: string, dto: CreateQuizDto) {
    return this.prisma.quiz.create({
      data: {
        ...dto,
        authorId: userId,
      },
      include: {
        category: true,
      },
    });
  }

  async update(id: string, userId: string, userRole: UserRole, dto: UpdateQuizDto) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (quiz.authorId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You cannot update this quiz');
    }

    return this.prisma.quiz.update({
      where: { id },
      data: dto,
      include: {
        category: true,
      },
    });
  }

  async delete(id: string, userId: string, userRole: UserRole) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (quiz.authorId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You cannot delete this quiz');
    }

    return this.prisma.quiz.delete({ where: { id } });
  }
}

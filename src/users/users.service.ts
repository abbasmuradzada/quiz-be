import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    if (dto.username) {
      const existing = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Username already taken');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async getStats(userId: string) {
    const [quizCount, gamesPlayed, totalScore] = await Promise.all([
      this.prisma.quiz.count({ where: { authorId: userId } }),
      this.prisma.gamePlayer.count({ where: { userId } }),
      this.prisma.gamePlayer.aggregate({
        where: { userId },
        _sum: { score: true },
      }),
    ]);

    return {
      quizCount,
      gamesPlayed,
      totalScore: totalScore._sum.score || 0,
    };
  }
}

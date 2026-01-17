import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      include: {
        _count: {
          select: { quizzes: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { quizzes: true },
        },
      },
    });
  }

  async create(dto: CreateCategoryDto) {
    const slug = this.generateSlug(dto.name);

    const existing = await this.prisma.category.findFirst({
      where: { OR: [{ name: dto.name }, { slug }] },
    });

    if (existing) {
      throw new ConflictException('Category already exists');
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        description: dto.description,
        slug,
      },
    });
  }

  async update(id: string, dto: CreateCategoryDto) {
    const slug = this.generateSlug(dto.name);

    const existing = await this.prisma.category.findFirst({
      where: {
        OR: [{ name: dto.name }, { slug }],
        NOT: { id },
      },
    });

    if (existing) {
      throw new ConflictException('Category name already exists');
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        slug,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}

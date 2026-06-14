import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateOutfitDto } from './dto';

@Injectable()
export class OutfitService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOutfitDto) {
    return this.prisma.outfit.create({
      data: {
        ...dto,
        wearDate: new Date(dto.wearDate),
      },
      include: { jewelry: { select: { id: true, name: true, material: true } } },
    });
  }

  async findAll(params?: { jewelryId?: number }) {
    const where: any = {};
    if (params?.jewelryId) where.jewelryId = params.jewelryId;
    return this.prisma.outfit.findMany({
      where,
      orderBy: { wearDate: 'desc' },
      include: { jewelry: { select: { id: true, name: true, material: true } } },
    });
  }

  async findOne(id: number) {
    const outfit = await this.prisma.outfit.findUnique({
      where: { id },
      include: { jewelry: true },
    });
    if (!outfit) throw new NotFoundException('穿搭记录不存在');
    return outfit;
  }

  async remove(id: number) {
    return this.prisma.outfit.delete({ where: { id } });
  }
}

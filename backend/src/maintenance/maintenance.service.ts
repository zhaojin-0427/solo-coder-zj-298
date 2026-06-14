import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateMaintenanceDto } from './dto';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateMaintenanceDto) {
    return this.prisma.maintenance.create({
      data: {
        ...dto,
        date: new Date(dto.date),
      },
      include: { jewelry: { select: { id: true, name: true } } },
    });
  }

  async findAll(params?: { jewelryId?: number }) {
    const where: any = {};
    if (params?.jewelryId) where.jewelryId = params.jewelryId;
    return this.prisma.maintenance.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { jewelry: { select: { id: true, name: true } } },
    });
  }

  async findOne(id: number) {
    const m = await this.prisma.maintenance.findUnique({
      where: { id },
      include: { jewelry: true },
    });
    if (!m) throw new NotFoundException('养护记录不存在');
    return m;
  }

  async remove(id: number) {
    return this.prisma.maintenance.delete({ where: { id } });
  }
}

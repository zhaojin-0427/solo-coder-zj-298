import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateRepairDto, UpdateRepairDto } from './dto';

@Injectable()
export class RepairService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRepairDto) {
    const data: any = {
      jewelryId: dto.jewelryId,
      problemType: dto.problemType,
      sendDate: new Date(dto.sendDate),
      repairItems: dto.repairItems,
      cost: dto.cost,
      status: dto.status,
      notes: dto.notes,
    };
    if (dto.returnDate) data.returnDate = new Date(dto.returnDate);
    return this.prisma.repair.create({
      data,
      include: { jewelry: { select: { id: true, name: true } } },
    });
  }

  async findAll(params?: { jewelryId?: number; status?: string }) {
    const where: any = {};
    if (params?.jewelryId) where.jewelryId = params.jewelryId;
    if (params?.status) where.status = params.status;
    return this.prisma.repair.findMany({
      where,
      orderBy: { sendDate: 'desc' },
      include: { jewelry: { select: { id: true, name: true } } },
    });
  }

  async findOne(id: number) {
    const r = await this.prisma.repair.findUnique({
      where: { id },
      include: { jewelry: true },
    });
    if (!r) throw new NotFoundException('维修记录不存在');
    return r;
  }

  async update(id: number, dto: UpdateRepairDto) {
    const data: any = { ...dto };
    if (dto.returnDate) data.returnDate = new Date(dto.returnDate);
    return this.prisma.repair.update({ where: { id }, data });
  }

  async remove(id: number) {
    return this.prisma.repair.delete({ where: { id } });
  }
}

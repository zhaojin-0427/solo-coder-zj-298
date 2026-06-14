import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateRepairDto, UpdateRepairDto } from './dto';

@Injectable()
export class RepairService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRepairDto) {
    if (dto.status === '已完成' && !dto.returnDate) {
      throw new BadRequestException('维修已完成时必须填写取件日期');
    }
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

    const result = await this.prisma.repair.create({
      data,
      include: { jewelry: { select: { id: true, name: true } } },
    });

    if (dto.status === '维修中') {
      const sendD = new Date(dto.sendDate);
      const returnD = dto.returnDate
        ? new Date(dto.returnDate)
        : new Date(sendD.getTime() + 30 * 24 * 60 * 60 * 1000);
      await this.prisma.wearPlan.updateMany({
        where: {
          status: '已确认',
          planDate: { gte: sendD, lte: returnD },
          wearPlanItems: {
            some: {
              jewelryId: dto.jewelryId,
              isSelected: true,
            },
          },
        },
        data: { conflictResolved: false },
      });
    }

    return result;
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
    const existing = await this.prisma.repair.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('维修记录不存在');
    
    const newStatus = dto.status || existing.status;
    const newReturnDate = dto.returnDate || existing.returnDate;
    
    if (newStatus === '已完成' && !newReturnDate) {
      throw new BadRequestException('维修已完成时必须填写取件日期');
    }
    
    const data: any = { ...dto };
    if (dto.returnDate) data.returnDate = new Date(dto.returnDate);
    return this.prisma.repair.update({ where: { id }, data });
  }

  async remove(id: number) {
    return this.prisma.repair.delete({ where: { id } });
  }
}

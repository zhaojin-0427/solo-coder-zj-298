import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateLendingDto, ReturnLendingDto } from './dto';

@Injectable()
export class LendingService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLendingDto) {
    const activeLending = await this.prisma.lending.findFirst({
      where: { jewelryId: dto.jewelryId, status: '借出中' },
    });
    if (activeLending) {
      throw new BadRequestException('该首饰当前已被借出，无法重复登记');
    }
    return this.prisma.lending.create({
      data: {
        jewelryId: dto.jewelryId,
        borrowerName: dto.borrowerName,
        borrowerContact: dto.borrowerContact,
        lendDate: new Date(dto.lendDate),
        expectedReturnDate: new Date(dto.expectedReturnDate),
        purpose: dto.purpose,
        deposit: dto.deposit || 0,
        conditionBeforeLend: dto.conditionBeforeLend,
        notes: dto.notes,
        status: '借出中',
      },
      include: { jewelry: { select: { id: true, name: true, material: true } } },
    });
  }

  async findAll(params?: { status?: string; jewelryId?: number }) {
    const where: any = {};
    if (params?.status) where.status = params.status;
    if (params?.jewelryId) where.jewelryId = params.jewelryId;
    return this.prisma.lending.findMany({
      where,
      orderBy: { lendDate: 'desc' },
      include: { jewelry: { select: { id: true, name: true, material: true } } },
    });
  }

  async findOne(id: number) {
    const lending = await this.prisma.lending.findUnique({
      where: { id },
      include: { jewelry: true },
    });
    if (!lending) throw new NotFoundException('借还记录不存在');
    return lending;
  }

  async returnJewelry(id: number, dto: ReturnLendingDto) {
    const lending = await this.prisma.lending.findUnique({ where: { id } });
    if (!lending) throw new NotFoundException('借还记录不存在');
    if (lending.status !== '借出中' && lending.status !== '逾期未还') {
      throw new BadRequestException('该首饰已归还，无法重复操作');
    }
    return this.prisma.lending.update({
      where: { id },
      data: {
        returnCondition: dto.returnCondition || '',
        hasWear: dto.hasWear || false,
        compensationAmount: dto.compensationAmount || 0,
        actualReturnDate: dto.actualReturnDate ? new Date(dto.actualReturnDate) : new Date(),
        notes: dto.notes,
        status: '已归还',
      },
      include: { jewelry: { select: { id: true, name: true, material: true } } },
    });
  }

  async updateOverdue() {
    const now = new Date();
    const result = await this.prisma.lending.updateMany({
      where: {
        status: '借出中',
        expectedReturnDate: { lt: now },
      },
      data: { status: '逾期未还' },
    });
    return { updated: result.count };
  }

  async remove(id: number) {
    return this.prisma.lending.delete({ where: { id } });
  }
}

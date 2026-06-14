import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateJewelryDto, UpdateJewelryDto } from './dto';

@Injectable()
export class JewelryService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateJewelryDto) {
    return this.prisma.jewelry.create({
      data: {
        ...dto,
        purchaseDate: new Date(dto.purchaseDate),
      },
    });
  }

  async findAll() {
    return this.prisma.jewelry.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { outfits: true, maintenances: true, repairs: true },
        },
        lendings: {
          where: { status: { in: ['借出中', '逾期未还'] } },
          take: 1,
          orderBy: { lendDate: 'desc' },
          select: {
            id: true,
            borrowerName: true,
            expectedReturnDate: true,
            status: true,
          },
        },
        valuations: {
          orderBy: { valuationDate: 'desc' },
          take: 1,
          select: {
            id: true,
            currentValue: true,
            valuationDate: true,
            valuationAgency: true,
          },
        },
        insurances: {
          where: { status: '生效中' },
          take: 1,
          select: {
            id: true,
            policyNumber: true,
            insuranceCompany: true,
            endDate: true,
            status: true,
          },
        },
        credentials: {
          select: { id: true, type: true },
        },
      },
    });
  }

  async findOne(id: number) {
    const jewelry = await this.prisma.jewelry.findUnique({
      where: { id },
      include: {
        outfits: { orderBy: { wearDate: 'desc' }, take: 10 },
        maintenances: { orderBy: { date: 'desc' }, take: 10 },
        repairs: { orderBy: { sendDate: 'desc' }, take: 10 },
        lendings: {
          where: { status: { in: ['借出中', '逾期未还'] } },
          take: 1,
          orderBy: { lendDate: 'desc' },
        },
        wearPlanItems: {
          where: {
            isSelected: true,
            wearPlan: {
              status: '已确认',
              planDate: { gte: new Date() },
            },
          },
          include: {
            wearPlan: {
              select: {
                id: true,
                planDate: true,
                scenario: true,
                outfitTags: true,
                priority: true,
              },
            },
          },
          orderBy: { wearPlan: { planDate: 'asc' } },
        },
        valuations: {
          orderBy: { valuationDate: 'desc' },
          take: 5,
        },
        insurances: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        credentials: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!jewelry) throw new NotFoundException('首饰不存在');
    return jewelry;
  }

  async update(id: number, dto: UpdateJewelryDto) {
    const data: any = { ...dto };
    if (dto.purchaseDate) data.purchaseDate = new Date(dto.purchaseDate);
    return this.prisma.jewelry.update({ where: { id }, data });
  }

  async remove(id: number) {
    return this.prisma.jewelry.delete({ where: { id } });
  }
}

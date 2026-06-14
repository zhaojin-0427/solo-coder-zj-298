import { Module } from '@nestjs/common';
import { RepairController } from './repair.controller';
import { RepairService } from './repair.service';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [RepairController],
  providers: [RepairService, PrismaService],
})
export class RepairModule {}

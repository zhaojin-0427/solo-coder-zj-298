import { Module } from '@nestjs/common';
import { JewelryController } from './jewelry.controller';
import { JewelryService } from './jewelry.service';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [JewelryController],
  providers: [JewelryService, PrismaService],
})
export class JewelryModule {}

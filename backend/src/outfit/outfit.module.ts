import { Module } from '@nestjs/common';
import { OutfitController } from './outfit.controller';
import { OutfitService } from './outfit.service';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [OutfitController],
  providers: [OutfitService, PrismaService],
})
export class OutfitModule {}

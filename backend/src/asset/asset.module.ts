import { Module } from '@nestjs/common';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [AssetController],
  providers: [AssetService, PrismaService],
})
export class AssetModule {}

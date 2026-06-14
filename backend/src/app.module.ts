import { Module } from '@nestjs/common';
import { JewelryModule } from './jewelry/jewelry.module';
import { OutfitModule } from './outfit/outfit.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { RepairModule } from './repair/repair.module';
import { StatsModule } from './stats/stats.module';
import { LendingModule } from './lending/lending.module';
import { ScheduleModule } from './schedule/schedule.module';
import { AssetModule } from './asset/asset.module';
import { PrismaService } from './common/prisma.service';
import { UnifiedRiskStatusService } from './common/unified-risk-status.service';

@Module({
  imports: [JewelryModule, OutfitModule, MaintenanceModule, RepairModule, StatsModule, LendingModule, ScheduleModule, AssetModule],
  providers: [PrismaService, UnifiedRiskStatusService],
  exports: [PrismaService, UnifiedRiskStatusService],
})
export class AppModule {}

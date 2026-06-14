import { Module } from '@nestjs/common';
import { JewelryModule } from './jewelry/jewelry.module';
import { OutfitModule } from './outfit/outfit.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { RepairModule } from './repair/repair.module';
import { StatsModule } from './stats/stats.module';
import { LendingModule } from './lending/lending.module';
import { ScheduleModule } from './schedule/schedule.module';
import { PrismaService } from './common/prisma.service';

@Module({
  imports: [JewelryModule, OutfitModule, MaintenanceModule, RepairModule, StatsModule, LendingModule, ScheduleModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}

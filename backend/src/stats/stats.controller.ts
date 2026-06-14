import { Controller, Get, Query } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('api/stats')
export class StatsController {
  constructor(private readonly service: StatsService) {}

  @Get()
  getAll(@Query('days') days?: string) {
    return this.service.getAll(days ? parseInt(days) : 30);
  }

  @Get('overview')
  getOverview() {
    return this.service.getOverview();
  }

  @Get('material-frequency')
  getMaterialFrequency() {
    return this.service.getMaterialWearFrequency();
  }

  @Get('problem-distribution')
  getProblemDistribution() {
    return this.service.getProblemDistribution();
  }

  @Get('top-combinations')
  getTopCombinations() {
    return this.service.getTopOutfitCombinations();
  }

  @Get('idle-jewelry')
  getIdleJewelry(@Query('days') days?: string) {
    return this.service.getLongIdleJewelry(days ? parseInt(days) : 30);
  }

  @Get('lending')
  getLendingStats() {
    return this.service.getLendingStats();
  }
}

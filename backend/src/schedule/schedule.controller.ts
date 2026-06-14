import { Controller, Get, Post, Body, Param, Delete, Put, ParseIntPipe, Query } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { CreateWearPlanDto, ConfirmWearPlanDto, ResolveConflictDto } from './dto';

@Controller('api/schedule')
export class ScheduleController {
  constructor(private readonly service: ScheduleService) {}

  @Post('recommend')
  generateRecommendations(
    @Body()
    body: {
      jewelryIds: number[];
      planDate: string;
      scenario: string;
      outfitTags: string | string[];
      priority?: number;
    },
  ) {
    return this.service.generateRecommendations(
      body.jewelryIds,
      body.planDate,
      body.scenario,
      body.outfitTags,
      body.priority || 1,
    );
  }

  @Post()
  createPlan(@Body() dto: CreateWearPlanDto) {
    return this.service.createPlan(dto);
  }

  @Get()
  listPlans(
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.listPlans({ status, fromDate, toDate });
  }

  @Get('conflicts')
  detectConflicts() {
    return this.service.detectConflicts();
  }

  @Get(':id')
  getPlanDetail(@Param('id', ParseIntPipe) id: number) {
    return this.service.getPlanDetail(id);
  }

  @Put(':id/confirm')
  confirmPlan(@Param('id', ParseIntPipe) id: number, @Body() dto: ConfirmWearPlanDto) {
    return this.service.confirmPlan(id, dto);
  }

  @Put(':id/resolve-conflict/:jewelryId')
  resolveConflict(
    @Param('id', ParseIntPipe) planId: number,
    @Param('jewelryId', ParseIntPipe) jewelryId: number,
    @Body() dto: ResolveConflictDto,
  ) {
    return this.service.resolveConflict(planId, jewelryId, dto);
  }

  @Delete(':id')
  deletePlan(@Param('id', ParseIntPipe) id: number) {
    return this.service.deletePlan(id);
  }

  @Get('jewelry/:jewelryId/future')
  getJewelryFuturePlans(@Param('jewelryId', ParseIntPipe) jewelryId: number) {
    return this.service.getJewelryFuturePlans(jewelryId);
  }
}

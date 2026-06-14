import { Controller, Get, Post, Body, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto';

@Controller('api/maintenances')
export class MaintenanceController {
  constructor(private readonly service: MaintenanceService) {}

  @Post()
  create(@Body() dto: CreateMaintenanceDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('jewelryId') jewelryId?: string) {
    return this.service.findAll({
      jewelryId: jewelryId ? parseInt(jewelryId) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}

import { Controller, Get, Post, Body, Param, Delete, Put, Query, ParseIntPipe } from '@nestjs/common';
import { RepairService } from './repair.service';
import { CreateRepairDto, UpdateRepairDto } from './dto';

@Controller('api/repairs')
export class RepairController {
  constructor(private readonly service: RepairService) {}

  @Post()
  create(@Body() dto: CreateRepairDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('jewelryId') jewelryId?: string, @Query('status') status?: string) {
    return this.service.findAll({
      jewelryId: jewelryId ? parseInt(jewelryId) : undefined,
      status,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRepairDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}

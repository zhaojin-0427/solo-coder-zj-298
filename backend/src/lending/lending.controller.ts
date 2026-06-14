import { Controller, Get, Post, Body, Param, Delete, Put, ParseIntPipe, Query } from '@nestjs/common';
import { LendingService } from './lending.service';
import { CreateLendingDto, ReturnLendingDto } from './dto';

@Controller('api/lendings')
export class LendingController {
  constructor(private readonly service: LendingService) {}

  @Post()
  create(@Body() dto: CreateLendingDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('jewelryId') jewelryId?: string,
  ) {
    return this.service.findAll({
      status,
      jewelryId: jewelryId ? parseInt(jewelryId) : undefined,
    });
  }

  @Get('overdue-check')
  checkOverdue() {
    return this.service.updateOverdue();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put(':id/return')
  returnJewelry(@Param('id', ParseIntPipe) id: number, @Body() dto: ReturnLendingDto) {
    return this.service.returnJewelry(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}

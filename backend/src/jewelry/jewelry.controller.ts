import { Controller, Get, Post, Body, Param, Delete, Put, ParseIntPipe } from '@nestjs/common';
import { JewelryService } from './jewelry.service';
import { RiskService } from './risk.service';
import { CreateJewelryDto, UpdateJewelryDto } from './dto';

@Controller('api/jewelry')
export class JewelryController {
  constructor(
    private readonly service: JewelryService,
    private readonly riskService: RiskService,
  ) {}

  @Post()
  create(@Body() dto: CreateJewelryDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateJewelryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Get(':id/risk')
  getRiskAssessment(@Param('id', ParseIntPipe) id: number) {
    return this.riskService.assessJewelry(id);
  }

  @Get('risk/all')
  getAllRiskAssessments() {
    return this.riskService.assessAllJewelry();
  }

  @Get('risk/stats')
  getRiskStats() {
    return this.riskService.getRiskStats();
  }
}

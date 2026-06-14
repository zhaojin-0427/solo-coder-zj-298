import { Controller, Get, Post, Body, Param, Delete, Put, ParseIntPipe } from '@nestjs/common';
import { JewelryService } from './jewelry.service';
import { CreateJewelryDto, UpdateJewelryDto } from './dto';

@Controller('api/jewelry')
export class JewelryController {
  constructor(private readonly service: JewelryService) {}

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
}

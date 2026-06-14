import { Controller, Get, Post, Body, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { OutfitService } from './outfit.service';
import { CreateOutfitDto } from './dto';

@Controller('api/outfits')
export class OutfitController {
  constructor(private readonly service: OutfitService) {}

  @Post()
  create(@Body() dto: CreateOutfitDto) {
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

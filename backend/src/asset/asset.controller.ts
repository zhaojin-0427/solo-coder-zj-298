import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { AssetService } from './asset.service';
import {
  CreateValuationDto,
  CreateInsuranceDto,
  UpdateInsuranceDto,
  CreateCredentialDto,
  UpdateCredentialDto,
  RenewInsuranceDto,
} from './dto';

@Controller('api/asset')
export class AssetController {
  constructor(private readonly service: AssetService) {}

  @Get('valuations')
  getValuations(@Query('jewelryId') jewelryId?: string) {
    return this.service.getValuations(jewelryId ? parseInt(jewelryId) : undefined);
  }

  @Post('valuations')
  createValuation(@Body() dto: CreateValuationDto) {
    return this.service.createValuation(dto);
  }

  @Delete('valuations/:id')
  deleteValuation(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteValuation(id);
  }

  @Get('insurances')
  getInsurances(@Query('jewelryId') jewelryId?: string) {
    return this.service.getInsurances(jewelryId ? parseInt(jewelryId) : undefined);
  }

  @Post('insurances')
  createInsurance(@Body() dto: CreateInsuranceDto) {
    return this.service.createInsurance(dto);
  }

  @Put('insurances/:id')
  updateInsurance(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInsuranceDto) {
    return this.service.updateInsurance(id, dto);
  }

  @Post('insurances/:id/renew')
  renewInsurance(@Param('id', ParseIntPipe) id: number, @Body() dto: RenewInsuranceDto) {
    return this.service.renewInsurance(id, dto);
  }

  @Delete('insurances/:id')
  deleteInsurance(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteInsurance(id);
  }

  @Get('credentials')
  getCredentials(@Query('jewelryId') jewelryId?: string) {
    return this.service.getCredentials(jewelryId ? parseInt(jewelryId) : undefined);
  }

  @Post('credentials')
  createCredential(@Body() dto: CreateCredentialDto) {
    return this.service.createCredential(dto);
  }

  @Put('credentials/:id')
  updateCredential(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCredentialDto) {
    return this.service.updateCredential(id, dto);
  }

  @Delete('credentials/:id')
  deleteCredential(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteCredential(id);
  }

  @Get('uninsured')
  getUninsuredJewelry() {
    return this.service.getUninsuredJewelry();
  }

  @Get('expiring-policies')
  getExpiringPolicies(@Query('days') days?: string) {
    return this.service.getExpiringPolicies(days ? parseInt(days) : 30);
  }

  @Get('expired-valuations')
  getExpiredValuations(@Query('days') days?: string) {
    return this.service.getExpiredValuations(days ? parseInt(days) : 365);
  }

  @Get('missing-credentials')
  getMissingCredentialsJewelry() {
    return this.service.getMissingCredentialsJewelry();
  }

  @Get('high-value')
  getHighValueJewelry(@Query('threshold') threshold?: string) {
    return this.service.getHighValueJewelry(threshold ? parseFloat(threshold) : 10000);
  }

  @Get('stats')
  getAssetStats() {
    return this.service.getAssetStats();
  }

  @Get('jewelry/:id')
  getJewelryAssetInfo(@Param('id', ParseIntPipe) id: number) {
    return this.service.getJewelryAssetInfo(id);
  }
}

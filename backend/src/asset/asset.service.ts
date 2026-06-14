import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { UnifiedRiskStatusService } from '../common/unified-risk-status.service';
import {
  REQUIRED_CREDENTIAL_TYPES,
  VALUATION_EXPIRY_DAYS,
  INSURANCE_WARNING_DAYS,
  HIGH_VALUE_THRESHOLD,
  HIGH_VALUE_DISPLAY_THRESHOLD,
} from '../common/unified-risk.interface';
import {
  CreateValuationDto,
  CreateInsuranceDto,
  UpdateInsuranceDto,
  CreateCredentialDto,
  UpdateCredentialDto,
  RenewInsuranceDto,
} from './dto';

@Injectable()
export class AssetService {
  constructor(
    private prisma: PrismaService,
    private unifiedRiskService: UnifiedRiskStatusService,
  ) {}

  async getValuations(jewelryId?: number) {
    const where = jewelryId ? { jewelryId } : {};
    return this.prisma.valuation.findMany({
      where,
      orderBy: { valuationDate: 'desc' },
      include: {
        jewelry: { select: { id: true, name: true, material: true } },
      },
    });
  }

  async createValuation(dto: CreateValuationDto) {
    return this.prisma.valuation.create({
      data: {
        jewelryId: dto.jewelryId,
        currentValue: dto.currentValue,
        valuationDate: new Date(dto.valuationDate),
        valuationAgency: dto.valuationAgency,
        notes: dto.notes,
      },
    });
  }

  async deleteValuation(id: number) {
    return this.prisma.valuation.delete({ where: { id } });
  }

  async getInsurances(jewelryId?: number) {
    const where = jewelryId ? { jewelryId } : {};
    return this.prisma.insurance.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        jewelry: { select: { id: true, name: true, material: true } },
      },
    });
  }

  async createInsurance(dto: CreateInsuranceDto) {
    return this.prisma.insurance.create({
      data: {
        jewelryId: dto.jewelryId,
        policyNumber: dto.policyNumber,
        insuranceCompany: dto.insuranceCompany,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        insuredAmount: dto.insuredAmount,
        deductible: dto.deductible || 0,
        claimsContact: dto.claimsContact,
        notes: dto.notes,
      },
    });
  }

  async updateInsurance(id: number, dto: UpdateInsuranceDto) {
    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    return this.prisma.insurance.update({ where: { id }, data });
  }

  async renewInsurance(id: number, dto: RenewInsuranceDto) {
    const old = await this.prisma.insurance.findUnique({ where: { id } });
    if (!old) throw new NotFoundException('保单不存在');
    await this.prisma.insurance.update({
      where: { id },
      data: { status: '已过期' },
    });
    return this.prisma.insurance.create({
      data: {
        jewelryId: old.jewelryId,
        policyNumber: dto.policyNumber,
        insuranceCompany: dto.insuranceCompany,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        insuredAmount: dto.insuredAmount,
        deductible: dto.deductible || 0,
        claimsContact: dto.claimsContact || old.claimsContact,
        notes: dto.notes,
      },
    });
  }

  async deleteInsurance(id: number) {
    return this.prisma.insurance.delete({ where: { id } });
  }

  async getCredentials(jewelryId?: number) {
    const where = jewelryId ? { jewelryId } : {};
    return this.prisma.credential.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        jewelry: { select: { id: true, name: true, material: true } },
      },
    });
  }

  async createCredential(dto: CreateCredentialDto) {
    return this.prisma.credential.create({
      data: {
        jewelryId: dto.jewelryId,
        type: dto.type,
        credentialNumber: dto.credentialNumber,
        description: dto.description,
        fileUrl: dto.fileUrl,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
        issuedBy: dto.issuedBy,
      },
    });
  }

  async updateCredential(id: number, dto: UpdateCredentialDto) {
    const data: any = { ...dto };
    if (dto.issueDate) data.issueDate = new Date(dto.issueDate);
    return this.prisma.credential.update({ where: { id }, data });
  }

  async deleteCredential(id: number) {
    return this.prisma.credential.delete({ where: { id } });
  }

  async getUninsuredJewelry() {
    const allJewelry = await this.prisma.jewelry.findMany({
      include: {
        insurances: {
          where: { status: '生效中' },
          take: 1,
        },
        valuations: { orderBy: { valuationDate: 'desc' }, take: 1 },
        credentials: true,
      },
    });
    return allJewelry
      .filter((j) => {
        const flags = this.unifiedRiskService.calculateStatusFlags(j);
        return flags.isUninsured;
      })
      .map((j) => ({
        id: j.id,
        name: j.name,
        material: j.material,
        currentValuation: j.valuations[0]?.currentValue || null,
        purchasePrice: j.purchasePrice || null,
        credentialCount: j.credentials.length,
      }));
  }

  async getExpiringPolicies(days: number = INSURANCE_WARNING_DAYS) {
    const now = new Date();
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return this.prisma.insurance.findMany({
      where: {
        status: '生效中',
        endDate: { lte: cutoff, gte: now },
      },
      include: {
        jewelry: { select: { id: true, name: true, material: true } },
      },
      orderBy: { endDate: 'asc' },
    });
  }

  async getExpiredValuations(days: number = VALUATION_EXPIRY_DAYS) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const allJewelry = await this.prisma.jewelry.findMany({
      include: {
        valuations: { orderBy: { valuationDate: 'desc' }, take: 1 },
      },
    });
    return allJewelry
      .filter((j) => {
        const flags = this.unifiedRiskService.calculateStatusFlags(j);
        return flags.isValuationExpired;
      })
      .map((j) => ({
        id: j.id,
        name: j.name,
        material: j.material,
        lastValuationDate: j.valuations[0]?.valuationDate || null,
        lastValuationValue: j.valuations[0]?.currentValue || null,
      }));
  }

  async getMissingCredentialsJewelry() {
    const allJewelry = await this.prisma.jewelry.findMany({
      include: { credentials: true },
    });
    return allJewelry
      .filter((j) => {
        const flags = this.unifiedRiskService.calculateStatusFlags(j);
        return flags.isMissingCredentials;
      })
      .map((j) => {
        const flags = this.unifiedRiskService.calculateStatusFlags(j);
        return {
          id: j.id,
          name: j.name,
          material: j.material,
          missingTypes: flags.missingCredentialTypes,
          existingCredentialTypes: j.credentials.map((c) => c.type),
        };
      });
  }

  async getHighValueJewelry(threshold: number = HIGH_VALUE_DISPLAY_THRESHOLD) {
    const allJewelry = await this.prisma.jewelry.findMany({
      include: {
        valuations: { orderBy: { valuationDate: 'desc' }, take: 1 },
        insurances: {
          where: { status: '生效中' },
          take: 1,
        },
      },
    });
    return allJewelry
      .filter((j) => {
        const val = j.valuations[0]?.currentValue || j.purchasePrice || 0;
        return val >= threshold;
      })
      .map((j) => {
        const flags = this.unifiedRiskService.calculateStatusFlags(j);
        return {
          id: j.id,
          name: j.name,
          material: j.material,
          currentValue: j.valuations[0]?.currentValue || j.purchasePrice || 0,
          isInsured: !flags.isUninsured,
          lastValuationDate: j.valuations[0]?.valuationDate || null,
        };
      })
      .sort((a, b) => b.currentValue - a.currentValue);
  }

  async getAssetStats() {
    const allJewelry = await this.prisma.jewelry.findMany({
      include: {
        valuations: { orderBy: { valuationDate: 'desc' }, take: 1 },
        insurances: {
          where: { status: '生效中' },
          take: 1,
        },
        credentials: true,
      },
    });

    let totalValuation = 0;
    const materialValuationMap = new Map<string, { total: number; count: number }>();
    let insuredCount = 0;
    const highValueHighRisk: Array<{
      id: number;
      name: string;
      material: string;
      currentValue: number;
      isInsured: boolean;
      riskFactors: string[];
    }> = [];

    const now = new Date();
    const expiringPolicies: Array<{
      id: number;
      name: string;
      policyNumber: string;
      insuranceCompany: string;
      endDate: string;
      daysRemaining: number;
    }> = [];

    let missingCredentialCount = 0;

    for (const j of allJewelry) {
      const val = j.valuations[0]?.currentValue || j.purchasePrice || 0;
      totalValuation += val;

      const existing = materialValuationMap.get(j.material) || { total: 0, count: 0 };
      existing.total += val;
      existing.count += 1;
      materialValuationMap.set(j.material, existing);

      const flags = this.unifiedRiskService.calculateStatusFlags(j);

      if (!flags.isUninsured) {
        insuredCount++;
      }

      if (flags.isInsuranceExpiring && flags.insuranceDaysRemaining >= 0 && j.insurances[0]) {
        expiringPolicies.push({
          id: j.insurances[0].id,
          name: j.name,
          policyNumber: j.insurances[0].policyNumber,
          insuranceCompany: j.insurances[0].insuranceCompany,
          endDate: j.insurances[0].endDate.toISOString(),
          daysRemaining: flags.insuranceDaysRemaining,
        });
      }

      if (flags.isMissingCredentials) {
        missingCredentialCount++;
      }

      const riskFactors: string[] = [];
      if (flags.isUninsured && val >= HIGH_VALUE_THRESHOLD) riskFactors.push('高价值未投保');
      if (flags.isInsuranceExpired) riskFactors.push('保单已过期');
      else if (flags.isInsuranceExpiring) riskFactors.push('保单即将到期');
      if (flags.isValuationExpired) riskFactors.push('估值已过期');
      else if ((j.valuations || []).length === 0 && val === 0) riskFactors.push('无估值记录');

      if (riskFactors.length > 0 && val >= HIGH_VALUE_THRESHOLD) {
        highValueHighRisk.push({
          id: j.id,
          name: j.name,
          material: j.material,
          currentValue: val,
          isInsured: !flags.isUninsured,
          riskFactors,
        });
      }
    }

    const materialAssetDistribution = Array.from(materialValuationMap.entries())
      .map(([material, data]) => ({
        material,
        totalValue: data.total,
        count: data.count,
        percentage: totalValuation > 0 ? Math.round((data.total / totalValuation) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.totalValue - a.totalValue);

    const insuranceCoverageRate =
      allJewelry.length > 0
        ? Math.round((insuredCount / allJewelry.length) * 10000) / 100
        : 0;

    const credentialMissingRate =
      allJewelry.length > 0
        ? Math.round((missingCredentialCount / allJewelry.length) * 10000) / 100
        : 0;

    highValueHighRisk.sort((a, b) => b.currentValue - a.currentValue);

    const valuationTrend = await this.getValuationTrend();

    return {
      totalValuation,
      materialAssetDistribution,
      insuranceCoverageRate,
      insuredCount,
      totalJewelry: allJewelry.length,
      expiringPolicies,
      credentialMissingRate,
      missingCredentialCount,
      highValueHighRisk: highValueHighRisk.slice(0, 10),
      valuationTrend,
    };
  }

  private async getValuationTrend() {
    const now = new Date();
    const months: Array<{
      period: string;
      totalValue: number;
      jewelryCount: number;
    }> = [];

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const period = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;

      const valuations = await this.prisma.valuation.findMany({
        where: {
          valuationDate: {
            lte: monthEnd,
          },
        },
        orderBy: { valuationDate: 'desc' },
        distinct: ['jewelryId'],
      });

      const totalValue = valuations.reduce((sum, v) => sum + v.currentValue, 0);
      months.push({
        period,
        totalValue,
        jewelryCount: valuations.length,
      });
    }

    return months;
  }

  async getJewelryAssetInfo(jewelryId: number) {
    const jewelry = await this.prisma.jewelry.findUnique({
      where: { id: jewelryId },
      include: {
        valuations: { orderBy: { valuationDate: 'desc' } },
        insurances: { orderBy: { createdAt: 'desc' } },
        credentials: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!jewelry) throw new NotFoundException('首饰不存在');

    const flags = this.unifiedRiskService.calculateStatusFlags(jewelry);
    const latestValuation = jewelry.valuations[0] || null;
    const activeInsurance = jewelry.insurances.find((i) => i.status === '生效中') || null;

    const existingTypes = new Set(jewelry.credentials.map((c) => c.type));
    const credentialCompleteness = Math.round(
      (existingTypes.size / (existingTypes.size + REQUIRED_CREDENTIAL_TYPES.filter((t) => !existingTypes.has(t)).length)) * 100,
    );

    let insuranceStatus: string;
    if (flags.isUninsured) {
      insuranceStatus = '未投保';
    } else if (flags.isInsuranceExpired) {
      insuranceStatus = '已过期';
    } else if (flags.isInsuranceExpiring) {
      insuranceStatus = '即将到期';
    } else {
      insuranceStatus = '生效中';
    }

    return {
      jewelryId: jewelry.id,
      jewelryName: jewelry.name,
      purchasePrice: jewelry.purchasePrice,
      invoiceNumber: jewelry.invoiceNumber,
      latestValuation,
      activeInsurance,
      credentials: jewelry.credentials,
      valuationExpired: flags.isValuationExpired,
      credentialCompleteness,
      insuranceStatus,
    };
  }
}

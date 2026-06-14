import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  RiskLevel,
  RiskFactor,
  RiskScoreResult,
  JewelryStatusFlags,
  AssetStatusTag,
  JewelryFullStatus,
  AvailabilityCheckOptions,
  SEVERE_PROBLEM_TYPES,
  HIGH_RISK_MATERIALS,
  REQUIRED_CREDENTIAL_TYPES,
  VALUATION_EXPIRY_DAYS,
  VALUATION_WARNING_DAYS,
  INSURANCE_WARNING_DAYS,
  HIGH_VALUE_THRESHOLD,
  IDLE_LONG_THRESHOLD,
  IDLE_MEDIUM_THRESHOLD,
  IDLE_SHORT_THRESHOLD,
} from './unified-risk.interface';

@Injectable()
export class UnifiedRiskStatusService {
  constructor(private prisma: PrismaService) {}

  getSevereProblemTypes(): Set<string> {
    return new Set(SEVERE_PROBLEM_TYPES);
  }

  getHighRiskMaterials(): Set<string> {
    return new Set(HIGH_RISK_MATERIALS);
  }

  getRequiredCredentialTypes(): string[] {
    return [...REQUIRED_CREDENTIAL_TYPES];
  }

  getRiskLevel(score: number): { level: RiskLevel; levelText: string } {
    if (score >= 80) return { level: 'critical', levelText: '极高风险' };
    if (score >= 51) return { level: 'high', levelText: '高风险' };
    if (score >= 21) return { level: 'medium', levelText: '中风险' };
    return { level: 'low', levelText: '低风险' };
  }

  calculateIdleDays(jewelry: any, now: Date = new Date()): number {
    const outfits = jewelry.outfits || [];
    const outfitCount = jewelry._count?.outfits ?? outfits.length;
    if (outfitCount === 0) {
      return Math.floor(
        (now.getTime() - new Date(jewelry.purchaseDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );
    }
    const lastWear = outfits[0]?.wearDate;
    if (!lastWear) return 0;
    return Math.floor(
      (now.getTime() - new Date(lastWear).getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  calculateRiskScore(jewelry: any): RiskScoreResult {
    const factors: RiskFactor[] = [];
    let totalScore = 0;
    const now = new Date();

    const outfits = jewelry.outfits || [];
    const repairs = jewelry.repairs || [];

    const allergicCount = outfits.filter((o: any) => o.isAllergic).length;
    if (allergicCount > 0) {
      const score = allergicCount * 30;
      totalScore += score;
      factors.push({
        type: 'allergy',
        score,
        description: `记录过${allergicCount}次过敏反应，每次+30分`,
      });
    }

    const fadingCount = outfits.filter((o: any) => o.isFading).length;
    if (fadingCount > 0) {
      const score = fadingCount * 20;
      totalScore += score;
      factors.push({
        type: 'fading',
        score,
        description: `记录过${fadingCount}次掉色，每次+20分`,
      });
    }

    const needCleaningCount = outfits.filter(
      (o: any) => o.cleanStatus === '待专业清洁',
    ).length;
    if (needCleaningCount > 0) {
      const score = needCleaningCount * 10;
      totalScore += score;
      factors.push({
        type: 'cleaning',
        score,
        description: `有${needCleaningCount}次记录待专业清洁，每次+10分`,
      });
    }

    const severeProblemTypes = this.getSevereProblemTypes();
    const severeProblems = repairs.filter((r: any) =>
      severeProblemTypes.has(r.problemType),
    );
    if (severeProblems.length > 0) {
      const score = severeProblems.length * 25;
      totalScore += score;
      factors.push({
        type: 'severe_repair',
        score,
        description: `有${severeProblems.length}次严重维修记录（${severeProblems.map((p: any) => p.problemType).join('、')}），每次+25分`,
      });
    }

    const pendingRepairs = repairs.filter(
      (r: any) => r.status === '维修中' || r.status === '待取件',
    );
    if (pendingRepairs.length > 0) {
      const score = pendingRepairs.length * 15;
      totalScore += score;
      factors.push({
        type: 'pending_repair',
        score,
        description: `有${pendingRepairs.length}件维修未完成，每件+15分`,
      });
    }

    const highCostRepairs = repairs.filter((r: any) => r.cost >= 500);
    if (highCostRepairs.length > 0) {
      const score = highCostRepairs.length * 20;
      totalScore += score;
      factors.push({
        type: 'high_cost',
        score,
        description: `有${highCostRepairs.length}次高额维修（≥500元），每次+20分`,
      });
    }

    const idleDays = this.calculateIdleDays(jewelry, now);
    if (idleDays >= IDLE_LONG_THRESHOLD) {
      totalScore += 25;
      factors.push({
        type: 'idle',
        score: 25,
        description: `已闲置${idleDays}天（≥${IDLE_LONG_THRESHOLD}天），+25分`,
      });
    } else if (idleDays >= IDLE_MEDIUM_THRESHOLD) {
      totalScore += 15;
      factors.push({
        type: 'idle',
        score: 15,
        description: `已闲置${idleDays}天（≥${IDLE_MEDIUM_THRESHOLD}天），+15分`,
      });
    } else if (idleDays >= IDLE_SHORT_THRESHOLD) {
      totalScore += 5;
      factors.push({
        type: 'idle',
        score: 5,
        description: `已闲置${idleDays}天（≥${IDLE_SHORT_THRESHOLD}天），+5分`,
      });
    }

    const highRiskMaterials = this.getHighRiskMaterials();
    if (highRiskMaterials.has(jewelry.material)) {
      const score = jewelry.material === '合金' ? 15 : 5;
      totalScore += score;
      factors.push({
        type: 'material',
        score,
        description: `${jewelry.material}材质属于高风险材质，+${score}分`,
      });
    }

    const { level, levelText } = this.getRiskLevel(totalScore);
    const reminders = this.generateReminders(factors, jewelry);

    return {
      score: totalScore,
      level,
      levelText,
      factors,
      reminders,
    };
  }

  private generateReminders(factors: RiskFactor[], jewelry: any): string[] {
    const reminders: string[] = [];

    const allergyFactor = factors.find((f) => f.type === 'allergy');
    if (allergyFactor) {
      reminders.push('⚠️ 该首饰曾引起过敏反应，建议减少佩戴或避免直接接触皮肤');
    }

    const fadingFactor = factors.find((f) => f.type === 'fading');
    if (fadingFactor) {
      reminders.push('⚠️ 该首饰存在掉色问题，建议进行专业保养或减少佩戴频率');
    }

    const cleaningFactor = factors.find((f) => f.type === 'cleaning');
    if (cleaningFactor) {
      reminders.push('🧹 该首饰需要专业清洁，建议尽快送店保养');
    }

    const severeRepairFactor = factors.find((f) => f.type === 'severe_repair');
    if (severeRepairFactor) {
      reminders.push('🔧 该首饰曾发生严重损坏，建议定期检查结构完整性');
    }

    const pendingRepairFactor = factors.find((f) => f.type === 'pending_repair');
    if (pendingRepairFactor) {
      reminders.push('📦 该首饰有维修尚未完成，请及时跟进处理');
    }

    const highCostFactor = factors.find((f) => f.type === 'high_cost');
    if (highCostFactor) {
      reminders.push('💰 该首饰维修成本较高，建议平时小心佩戴以减少损坏风险');
    }

    const idleFactor = factors.find((f) => f.type === 'idle');
    if (idleFactor) {
      reminders.push('📅 该首饰已长期闲置，建议定期检查保养状态或考虑转送他人');
    }

    const materialFactor = factors.find((f) => f.type === 'material');
    if (materialFactor) {
      reminders.push('⚠️ 该首饰材质稳定性较差，建议避免接触汗水、香水等腐蚀性物质');
    }

    if (reminders.length === 0) {
      reminders.push('✅ 该首饰状态良好，继续保持定期清洁和妥善存放');
    }

    return reminders;
  }

  calculateStatusFlags(jewelry: any): JewelryStatusFlags {
    const now = new Date();
    const outfits = jewelry.outfits || [];
    const repairs = jewelry.repairs || [];
    const lendings = jewelry.lendings || [];
    const valuations = jewelry.valuations || [];
    const insurances = jewelry.insurances || [];
    const credentials = jewelry.credentials || [];

    const activeRepairs = repairs.filter(
      (r: any) => r.status === '维修中' || r.status === '待取件',
    );
    const activeLending = lendings.find(
      (l: any) => l.status === '借出中' || l.status === '逾期未还',
    );

    const idleDays = this.calculateIdleDays(jewelry, now);

    const latestValuation = valuations[0];
    let daysSinceValuation = 0;
    let valuationExpired = false;
    if (latestValuation) {
      daysSinceValuation = Math.floor(
        (now.getTime() - new Date(latestValuation.valuationDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      valuationExpired = daysSinceValuation > VALUATION_EXPIRY_DAYS;
    } else {
      valuationExpired = true;
    }

    const activeInsurance = insurances.find((i: any) => i.status === '生效中');
    let insuranceDaysRemaining = -1;
    let insuranceExpired = false;
    let insuranceExpiring = false;
    if (activeInsurance) {
      insuranceDaysRemaining = Math.floor(
        (new Date(activeInsurance.endDate).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (insuranceDaysRemaining < 0) {
        insuranceExpired = true;
      } else if (insuranceDaysRemaining <= INSURANCE_WARNING_DAYS) {
        insuranceExpiring = true;
      }
    }

    const existingCredentialTypes = new Set(credentials.map((c: any) => c.type));
    const missingCredentialTypes = REQUIRED_CREDENTIAL_TYPES.filter(
      (t) => !existingCredentialTypes.has(t),
    );

    const highRiskMaterials = this.getHighRiskMaterials();
    const allergicCount = outfits.filter((o: any) => o.isAllergic).length;
    const fadingCount = outfits.filter((o: any) => o.isFading).length;

    return {
      isInRepair: activeRepairs.length > 0,
      isLentOut: !!activeLending && activeLending.status === '借出中',
      isOverdue: !!activeLending && activeLending.status === '逾期未还',
      isLongIdle: idleDays >= IDLE_LONG_THRESHOLD,
      idleDays,
      isUninsured: !activeInsurance,
      isValuationExpired: valuationExpired,
      isMissingCredentials: missingCredentialTypes.length > 0,
      missingCredentialTypes,
      isInsuranceExpiring: insuranceExpiring,
      isInsuranceExpired: insuranceExpired,
      insuranceDaysRemaining,
      daysSinceValuation,
      isHighRiskMaterial: highRiskMaterials.has(jewelry.material),
      hasAllergyHistory: allergicCount > 0,
      hasFadingHistory: fadingCount > 0,
    };
  }

  generateAssetStatusTags(
    jewelry: any,
    flags?: JewelryStatusFlags,
  ): AssetStatusTag[] {
    const tags: AssetStatusTag[] = [];
    const status = flags || this.calculateStatusFlags(jewelry);
    const risk = this.calculateRiskScore(jewelry);

    if (risk.level === 'critical') {
      tags.push({ label: '极高风险', type: 'danger' });
    } else if (risk.level === 'high') {
      tags.push({ label: '高风险', type: 'warning' });
    } else if (risk.level === 'medium') {
      tags.push({ label: '中风险', type: 'info' });
    }

    if (status.isInRepair) {
      tags.push({ label: '维修中', type: 'warning' });
    }

    if (status.isOverdue) {
      tags.push({ label: '逾期未还', type: 'danger' });
    } else if (status.isLentOut) {
      tags.push({ label: '已借出', type: 'warning' });
    }

    if (status.idleDays >= IDLE_LONG_THRESHOLD) {
      tags.push({ label: '长期闲置', type: 'warning' });
    } else if (status.idleDays >= IDLE_MEDIUM_THRESHOLD) {
      tags.push({ label: '闲置中', type: 'info' });
    }

    if (status.isValuationExpired) {
      tags.push({ label: '估值过期', type: 'danger' });
    } else if (status.daysSinceValuation > VALUATION_WARNING_DAYS) {
      tags.push({ label: '估值将过期', type: 'warning' });
    } else if ((jewelry.valuations || []).length === 0) {
      tags.push({ label: '未估值', type: 'info' });
    }

    const val =
      (jewelry.valuations || [])[0]?.currentValue || jewelry.purchasePrice || 0;
    if (status.isUninsured && val >= HIGH_VALUE_THRESHOLD) {
      tags.push({ label: '未投保', type: 'danger' });
    } else if (status.isInsuranceExpired) {
      tags.push({ label: '保险过期', type: 'danger' });
    } else if (status.isInsuranceExpiring) {
      tags.push({ label: '保险将到期', type: 'warning' });
    }

    if (status.isMissingCredentials) {
      tags.push({ label: '凭证缺失', type: 'warning' });
    }

    return tags;
  }

  getInsuranceRiskWarning(jewelry: any): { hasRisk: boolean; warnings: string[] } {
    const warnings: string[] = [];
    const now = new Date();
    const valuations = jewelry.valuations || [];
    const insurances = (jewelry.insurances || []).filter(
      (i: any) => i.status === '生效中',
    );
    const val = valuations[0]?.currentValue || jewelry.purchasePrice || 0;

    if (insurances.length === 0) {
      if (val >= HIGH_VALUE_THRESHOLD) {
        warnings.push(
          `该首饰估值 ¥${val.toLocaleString()}，尚未投保，存在资产风险`,
        );
      } else if (val > 0) {
        warnings.push('该首饰未投保');
      }
    } else {
      const ins = insurances[0];
      const daysToExpiry = Math.floor(
        (new Date(ins.endDate).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (daysToExpiry < 0) {
        warnings.push(
          `该首饰保单已过期（${new Date(ins.endDate).toISOString().split('T')[0]}），需尽快续保`,
        );
      } else if (daysToExpiry <= INSURANCE_WARNING_DAYS) {
        warnings.push(
          `该首饰保单将于 ${daysToExpiry} 天后到期，请注意续保`,
        );
      }
    }

    if (valuations.length > 0) {
      const daysSinceValuation = Math.floor(
        (now.getTime() - new Date(valuations[0].valuationDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (daysSinceValuation > VALUATION_EXPIRY_DAYS) {
        warnings.push('该首饰估值已超过1年未更新，建议重新估值');
      }
    }

    return { hasRisk: warnings.length > 0, warnings };
  }

  async checkAvailability(
    jewelryId: number,
    options: AvailabilityCheckOptions = {},
  ): Promise<{
    available: boolean;
    reasons: string[];
    statusInfo: {
      lending: any;
      repair: any;
      riskScore: number;
      riskLevel: RiskLevel;
    };
  }> {
    const { planDate = new Date(), includeRisk = true } = options;
    const reasons: string[] = [];

    const jewelry = await this.prisma.jewelry.findUnique({
      where: { id: jewelryId },
      include: {
        outfits: { orderBy: { wearDate: 'desc' }, take: 20 },
        lendings: {
          where: { status: { in: ['借出中', '逾期未还'] } },
          orderBy: { lendDate: 'desc' },
          take: 5,
        },
        repairs: {
          where: { status: { in: ['维修中', '待取件'] } },
          orderBy: { sendDate: 'desc' },
          take: 5,
        },
      },
    });

    if (!jewelry) {
      return {
        available: false,
        reasons: ['首饰不存在'],
        statusInfo: { lending: null, repair: null, riskScore: 0, riskLevel: 'low' },
      };
    }

    const activeLending = jewelry.lendings.find((l: any) => {
      const lendStart = new Date(l.lendDate);
      const expectedReturn = new Date(l.expectedReturnDate);
      return planDate >= lendStart && planDate <= expectedReturn;
    });

    if (activeLending) {
      if (activeLending.status === '逾期未还') {
        reasons.push(
          `逾期未还：借给${activeLending.borrowerName}，应于${new Date(activeLending.expectedReturnDate).toLocaleDateString('zh-CN')}归还`,
        );
      } else {
        reasons.push(
          `借出中：借给${activeLending.borrowerName}，预计${new Date(activeLending.expectedReturnDate).toLocaleDateString('zh-CN')}归还`,
        );
      }
    }

    const activeRepair = jewelry.repairs.find((r: any) => {
      const sendD = new Date(r.sendDate);
      const returnD = r.returnDate
        ? new Date(r.returnDate)
        : new Date(sendD.getTime() + 30 * 24 * 60 * 60 * 1000);
      return planDate >= sendD && planDate <= returnD;
    });

    if (activeRepair) {
      if (activeRepair.status === '待取件') {
        reasons.push(`待取件：${activeRepair.problemType}维修已完成，请尽快取回`);
      } else {
        reasons.push(
          `维修中：${activeRepair.problemType}，预计${activeRepair.returnDate ? new Date(activeRepair.returnDate).toLocaleDateString('zh-CN') : '待定'}可取回`,
        );
      }
    }

    let riskScore = 0;
    let riskLevel: RiskLevel = 'low';
    if (includeRisk) {
      const risk = this.calculateRiskScore(jewelry);
      riskScore = risk.score;
      riskLevel = risk.level;
      if (risk.level === 'critical') {
        reasons.push(`极高风险：风险评分${risk.score}分，强烈不建议佩戴`);
      }
    }

    return {
      available: reasons.length === 0,
      reasons,
      statusInfo: {
        lending: jewelry.lendings[0] || null,
        repair: jewelry.repairs[0] || null,
        riskScore,
        riskLevel,
      },
    };
  }

  async getJewelryFullStatus(jewelryId: number): Promise<JewelryFullStatus> {
    const jewelry = await this.prisma.jewelry.findUnique({
      where: { id: jewelryId },
      include: {
        outfits: { orderBy: { wearDate: 'desc' }, take: 20 },
        repairs: { orderBy: { sendDate: 'desc' }, take: 10 },
        lendings: {
          where: { status: { in: ['借出中', '逾期未还'] } },
          orderBy: { lendDate: 'desc' },
          take: 3,
        },
        valuations: { orderBy: { valuationDate: 'desc' }, take: 5 },
        insurances: { orderBy: { createdAt: 'desc' }, take: 3 },
        credentials: true,
      },
    });

    if (!jewelry) {
      throw new Error('首饰不存在');
    }

    const risk = this.calculateRiskScore(jewelry);
    const status = this.calculateStatusFlags(jewelry);
    const assetTags = this.generateAssetStatusTags(jewelry, status);
    const insuranceWarning = this.getInsuranceRiskWarning(jewelry);
    const availability = await this.checkAvailability(jewelryId);

    return {
      risk,
      status,
      assetTags,
      insuranceWarning,
      availability,
    };
  }

  async getJewelryFullStatusBatch(
    jewelryIds: number[],
  ): Promise<Map<number, JewelryFullStatus>> {
    const result = new Map<number, JewelryFullStatus>();
    for (const id of jewelryIds) {
      try {
        const status = await this.getJewelryFullStatus(id);
        result.set(id, status);
      } catch (e) {
        // skip missing jewelry
      }
    }
    return result;
  }
}

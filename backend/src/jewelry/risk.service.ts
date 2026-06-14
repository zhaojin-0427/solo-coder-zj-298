import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import type {
  RiskAssessment,
  RiskFactor,
  RiskLevel,
  RiskJewelryRanking,
  PendingReminder,
  HighRiskMaterial,
  RiskStats,
} from './risk.dto';

@Injectable()
export class RiskService {
  constructor(private prisma: PrismaService) {}

  private getRiskLevel(score: number): { level: RiskLevel; levelText: string } {
    if (score >= 80) return { level: 'critical', levelText: '极高风险' };
    if (score >= 51) return { level: 'high', levelText: '高风险' };
    if (score >= 21) return { level: 'medium', levelText: '中风险' };
    return { level: 'low', levelText: '低风险' };
  }

  private getSevereProblemTypes(): Set<string> {
    return new Set(['断裂', '断链', '掉钻', '严重变形']);
  }

  private getHighRiskMaterials(): Set<string> {
    return new Set(['合金', '其他']);
  }

  async assessJewelry(jewelryId: number): Promise<RiskAssessment> {
    const jewelry = await this.prisma.jewelry.findUnique({
      where: { id: jewelryId },
      include: {
        outfits: { orderBy: { wearDate: 'desc' } },
        repairs: { orderBy: { sendDate: 'desc' } },
        _count: { select: { outfits: true } },
      },
    });

    if (!jewelry) {
      throw new Error('首饰不存在');
    }

    const factors: RiskFactor[] = [];
    let totalScore = 0;

    const allergicCount = jewelry.outfits.filter((o) => o.isAllergic).length;
    if (allergicCount > 0) {
      const score = allergicCount * 30;
      totalScore += score;
      factors.push({
        type: 'allergy',
        score,
        description: `记录过${allergicCount}次过敏反应，每次+30分`,
      });
    }

    const fadingCount = jewelry.outfits.filter((o) => o.isFading).length;
    if (fadingCount > 0) {
      const score = fadingCount * 20;
      totalScore += score;
      factors.push({
        type: 'fading',
        score,
        description: `记录过${fadingCount}次掉色，每次+20分`,
      });
    }

    const needCleaningCount = jewelry.outfits.filter(
      (o) => o.cleanStatus === '待专业清洁',
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

    const severeProblems = jewelry.repairs.filter((r) =>
      this.getSevereProblemTypes().has(r.problemType),
    );
    if (severeProblems.length > 0) {
      const score = severeProblems.length * 25;
      totalScore += score;
      factors.push({
        type: 'severe_repair',
        score,
        description: `有${severeProblems.length}次严重维修记录（${severeProblems.map((p) => p.problemType).join('、')}），每次+25分`,
      });
    }

    const pendingRepairs = jewelry.repairs.filter(
      (r) => r.status === '维修中' || r.status === '待取件',
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

    const highCostRepairs = jewelry.repairs.filter((r) => r.cost >= 500);
    if (highCostRepairs.length > 0) {
      const score = highCostRepairs.length * 20;
      totalScore += score;
      factors.push({
        type: 'high_cost',
        score,
        description: `有${highCostRepairs.length}次高额维修（≥500元），每次+20分`,
      });
    }

    const now = new Date();
    let idleDays = 0;
    if (jewelry._count.outfits === 0) {
      idleDays = Math.floor(
        (now.getTime() - new Date(jewelry.purchaseDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );
    } else {
      const lastWear = jewelry.outfits[0]?.wearDate;
      if (lastWear) {
        idleDays = Math.floor(
          (now.getTime() - new Date(lastWear).getTime()) /
            (1000 * 60 * 60 * 24),
        );
      }
    }
    if (idleDays >= 90) {
      totalScore += 25;
      factors.push({
        type: 'idle',
        score: 25,
        description: `已闲置${idleDays}天（≥90天），+25分`,
      });
    } else if (idleDays >= 60) {
      totalScore += 15;
      factors.push({
        type: 'idle',
        score: 15,
        description: `已闲置${idleDays}天（≥60天），+15分`,
      });
    } else if (idleDays >= 30) {
      totalScore += 5;
      factors.push({
        type: 'idle',
        score: 5,
        description: `已闲置${idleDays}天（≥30天），+5分`,
      });
    }

    if (this.getHighRiskMaterials().has(jewelry.material)) {
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
      jewelryId: jewelry.id,
      jewelryName: jewelry.name,
      level,
      levelText,
      score: totalScore,
      factors,
      reminders,
    };
  }

  private generateReminders(
    factors: RiskFactor[],
    jewelry: any,
  ): string[] {
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

  async assessAllJewelry(): Promise<RiskAssessment[]> {
    const allJewelry = await this.prisma.jewelry.findMany({
      select: { id: true },
    });
    const assessments = await Promise.all(
      allJewelry.map((j) => this.assessJewelry(j.id)),
    );
    return assessments.sort((a, b) => b.score - a.score);
  }

  async getRiskStats(): Promise<RiskStats> {
    const allAssessments = await this.assessAllJewelry();
    const allJewelry = await this.prisma.jewelry.findMany({
      include: {
        outfits: { orderBy: { wearDate: 'desc' }, take: 5 },
        repairs: { where: { status: { in: ['维修中', '待取件'] } } },
      },
    });

    const jewelryMap = new Map(allJewelry.map((j) => [j.id, j]));

    const rankings: RiskJewelryRanking[] = allAssessments
      .filter((a) => a.level !== 'low')
      .slice(0, 10)
      .map((a) => ({
        id: a.jewelryId,
        name: a.jewelryName,
        material: jewelryMap.get(a.jewelryId)?.material || '',
        level: a.level,
        levelText: a.levelText,
        score: a.score,
        topFactor: a.factors[0]?.description || '状态良好',
      }));

    const pendingReminders: PendingReminder[] = [];
    for (const assessment of allAssessments) {
      const jewelry = jewelryMap.get(assessment.jewelryId);
      if (!jewelry) continue;

      for (const factor of assessment.factors) {
        if (factor.type === 'allergy' && factor.score >= 30) {
          pendingReminders.push({
            jewelryId: assessment.jewelryId,
            jewelryName: assessment.jewelryName,
            type: 'allergy',
            title: '过敏风险提醒',
            description: `「${assessment.jewelryName}」曾引起过敏反应，请谨慎佩戴`,
            level: 'critical',
          });
        }
        if (factor.type === 'pending_repair') {
          pendingReminders.push({
            jewelryId: assessment.jewelryId,
            jewelryName: assessment.jewelryName,
            type: 'repair',
            title: '维修待处理',
            description: `「${assessment.jewelryName}」有${jewelry.repairs.length}件维修尚未完成`,
            level: 'high',
          });
        }
        if (factor.type === 'idle' && factor.score >= 15) {
          pendingReminders.push({
            jewelryId: assessment.jewelryId,
            jewelryName: assessment.jewelryName,
            type: 'idle',
            title: '长期闲置提醒',
            description: `「${assessment.jewelryName}」已闲置超过60天，记得定期保养`,
            level: 'medium',
          });
        }
        if (factor.type === 'cleaning') {
          pendingReminders.push({
            jewelryId: assessment.jewelryId,
            jewelryName: assessment.jewelryName,
            type: 'cleaning',
            title: '待专业清洁',
            description: `「${assessment.jewelryName}」需要专业清洁保养`,
            level: 'medium',
          });
        }
        if (factor.type === 'fading') {
          pendingReminders.push({
            jewelryId: assessment.jewelryId,
            jewelryName: assessment.jewelryName,
            type: 'fading',
            title: '掉色问题提醒',
            description: `「${assessment.jewelryName}」存在掉色问题，建议保养`,
            level: 'high',
          });
        }
        if (factor.type === 'high_cost') {
          pendingReminders.push({
            jewelryId: assessment.jewelryId,
            jewelryName: assessment.jewelryName,
            type: 'high_cost',
            title: '高额维修提醒',
            description: `「${assessment.jewelryName}」维修成本较高，建议小心佩戴`,
            level: 'medium',
          });
        }
      }
    }

    const materialMap = new Map<
      string,
      { count: number; totalScore: number; highRiskCount: number }
    >();
    for (const assessment of allAssessments) {
      const jewelry = jewelryMap.get(assessment.jewelryId);
      if (!jewelry) continue;
      const material = jewelry.material;
      const existing = materialMap.get(material) || {
        count: 0,
        totalScore: 0,
        highRiskCount: 0,
      };
      existing.count++;
      existing.totalScore += assessment.score;
      if (assessment.level === 'high' || assessment.level === 'critical') {
        existing.highRiskCount++;
      }
      materialMap.set(material, existing);
    }

    const highRiskMaterials: HighRiskMaterial[] = Array.from(
      materialMap.entries(),
    )
      .map(([material, data]) => ({
        material,
        count: data.count,
        averageScore: Math.round((data.totalScore / data.count) * 10) / 10,
        highRiskCount: data.highRiskCount,
      }))
      .filter((m) => m.highRiskCount > 0 || m.averageScore >= 20)
      .sort((a, b) => b.averageScore - a.averageScore);

    return {
      rankings,
      pendingReminders: pendingReminders.sort((a, b) => {
        const levelOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return levelOrder[a.level] - levelOrder[b.level];
      }),
      highRiskMaterials,
    };
  }
}

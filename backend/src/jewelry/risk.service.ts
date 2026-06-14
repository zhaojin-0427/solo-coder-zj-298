import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { UnifiedRiskStatusService } from '../common/unified-risk-status.service';
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
  constructor(
    private prisma: PrismaService,
    private unifiedRiskService: UnifiedRiskStatusService,
  ) {}

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

    const riskResult = this.unifiedRiskService.calculateRiskScore(jewelry);

    return {
      jewelryId: jewelry.id,
      jewelryName: jewelry.name,
      level: riskResult.level as RiskLevel,
      levelText: riskResult.levelText,
      score: riskResult.score,
      factors: riskResult.factors as RiskFactor[],
      reminders: riskResult.reminders,
    };
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

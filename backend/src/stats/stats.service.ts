import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { UnifiedRiskStatusService } from '../common/unified-risk-status.service';

@Injectable()
export class StatsService {
  constructor(
    private prisma: PrismaService,
    private unifiedRiskService: UnifiedRiskStatusService,
  ) {}

  async getScheduleStats(days: number = 30) {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const futureEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [futurePlans, allPlanItems, allPlans] = await Promise.all([
      this.prisma.wearPlan.findMany({
        where: {
          planDate: { gte: now, lte: futureEnd },
        },
        include: {
          wearPlanItems: {
            where: { isSelected: true },
            include: { jewelry: { select: { id: true, name: true, material: true } } },
          },
        },
        orderBy: { planDate: 'asc' },
      }),
      this.prisma.wearPlanItem.findMany({
        where: {
          wearPlan: {
            createdAt: { gte: startDate },
          },
        },
        include: {
          jewelry: { select: { id: true, name: true } },
          wearPlan: { select: { id: true, status: true, planDate: true } },
        },
      }),
      this.prisma.wearPlan.findMany({
        where: { createdAt: { gte: startDate } },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const futureScheduleCalendar: Array<{
      date: string;
      dateStr: string;
      weekday: string;
      plans: Array<{
        id: number;
        scenario: string;
        outfitTags: string;
        priority: number;
        status: string;
        jewelry: Array<{ id: number; name: string; material: string }>;
      }>;
    }> = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const weekdayMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const dayPlans = futurePlans.filter((p) => {
        const pd = new Date(p.planDate);
        return pd.toISOString().split('T')[0] === dateStr;
      });
      futureScheduleCalendar.push({
        date: d.toISOString(),
        dateStr,
        weekday: weekdayMap[d.getDay()],
        plans: dayPlans.map((p) => ({
          id: p.id,
          scenario: p.scenario,
          outfitTags: p.outfitTags,
          priority: p.priority,
          status: p.status,
          jewelry: p.wearPlanItems.map((item) => ({
            id: item.jewelryId,
            name: item.jewelry.name,
            material: item.jewelry.material,
          })),
        })),
      });
    }

    const unavailableReasonMap = new Map<string, number>();
    for (const item of allPlanItems) {
      if (item.unavailableReasons && item.unavailableReasons.length > 0) {
        const reasons = item.unavailableReasons.split('|');
        for (const reason of reasons) {
          const category = this.categorizeUnavailableReason(reason);
          unavailableReasonMap.set(category, (unavailableReasonMap.get(category) || 0) + 1);
        }
      }
    }
    const unavailableReasonsDistribution = Array.from(unavailableReasonMap.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    const confirmedPlans = allPlans.filter((p) => p.status === '已确认');
    const confirmedItems = allPlanItems.filter((item) => item.wearPlan.status === '已确认');
    const selectedItems = confirmedItems.filter((item) => item.isSelected);
    const hitCount = selectedItems.filter((item) => item.recommendationScore >= 70).length;
    const recommendationHitRate = selectedItems.length > 0
      ? Math.round((hitCount / selectedItems.length) * 100)
      : 0;

    const hitTrend: Array<{ period: string; hitRate: number; totalSelected: number; hitCount: number }> = [];
    const groupedPlans = new Map<string, typeof confirmedPlans>();
    for (const p of confirmedPlans) {
      const weekKey = this.getWeekKey(p.createdAt);
      if (!groupedPlans.has(weekKey)) groupedPlans.set(weekKey, []);
      groupedPlans.get(weekKey)!.push(p);
    }
    for (const [weekKey, weekPlans] of groupedPlans) {
      const planIds = weekPlans.map((p) => p.id);
      const weekSelected = allPlanItems.filter(
        (item) => planIds.includes(item.wearPlanId) && item.isSelected,
      );
      const weekHit = weekSelected.filter((item) => item.recommendationScore >= 70).length;
      hitTrend.push({
        period: weekKey,
        hitRate: weekSelected.length > 0 ? Math.round((weekHit / weekSelected.length) * 100) : 0,
        totalSelected: weekSelected.length,
        hitCount: weekHit,
      });
    }
    hitTrend.sort((a, b) => a.period.localeCompare(b.period));

    const conflicts = await this.detectConflicts();

    return {
      overview: {
        totalPlans: allPlans.length,
        confirmedPlans: confirmedPlans.length,
        pendingPlans: allPlans.filter((p) => p.status === '待确认').length,
        futurePlannedDays: futurePlans.length,
        averageSelectedPerPlan: confirmedPlans.length > 0
          ? Math.round((selectedItems.length / confirmedPlans.length) * 10) / 10
          : 0,
        recommendationHitRate,
        unresolvedConflicts: conflicts.filter((c) => c.status === '待处理').length,
      },
      futureScheduleCalendar,
      unavailableReasonsDistribution,
      conflicts,
      recommendationHitTrend: hitTrend,
    };
  }

  private categorizeUnavailableReason(reason: string): string {
    if (reason.includes('借出中')) return '借出中占用';
    if (reason.includes('逾期未还')) return '逾期未还';
    if (reason.includes('维修中')) return '维修中占用';
    if (reason.includes('待取件')) return '维修待取件';
    if (reason.includes('极高风险')) return '极高风险';
    if (reason.includes('高风险')) return '高风险提醒';
    if (reason.includes('首饰不存在')) return '数据异常';
    return '其他原因';
  }

  private getWeekKey(date: Date): string {
    const d = new Date(date);
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
    return d.toISOString().split('T')[0];
  }

  private async detectConflicts() {
    const now = new Date();
    const futureCutoff = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const conflicts: any[] = [];

    const confirmedPlans = await this.prisma.wearPlan.findMany({
      where: {
        status: '已确认',
        planDate: { gte: now, lte: futureCutoff },
      },
      orderBy: { planDate: 'asc' },
    });

    let conflictId = 1;

    for (const plan of confirmedPlans) {
      const planD = new Date(plan.planDate);
      const selectedItems = await this.prisma.wearPlanItem.findMany({
        where: { wearPlanId: plan.id, isSelected: true },
        include: { jewelry: { select: { id: true, name: true } } },
      });

      for (const item of selectedItems) {
        const availability = await this.unifiedRiskService.checkAvailability(item.jewelryId, { planDate: planD });
        if (!availability.available) {
          for (const reason of availability.reasons) {
            let conflictType: any = 'high_risk';
            let conflictTypeText = '高风险';
            let severity: any = 'warning';

            if (reason.includes('借出中')) {
              conflictType = 'lending';
              conflictTypeText = '借出中冲突';
              severity = 'danger';
            } else if (reason.includes('逾期未还')) {
              conflictType = 'overdue';
              conflictTypeText = '逾期未还冲突';
              severity = 'danger';
            } else if (reason.includes('维修中')) {
              conflictType = 'repair';
              conflictTypeText = '维修中冲突';
              severity = 'danger';
            } else if (reason.includes('待取件')) {
              conflictType = 'pending_pickup';
              conflictTypeText = '待取件提醒';
              severity = 'warning';
            } else if (reason.includes('极高风险')) {
              conflictType = 'critical_risk';
              conflictTypeText = '极高风险提醒';
              severity = 'danger';
            }

            conflicts.push({
              id: conflictId++,
              wearPlanId: plan.id,
              planDate: plan.planDate.toISOString(),
              scenario: plan.scenario,
              jewelryId: item.jewelryId,
              jewelryName: item.jewelry.name,
              conflictType,
              conflictTypeText,
              description: reason,
              severity,
              status: plan.conflictResolved ? '已处理' : '待处理',
            });
          }
        }
      }
    }

    return conflicts.sort((a, b) => {
      const severityOrder: any = { danger: 0, warning: 1 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return new Date(a.planDate).getTime() - new Date(b.planDate).getTime();
    });
  }

  async getLendingStats() {
    const [lendings, totalDeposit, totalCompensation] = await Promise.all([
      this.prisma.lending.findMany({
        include: { jewelry: { select: { id: true, name: true, material: true } } },
      }),
      this.prisma.lending.aggregate({ _sum: { deposit: true } }),
      this.prisma.lending.aggregate({ _sum: { compensationAmount: true } }),
    ]);

    const borrowCountMap = new Map<string, { name: string; count: number }>();
    for (const l of lendings) {
      const key = l.borrowerName;
      const existing = borrowCountMap.get(key) || { name: key, count: 0 };
      existing.count += 1;
      borrowCountMap.set(key, existing);
    }
    const lendingRanking = Array.from(borrowCountMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const now = new Date();
    const overdueReminders = lendings
      .filter((l) => (l.status === '借出中' || l.status === '逾期未还') && new Date(l.expectedReturnDate) < now)
      .map((l) => ({
        id: l.id,
        jewelryId: l.jewelryId,
        jewelryName: l.jewelry.name,
        borrowerName: l.borrowerName,
        borrowerContact: l.borrowerContact,
        expectedReturnDate: l.expectedReturnDate,
        overdueDays: Math.floor((now.getTime() - new Date(l.expectedReturnDate).getTime()) / (1000 * 60 * 60 * 24)),
        status: l.status,
      }));

    const wearDistribution = [
      { type: '有损耗', count: lendings.filter((l) => l.hasWear).length },
      { type: '无损耗', count: lendings.filter((l) => !l.hasWear && l.status === '已归还').length },
      { type: '借出中', count: lendings.filter((l) => l.status === '借出中' || l.status === '逾期未还').length },
    ];

    return {
      lendingRanking,
      overdueReminders,
      wearDistribution,
      totalDeposit: totalDeposit._sum.deposit || 0,
      totalCompensation: totalCompensation._sum.compensationAmount || 0,
      totalLendings: lendings.length,
      activeLendings: lendings.filter((l) => l.status === '借出中').length,
      overdueLendings: lendings.filter((l) => l.status === '逾期未还').length,
    };
  }

  async getMaterialWearFrequency() {
    const outfits = await this.prisma.outfit.findMany({
      include: { jewelry: { select: { material: true } } },
    });
    const map = new Map<string, number>();
    for (const o of outfits) {
      const m = o.jewelry.material || '未知';
      map.set(m, (map.get(m) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([material, count]) => ({ material, count }))
      .sort((a, b) => b.count - a.count);
  }

  async getProblemDistribution() {
    const repairs = await this.prisma.repair.findMany({ select: { problemType: true } });
    const outfits = await this.prisma.outfit.findMany({
      select: { isAllergic: true, isFading: true },
    });
    const map = new Map<string, number>();
    for (const r of repairs) {
      map.set(r.problemType, (map.get(r.problemType) || 0) + 1);
    }
    const allergicCount = outfits.filter((o) => o.isAllergic).length;
    const fadingCount = outfits.filter((o) => o.isFading).length;
    if (allergicCount > 0) map.set('过敏反应', allergicCount);
    if (fadingCount > 0) map.set('掉色', fadingCount);
    return Array.from(map.entries())
      .map(([problem, count]) => ({ problem, count }))
      .sort((a, b) => b.count - a.count);
  }

  async getTopOutfitCombinations() {
    const outfits = await this.prisma.outfit.findMany({
      select: { outfitTags: true },
    });
    const combinationMap = new Map<string, number>();
    const singleTagMap = new Map<string, number>();
    for (const o of outfits) {
      const tags = (o.outfitTags || '')
        .split(/[,，、\s]+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      tags.forEach((tag) => {
        singleTagMap.set(tag, (singleTagMap.get(tag) || 0) + 1);
      });
      if (tags.length >= 2) {
        const sortedTags = [...tags].sort();
        const key = sortedTags.join(' + ');
        combinationMap.set(key, (combinationMap.get(key) || 0) + 1);
      }
    }
    const combinations = Array.from(combinationMap.entries())
      .map(([combination, count]) => ({ combination, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    const singleTags = Array.from(singleTagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
    return { combinations, singleTags };
  }

  async getLongIdleJewelry(days: number = 30) {
    const now = new Date();
    const threshold = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const allJewelry = await this.prisma.jewelry.findMany({
      include: {
        outfits: {
          orderBy: { wearDate: 'desc' },
          take: 1,
          select: { wearDate: true },
        },
        _count: { select: { outfits: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return allJewelry
      .filter((j) => {
        if (j._count.outfits === 0) {
          return new Date(j.purchaseDate) < threshold;
        }
        const lastWear = j.outfits[0]?.wearDate;
        return lastWear && new Date(lastWear) < threshold;
      })
      .map((j) => ({
        id: j.id,
        name: j.name,
        material: j.material,
        lastWearDate: j.outfits[0]?.wearDate || null,
        totalWears: j._count.outfits,
        idleDays: j._count.outfits === 0
          ? Math.floor((now.getTime() - new Date(j.purchaseDate).getTime()) / (1000 * 60 * 60 * 24))
          : Math.floor((now.getTime() - new Date(j.outfits[0].wearDate).getTime()) / (1000 * 60 * 60 * 24)),
      }))
      .sort((a, b) => b.idleDays - a.idleDays);
  }

  async getOverview() {
    const [jewelryCount, outfitCount, maintenanceCount, repairCount, totalCost] = await Promise.all([
      this.prisma.jewelry.count(),
      this.prisma.outfit.count(),
      this.prisma.maintenance.count(),
      this.prisma.repair.count(),
      this.prisma.repair.aggregate({ _sum: { cost: true } }),
    ]);
    return {
      jewelryCount,
      outfitCount,
      maintenanceCount,
      repairCount,
      totalRepairCost: totalCost._sum.cost || 0,
    };
  }

  async getAll(days: number = 30) {
    const [overview, materialFreq, problemDist, topCombos, idleJewelry] = await Promise.all([
      this.getOverview(),
      this.getMaterialWearFrequency(),
      this.getProblemDistribution(),
      this.getTopOutfitCombinations(),
      this.getLongIdleJewelry(days),
    ]);
    return {
      overview,
      materialWearFrequency: materialFreq,
      problemDistribution: problemDist,
      topOutfitCombinations: topCombos,
      longIdleJewelry: idleJewelry,
    };
  }
}

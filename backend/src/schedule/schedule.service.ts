import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateWearPlanDto, ConfirmWearPlanDto, ResolveConflictDto } from './dto';
import type { JewelryRecommendation, RecommendationFactor, ScheduleConflict, WearPlanDetail, PlanItemDetail } from './dto';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  private getRiskLevel(score: number): { level: string; levelText: string } {
    if (score >= 80) return { level: 'critical', levelText: '极高风险' };
    if (score >= 51) return { level: 'high', levelText: '高风险' };
    if (score >= 21) return { level: 'medium', levelText: '中风险' };
    return { level: 'low', levelText: '低风险' };
  }

  private calculateRiskScore(jewelry: any): { score: number; factors: string[]; reminders: string[] } {
    let score = 0;
    const factors: string[] = [];
    const reminders: string[] = [];

    const allergicCount = jewelry.outfits?.filter((o: any) => o.isAllergic).length || 0;
    if (allergicCount > 0) {
      score += allergicCount * 30;
      factors.push(`过敏${allergicCount}次`);
      reminders.push(`曾引起${allergicCount}次过敏反应`);
    }

    const fadingCount = jewelry.outfits?.filter((o: any) => o.isFading).length || 0;
    if (fadingCount > 0) {
      score += fadingCount * 20;
      factors.push(`掉色${fadingCount}次`);
      reminders.push(`存在${fadingCount}次掉色记录`);
    }

    const pendingRepairs = jewelry.repairs?.filter(
      (r: any) => r.status === '维修中' || r.status === '待取件',
    ).length || 0;
    if (pendingRepairs > 0) {
      score += pendingRepairs * 15;
      factors.push(`待处理维修${pendingRepairs}件`);
      reminders.push(`${pendingRepairs}件维修未完成`);
    }

    const severeProblemTypes = new Set(['断裂', '断链', '掉钻', '严重变形']);
    const severeProblems = jewelry.repairs?.filter((r: any) =>
      severeProblemTypes.has(r.problemType),
    ).length || 0;
    if (severeProblems > 0) {
      score += severeProblems * 25;
      factors.push(`严重维修${severeProblems}次`);
      reminders.push(`曾发生${severeProblems}次严重损坏`);
    }

    const highRiskMaterials = new Set(['合金', '其他']);
    if (highRiskMaterials.has(jewelry.material)) {
      score += jewelry.material === '合金' ? 15 : 5;
      factors.push(`${jewelry.material}高风险材质`);
      reminders.push(`${jewelry.material}材质稳定性较差`);
    }

    const now = new Date();
    let idleDays = 0;
    if (!jewelry.outfits || jewelry.outfits.length === 0) {
      idleDays = Math.floor((now.getTime() - new Date(jewelry.purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
    } else {
      const lastWear = jewelry.outfits[0]?.wearDate;
      if (lastWear) {
        idleDays = Math.floor((now.getTime() - new Date(lastWear).getTime()) / (1000 * 60 * 60 * 24));
      }
    }
    if (idleDays >= 90) {
      score += 25;
      factors.push(`闲置${idleDays}天`);
      reminders.push(`已闲置${idleDays}天`);
    } else if (idleDays >= 60) {
      score += 15;
      factors.push(`闲置${idleDays}天`);
      reminders.push(`已闲置${idleDays}天`);
    }

    return { score, factors, reminders };
  }

  async checkAvailability(
    jewelryId: number,
    planDate: Date,
  ): Promise<{ available: boolean; reasons: string[]; statusInfo: any }> {
    const reasons: string[] = [];
    const jewelry = await this.prisma.jewelry.findUnique({
      where: { id: jewelryId },
      include: {
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
      return { available: false, reasons: ['首饰不存在'], statusInfo: null };
    }

    const activeLending = jewelry.lendings.find((l) => {
      const lendStart = new Date(l.lendDate);
      const expectedReturn = new Date(l.expectedReturnDate);
      return planDate >= lendStart && planDate <= expectedReturn;
    });
    if (activeLending) {
      if (activeLending.status === '逾期未还') {
        reasons.push(`逾期未还：借给${activeLending.borrowerName}，应于${new Date(activeLending.expectedReturnDate).toLocaleDateString('zh-CN')}归还`);
      } else {
        reasons.push(`借出中：借给${activeLending.borrowerName}，预计${new Date(activeLending.expectedReturnDate).toLocaleDateString('zh-CN')}归还`);
      }
    }

    const activeRepair = jewelry.repairs.find((r) => {
      const sendD = new Date(r.sendDate);
      const returnD = r.returnDate ? new Date(r.returnDate) : new Date(sendD.getTime() + 30 * 24 * 60 * 60 * 1000);
      return planDate >= sendD && planDate <= returnD;
    });
    if (activeRepair) {
      if (activeRepair.status === '待取件') {
        reasons.push(`待取件：${activeRepair.problemType}维修已完成，请尽快取回`);
      } else {
        reasons.push(`维修中：${activeRepair.problemType}，预计${activeRepair.returnDate ? new Date(activeRepair.returnDate).toLocaleDateString('zh-CN') : '待定'}可取回`);
      }
    }

    const { score } = this.calculateRiskScore(jewelry);
    const { level } = this.getRiskLevel(score);
    if (level === 'critical') {
      reasons.push(`极高风险：风险评分${score}分，强烈不建议佩戴`);
    }

    return {
      available: reasons.length === 0,
      reasons,
      statusInfo: { lending: jewelry.lendings[0] || null, repair: jewelry.repairs[0] || null, riskScore: score, riskLevel: level },
    };
  }

  async generateRecommendations(
    jewelryIds: number[],
    planDate: string,
    scenario: string,
    outfitTags: string | string[],
    priority: number = 1,
  ): Promise<JewelryRecommendation[]> {
    const planD = new Date(planDate);
    let tagList: string[] = [];
    if (Array.isArray(outfitTags)) {
      tagList = outfitTags.map((t) => String(t).trim()).filter((t) => t.length > 0);
    } else if (typeof outfitTags === 'string') {
      tagList = outfitTags.split(/[,，、\s]+/).map((t) => t.trim()).filter((t) => t.length > 0);
    }

    const jewelries = await this.prisma.jewelry.findMany({
      where: { id: { in: jewelryIds } },
      include: {
        outfits: {
          orderBy: { wearDate: 'desc' },
          take: 20,
        },
        repairs: {
          orderBy: { sendDate: 'desc' },
          take: 10,
        },
        maintenances: {
          orderBy: { date: 'desc' },
          take: 5,
        },
        lendings: {
          where: { status: { in: ['借出中', '逾期未还'] } },
          orderBy: { lendDate: 'desc' },
          take: 3,
        },
      },
    });

    const now = new Date();
    const results: JewelryRecommendation[] = [];

    for (const jewelry of jewelries) {
      const factors: RecommendationFactor[] = [];
      let totalScore = 0;
      const maxScore = 100;
      const unavailableReasons: string[] = [];
      const allReminders: string[] = [];

      const { score: riskScore, factors: riskFactors, reminders } = this.calculateRiskScore(jewelry);
      const { level: riskLevel, levelText: riskLevelText } = this.getRiskLevel(riskScore);
      allReminders.push(...reminders);

      const riskPenalty = Math.min(riskScore, 40);
      const riskFactorScore = Math.max(0, 20 - riskPenalty);
      factors.push({
        type: 'risk',
        name: '风险评估',
        score: riskFactorScore,
        maxScore: 20,
        description: `风险评分${riskScore}分(${riskLevelText})，扣${riskPenalty > 20 ? 20 : riskPenalty}分${riskFactors.length > 0 ? '：' + riskFactors.join('、') : ''}`,
      });
      totalScore += riskFactorScore;

      const suitableScenarios = (jewelry.suitableScenarios || '')
        .split(/[,，、\s]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const scenarioMatch = suitableScenarios.some((s) => scenario.includes(s) || s.includes(scenario));
      if (scenarioMatch) {
        factors.push({
          type: 'scenario',
          name: '场景适配',
          score: 20,
          maxScore: 20,
          description: `适配当前场景「${scenario}」：支持${suitableScenarios.join('、')}`,
        });
        totalScore += 20;
      } else {
        factors.push({
          type: 'scenario',
          name: '场景适配',
          score: 5,
          maxScore: 20,
          description: `场景不完全匹配，建议场景：${suitableScenarios.join('、')}`,
        });
        totalScore += 5;
      }

      const totalWears = jewelry.outfits.length;
      const recentCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const recentWears = jewelry.outfits.filter((o) => new Date(o.wearDate) >= recentCutoff).length;
      let freqScore = 15;
      if (totalWears === 0) {
        freqScore = 12;
        factors.push({ type: 'frequency', name: '佩戴频次', score: freqScore, maxScore: 15, description: '从未佩戴过，建议尝试' });
      } else if (recentWears === 0) {
        freqScore = 15;
        factors.push({ type: 'frequency', name: '佩戴频次', score: freqScore, maxScore: 15, description: `近30天未佩戴(共${totalWears}次)，推荐轮换使用` });
      } else if (recentWears >= 5) {
        freqScore = 6;
        factors.push({ type: 'frequency', name: '佩戴频次', score: freqScore, maxScore: 15, description: `近30天佩戴${recentWears}次，过于频繁` });
      } else {
        freqScore = 15 - recentWears;
        factors.push({ type: 'frequency', name: '佩戴频次', score: freqScore, maxScore: 15, description: `近30天佩戴${recentWears}次，频次适中` });
      }
      totalScore += freqScore;

      let idleDays = 0;
      if (totalWears === 0) {
        idleDays = Math.floor((now.getTime() - new Date(jewelry.purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
      } else {
        const lastWear = jewelry.outfits[0]?.wearDate;
        if (lastWear) {
          idleDays = Math.floor((now.getTime() - new Date(lastWear).getTime()) / (1000 * 60 * 60 * 24));
        }
      }
      let idleScore = 0;
      if (idleDays >= 90) {
        idleScore = 20;
        factors.push({ type: 'idle', name: '闲置推荐', score: idleScore, maxScore: 20, description: `已闲置${idleDays}天，强烈推荐佩戴` });
      } else if (idleDays >= 60) {
        idleScore = 18;
        factors.push({ type: 'idle', name: '闲置推荐', score: idleScore, maxScore: 20, description: `已闲置${idleDays}天，推荐佩戴` });
      } else if (idleDays >= 30) {
        idleScore = 15;
        factors.push({ type: 'idle', name: '闲置推荐', score: idleScore, maxScore: 20, description: `已闲置${idleDays}天，可考虑佩戴` });
      } else if (idleDays <= 3) {
        idleScore = 6;
        factors.push({ type: 'idle', name: '闲置推荐', score: idleScore, maxScore: 20, description: `${idleDays}天前刚佩戴过，建议间隔更长` });
      } else {
        idleScore = 12;
        factors.push({ type: 'idle', name: '闲置推荐', score: idleScore, maxScore: 20, description: `${idleDays}天未佩戴，间隔适中` });
      }
      totalScore += idleScore;

      const lastOutfit = jewelry.outfits[0];
      const needCleaning = lastOutfit?.cleanStatus === '待专业清洁';
      const historyTagMatch = jewelry.outfits.some((o) => {
        const outfitTagList = (o.outfitTags || '').split(/[,，、\s]+/).map((t) => t.trim());
        return tagList.some((tag) => outfitTagList.includes(tag));
      });
      let historyScore = 0;
      let cleaningNote = '';
      if (needCleaning) {
        historyScore = 6;
        cleaningNote = '；上次佩戴后待清洁';
        allReminders.push('待专业清洁');
      } else if (historyTagMatch && tagList.length > 0) {
        historyScore = 15;
      } else {
        historyScore = 10;
      }
      factors.push({
        type: 'history',
        name: '历史搭配',
        score: historyScore,
        maxScore: 15,
        description: historyTagMatch
          ? `有类似穿搭记录${cleaningNote}`
          : `暂无相同风格搭配记录，可尝试新风格${cleaningNote}`,
      });
      totalScore += historyScore;

      const priorityBonus = Math.min((priority - 1) * 5, 10);
      if (priorityBonus > 0) {
        factors.push({
          type: 'priority',
          name: '优先级加成',
          score: priorityBonus,
          maxScore: 10,
          description: `优先级${priority}级，加${priorityBonus}分`,
        });
        totalScore += priorityBonus;
      }

      const availability = await this.checkAvailability(jewelry.id, planD);
      const isAvailable = availability.available;
      unavailableReasons.push(...availability.reasons);
      if (riskLevel === 'high') {
        unavailableReasons.push(`高风险提醒：风险评分${riskScore}分，请谨慎使用`);
      }

      results.push({
        jewelryId: jewelry.id,
        jewelryName: jewelry.name,
        material: jewelry.material,
        color: jewelry.color,
        totalScore: Math.min(totalScore, 100),
        maxScore,
        percentage: Math.round((Math.min(totalScore, 100) / maxScore) * 100),
        isAvailable,
        unavailableReasons,
        riskLevel,
        riskLevelText,
        riskScore,
        factors,
        reminders: allReminders,
      });
    }

    return results.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
      return b.totalScore - a.totalScore;
    });
  }

  async createPlan(dto: CreateWearPlanDto) {
    const recommendations = await this.generateRecommendations(
      dto.candidateJewelryIds,
      dto.planDate,
      dto.scenario,
      dto.outfitTags,
      dto.priority || 1,
    );

    const outfitTagsStr = Array.isArray(dto.outfitTags) ? dto.outfitTags.join('、') : dto.outfitTags || '';

    const plan = await this.prisma.wearPlan.create({
      data: {
        planDate: new Date(dto.planDate),
        scenario: dto.scenario,
        outfitTags: outfitTagsStr,
        candidateJewelryIds: JSON.stringify(dto.candidateJewelryIds),
        priority: dto.priority || 1,
        forbiddenConditions: dto.forbiddenConditions,
        notes: dto.notes,
        status: '待确认',
        recommendationSnapshot: JSON.stringify(recommendations),
      },
    });

    const items = [];
    for (const rec of recommendations) {
      items.push(
        this.prisma.wearPlanItem.create({
          data: {
            wearPlanId: plan.id,
            jewelryId: rec.jewelryId,
            recommendationScore: rec.totalScore,
            riskLevel: rec.riskLevel,
            riskLevelText: rec.riskLevelText,
            riskScore: rec.riskScore,
            unavailableReasons: rec.unavailableReasons.join('|'),
            isAvailable: rec.isAvailable,
            factors: JSON.stringify(rec.factors),
          },
        }),
      );
    }
    await Promise.all(items);

    return this.getPlanDetail(plan.id);
  }

  async getPlanDetail(id: number): Promise<WearPlanDetail> {
    const plan = await this.prisma.wearPlan.findUnique({
      where: { id },
      include: {
        wearPlanItems: {
          include: {
            jewelry: { select: { id: true, name: true, material: true } },
          },
        },
      },
    });
    if (!plan) throw new NotFoundException('佩戴计划不存在');

    const items: PlanItemDetail[] = plan.wearPlanItems
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .map((item) => ({
        id: item.id,
        jewelryId: item.jewelryId,
        jewelryName: item.jewelry.name,
        material: item.jewelry.material,
        recommendationScore: item.recommendationScore,
        riskLevel: item.riskLevel,
        riskLevelText: item.riskLevelText,
        riskScore: item.riskScore,
        unavailableReasons: item.unavailableReasons || '',
        isAvailable: item.isAvailable,
        isSelected: item.isSelected,
        factors: item.factors || '[]',
      }));

    const selectedJewelryNames = items.filter((i) => i.isSelected).map((i) => i.jewelryName);

    return {
      id: plan.id,
      planDate: plan.planDate.toISOString(),
      scenario: plan.scenario,
      outfitTags: plan.outfitTags,
      priority: plan.priority,
      forbiddenConditions: plan.forbiddenConditions || '',
      status: plan.status,
      confirmedAt: plan.confirmedAt?.toISOString() || '',
      notes: plan.notes || '',
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
      items,
      selectedJewelryNames,
    };
  }

  async listPlans(params?: { status?: string; fromDate?: string; toDate?: string }) {
    const where: any = {};
    if (params?.status) where.status = params.status;
    if (params?.fromDate) where.planDate = { ...(where.planDate || {}), gte: new Date(params.fromDate) };
    if (params?.toDate) where.planDate = { ...(where.planDate || {}), lte: new Date(params.toDate) };

    const plans = await this.prisma.wearPlan.findMany({
      where,
      orderBy: { planDate: 'asc' },
      include: {
        wearPlanItems: {
          where: { isSelected: true },
          include: { jewelry: { select: { id: true, name: true, material: true } } },
        },
      },
    });

    return plans.map((p) => ({
      id: p.id,
      planDate: p.planDate.toISOString(),
      scenario: p.scenario,
      outfitTags: p.outfitTags,
      priority: p.priority,
      status: p.status,
      confirmedAt: p.confirmedAt?.toISOString() || null,
      conflictResolved: p.conflictResolved,
      selectedJewelry: p.wearPlanItems.map((item) => ({
        id: item.jewelryId,
        name: item.jewelry.name,
        material: item.jewelry.material,
      })),
    }));
  }

  async confirmPlan(id: number, dto: ConfirmWearPlanDto) {
    const plan = await this.prisma.wearPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('佩戴计划不存在');
    if (plan.status === '已确认') throw new BadRequestException('该计划已确认，无法重复操作');

    const unavailableItems = await this.prisma.wearPlanItem.findMany({
      where: { wearPlanId: id, isAvailable: false, jewelryId: { in: dto.selectedJewelryIds } },
      include: { jewelry: { select: { name: true } } },
    });
    if (unavailableItems.length > 0) {
      const names = unavailableItems.map((i) => i.jewelry.name).join('、');
      throw new BadRequestException(`以下首饰不可用：${names}，请重新选择或取消选择`);
    }

    await this.prisma.wearPlanItem.updateMany({
      where: { wearPlanId: id },
      data: { isSelected: false },
    });

    await this.prisma.wearPlanItem.updateMany({
      where: { wearPlanId: id, jewelryId: { in: dto.selectedJewelryIds } },
      data: { isSelected: true },
    });

    const updated = await this.prisma.wearPlan.update({
      where: { id },
      data: {
        status: '已确认',
        confirmedAt: new Date(),
        selectedJewelryIds: JSON.stringify(dto.selectedJewelryIds),
      },
    });

    return this.getPlanDetail(updated.id);
  }

  async deletePlan(id: number) {
    const plan = await this.prisma.wearPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('佩戴计划不存在');
    return this.prisma.wearPlan.delete({ where: { id } });
  }

  async detectConflicts(): Promise<ScheduleConflict[]> {
    const now = new Date();
    const futureCutoff = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const conflicts: ScheduleConflict[] = [];

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
        const availability = await this.checkAvailability(item.jewelryId, planD);
        if (!availability.available) {
          for (const reason of availability.reasons) {
            let conflictType: ScheduleConflict['conflictType'] = 'high_risk';
            let conflictTypeText = '高风险';
            let severity: ScheduleConflict['severity'] = 'warning';

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
      const severityOrder = { danger: 0, warning: 1 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return new Date(a.planDate).getTime() - new Date(b.planDate).getTime();
    });
  }

  async resolveConflict(planId: number, jewelryId: number, dto: ResolveConflictDto) {
    const plan = await this.prisma.wearPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('佩戴计划不存在');

    await this.prisma.wearPlanItem.updateMany({
      where: { wearPlanId: planId, jewelryId },
      data: { isSelected: false },
    });

    const existingRec = await this.prisma.wearPlanItem.findUnique({
      where: { wearPlanId_jewelryId: { wearPlanId: planId, jewelryId: dto.newJewelryId } },
    });

    if (existingRec) {
      await this.prisma.wearPlanItem.update({
        where: { id: existingRec.id },
        data: { isSelected: true },
      });
    } else {
      const planD = new Date(plan.planDate);
      const availability = await this.checkAvailability(dto.newJewelryId, planD);
      const jewelry = await this.prisma.jewelry.findUnique({ where: { id: dto.newJewelryId } });
      if (!jewelry) throw new NotFoundException('新首饰不存在');

      const { score: riskScore } = this.calculateRiskScore(jewelry);
      const { level, levelText } = this.getRiskLevel(riskScore);

      await this.prisma.wearPlanItem.create({
        data: {
          wearPlanId: planId,
          jewelryId: dto.newJewelryId,
          recommendationScore: availability.available ? 80 : 40,
          riskLevel: level,
          riskLevelText: levelText,
          riskScore,
          unavailableReasons: availability.reasons.join('|'),
          isAvailable: availability.available,
          isSelected: true,
          factors: JSON.stringify([]),
        },
      });
    }

    await this.prisma.wearPlan.update({
      where: { id: planId },
      data: { conflictResolved: true, notes: dto.notes || plan.notes },
    });

    return this.getPlanDetail(planId);
  }

  async getJewelryFuturePlans(jewelryId: number) {
    const now = new Date();
    const items = await this.prisma.wearPlanItem.findMany({
      where: {
        jewelryId,
        isSelected: true,
        wearPlan: {
          status: '已确认',
          planDate: { gte: now },
        },
      },
      include: {
        wearPlan: {
          select: {
            id: true,
            planDate: true,
            scenario: true,
            outfitTags: true,
            priority: true,
          },
        },
      },
      orderBy: { wearPlan: { planDate: 'asc' } },
    });

    return items.map((item) => ({
      planId: item.wearPlan.id,
      planDate: item.wearPlan.planDate.toISOString(),
      scenario: item.wearPlan.scenario,
      outfitTags: item.wearPlan.outfitTags,
      priority: item.wearPlan.priority,
      recommendationScore: item.recommendationScore,
      riskLevel: item.riskLevel,
      riskLevelText: item.riskLevelText,
    }));
  }
}

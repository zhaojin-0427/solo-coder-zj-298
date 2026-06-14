import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

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
      const tags = o.outfitTags
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

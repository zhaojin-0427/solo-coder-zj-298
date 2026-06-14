import type { RiskLevel, RiskAssessment, Jewelry, Outfit, Repair } from '../types';

export const getRiskLevelInfo = (level: RiskLevel) => {
  const map: Record<RiskLevel, { text: string; color: string; type: any; icon: string }> = {
    low: { text: '低风险', color: '#10b981', type: 'success', icon: '✅' },
    medium: { text: '中风险', color: '#f59e0b', type: 'warning', icon: '⚠️' },
    high: { text: '高风险', color: '#f97316', type: 'warning', icon: '🔶' },
    critical: { text: '极高风险', color: '#ef4444', type: 'danger', icon: '🔴' },
  };
  return map[level];
};

export const getRiskTagType = (level: RiskLevel): any => {
  const map: Record<RiskLevel, any> = {
    low: 'success',
    medium: 'warning',
    high: 'warning',
    critical: 'danger',
  };
  return map[level];
};

export const getReminderTypeInfo = (type: string) => {
  const map: Record<string, { icon: string; color: string }> = {
    allergy: { icon: '🤧', color: '#ef4444' },
    repair: { icon: '🔧', color: '#f97316' },
    idle: { icon: '📅', color: '#f59e0b' },
    cleaning: { icon: '🧹', color: '#06b6d4' },
    fading: { icon: '🎨', color: '#8b5cf6' },
    high_cost: { icon: '💰', color: '#6b7280' },
  };
  return map[type] || { icon: 'ℹ️', color: '#6b7280' };
};

export const calculateRiskLocally = (
  jewelry: Jewelry & { outfits?: Outfit[]; repairs?: Repair[] },
): RiskAssessment => {
  const outfits = jewelry.outfits || [];
  const repairs = jewelry.repairs || [];

  let score = 0;
  const factors = [];

  const allergicCount = outfits.filter((o) => o.isAllergic).length;
  if (allergicCount > 0) {
    const s = allergicCount * 30;
    score += s;
    factors.push({
      type: 'allergy',
      score: s,
      description: `记录过${allergicCount}次过敏反应，每次+30分`,
    });
  }

  const fadingCount = outfits.filter((o) => o.isFading).length;
  if (fadingCount > 0) {
    const s = fadingCount * 20;
    score += s;
    factors.push({
      type: 'fading',
      score: s,
      description: `记录过${fadingCount}次掉色，每次+20分`,
    });
  }

  const needCleaningCount = outfits.filter((o) => o.cleanStatus === '待专业清洁').length;
  if (needCleaningCount > 0) {
    const s = needCleaningCount * 10;
    score += s;
    factors.push({
      type: 'cleaning',
      score: s,
      description: `有${needCleaningCount}次记录待专业清洁，每次+10分`,
    });
  }

  const severeTypes = new Set(['断裂', '断链', '掉钻', '严重变形']);
  const severeProblems = repairs.filter((r) => severeTypes.has(r.problemType));
  if (severeProblems.length > 0) {
    const s = severeProblems.length * 25;
    score += s;
    factors.push({
      type: 'severe_repair',
      score: s,
      description: `有${severeProblems.length}次严重维修记录，每次+25分`,
    });
  }

  const pendingRepairs = repairs.filter((r) => r.status === '维修中' || r.status === '待取件');
  if (pendingRepairs.length > 0) {
    const s = pendingRepairs.length * 15;
    score += s;
    factors.push({
      type: 'pending_repair',
      score: s,
      description: `有${pendingRepairs.length}件维修未完成，每件+15分`,
    });
  }

  const highCostRepairs = repairs.filter((r) => r.cost >= 500);
  if (highCostRepairs.length > 0) {
    const s = highCostRepairs.length * 20;
    score += s;
    factors.push({
      type: 'high_cost',
      score: s,
      description: `有${highCostRepairs.length}次高额维修（≥500元），每次+20分`,
    });
  }

  const now = new Date();
  let idleDays = 0;
  if (outfits.length === 0) {
    idleDays = Math.floor(
      (now.getTime() - new Date(jewelry.purchaseDate).getTime()) / (1000 * 60 * 60 * 24),
    );
  } else {
    const lastWear = outfits[0]?.wearDate;
    if (lastWear) {
      idleDays = Math.floor(
        (now.getTime() - new Date(lastWear).getTime()) / (1000 * 60 * 60 * 24),
      );
    }
  }
  if (idleDays >= 90) {
    score += 25;
    factors.push({ type: 'idle', score: 25, description: `已闲置${idleDays}天，+25分` });
  } else if (idleDays >= 60) {
    score += 15;
    factors.push({ type: 'idle', score: 15, description: `已闲置${idleDays}天，+15分` });
  } else if (idleDays >= 30) {
    score += 5;
    factors.push({ type: 'idle', score: 5, description: `已闲置${idleDays}天，+5分` });
  }

  const highRiskMaterials = new Set(['合金', '其他']);
  if (highRiskMaterials.has(jewelry.material)) {
    const s = jewelry.material === '合金' ? 15 : 5;
    score += s;
    factors.push({
      type: 'material',
      score: s,
      description: `${jewelry.material}材质属于高风险材质，+${s}分`,
    });
  }

  let level: RiskLevel = 'low';
  let levelText = '低风险';
  if (score >= 80) {
    level = 'critical';
    levelText = '极高风险';
  } else if (score >= 51) {
    level = 'high';
    levelText = '高风险';
  } else if (score >= 21) {
    level = 'medium';
    levelText = '中风险';
  }

  const reminders: string[] = [];
  if (allergicCount > 0) reminders.push('⚠️ 该首饰曾引起过敏反应，建议减少佩戴');
  if (fadingCount > 0) reminders.push('⚠️ 该首饰存在掉色问题，建议专业保养');
  if (needCleaningCount > 0) reminders.push('🧹 该首饰需要专业清洁');
  if (severeProblems.length > 0) reminders.push('🔧 该首饰曾发生严重损坏，建议定期检查');
  if (pendingRepairs.length > 0) reminders.push('📦 该首饰有维修尚未完成');
  if (highCostRepairs.length > 0) reminders.push('💰 该首饰维修成本较高，小心佩戴');
  if (idleDays >= 60) reminders.push('📅 该首饰已长期闲置，记得定期保养');
  if (highRiskMaterials.has(jewelry.material)) reminders.push('⚠️ 该材质稳定性较差，避免接触汗水');
  if (reminders.length === 0) reminders.push('✅ 该首饰状态良好，继续保持');

  return {
    jewelryId: jewelry.id,
    jewelryName: jewelry.name,
    level,
    levelText,
    score,
    factors,
    reminders,
  };
};

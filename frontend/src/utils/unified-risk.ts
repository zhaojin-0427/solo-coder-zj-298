import type {
  RiskLevel,
  RiskFactor,
  RiskScoreResult,
  JewelryStatusFlags,
  AssetStatusTag,
  JewelryFullStatus,
  Jewelry,
  Outfit,
  Repair,
  Valuation,
  Insurance,
  Credential,
} from '../types';

export const SEVERE_PROBLEM_TYPES = ['断裂', '断链', '掉钻', '严重变形'];
export const HIGH_RISK_MATERIALS = ['合金', '其他'];
export const REQUIRED_CREDENTIAL_TYPES = ['购买凭证', '鉴定证书'];
export const VALUATION_EXPIRY_DAYS = 365;
export const VALUATION_WARNING_DAYS = 270;
export const INSURANCE_WARNING_DAYS = 30;
export const HIGH_VALUE_THRESHOLD = 5000;
export const HIGH_VALUE_DISPLAY_THRESHOLD = 10000;
export const IDLE_LONG_THRESHOLD = 90;
export const IDLE_MEDIUM_THRESHOLD = 60;
export const IDLE_SHORT_THRESHOLD = 30;

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
    severe_repair: { icon: '🔩', color: '#dc2626' },
    pending_repair: { icon: '📦', color: '#ea580c' },
    material: { icon: '⚗️', color: '#7c3aed' },
  };
  return map[type] || { icon: 'ℹ️', color: '#6b7280' };
};

export const calculateIdleDays = (
  jewelry: Pick<Jewelry, 'purchaseDate'> & { outfits?: Outfit[] },
  now: Date = new Date(),
): number => {
  const outfits = jewelry.outfits || [];
  if (outfits.length === 0) {
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
};

export const calculateRiskScore = (
  jewelry: Jewelry & { outfits?: Outfit[]; repairs?: Repair[] },
): RiskScoreResult => {
  const factors: RiskFactor[] = [];
  let totalScore = 0;
  const now = new Date();

  const outfits = jewelry.outfits || [];
  const repairs = jewelry.repairs || [];

  const allergicCount = outfits.filter((o) => o.isAllergic).length;
  if (allergicCount > 0) {
    const score = allergicCount * 30;
    totalScore += score;
    factors.push({
      type: 'allergy',
      score,
      description: `记录过${allergicCount}次过敏反应，每次+30分`,
    });
  }

  const fadingCount = outfits.filter((o) => o.isFading).length;
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

  const severeProblemTypes = new Set(SEVERE_PROBLEM_TYPES);
  const severeProblems = repairs.filter((r) =>
    severeProblemTypes.has(r.problemType),
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

  const pendingRepairs = repairs.filter(
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

  const highCostRepairs = repairs.filter((r) => r.cost >= 500);
  if (highCostRepairs.length > 0) {
    const score = highCostRepairs.length * 20;
    totalScore += score;
    factors.push({
      type: 'high_cost',
      score,
      description: `有${highCostRepairs.length}次高额维修（≥500元），每次+20分`,
    });
  }

  const idleDays = calculateIdleDays(jewelry, now);
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

  const highRiskMaterials = new Set(HIGH_RISK_MATERIALS);
  if (highRiskMaterials.has(jewelry.material)) {
    const score = jewelry.material === '合金' ? 15 : 5;
    totalScore += score;
    factors.push({
      type: 'material',
      score,
      description: `${jewelry.material}材质属于高风险材质，+${score}分`,
    });
  }

  const { level, levelText } = getRiskLevel(totalScore);
  const reminders = generateReminders(factors);

  return {
    score: totalScore,
    level,
    levelText,
    factors,
    reminders,
  };
};

const getRiskLevel = (score: number): { level: RiskLevel; levelText: string } => {
  if (score >= 80) return { level: 'critical', levelText: '极高风险' };
  if (score >= 51) return { level: 'high', levelText: '高风险' };
  if (score >= 21) return { level: 'medium', levelText: '中风险' };
  return { level: 'low', levelText: '低风险' };
};

const generateReminders = (factors: RiskFactor[]): string[] => {
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
};

export const calculateStatusFlags = (
  jewelry: Jewelry & {
    outfits?: Outfit[];
    repairs?: Repair[];
    lendings?: any[];
    valuations?: Valuation[];
    insurances?: Insurance[];
    credentials?: Credential[];
  },
): JewelryStatusFlags => {
  const now = new Date();
  const outfits = jewelry.outfits || [];
  const repairs = jewelry.repairs || [];
  const lendings = jewelry.lendings || [];
  const valuations = jewelry.valuations || [];
  const insurances = jewelry.insurances || [];
  const credentials = jewelry.credentials || [];

  const activeRepairs = repairs.filter(
    (r) => r.status === '维修中' || r.status === '待取件',
  );
  const activeLending = lendings.find(
    (l) => l.status === '借出中' || l.status === '逾期未还',
  );

  const idleDays = calculateIdleDays(jewelry, now);

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

  const activeInsurance = insurances.find((i) => i.status === '生效中');
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

  const existingCredentialTypes = new Set(credentials.map((c) => c.type));
  const missingCredentialTypes = REQUIRED_CREDENTIAL_TYPES.filter(
    (t) => !existingCredentialTypes.has(t),
  );

  const highRiskMaterials = new Set(HIGH_RISK_MATERIALS);
  const allergicCount = outfits.filter((o) => o.isAllergic).length;
  const fadingCount = outfits.filter((o) => o.isFading).length;

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
};

export const generateAssetStatusTags = (
  jewelry: Jewelry & {
    valuations?: Valuation[];
    insurances?: Insurance[];
    credentials?: Credential[];
    lendings?: any[];
    repairs?: Repair[];
    outfits?: Outfit[];
  },
  flags?: JewelryStatusFlags,
): AssetStatusTag[] => {
  const tags: AssetStatusTag[] = [];
  const status = flags || calculateStatusFlags(jewelry);
  const risk = calculateRiskScore(jewelry);

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
};

export const getInsuranceRiskWarning = (
  jewelry: Jewelry & {
    valuations?: Valuation[];
    insurances?: Insurance[];
  },
): { hasRisk: boolean; warnings: string[] } => {
  const warnings: string[] = [];
  const now = new Date();
  const valuations = jewelry.valuations || [];
  const insurances = (jewelry.insurances || []).filter(
    (i) => i.status === '生效中',
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
};

export const getCredentialCompleteness = (
  credentials: Credential[] = [],
): number => {
  const existingTypes = new Set(credentials.map((c) => c.type));
  const missingCount = REQUIRED_CREDENTIAL_TYPES.filter(
    (t) => !existingTypes.has(t),
  ).length;
  const total = existingTypes.size + missingCount;
  return total > 0 ? Math.round((existingTypes.size / total) * 100) : 0;
};

export const mergeFullStatusToJewelry = (
  jewelry: Jewelry,
  fullStatus?: JewelryFullStatus,
): Jewelry & {
  _risk?: RiskScoreResult;
  _status?: JewelryStatusFlags;
  _assetTags?: AssetStatusTag[];
  _insuranceWarning?: { hasRisk: boolean; warnings: string[] };
} => {
  if (!fullStatus) return jewelry as any;
  return {
    ...jewelry,
    _risk: fullStatus.risk,
    _status: fullStatus.status,
    _assetTags: fullStatus.assetTags,
    _insuranceWarning: fullStatus.insuranceWarning,
  };
};

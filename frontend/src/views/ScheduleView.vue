<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon :size="28" color="#a855f7"><Calendar /></el-icon>
        多维首饰使用决策与智能排程中心
      </h1>
      <el-button type="primary" @click="showCreateForm = true" :icon="Plus">
        创建穿搭计划
      </el-button>
    </div>

    <el-alert
      v-if="pendingConflicts.length > 0"
      type="error"
      :closable="false"
      style="margin-bottom: 16px"
      show-icon
    >
      <template #title>
        <span style="font-weight: 600">
          检测到 {{ pendingConflicts.length }} 个待处理冲突，请尽快处理
        </span>
      </template>
      <div style="margin-top: 8px">
        <div
          v-for="conflict in pendingConflicts"
          :key="conflict.id"
          class="conflict-item"
        >
          <div class="conflict-info">
            <el-tag :type="conflict.severity === 'danger' ? 'danger' : 'warning'" effect="dark" size="small">
              {{ conflict.conflictTypeText }}
            </el-tag>
            <span class="conflict-text">
              <b>{{ formatDate(conflict.planDate) }}</b> · {{ conflict.scenario }} ·
              首饰「<b>{{ conflict.jewelryName }}</b>」 {{ conflict.description }}
            </span>
          </div>
          <div class="conflict-actions">
            <el-button size="small" type="primary" @click="openReassignDialog(conflict)">
              改派其他首饰
            </el-button>
          </div>
        </div>
      </div>
    </el-alert>

    <el-dialog
      v-model="showCreateForm"
      title="创建穿搭计划"
      width="720px"
      :close-on-click-modal="false"
    >
      <el-form :model="planForm" label-width="100px" ref="planFormRef">
        <div class="form-section-title">计划基础信息</div>
        <el-form-item label="计划日期" prop="planDate" :rules="[{ required: true, message: '请选择日期' }]">
          <el-date-picker
            v-model="planForm.planDate"
            type="date"
            style="width: 100%"
            value-format="YYYY-MM-DD"
            :disabled-date="disablePastDate"
            placeholder="选择计划佩戴的日期"
          />
        </el-form-item>
        <el-form-item label="场景" prop="scenario" :rules="[{ required: true, message: '请选择或输入场景' }]">
          <el-select v-model="planForm.scenario" filterable allow-create default-first-option style="width: 100%">
            <el-option label="日常通勤" value="日常通勤" />
            <el-option label="约会" value="约会" />
            <el-option label="婚礼宴会" value="婚礼宴会" />
            <el-option label="商务场合" value="商务场合" />
            <el-option label="派对" value="派对" />
            <el-option label="旅行" value="旅行" />
            <el-option label="运动健身" value="运动健身" />
            <el-option label="居家休闲" value="居家休闲" />
          </el-select>
        </el-form-item>
        <el-form-item label="穿搭标签" prop="outfitTags" :rules="[{ required: true, message: '请选择或输入标签' }]">
          <el-select
            v-model="planForm.outfitTagsList"
            multiple
            filterable
            allow-create
            default-first-option
            style="width: 100%"
            placeholder="选择或输入穿搭标签，如：优雅、休闲、复古等"
          >
            <el-option label="优雅" value="优雅" />
            <el-option label="休闲" value="休闲" />
            <el-option label="复古" value="复古" />
            <el-option label="简约" value="简约" />
            <el-option label="甜美" value="甜美" />
            <el-option label="酷飒" value="酷飒" />
            <el-option label="职场" value="职场" />
            <el-option label="度假" value="度假" />
          </el-select>
        </el-form-item>
        <div class="form-section-title">首饰选择与设置</div>
        <el-form-item label="候选首饰" prop="candidateJewelryIds" :rules="[{ required: true, type: 'array', message: '请至少选择一件首饰' }]">
          <el-select
            v-model="planForm.candidateJewelryIds"
            multiple
            filterable
            style="width: 100%"
            placeholder="从首饰库中选择候选首饰"
          >
            <el-option
              v-for="j in allJewelry"
              :key="j.id"
              :label="`${j.name} · ${j.material} · ${j.color}`"
              :value="j.id"
            >
              <span style="display: flex; justify-content: space-between; width: 100%">
                <span>{{ j.name }}</span>
                <span style="color: #909399; font-size: 12px">{{ j.material }} · {{ j.color }}</span>
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="佩戴优先级" prop="priority">
          <el-radio-group v-model="planForm.priority">
            <el-radio :value="1">普通</el-radio>
            <el-radio :value="2">较高</el-radio>
            <el-radio :value="3">最高</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="禁用条件">
          <el-input
            v-model="planForm.forbiddenConditions"
            type="textarea"
            :rows="2"
            placeholder="如：避免与金属材质叠戴、避免运动场景等"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="planForm.notes"
            type="textarea"
            :rows="2"
            placeholder="其他需要说明的信息"
          />
        </el-form-item>
      </el-form>

      <div v-if="recommendations.length > 0" style="margin-top: 24px">
        <el-divider content-position="left">
          <span style="font-weight: 600">智能推荐结果</span>
        </el-divider>
        <div
          v-for="rec in recommendations"
          :key="rec.jewelryId"
          class="recommendation-card"
          :class="{ 'card-unavailable': !rec.isAvailable }"
        >
          <div class="rec-header">
            <div class="rec-title">
              <el-checkbox
                v-model="selectedMap[rec.jewelryId]"
                :disabled="!rec.isAvailable"
              />
              <span class="rec-name">{{ rec.jewelryName }}</span>
              <el-tag size="small" effect="light" style="margin-left: 8px">{{ rec.material }}</el-tag>
              <el-tag size="small" type="warning" effect="light">{{ rec.color }}</el-tag>
              <el-tag
                v-if="!rec.isAvailable"
                size="small"
                type="danger"
                effect="dark"
                style="margin-left: 8px"
              >
                不可用
              </el-tag>
              <el-tag
                v-else-if="rec.riskLevel === 'high' || rec.riskLevel === 'critical'"
                size="small"
                type="warning"
                effect="dark"
                style="margin-left: 8px"
              >
                ⚠️ 请谨慎使用
              </el-tag>
            </div>
            <div class="rec-score">
              <span class="score-value" :class="getScoreClass(rec.percentage)">{{ rec.percentage }}分</span>
              <span class="score-label">推荐度</span>
            </div>
          </div>

          <el-progress
            :percentage="rec.percentage"
            :stroke-width="10"
            :color="getProgressColor(rec.percentage)"
            style="margin: 12px 0"
          />

          <div class="rec-meta">
            <el-tag
              size="small"
              :type="getRiskTagType(rec.riskLevel)"
              effect="dark"
            >
              {{ rec.riskLevelText }} · {{ rec.riskScore }}分
            </el-tag>
          </div>

          <div v-if="rec.unavailableReasons.length > 0" class="unavailable-reasons">
            <div class="section-label">不可用原因：</div>
            <div v-for="(reason, idx) in rec.unavailableReasons" :key="idx" class="reason-item">
              <el-icon color="#ef4444"><CircleClose /></el-icon>
              <span>{{ reason }}</span>
            </div>
          </div>

          <div v-if="rec.reminders.length > 0" class="reminders">
            <div class="section-label">温馨提示：</div>
            <div v-for="(rem, idx) in rec.reminders" :key="idx" class="reminder-item">
              <el-icon color="#f59e0b"><Warning /></el-icon>
              <span>{{ rem }}</span>
            </div>
          </div>

          <div v-if="getInsuranceRiskWarning(allJewelry.find(j => j.id === rec.jewelryId) as any).hasRisk" class="insurance-risk-warnings">
            <div class="section-label">保险/估值风险：</div>
            <el-alert
              v-for="(warning, idx) in getInsuranceRiskWarning(allJewelry.find(j => j.id === rec.jewelryId) as any).warnings"
              :key="idx"
              type="warning"
              :closable="false"
              show-icon
              style="margin-bottom: 6px"
            >
              <template #title>{{ warning }}</template>
            </el-alert>
          </div>

          <el-collapse class="factors-collapse">
            <el-collapse-item title="查看评分详情" name="factors">
              <div v-for="factor in rec.factors" :key="factor.type" class="factor-row">
                <div class="factor-name">{{ factor.name }}</div>
                <div class="factor-bar-wrap">
                  <div class="factor-bar-bg">
                    <div
                      class="factor-bar"
                      :style="{
                        width: factor.maxScore > 0 ? (factor.score / factor.maxScore) * 100 + '%' : '0%',
                        background: getFactorColor(factor.type),
                      }"
                    ></div>
                  </div>
                </div>
                <div class="factor-score">{{ factor.score }}/{{ factor.maxScore }}</div>
              </div>
              <div class="factor-desc">
                <div v-for="factor in rec.factors" :key="'desc-' + factor.type" class="desc-item">
                  · {{ factor.description }}
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>

      <template #footer>
        <el-button @click="resetCreateForm">取消</el-button>
        <el-button
          v-if="recommendations.length === 0"
          type="primary"
          :disabled="!canGenerate"
          @click="generateRecommendations"
          :loading="recommending"
        >
          生成智能推荐
        </el-button>
        <template v-else>
          <el-button @click="recommendations = []">重新推荐</el-button>
          <el-button
            type="success"
            :disabled="selectedCount === 0"
            @click="confirmPlan"
            :loading="confirming"
          >
            确认排程 (已选 {{ selectedCount }} 件)
          </el-button>
        </template>
      </template>
    </el-dialog>

    <el-dialog v-model="showReassignDialog" title="冲突处理：改派其他首饰" width="600px">
      <div v-if="currentConflict" class="reassign-info">
        <el-alert type="warning" :closable="false" show-icon style="margin-bottom: 16px">
          <template #title>
            <b>{{ formatDate(currentConflict.planDate) }} · {{ currentConflict.scenario }}</b>
          </template>
          当前首饰「<b>{{ currentConflict.jewelryName }}</b>」冲突原因：{{ currentConflict.description }}
        </el-alert>
        <el-form label-width="100px">
          <el-form-item label="替代首饰">
            <el-select
              v-model="reassignJewelryId"
              filterable
              style="width: 100%"
              placeholder="选择替代首饰"
            >
              <el-option
                v-for="j in allJewelry.filter((j) => j.id !== currentConflict.jewelryId)"
                :key="j.id"
                :label="`${j.name} · ${j.material} · ${j.color}`"
                :value="j.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="处理备注">
            <el-input v-model="reassignNotes" type="textarea" :rows="2" placeholder="可选" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showReassignDialog = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!reassignJewelryId"
          @click="submitReassign"
          :loading="reassigning"
        >
          确认改派
        </el-button>
      </template>
    </el-dialog>

    <el-row :gutter="16" style="margin-top: 8px">
      <el-col :xs="24" :md="14">
        <el-card class="card" shadow="never">
          <div class="card-header">
            <h3>
              <el-icon color="#a855f7"><Date /></el-icon>
              未来 30 天佩戴排程
            </h3>
          </div>
          <div class="schedule-calendar">
            <div
              v-for="day in calendarDays"
              :key="day.dateStr"
              class="calendar-day"
              :class="{ 'is-today': day.isToday, 'has-plan': day.plans.length > 0 }"
            >
              <div class="day-header">
                <span class="day-week">{{ day.weekday }}</span>
                <span class="day-date" :class="{ 'today-mark': day.isToday }">
                  {{ day.dayNum }}
                </span>
              </div>
              <div class="day-body">
                <div v-if="day.plans.length === 0" class="day-empty">—</div>
                <div
                  v-for="plan in day.plans"
                  :key="plan.id"
                  class="plan-chip"
                  :class="'priority-' + (plan.priority || 1)"
                  @click="viewPlanDetail(plan.id)"
                >
                  <div class="plan-chip-title">{{ plan.scenario }}</div>
                  <div class="plan-chip-jewelry">
                    {{ plan.jewelry.map((j: any) => j.name).join('、') || '待选择' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="10">
        <el-card class="card" shadow="never" style="margin-bottom: 16px">
          <div class="card-header">
            <h3>
              <el-icon color="#06b6d4"><List /></el-icon>
              已创建的计划
            </h3>
            <el-tag size="small" type="info">
              待确认 {{ pendingPlans.length }} · 已确认 {{ confirmedPlans.length }}
            </el-tag>
          </div>
          <el-tabs v-model="activePlanTab">
            <el-tab-pane label="全部" name="all">
              <div v-if="allPlans.length === 0" class="empty-mini">暂无计划</div>
              <div
                v-for="plan in allPlans"
                :key="plan.id"
                class="plan-list-item"
                @click="viewPlanDetail(plan.id)"
              >
                <div class="plan-list-date">
                  <span class="date-num">{{ formatDateDay(plan.planDate) }}</span>
                  <span class="date-month">{{ formatDateMonth(plan.planDate) }}月</span>
                </div>
                <div class="plan-list-info">
                  <div class="plan-list-title">
                    {{ plan.scenario }}
                    <el-tag
                      size="small"
                      :type="plan.status === '已确认' ? 'success' : 'warning'"
                      effect="light"
                      style="margin-left: 6px"
                    >{{ plan.status }}</el-tag>
                    <el-tag
                      v-if="plan.conflictResolved === false && plan.status === '已确认'"
                      size="small"
                      type="danger"
                      effect="dark"
                      style="margin-left: 6px"
                    >有冲突</el-tag>
                  </div>
                  <div class="plan-list-jewelry">
                    {{ plan.selectedJewelry.map((j: any) => j.name).join('、') || '未选择首饰' }}
                  </div>
                </div>
                <div class="plan-list-actions" @click.stop>
                  <el-button
                    v-if="plan.status === '待确认'"
                    size="small"
                    type="danger"
                    link
                    @click="deletePlan(plan.id)"
                  >删除</el-button>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="待确认" name="pending">
              <div v-if="pendingPlans.length === 0" class="empty-mini">暂无待确认计划</div>
              <div
                v-for="plan in pendingPlans"
                :key="plan.id"
                class="plan-list-item"
                @click="viewPlanDetail(plan.id)"
              >
                <div class="plan-list-date">
                  <span class="date-num">{{ formatDateDay(plan.planDate) }}</span>
                  <span class="date-month">{{ formatDateMonth(plan.planDate) }}月</span>
                </div>
                <div class="plan-list-info">
                  <div class="plan-list-title">
                    {{ plan.scenario }}
                    <el-tag size="small" type="warning" effect="light" style="margin-left: 6px">待确认</el-tag>
                  </div>
                  <div class="plan-list-jewelry">
                    {{ plan.selectedJewelry.map((j: any) => j.name).join('、') || '未选择首饰' }}
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>

    <el-drawer v-model="showPlanDetail" title="计划详情" size="560px">
      <div v-if="currentPlanDetail">
        <div class="detail-header">
          <h2>{{ currentPlanDetail.scenario }}</h2>
          <el-tag :type="currentPlanDetail.status === '已确认' ? 'success' : 'warning'" effect="dark" size="large">
            {{ currentPlanDetail.status }}
          </el-tag>
        </div>
        <el-descriptions :column="1" border style="margin-top: 16px">
          <el-descriptions-item label="计划日期">
            {{ formatDate(currentPlanDetail.planDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="穿搭标签">
            <el-tag
              v-for="tag in currentPlanDetail.outfitTags.split(/[,，、\s]+/).filter(Boolean)"
              :key="tag"
              size="small"
              effect="light"
              style="margin-right: 4px"
            >{{ tag }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="优先级">
            {{ ['', '普通', '较高', '最高'][currentPlanDetail.priority] }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentPlanDetail.forbiddenConditions" label="禁用条件">
            {{ currentPlanDetail.forbiddenConditions }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentPlanDetail.notes" label="备注">
            {{ currentPlanDetail.notes }}
          </el-descriptions-item>
          <el-descriptions-item label="已选首饰">
            <div v-if="currentPlanDetail.selectedJewelryNames.length === 0">暂无</div>
            <div v-else>
              <el-tag
                v-for="name in currentPlanDetail.selectedJewelryNames"
                :key="name"
                size="small"
                type="success"
                effect="light"
                style="margin-right: 4px"
              >{{ name }}</el-tag>
            </div>
          </el-descriptions-item>
        </el-descriptions>

        <div style="margin-top: 24px">
          <h4 style="margin-bottom: 12px">候选首饰评分详情</h4>
          <div
            v-for="item in currentPlanDetail.items"
            :key="item.id"
            class="detail-item-card"
            :class="{ 'card-unavailable': !item.isAvailable }"
          >
            <div class="detail-item-header">
              <div>
                <el-checkbox
                  v-model="detailSelectedMap[item.jewelryId]"
                  :disabled="!item.isAvailable || currentPlanDetail.status === '已确认'"
                />
                <span class="detail-item-name" :style="{ fontWeight: item.isSelected ? 600 : 400 }">
                  {{ item.jewelryName }}
                </span>
                <el-tag size="small" effect="light">{{ item.material }}</el-tag>
              </div>
              <div class="detail-item-score">
                <span :class="getScoreClass(Math.round((item.recommendationScore / 100) * 100))">
                  {{ item.recommendationScore }}分
                </span>
                <el-tag
                  size="small"
                  :type="getRiskTagType(item.riskLevel)"
                  effect="dark"
                  style="margin-left: 8px"
                >
                  {{ item.riskLevelText }}
                </el-tag>
              </div>
            </div>
            <div v-if="item.unavailableReasons" class="detail-item-warnings">
              <el-tag
                v-for="(r, i) in item.unavailableReasons.split('|').filter(Boolean)"
                :key="i"
                size="small"
                type="danger"
                effect="light"
                style="margin: 2px 4px 2px 0"
              >{{ r }}</el-tag>
            </div>
          </div>
        </div>

        <div v-if="currentPlanDetail.status === '待确认'" style="margin-top: 24px">
          <el-button
            type="primary"
            :disabled="detailSelectedCount === 0"
            @click="confirmExistingPlan"
            :loading="confirming"
          >
            确认排程 (已选 {{ detailSelectedCount }} 件)
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Plus,
  Calendar,
  Date as DateIcon,
  List,
  Warning,
  CircleClose,
} from '@element-plus/icons-vue';
import { jewelryApi, scheduleApi } from '@/api';
import { getInsuranceRiskWarning } from '@/utils/risk';
import type {
  Jewelry,
  JewelryRecommendation,
  WearPlanSummary,
  ScheduleConflict,
  WearPlanDetail,
  ScheduleCalendarDay,
} from '@/types';

const showCreateForm = ref(false);
const planFormRef = ref();
const recommending = ref(false);
const confirming = ref(false);
const reassigning = ref(false);

const allJewelry = ref<Jewelry[]>([]);
const allPlans = ref<WearPlanSummary[]>([]);
const pendingConflicts = ref<ScheduleConflict[]>([]);
const recommendations = ref<JewelryRecommendation[]>([]);
const selectedMap = reactive<Record<number, boolean>>({});

const planForm = reactive({
  planDate: '',
  scenario: '',
  outfitTagsList: [] as string[],
  candidateJewelryIds: [] as number[],
  priority: 1,
  forbiddenConditions: '',
  notes: '',
});

const showReassignDialog = ref(false);
const currentConflict = ref<ScheduleConflict | null>(null);
const reassignJewelryId = ref<number | null>(null);
const reassignNotes = ref('');

const showPlanDetail = ref(false);
const currentPlanDetail = ref<WearPlanDetail | null>(null);
const detailSelectedMap = reactive<Record<number, boolean>>({});

const activePlanTab = ref('all');

const pendingPlans = computed(() => allPlans.value.filter((p) => p.status === '待确认'));
const confirmedPlans = computed(() => allPlans.value.filter((p) => p.status === '已确认'));

const canGenerate = computed(() => {
  return (
    planForm.planDate &&
    planForm.scenario &&
    planForm.outfitTagsList.length > 0 &&
    planForm.candidateJewelryIds.length > 0
  );
});

const selectedCount = computed(() => Object.values(selectedMap).filter(Boolean).length);
const detailSelectedCount = computed(() => Object.values(detailSelectedMap).filter(Boolean).length);

const calendarDays = computed(() => {
  const now = new Date();
  const planMap = new Map<string, any[]>();
  for (const plan of allPlans.value) {
    const dStr = new Date(plan.planDate).toISOString().split('T')[0];
    if (!planMap.has(dStr)) planMap.set(dStr, []);
    planMap.get(dStr)!.push(plan);
  }

  const days: Array<any> = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const dStr = d.toISOString().split('T')[0];
    const weekdayMap = ['日', '一', '二', '三', '四', '五', '六'];
    days.push({
      date: d.toISOString(),
      dateStr: dStr,
      weekday: weekdayMap[d.getDay()],
      dayNum: d.getDate(),
      isToday: i === 0,
      plans: planMap.get(dStr) || [],
    });
  }
  return days;
});

function disablePastDate(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() < today.getTime();
}

function formatDate(d: string | Date) {
  const date = typeof d === 'string' ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateDay(d: string) {
  return new Date(d).getDate();
}

function formatDateMonth(d: string) {
  return new Date(d).getMonth() + 1;
}

function getScoreClass(pct: number) {
  if (pct >= 80) return 'score-excellent';
  if (pct >= 60) return 'score-good';
  if (pct >= 40) return 'score-fair';
  return 'score-poor';
}

function getProgressColor(pct: number) {
  if (pct >= 80) return '#10b981';
  if (pct >= 60) return '#3b82f6';
  if (pct >= 40) return '#f59e0b';
  return '#ef4444';
}

function getFactorColor(type: string) {
  const colors: Record<string, string> = {
    risk: '#ef4444',
    scenario: '#8b5cf6',
    frequency: '#3b82f6',
    idle: '#10b981',
    history: '#f59e0b',
    priority: '#ec4899',
  };
  return colors[type] || '#a855f7';
}

function getRiskTagType(level: string) {
  const map: Record<string, any> = {
    low: 'success',
    medium: 'info',
    high: 'warning',
    critical: 'danger',
  };
  return map[level] || 'info';
}

async function loadAllJewelry() {
  allJewelry.value = await jewelryApi.list();
}

async function loadAllPlans() {
  allPlans.value = await scheduleApi.listPlans();
}

async function loadConflicts() {
  pendingConflicts.value = (await scheduleApi.getConflicts()).filter((c) => c.status === '待处理');
}

async function generateRecommendations() {
  if (!canGenerate.value) return;
  recommending.value = true;
  try {
    recommendations.value = await scheduleApi.recommend({
      jewelryIds: planForm.candidateJewelryIds,
      planDate: planForm.planDate,
      scenario: planForm.scenario,
      outfitTags: planForm.outfitTagsList.join('、'),
      priority: planForm.priority,
    });
    for (const rec of recommendations.value) {
      selectedMap[rec.jewelryId] = rec.isAvailable && rec.totalScore >= 70;
    }
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '生成推荐失败');
  } finally {
    recommending.value = false;
  }
}

async function confirmPlan() {
  const selectedIds = Object.entries(selectedMap)
    .filter(([, v]) => v)
    .map(([k]) => Number(k));
  if (selectedIds.length === 0) return;

  confirming.value = true;
  try {
    const plan = await scheduleApi.createPlan({
      planDate: planForm.planDate,
      scenario: planForm.scenario,
      outfitTags: planForm.outfitTagsList.join('、'),
      candidateJewelryIds: planForm.candidateJewelryIds,
      priority: planForm.priority,
      forbiddenConditions: planForm.forbiddenConditions,
      notes: planForm.notes,
    });
    await scheduleApi.confirmPlan(plan.id, selectedIds);
    ElMessage.success('排程确认成功！');
    showCreateForm.value = false;
    resetCreateForm();
    await loadAllPlans();
    await loadConflicts();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '确认排程失败');
  } finally {
    confirming.value = false;
  }
}

function resetCreateForm() {
  planForm.planDate = '';
  planForm.scenario = '';
  planForm.outfitTagsList = [];
  planForm.candidateJewelryIds = [];
  planForm.priority = 1;
  planForm.forbiddenConditions = '';
  planForm.notes = '';
  recommendations.value = [];
  Object.keys(selectedMap).forEach((k) => delete selectedMap[Number(k)]);
}

function openReassignDialog(conflict: ScheduleConflict) {
  currentConflict.value = conflict;
  reassignJewelryId.value = null;
  reassignNotes.value = '';
  showReassignDialog.value = true;
}

async function submitReassign() {
  if (!currentConflict.value || !reassignJewelryId.value) return;
  reassigning.value = true;
  try {
    await scheduleApi.resolveConflict(
      currentConflict.value.wearPlanId,
      currentConflict.value.jewelryId,
      reassignJewelryId.value,
      reassignNotes.value,
    );
    ElMessage.success('改派成功！');
    showReassignDialog.value = false;
    await loadAllPlans();
    await loadConflicts();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '改派失败');
  } finally {
    reassigning.value = false;
  }
}

async function viewPlanDetail(id: number) {
  try {
    currentPlanDetail.value = await scheduleApi.getPlanDetail(id);
    Object.keys(detailSelectedMap).forEach((k) => delete detailSelectedMap[Number(k)]);
    for (const item of currentPlanDetail.value.items) {
      detailSelectedMap[item.jewelryId] = item.isSelected;
    }
    showPlanDetail.value = true;
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '加载计划详情失败');
  }
}

async function confirmExistingPlan() {
  if (!currentPlanDetail.value) return;
  const selectedIds = Object.entries(detailSelectedMap)
    .filter(([, v]) => v)
    .map(([k]) => Number(k));
  if (selectedIds.length === 0) return;

  confirming.value = true;
  try {
    currentPlanDetail.value = await scheduleApi.confirmPlan(currentPlanDetail.value.id, selectedIds);
    ElMessage.success('排程确认成功！');
    showPlanDetail.value = false;
    await loadAllPlans();
    await loadConflicts();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '确认排程失败');
  } finally {
    confirming.value = false;
  }
}

async function deletePlan(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除该计划吗？', '确认删除', { type: 'warning' });
    await scheduleApi.deletePlan(id);
    ElMessage.success('已删除');
    await loadAllPlans();
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.response?.data?.message || '删除失败');
  }
}

onMounted(async () => {
  await Promise.all([loadAllJewelry(), loadAllPlans(), loadConflicts()]);
});
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 22px;
  font-weight: 700;
  color: #4c1d95;
  margin: 0;
}

.card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.card-header h3 {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  color: #4c1d95;
  margin: 0;
}

.form-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #6b21a8;
  margin: 8px 0 12px 0;
  padding-left: 8px;
  border-left: 3px solid #a855f7;
}

.conflict-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #fff1f2;
  border-radius: 8px;
  margin-bottom: 6px;
}

.conflict-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.conflict-text {
  font-size: 13px;
  color: #1f2937;
}

.recommendation-card {
  border: 1px solid #e9d5ff;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
  background: #fdfbff;
  transition: all 0.2s;
}

.recommendation-card:hover {
  border-color: #a855f7;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.1);
}

.recommendation-card.card-unavailable {
  background: #fef2f2;
  border-color: #fecaca;
  opacity: 0.85;
}

.rec-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rec-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rec-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.rec-score {
  text-align: right;
}

.score-value {
  font-size: 22px;
  font-weight: 700;
}

.score-excellent {
  color: #10b981;
}

.score-good {
  color: #3b82f6;
}

.score-fair {
  color: #f59e0b;
}

.score-poor {
  color: #ef4444;
}

.score-label {
  font-size: 12px;
  color: #6b7280;
  display: block;
}

.rec-meta {
  margin-bottom: 8px;
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: #4b5563;
  margin: 8px 0 6px 0;
}

.unavailable-reasons,
.reminders,
.insurance-risk-warnings {
  margin-top: 8px;
}

.reason-item,
.reminder-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 13px;
  color: #374151;
  padding: 3px 0;
}

.factors-collapse {
  margin-top: 8px;
  --el-collapse-border-color: #e9d5ff;
}

.factor-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
}

.factor-name {
  width: 80px;
  font-size: 13px;
  color: #4b5563;
  flex-shrink: 0;
}

.factor-bar-wrap {
  flex: 1;
}

.factor-bar-bg {
  background: #f3e8ff;
  border-radius: 4px;
  height: 8px;
  overflow: hidden;
}

.factor-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.factor-score {
  width: 50px;
  text-align: right;
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
  flex-shrink: 0;
}

.factor-desc {
  margin-top: 8px;
  padding: 8px 12px;
  background: #faf5ff;
  border-radius: 6px;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.6;
}

.schedule-calendar {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

@media (max-width: 768px) {
  .schedule-calendar {
    grid-template-columns: repeat(3, 1fr);
  }
}

.calendar-day {
  border: 1px solid #e9d5ff;
  border-radius: 8px;
  min-height: 90px;
  background: #fff;
  transition: all 0.2s;
  overflow: hidden;
}

.calendar-day:hover {
  border-color: #a855f7;
}

.calendar-day.is-today {
  border-color: #a855f7;
  background: #faf5ff;
}

.calendar-day.has-plan {
  background: #fdfbff;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: #f3e8ff;
  font-size: 12px;
}

.day-week {
  color: #6b21a8;
  font-weight: 500;
}

.day-date {
  font-weight: 600;
  color: #1f2937;
}

.today-mark {
  color: #a855f7;
  font-weight: 700;
}

.day-body {
  padding: 6px;
}

.day-empty {
  text-align: center;
  color: #d1d5db;
  font-size: 18px;
  padding: 8px 0;
}

.plan-chip {
  background: linear-gradient(135deg, #c084fc, #a855f7);
  color: #fff;
  padding: 4px 6px;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 11px;
  cursor: pointer;
}

.plan-chip.priority-2 {
  background: linear-gradient(135deg, #f97316, #ef4444);
}

.plan-chip.priority-3 {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.plan-chip-title {
  font-weight: 600;
}

.plan-chip-jewelry {
  opacity: 0.9;
  font-size: 10px;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plan-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-bottom: 1px solid #f3e8ff;
  cursor: pointer;
  transition: background 0.2s;
}

.plan-list-item:hover {
  background: #faf5ff;
}

.plan-list-date {
  width: 50px;
  text-align: center;
  flex-shrink: 0;
  background: #f3e8ff;
  border-radius: 6px;
  padding: 6px 4px;
}

.date-num {
  font-size: 18px;
  font-weight: 700;
  color: #6b21a8;
  display: block;
  line-height: 1;
}

.date-month {
  font-size: 11px;
  color: #6b21a8;
}

.plan-list-info {
  flex: 1;
  min-width: 0;
}

.plan-list-title {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
  margin-bottom: 4px;
}

.plan-list-jewelry {
  font-size: 12px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-mini {
  text-align: center;
  padding: 24px;
  color: #9ca3af;
  font-size: 13px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #4c1d95;
  margin: 0;
}

.detail-item-card {
  border: 1px solid #e9d5ff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  background: #fdfbff;
}

.detail-item-card.card-unavailable {
  background: #fef2f2;
  border-color: #fecaca;
}

.detail-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-item-name {
  font-size: 15px;
  color: #1f2937;
}

.detail-item-score {
  display: flex;
  align-items: center;
}

.detail-item-warnings {
  margin-top: 8px;
}

.reassign-info {
  margin-top: 8px;
}
</style>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">数据统计</h1>
      <div class="filter-group">
        <span class="label">闲置阈值</span>
        <el-select v-model="idleDays" style="width: 140px" @change="loadData">
          <el-option label="15天未佩戴" :value="15" />
          <el-option label="30天未佩戴" :value="30" />
          <el-option label="60天未佩戴" :value="60" />
          <el-option label="90天未佩戴" :value="90" />
        </el-select>
      </div>
    </div>

    <el-row :gutter="16" style="margin-bottom: 16px">
      <el-col :xs="12" :sm="12" :md="6">
        <div class="stat-card">
          <el-icon :size="28" color="#a855f7"><Present /></el-icon>
          <div class="label">首饰总数</div>
          <div class="value">{{ data.overview?.jewelryCount || 0 }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6">
        <div class="stat-card">
          <el-icon :size="28" color="#06b6d4"><Handbag /></el-icon>
          <div class="label">穿搭记录</div>
          <div class="value">{{ data.overview?.outfitCount || 0 }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6">
        <div class="stat-card">
          <el-icon :size="28" color="#10b981"><MagicStick /></el-icon>
          <div class="label">养护次数</div>
          <div class="value">{{ data.overview?.maintenanceCount || 0 }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6">
        <div class="stat-card">
          <el-icon :size="28" color="#f59e0b"><Tools /></el-icon>
          <div class="label">维修花费</div>
          <div class="value">¥{{ (data.overview?.totalRepairCost || 0).toFixed(0) }}</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :xs="24" :md="12" style="margin-bottom: 16px">
        <el-card class="card chart-card" shadow="never">
          <div class="card-header">
            <h3><el-icon color="#a855f7"><PieChart /></el-icon> 各材质佩戴频次</h3>
          </div>
          <div ref="materialChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12" style="margin-bottom: 16px">
        <el-card class="card chart-card" shadow="never">
          <div class="card-header">
            <h3><el-icon color="#ef4444"><Warning /></el-icon> 常见问题分布</h3>
          </div>
          <div ref="problemChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12" style="margin-bottom: 16px">
        <el-card class="card chart-card" shadow="never">
          <div class="card-header">
            <h3><el-icon color="#06b6d4"><TrendCharts /></el-icon> 高频穿搭标签 TOP10</h3>
          </div>
          <div ref="comboChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12" style="margin-bottom: 16px">
        <el-card class="card idle-card" shadow="never">
          <div class="card-header">
            <h3><el-icon color="#f59e0b"><Bell /></el-icon> 长期闲置首饰</h3>
            <el-tag type="warning" effect="light" size="small">
              {{ idleDays }}天未佩戴
            </el-tag>
          </div>
          <div v-if="data.longIdleJewelry?.length > 0" class="idle-list">
            <div
              v-for="item in data.longIdleJewelry"
              :key="item.id"
              class="idle-item"
            >
              <div class="idle-icon">
                <el-icon :size="20" color="#f59e0b"><Present /></el-icon>
              </div>
              <div class="idle-info">
                <div class="idle-name">
                  {{ item.name }}
                  <el-tag size="small" effect="plain">{{ item.material }}</el-tag>
                </div>
                <div class="idle-meta">
                  <span v-if="item.lastWearDate">上次佩戴: {{ formatDate(item.lastWearDate) }}</span>
                  <span v-else>从未佩戴</span>
                  <span> · 共{{ item.totalWears }}次佩戴</span>
                </div>
              </div>
              <div class="idle-days">
                <div class="days-num">{{ item.idleDays }}</div>
                <div class="days-text">天未戴</div>
              </div>
            </div>
          </div>
          <el-empty v-else description="太棒了，暂无闲置首饰！" :image-size="80" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import * as echarts from 'echarts';
import {
  Present,
  Handbag,
  MagicStick,
  Tools,
  PieChart,
  Warning,
  TrendCharts,
  Bell,
} from '@element-plus/icons-vue';
import { statsApi } from '@/api';
import type { AllStats } from '@/types';

const idleDays = ref(30);
const data = reactive<Partial<AllStats>>({});

const materialChartRef = ref<HTMLElement>();
const problemChartRef = ref<HTMLElement>();
const comboChartRef = ref<HTMLElement>();

let materialChart: echarts.ECharts | null = null;
let problemChart: echarts.ECharts | null = null;
let comboChart: echarts.ECharts | null = null;

const purplePalette = ['#a855f7', '#c084fc', '#e879f9', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'];

const loadData = async () => {
  const res = await statsApi.all(idleDays.value);
  Object.assign(data, res);
  await nextTick();
  renderCharts();
};

const renderCharts = () => {
  renderMaterialChart();
  renderProblemChart();
  renderComboChart();
};

const renderMaterialChart = () => {
  if (!materialChartRef.value) return;
  if (!materialChart) {
    materialChart = echarts.init(materialChartRef.value);
  }
  const items = data.materialWearFrequency || [];
  materialChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}次 ({d}%)',
    },
    legend: {
      bottom: 0,
      left: 'center',
      icon: 'circle',
      textStyle: { color: '#6b4c8a' },
    },
    color: purplePalette,
    series: [
      {
        name: '佩戴频次',
        type: 'pie',
        radius: ['40%', '68%'],
        center: ['50%', '42%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}\n{c}次',
          color: '#4c1d95',
          fontSize: 12,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(168, 85, 247, 0.3)',
          },
        },
        data: items.length > 0
          ? items.map((i) => ({ name: i.material, value: i.count }))
          : [{ name: '暂无数据', value: 1, itemStyle: { color: '#e5e7eb' }, label: { show: false } }],
      },
    ],
  });
};

const renderProblemChart = () => {
  if (!problemChartRef.value) return;
  if (!problemChart) {
    problemChart = echarts.init(problemChartRef.value);
  }
  const items = data.problemDistribution || [];
  const problemColors = ['#ef4444', '#f59e0b', '#f97316', '#dc2626', '#ea580c', '#eab308', '#facc15', '#fbbf24'];
  problemChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '8%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: items.length > 0 ? items.map((i) => i.problem) : ['暂无数据'],
      axisLabel: { color: '#6b4c8a', interval: 0, rotate: items.length > 4 ? 20 : 0 },
      axisLine: { lineStyle: { color: '#e9d5ff' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#6b4c8a' },
      splitLine: { lineStyle: { color: '#f3e8ff', type: 'dashed' } },
    },
    series: [
      {
        name: '发生次数',
        type: 'bar',
        barWidth: '50%',
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: (params: any) => problemColors[params.dataIndex % problemColors.length],
        },
        label: {
          show: true,
          position: 'top',
          color: '#4c1d95',
          fontWeight: 'bold',
        },
        data: items.length > 0 ? items.map((i) => i.count) : [0],
      },
    ],
  });
};

const renderComboChart = () => {
  if (!comboChartRef.value) return;
  if (!comboChart) {
    comboChart = echarts.init(comboChartRef.value);
  }
  const items = (data.topOutfitCombinations || []).slice(0, 10);
  const names = items.map((i) => i.tag).reverse();
  const counts = items.map((i) => i.count).reverse();
  comboChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#6b4c8a' },
      splitLine: { lineStyle: { color: '#f3e8ff', type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: names.length > 0 ? names : ['暂无数据'],
      axisLabel: { color: '#4c1d95', fontWeight: 500 },
      axisLine: { lineStyle: { color: '#e9d5ff' } },
    },
    series: [
      {
        name: '使用次数',
        type: 'bar',
        barWidth: '60%',
        itemStyle: {
          borderRadius: [0, 6, 6, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#c084fc' },
            { offset: 1, color: '#06b6d4' },
          ]),
        },
        label: {
          show: true,
          position: 'right',
          color: '#4c1d95',
          fontWeight: 'bold',
        },
        data: counts.length > 0 ? counts : [0],
      },
    ],
  });
};

const formatDate = (d: string) => d?.split('T')[0] || '';

const handleResize = () => {
  materialChart?.resize();
  problemChart?.resize();
  comboChart?.resize();
};

onMounted(async () => {
  await loadData();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  materialChart?.dispose();
  problemChart?.dispose();
  comboChart?.dispose();
});
</script>

<style scoped>
.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-group .label {
  font-size: 14px;
  color: #6b4c8a;
}

.stat-card {
  padding: 20px;
  text-align: center;
}

.stat-card .el-icon {
  margin-bottom: 8px;
}

.stat-card .label {
  font-size: 14px;
  color: #7c3aed;
  margin-bottom: 8px;
}

.stat-card .value {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary-dark);
}

.chart-card {
  height: 380px;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3e8ff;
}

.card-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #4c1d95;
  margin: 0;
}

.chart-box {
  flex: 1;
  min-height: 280px;
  width: 100%;
}

.idle-card {
  height: 380px;
  display: flex;
  flex-direction: column;
}

.idle-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.idle-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(135deg, #faf5ff, #fff);
  border: 1px solid #e9d5ff;
  border-radius: 10px;
  margin-bottom: 10px;
  transition: all 0.2s;
}

.idle-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.12);
}

.idle-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.idle-info {
  flex: 1;
  min-width: 0;
}

.idle-name {
  font-weight: 600;
  color: #4c1d95;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.idle-meta {
  font-size: 12px;
  color: #8b5cf6;
}

.idle-days {
  text-align: center;
  flex-shrink: 0;
}

.days-num {
  font-size: 22px;
  font-weight: 700;
  color: #f59e0b;
  line-height: 1;
}

.days-text {
  font-size: 11px;
  color: #92400e;
  margin-top: 2px;
}
</style>

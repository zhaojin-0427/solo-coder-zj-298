<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">首饰档案</h1>
      <el-button type="primary" @click="openDialog()" :icon="Plus">新增首饰</el-button>
    </div>

    <el-row :gutter="16">
      <el-col
        v-for="item in jewelryList"
        :key="item.id"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
        style="margin-bottom: 16px"
      >
        <div class="card jewelry-card" @click="showDetail(item)">
          <div v-if="item.lendings && item.lendings.length > 0" class="lending-badge">
            <el-tag type="danger" effect="dark" size="small" round>
              {{ item.lendings[0].status === '逾期未还' ? '逾期未还' : '已借出' }}
            </el-tag>
          </div>
          <div class="jewelry-avatar">
            <el-icon :size="36" color="#a855f7"><Present /></el-icon>
          </div>
          <h3 class="jewelry-name">{{ item.name }}</h3>
          <div class="jewelry-meta">
            <el-tag size="small" effect="light">{{ item.material }}</el-tag>
            <el-tag size="small" type="warning" effect="light">{{ item.color }}</el-tag>
            <el-tag
              size="small"
              :type="getRiskTagType(getJewelryRisk(item).level)"
              effect="dark"
              class="risk-tag"
            >
              {{ getRiskLevelInfo(getJewelryRisk(item).level).icon }} {{ getJewelryRisk(item).levelText }}
            </el-tag>
          </div>
          <p class="jewelry-info">
            <el-icon><Location /></el-icon>
            <span>{{ item.storageLocation }}</span>
          </p>
          <p class="jewelry-info">
            <el-icon><Calendar /></el-icon>
            <span>{{ formatDate(item.purchaseDate) }}</span>
          </p>
          <div v-if="item.lendings && item.lendings.length > 0" class="jewelry-lending-info">
            <el-icon color="#ef4444"><User /></el-icon>
            <span>借用人: {{ item.lendings[0].borrowerName }}</span>
            <span class="lending-return-date">预计 {{ formatDate(item.lendings[0].expectedReturnDate) }} 归还</span>
          </div>
          <div class="jewelry-stats">
            <span>{{ item._count?.outfits || 0 }}次佩戴</span>
            <span>{{ item._count?.maintenances || 0 }}次养护</span>
            <span>{{ item._count?.repairs || 0 }}次维修</span>
          </div>
          <div class="jewelry-actions">
            <el-button size="small" @click.stop="openDialog(item)">编辑</el-button>
            <el-button
              size="small"
              type="danger"
              :icon="Delete"
              @click.stop="handleDelete(item)"
            >删除</el-button>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-empty v-if="jewelryList.length === 0" description="暂无首饰，点击右上角添加" />

    <el-dialog v-model="dialogVisible" :title="editingItem ? '编辑首饰' : '新增首饰'" width="560px">
      <el-form :model="formData" label-width="100px" ref="formRef">
        <div class="form-section-title">基本信息</div>
        <el-form-item label="首饰名称" prop="name" :rules="[{ required: true, message: '请输入名称' }]">
          <el-input v-model="formData.name" placeholder="如：心形项链" />
        </el-form-item>
        <el-form-item label="材质" prop="material" :rules="[{ required: true, message: '请选择材质' }]">
          <el-select v-model="formData.material" placeholder="选择材质" style="width: 100%">
            <el-option label="黄金" value="黄金" />
            <el-option label="白银" value="白银" />
            <el-option label="铂金" value="铂金" />
            <el-option label="玫瑰金" value="玫瑰金" />
            <el-option label="不锈钢" value="不锈钢" />
            <el-option label="珍珠" value="珍珠" />
            <el-option label="水晶" value="水晶" />
            <el-option label="合金" value="合金" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="颜色" prop="color" :rules="[{ required: true, message: '请输入颜色' }]">
          <el-input v-model="formData.color" placeholder="如：金色" />
        </el-form-item>
        <div class="form-section-title">详细信息</div>
        <el-form-item label="购买时间" prop="purchaseDate" :rules="[{ required: true, message: '请选择日期' }]">
          <el-date-picker v-model="formData.purchaseDate" type="date" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="收纳位置" prop="storageLocation" :rules="[{ required: true }]">
          <el-input v-model="formData.storageLocation" placeholder="如：首饰盒A格" />
        </el-form-item>
        <el-form-item label="适配场景" prop="suitableScenarios" :rules="[{ required: true }]">
          <el-select
            v-model="formData.suitableScenarios"
            multiple
            filterable
            allow-create
            default-first-option
            style="width: 100%"
            placeholder="选择或输入场景"
          >
            <el-option label="日常通勤" value="日常通勤" />
            <el-option label="约会" value="约会" />
            <el-option label="婚礼宴会" value="婚礼宴会" />
            <el-option label="商务场合" value="商务场合" />
            <el-option label="派对" value="派对" />
            <el-option label="旅行" value="旅行" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" title="首饰详情" size="560px">
      <template v-if="currentDetail">
        <div class="detail-header">
          <h2>{{ currentDetail.name }}</h2>
          <el-tag
            v-if="currentRisk"
            :type="getRiskTagType(currentRisk.level)"
            effect="dark"
            size="large"
            class="detail-risk-tag"
          >
            {{ getRiskLevelInfo(currentRisk.level).icon }} {{ currentRisk.levelText }} · {{ currentRisk.score }}分
          </el-tag>
        </div>
        <el-descriptions :column="1" border style="margin-top: 16px">
          <el-descriptions-item label="材质">{{ currentDetail.material }}</el-descriptions-item>
          <el-descriptions-item label="颜色">{{ currentDetail.color }}</el-descriptions-item>
          <el-descriptions-item label="购买时间">{{ formatDate(currentDetail.purchaseDate) }}</el-descriptions-item>
          <el-descriptions-item label="收纳位置">{{ currentDetail.storageLocation }}</el-descriptions-item>
          <el-descriptions-item label="适配场景">{{ currentDetail.suitableScenarios }}</el-descriptions-item>
          <el-descriptions-item label="借出状态">
            <template v-if="currentDetail.lendings && currentDetail.lendings.length > 0">
              <el-tag :type="currentDetail.lendings[0].status === '逾期未还' ? 'danger' : 'warning'" effect="dark">
                {{ currentDetail.lendings[0].status }}
              </el-tag>
              <span style="margin-left: 8px; color: #6b4c8a">
                借用人: {{ currentDetail.lendings[0].borrowerName }} | 预计归还: {{ formatDate(currentDetail.lendings[0].expectedReturnDate) }}
              </span>
            </template>
            <el-tag v-else type="success" effect="light">在库</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="currentRisk" class="risk-section">
          <h3 class="form-section-title">
            <el-icon color="#f59e0b"><Warning /></el-icon> 风险评估
          </h3>
          <div class="risk-score-bar">
            <div class="risk-score-fill" :style="{ width: Math.min(currentRisk.score, 100) + '%' }" :class="'risk-' + currentRisk.level"></div>
            <span class="risk-score-text">{{ currentRisk.score }} / 100</span>
          </div>
          <div v-if="currentRisk.factors.length > 0" class="risk-factors">
            <h4>风险因素</h4>
            <div v-for="factor in currentRisk.factors" :key="factor.type" class="risk-factor-item">
              <span class="factor-score">+{{ factor.score }}</span>
              <span class="factor-desc">{{ factor.description }}</span>
            </div>
          </div>
          <div v-else class="risk-no-factors">
            <el-icon color="#10b981"><CircleCheck /></el-icon>
            <span>暂无风险因素</span>
          </div>
        </div>

        <div v-if="currentRisk && currentRisk.reminders.length > 0" class="reminder-section">
          <h3 class="form-section-title">
            <el-icon color="#ef4444"><Bell /></el-icon> 提醒事项
          </h3>
          <div class="reminder-list">
            <div v-for="(reminder, idx) in currentRisk.reminders" :key="idx" class="reminder-item">
              {{ reminder }}
            </div>
          </div>
        </div>

        <h3 style="margin-top: 24px" class="form-section-title">最近佩戴记录</h3>
        <el-table :data="currentDetail.outfits || []" size="small" empty-text="暂无佩戴记录">
          <el-table-column label="佩戴日期" prop="wearDate">
            <template #default="{ row }">{{ formatDate(row.wearDate) }}</template>
          </el-table-column>
          <el-table-column label="穿搭" prop="outfitTags" />
          <el-table-column label="清洁" prop="cleanStatus" width="80" />
        </el-table>

        <h3 style="margin-top: 24px" class="form-section-title">最近养护记录</h3>
        <el-table :data="currentDetail.maintenances || []" size="small" empty-text="暂无养护记录">
          <el-table-column label="日期" prop="date">
            <template #default="{ row }">{{ formatDate(row.date) }}</template>
          </el-table-column>
          <el-table-column label="类型" prop="type" width="100" />
          <el-table-column label="描述" prop="description" />
        </el-table>

        <h3 style="margin-top: 24px" class="form-section-title">最近维修记录</h3>
        <el-table :data="currentDetail.repairs || []" size="small" empty-text="暂无维修记录">
          <el-table-column label="送修日期" prop="sendDate">
            <template #default="{ row }">{{ formatDate(row.sendDate) }}</template>
          </el-table-column>
          <el-table-column label="问题" prop="problemType" width="100" />
          <el-table-column label="状态" prop="status" width="80" />
        </el-table>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Plus, Delete, Present, Location, Calendar, Warning, Bell, CircleCheck, User } from '@element-plus/icons-vue';
import { jewelryApi } from '@/api';
import type { Jewelry, RiskAssessment } from '@/types';
import { calculateRiskLocally, getRiskLevelInfo, getRiskTagType } from '@/utils/risk';

const jewelryList = ref<Jewelry[]>([]);
const dialogVisible = ref(false);
const detailVisible = ref(false);
const editingItem = ref<Jewelry | null>(null);
const currentDetail = ref<Jewelry | null>(null);
const currentRisk = ref<RiskAssessment | null>(null);
const formRef = ref<FormInstance>();

const riskMap = ref<Map<number, RiskAssessment>>(new Map());

const getJewelryRisk = (jewelry: Jewelry) => {
  return riskMap.value.get(jewelry.id) || calculateRiskLocally(jewelry);
};

const loadRiskAssessments = async () => {
  try {
    const risks = await jewelryApi.getAllRisk();
    const map = new Map<number, RiskAssessment>();
    risks.forEach((r) => map.set(r.jewelryId, r));
    riskMap.value = map;
  } catch (e) {
    console.error('加载风险评估失败', e);
  }
};

const formData = reactive({
  name: '',
  material: '',
  color: '',
  purchaseDate: '',
  storageLocation: '',
  suitableScenarios: [] as string[],
});

const loadList = async () => {
  jewelryList.value = await jewelryApi.list();
  await loadRiskAssessments();
};

const openDialog = (item?: Jewelry) => {
  editingItem.value = item || null;
  if (item) {
    Object.assign(formData, {
      name: item.name,
      material: item.material,
      color: item.color,
      purchaseDate: item.purchaseDate?.split('T')[0] || '',
      storageLocation: item.storageLocation,
      suitableScenarios: item.suitableScenarios
        ? item.suitableScenarios.split(/[、,，]/).map((s: string) => s.trim()).filter((s: string) => s.length > 0)
        : [],
    });
  } else {
    Object.assign(formData, {
      name: '',
      material: '',
      color: '',
      purchaseDate: '',
      storageLocation: '',
      suitableScenarios: [],
    });
  }
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  await formRef.value?.validate();
  const data: any = {
    name: formData.name,
    material: formData.material,
    color: formData.color,
    purchaseDate: formData.purchaseDate,
    storageLocation: formData.storageLocation,
    suitableScenarios: Array.isArray(formData.suitableScenarios)
      ? formData.suitableScenarios.join('、')
      : formData.suitableScenarios,
  };
  if (editingItem.value) {
    await jewelryApi.update(editingItem.value.id, data);
    ElMessage.success('更新成功');
  } else {
    await jewelryApi.create(data);
    ElMessage.success('创建成功');
  }
  dialogVisible.value = false;
  loadList();
};

const handleDelete = async (item: Jewelry) => {
  try {
    await ElMessageBox.confirm(`确定删除「${item.name}」吗？`, '提示', { type: 'warning' });
    await jewelryApi.delete(item.id);
    ElMessage.success('删除成功');
    loadList();
  } catch {}
};

const showDetail = async (item: Jewelry) => {
  currentDetail.value = await jewelryApi.detail(item.id);
  try {
    currentRisk.value = await jewelryApi.getRisk(item.id);
  } catch (e) {
    currentRisk.value = null;
  }
  detailVisible.value = true;
};

const formatDate = (d: string) => d?.split('T')[0] || '';

onMounted(loadList);
</script>

<style scoped>
.jewelry-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
}
.jewelry-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(168, 85, 247, 0.15);
}
.lending-badge {
  position: absolute;
  top: 12px;
  right: 12px;
}
.jewelry-lending-info {
  font-size: 12px;
  color: #ef4444;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #fef2f2;
  border-radius: 4px;
}
.lending-return-date {
  color: #9ca3af;
  margin-left: 4px;
}
.jewelry-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e9d5ff, #c084fc);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}
.jewelry-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #4c1d95;
}
.jewelry-meta {
  margin-bottom: 12px;
}
.jewelry-info {
  font-size: 13px;
  color: #6b4c8a;
  margin: 4px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}
.jewelry-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #8b5cf6;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f3e8ff;
}
.jewelry-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.risk-tag {
  margin-top: 6px;
  font-weight: 600;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-header h2 {
  margin: 0;
}

.detail-risk-tag {
  font-size: 14px;
  padding: 6px 12px;
}

.risk-section,
.reminder-section {
  margin-top: 24px;
}

.risk-score-bar {
  position: relative;
  height: 28px;
  background: #f3e8ff;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 16px;
}

.risk-score-fill {
  height: 100%;
  border-radius: 14px;
  transition: width 0.5s ease;
}

.risk-score-fill.risk-low {
  background: linear-gradient(90deg, #34d399, #10b981);
}

.risk-score-fill.risk-medium {
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
}

.risk-score-fill.risk-high {
  background: linear-gradient(90deg, #fb923c, #f97316);
}

.risk-score-fill.risk-critical {
  background: linear-gradient(90deg, #f87171, #ef4444);
}

.risk-score-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: 700;
  color: #4c1d95;
  font-size: 13px;
}

.risk-factors h4 {
  font-size: 14px;
  color: #6b4c8a;
  margin-bottom: 10px;
}

.risk-factor-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #faf5ff;
  border-radius: 8px;
  margin-bottom: 8px;
}

.factor-score {
  background: linear-gradient(135deg, #c084fc, #a855f7);
  color: white;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  flex-shrink: 0;
}

.factor-desc {
  font-size: 13px;
  color: #4c1d95;
}

.risk-no-factors {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  background: #f0fdf4;
  border-radius: 8px;
  color: #166534;
  font-size: 14px;
}

.reminder-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reminder-item {
  padding: 12px 16px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-left: 4px solid #f59e0b;
  border-radius: 8px;
  font-size: 13px;
  color: #92400e;
  line-height: 1.6;
}
</style>

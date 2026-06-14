<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">维修追踪</h1>
      <el-button type="primary" @click="openDialog()" :icon="Plus">登记送修</el-button>
    </div>

    <el-card class="card filter-card" shadow="never">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="首饰筛选">
          <el-select
            v-model="filterForm.jewelryId"
            placeholder="全部首饰"
            clearable
            style="width: 200px"
            @change="loadList"
          >
            <el-option
              v-for="j in jewelryList"
              :key="j.id"
              :label="j.name"
              :value="j.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="维修状态">
          <el-select
            v-model="filterForm.status"
            placeholder="全部状态"
            clearable
            style="width: 160px"
            @change="loadList"
          >
            <el-option label="维修中" value="维修中" />
            <el-option label="已完成" value="已完成" />
            <el-option label="待取件" value="待取件" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col
        v-for="item in repairList"
        :key="item.id"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
        style="margin-bottom: 16px"
      >
        <el-card class="card repair-card" shadow="hover">
          <div class="repair-status-bar" :class="statusClass(item.status)">
            <el-tag :type="statusType(item.status)" effect="dark" size="large" round>
              {{ item.status }}
            </el-tag>
            <span class="repair-cost">¥{{ item.cost.toFixed(2) }}</span>
          </div>
          <h3 class="repair-jewelry-name">
            <el-icon :size="18" color="#a855f7"><Present /></el-icon>
            {{ item.jewelry?.name }}
          </h3>
          <div class="repair-problem">
            <el-tag type="danger" effect="light" size="small">
              {{ item.problemType }}
            </el-tag>
          </div>
          <div class="repair-info">
            <div class="info-row">
              <span class="label">送修日期</span>
              <span>{{ formatDate(item.sendDate) }}</span>
            </div>
            <div class="info-row">
              <span class="label">取件日期</span>
              <span :class="{ muted: !item.returnDate }">
                {{ item.returnDate ? formatDate(item.returnDate) : '待取件' }}
              </span>
            </div>
            <div class="info-row">
              <span class="label">维修项目</span>
              <span class="items-text">{{ item.repairItems }}</span>
            </div>
          </div>
          <div v-if="item.notes" class="repair-notes">
            <span>📝 {{ item.notes }}</span>
          </div>
          <div
            v-if="getInsuranceRiskWarning(jewelryList.find(j => j.id === item.jewelryId)!).hasRisk"
            class="repair-insurance-warning"
          >
            <el-icon color="#f59e0b" :size="14"><Warning /></el-icon>
            <span>{{ getInsuranceRiskWarning(jewelryList.find(j => j.id === item.jewelryId)!).warnings[0] }}</span>
          </div>
          <div class="repair-actions">
            <el-button size="small" @click="openEditDialog(item)" v-if="item.status !== '已完成'">
              更新状态
            </el-button>
            <el-button
              size="small"
              type="danger"
              :icon="Delete"
              @click="handleDelete(item)"
            >删除</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-empty
      v-if="repairList.length === 0"
      description="暂无维修记录，点击右上角登记送修"
      style="margin-top: 80px"
    />

    <el-dialog
      v-model="dialogVisible"
      :title="editingItem ? '更新维修状态' : '登记送修'"
      width="580px"
    >
      <el-form :model="formData" label-width="100px" ref="formRef">
        <template v-if="!editingItem">
          <div class="form-section-title">基本信息</div>
          <el-form-item label="选择首饰" prop="jewelryId" :rules="[{ required: true, message: '请选择首饰' }]">
            <el-select v-model="formData.jewelryId" placeholder="选择首饰" style="width: 100%">
              <el-option
                v-for="j in jewelryList"
                :key="j.id"
                :label="`${j.name} (${j.material})`"
                :value="j.id"
                :disabled="isLentOut(j)"
              />
            </el-select>
            <div v-if="formData.jewelryId && isLentOutById(formData.jewelryId)" class="lending-warning">
              <el-icon color="#ef4444"><Warning /></el-icon>
              <span>该首饰当前已被借出，需等归还后再送修</span>
            </div>
          </el-form-item>
          <div class="form-section-title">维修详情</div>
          <el-form-item label="问题类型" prop="problemType" :rules="[{ required: true, message: '请选择问题类型' }]">
            <el-select v-model="formData.problemType" placeholder="选择问题类型" style="width: 100%">
              <el-option label="氧化" value="氧化" />
              <el-option label="断链" value="断链" />
              <el-option label="掉钻" value="掉钻" />
              <el-option label="变形" value="变形" />
              <el-option label="划痕" value="划痕" />
              <el-option label="变色" value="变色" />
              <el-option label="松动" value="松动" />
              <el-option label="断裂" value="断裂" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
          <el-form-item label="送修日期" prop="sendDate" :rules="[{ required: true, message: '请选择日期' }]">
            <el-date-picker
              v-model="formData.sendDate"
              type="date"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item label="维修项目" prop="repairItems" :rules="[{ required: true, message: '请输入维修项目' }]">
            <el-input
              v-model="formData.repairItems"
              type="textarea"
              :rows="2"
              placeholder="如：焊接链条、补钻、抛光等"
            />
          </el-form-item>
          <el-form-item label="维修花费" prop="cost" :rules="[{ required: true, message: '请输入花费' }]">
            <el-input-number
              v-model="formData.cost"
              :min="0"
              :precision="2"
              :step="10"
              style="width: 100%"
              controls-position="right"
            />
          </el-form-item>
        </template>
        <el-form-item label="当前状态" prop="status" :rules="[{ required: true, message: '请选择状态' }]">
          <el-select v-model="formData.status" placeholder="选择状态" style="width: 100%">
            <el-option label="维修中" value="维修中" />
            <el-option label="待取件" value="待取件" />
            <el-option label="已完成" value="已完成" />
          </el-select>
        </el-form-item>
        <el-form-item
          label="取件日期"
          v-if="formData.status !== '维修中'"
          prop="returnDate"
          :rules="formData.status === '已完成' ? [{ required: true, message: '维修已完成时取件日期为必填项' }] : []"
        >
          <el-date-picker
            v-model="formData.returnDate"
            type="date"
            style="width: 100%"
            value-format="YYYY-MM-DD"
            :placeholder="formData.status === '已完成' ? '请选择取件日期（必填）' : '请选择取件日期（可选）'"
          />
          <div v-if="formData.status === '已完成'" class="required-hint">
            ⚠️ 维修标记为已完成时必须填写取件日期
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="formData.notes"
            type="textarea"
            :rows="2"
            placeholder="可选：维修店铺名称、联系方式等"
          />
        </el-form-item>
      </el-form>
      <el-alert
        v-if="repairInsuranceRisk.hasRisk"
        type="warning"
        :closable="false"
        style="margin-top: 12px"
      >
        <template #title>保险与估值风险提醒</template>
        <div v-for="w in repairInsuranceRisk.warnings" :key="w" style="font-size: 13px; line-height: 1.6">
          ⚠️ {{ w }}
        </div>
      </el-alert>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus';
import { Plus, Delete, Present, Warning } from '@element-plus/icons-vue';
import { repairApi, jewelryApi } from '@/api';
import { getInsuranceRiskWarning } from '@/utils/risk';
import type { Repair, Jewelry } from '@/types';

const repairList = ref<Repair[]>([]);
const jewelryList = ref<Jewelry[]>([]);
const dialogVisible = ref(false);
const editingItem = ref<Repair | null>(null);
const formRef = ref<FormInstance>();

const filterForm = reactive({
  jewelryId: undefined as number | undefined,
  status: undefined as string | undefined,
});

const formData = reactive({
  jewelryId: undefined as number | undefined,
  problemType: '',
  sendDate: new Date().toISOString().split('T')[0],
  repairItems: '',
  cost: 0,
  returnDate: '' as string | undefined,
  status: '维修中',
  notes: '',
});

const loadList = async () => {
  repairList.value = await repairApi.list(filterForm.jewelryId, filterForm.status);
};

const loadJewelry = async () => {
  jewelryList.value = await jewelryApi.list();
};

const openDialog = () => {
  editingItem.value = null;
  Object.assign(formData, {
    jewelryId: undefined,
    problemType: '',
    sendDate: new Date().toISOString().split('T')[0],
    repairItems: '',
    cost: 0,
    returnDate: undefined,
    status: '维修中',
    notes: '',
  });
  dialogVisible.value = true;
};

const openEditDialog = (item: Repair) => {
  editingItem.value = item;
  Object.assign(formData, {
    jewelryId: item.jewelryId,
    problemType: item.problemType,
    sendDate: item.sendDate?.split('T')[0],
    repairItems: item.repairItems,
    cost: item.cost,
    returnDate: item.returnDate?.split('T')[0],
    status: item.status,
    notes: item.notes || '',
  });
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (formData.status === '已完成' && !formData.returnDate) {
    ElMessage.error('维修已完成时必须填写取件日期');
    return;
  }
  await formRef.value?.validate();
  const data: any = { ...formData };
  if (editingItem.value) {
    const updateData: any = {
      status: formData.status,
      returnDate: formData.returnDate,
      notes: formData.notes,
      cost: formData.cost,
      repairItems: formData.repairItems,
    };
    await repairApi.update(editingItem.value.id, updateData);
    ElMessage.success('更新成功');
  } else {
    await repairApi.create(data);
    ElMessage.success('登记成功');
  }
  dialogVisible.value = false;
  loadList();
};

const handleDelete = async (row: Repair) => {
  try {
    await ElMessageBox.confirm('确定删除该维修记录吗？', '提示', { type: 'warning' });
    await repairApi.delete(row.id);
    ElMessage.success('删除成功');
    loadList();
  } catch {}
};

const formatDate = (d: string) => d?.split('T')[0] || '';

const statusType = (status: string) => {
  const map: Record<string, any> = {
    维修中: 'warning',
    待取件: 'primary',
    已完成: 'success',
  };
  return map[status] || 'info';
};

const statusClass = (status: string) => `status-${status}`;

const isLentOut = (j: Jewelry) => j.lendings && j.lendings.length > 0;
const isLentOutById = (id: number) => {
  const j = jewelryList.value.find((j) => j.id === id);
  return j ? isLentOut(j) : false;
};

const repairInsuranceRisk = computed(() => {
  if (!formData.jewelryId) return { hasRisk: false, warnings: [] };
  const jewelry = jewelryList.value.find((j) => j.id === formData.jewelryId);
  if (!jewelry) return { hasRisk: false, warnings: [] };
  return getInsuranceRiskWarning(jewelry);
});

onMounted(() => {
  loadList();
  loadJewelry();
});
</script>

<style scoped>
.filter-card {
  margin-bottom: 0;
}

.repair-card {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.repair-status-bar {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.repair-status-bar.status-维修中 {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
}

.repair-status-bar.status-待取件 {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
}

.repair-status-bar.status-已完成 {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
}

.repair-cost {
  font-weight: 700;
  font-size: 16px;
  color: #4c1d95;
}

.repair-jewelry-name {
  padding: 12px 16px 4px;
  font-size: 18px;
  font-weight: 600;
  color: #4c1d95;
  display: flex;
  align-items: center;
  gap: 6px;
}

.repair-problem {
  padding: 4px 16px 12px;
}

.repair-info {
  padding: 0 16px 12px;
  flex: 1;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
  border-bottom: 1px dashed #f3e8ff;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  color: #8b5cf6;
}

.items-text {
  text-align: right;
  max-width: 60%;
}

.repair-notes {
  padding: 8px 16px;
  background: #faf5ff;
  margin: 0 16px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: #6b4c8a;
}

.repair-actions {
  padding: 12px 16px;
  border-top: 1px solid #f3e8ff;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.muted {
  color: #9ca3af;
}

.required-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #f56c6c;
  background: #fef0f0;
  padding: 6px 10px;
  border-radius: 4px;
}

.lending-warning {
  margin-top: 8px;
  font-size: 12px;
  color: #f56c6c;
  background: #fef0f0;
  padding: 6px 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.repair-insurance-warning {
  margin: 0 16px 12px;
  padding: 6px 10px;
  background: #fffbeb;
  border-radius: 6px;
  font-size: 12px;
  color: #b45309;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>

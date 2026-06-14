<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">借还管理</h1>
      <el-button type="primary" @click="openLendDialog()" :icon="Plus">登记借出</el-button>
    </div>

    <el-card class="card filter-card" shadow="never">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="状态筛选">
          <el-select
            v-model="filterForm.status"
            placeholder="全部状态"
            clearable
            style="width: 160px"
            @change="loadList"
          >
            <el-option label="借出中" value="借出中" />
            <el-option label="逾期未还" value="逾期未还" />
            <el-option label="已归还" value="已归还" />
          </el-select>
        </el-form-item>
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
      </el-form>
    </el-card>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col
        v-for="item in lendingList"
        :key="item.id"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
        style="margin-bottom: 16px"
      >
        <el-card class="card lending-card" shadow="hover">
          <div class="lending-status-bar" :class="'status-' + statusClass(item.status)">
            <el-tag :type="statusType(item.status)" effect="dark" size="large" round>
              {{ item.status }}
            </el-tag>
            <span class="lending-deposit">押金 ¥{{ item.deposit.toFixed(2) }}</span>
          </div>
          <h3 class="lending-jewelry-name">
            <el-icon :size="18" color="#a855f7"><Present /></el-icon>
            {{ item.jewelry?.name }}
          </h3>
          <div class="lending-borrower">
            <el-icon><User /></el-icon>
            <span>{{ item.borrowerName }}</span>
            <span class="borrower-contact">{{ item.borrowerContact }}</span>
          </div>
          <div class="lending-info">
            <div class="info-row">
              <span class="label">借出日期</span>
              <span>{{ formatDate(item.lendDate) }}</span>
            </div>
            <div class="info-row">
              <span class="label">预计归还</span>
              <span :class="{ 'overdue-text': isOverdue(item) }">
                {{ formatDate(item.expectedReturnDate) }}
                <el-tag v-if="isOverdue(item)" type="danger" size="small" effect="dark" style="margin-left: 4px">
                  逾期{{ overdueDays(item) }}天
                </el-tag>
              </span>
            </div>
            <div class="info-row">
              <span class="label">借出用途</span>
              <span class="purpose-text">{{ item.purpose }}</span>
            </div>
          </div>
          <div v-if="item.hasWear" class="lending-wear-warning">
            <el-icon color="#ef4444"><Warning /></el-icon>
            <span>归还时有损耗，补偿 ¥{{ item.compensationAmount.toFixed(2) }}</span>
          </div>
          <div class="lending-actions">
            <el-button
              v-if="item.status === '借出中' || item.status === '逾期未还'"
              type="success"
              size="small"
              @click="openReturnDialog(item)"
            >
              归还确认
            </el-button>
            <el-button size="small" @click="showDetail(item)">详情</el-button>
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
      v-if="lendingList.length === 0"
      description="暂无借还记录，点击右上角登记借出"
      style="margin-top: 80px"
    />

    <el-dialog v-model="lendDialogVisible" title="登记借出" width="620px">
      <el-form :model="lendForm" label-width="110px" ref="lendFormRef">
        <div class="form-section-title">首饰与借用人</div>
        <el-form-item label="选择首饰" prop="jewelryId" :rules="[{ required: true, message: '请选择首饰' }]">
          <el-select v-model="lendForm.jewelryId" placeholder="选择首饰" style="width: 100%">
            <el-option
              v-for="j in availableJewelry"
              :key="j.id"
              :label="`${j.name} (${j.material})`"
              :value="j.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="借用人姓名" prop="borrowerName" :rules="[{ required: true, message: '请输入借用人姓名' }]">
          <el-input v-model="lendForm.borrowerName" placeholder="如：张三" />
        </el-form-item>
        <el-form-item label="联系方式" prop="borrowerContact" :rules="[{ required: true, message: '请输入联系方式' }]">
          <el-input v-model="lendForm.borrowerContact" placeholder="手机号或其他联系方式" />
        </el-form-item>
        <div class="form-section-title">借出详情</div>
        <el-form-item label="借出日期" prop="lendDate" :rules="[{ required: true, message: '请选择借出日期' }]">
          <el-date-picker
            v-model="lendForm.lendDate"
            type="date"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="预计归还" prop="expectedReturnDate" :rules="[{ required: true, message: '请选择预计归还日期' }]">
          <el-date-picker
            v-model="lendForm.expectedReturnDate"
            type="date"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="借出用途" prop="purpose" :rules="[{ required: true, message: '请输入借出用途' }]">
          <el-input v-model="lendForm.purpose" type="textarea" :rows="2" placeholder="如：参加婚礼、演出等" />
        </el-form-item>
        <el-form-item label="押金金额">
          <el-input-number
            v-model="lendForm.deposit"
            :min="0"
            :precision="2"
            :step="100"
            style="width: 100%"
            controls-position="right"
          />
        </el-form-item>
        <div class="form-section-title">借出前状态</div>
        <el-form-item label="状态描述" prop="conditionBeforeLend" :rules="[{ required: true, message: '请描述借出前状态' }]">
          <el-input
            v-model="lendForm.conditionBeforeLend"
            type="textarea"
            :rows="3"
            placeholder="描述首饰借出前的状态，如完好无损、有轻微划痕等"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="lendForm.notes"
            type="textarea"
            :rows="2"
            placeholder="可选：其他需要记录的信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="lendDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleLendSubmit">确认借出</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="returnDialogVisible" title="归还确认" width="620px">
      <el-form :model="returnForm" label-width="110px" ref="returnFormRef">
        <div class="form-section-title">归还信息</div>
        <el-form-item label="归还日期">
          <el-date-picker
            v-model="returnForm.actualReturnDate"
            type="date"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="归还时状态" prop="returnCondition" :rules="[{ required: true, message: '请描述归还时状态' }]">
          <el-input
            v-model="returnForm.returnCondition"
            type="textarea"
            :rows="3"
            placeholder="描述首饰归还时的状态"
          />
        </el-form-item>
        <div class="form-section-title">损耗评估</div>
        <el-form-item label="是否产生损耗">
          <el-switch v-model="returnForm.hasWear" />
          <span v-if="returnForm.hasWear" style="color: #f56c6c; margin-left: 10px">
            ⚠️ 归还首饰存在损耗
          </span>
        </el-form-item>
        <el-form-item v-if="returnForm.hasWear" label="补偿金额">
          <el-input-number
            v-model="returnForm.compensationAmount"
            :min="0"
            :precision="2"
            :step="50"
            style="width: 100%"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="returnForm.notes"
            type="textarea"
            :rows="2"
            placeholder="可选：其他需要记录的信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="returnDialogVisible = false">取消</el-button>
        <el-button type="success" @click="handleReturnSubmit">确认归还</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" title="借还详情" size="560px">
      <template v-if="currentDetail">
        <div class="detail-header">
          <h2>{{ currentDetail.jewelry?.name }}</h2>
          <el-tag :type="statusType(currentDetail.status)" effect="dark" size="large">
            {{ currentDetail.status }}
          </el-tag>
        </div>
        <el-descriptions :column="1" border style="margin-top: 16px">
          <el-descriptions-item label="借用人">{{ currentDetail.borrowerName }}</el-descriptions-item>
          <el-descriptions-item label="联系方式">{{ currentDetail.borrowerContact }}</el-descriptions-item>
          <el-descriptions-item label="借出日期">{{ formatDate(currentDetail.lendDate) }}</el-descriptions-item>
          <el-descriptions-item label="预计归还">{{ formatDate(currentDetail.expectedReturnDate) }}</el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.actualReturnDate" label="实际归还">
            {{ formatDate(currentDetail.actualReturnDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="借出用途">{{ currentDetail.purpose }}</el-descriptions-item>
          <el-descriptions-item label="押金金额">¥{{ currentDetail.deposit.toFixed(2) }}</el-descriptions-item>
        </el-descriptions>

        <h3 style="margin-top: 24px" class="form-section-title">状态记录</h3>
        <div class="condition-block">
          <h4>借出前状态</h4>
          <p>{{ currentDetail.conditionBeforeLend }}</p>
        </div>
        <div v-if="currentDetail.returnCondition" class="condition-block">
          <h4>归还时状态</h4>
          <p>{{ currentDetail.returnCondition }}</p>
        </div>

        <div v-if="currentDetail.hasWear" class="wear-result-block">
          <el-icon color="#ef4444" :size="20"><Warning /></el-icon>
          <div>
            <h4>产生损耗</h4>
            <p>补偿金额：¥{{ currentDetail.compensationAmount.toFixed(2) }}</p>
          </div>
        </div>

        <div v-if="currentDetail.notes" class="condition-block">
          <h4>备注</h4>
          <p>{{ currentDetail.notes }}</p>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus';
import { Plus, Delete, Present, User, Warning } from '@element-plus/icons-vue';
import { lendingApi, jewelryApi } from '@/api';
import type { Lending, Jewelry } from '@/types';

const lendingList = ref<Lending[]>([]);
const jewelryList = ref<Jewelry[]>([]);
const lendDialogVisible = ref(false);
const returnDialogVisible = ref(false);
const detailVisible = ref(false);
const currentDetail = ref<Lending | null>(null);
const returningItem = ref<Lending | null>(null);
const lendFormRef = ref<FormInstance>();
const returnFormRef = ref<FormInstance>();

const filterForm = reactive({
  status: undefined as string | undefined,
  jewelryId: undefined as number | undefined,
});

const lendForm = reactive({
  jewelryId: undefined as number | undefined,
  borrowerName: '',
  borrowerContact: '',
  lendDate: new Date().toISOString().split('T')[0],
  expectedReturnDate: '',
  purpose: '',
  deposit: 0,
  conditionBeforeLend: '',
  notes: '',
});

const returnForm = reactive({
  actualReturnDate: new Date().toISOString().split('T')[0],
  returnCondition: '',
  hasWear: false,
  compensationAmount: 0,
  notes: '',
});

const availableJewelry = computed(() => {
  return jewelryList.value.filter((j) => !j.lendings || j.lendings.length === 0);
});

const loadList = async () => {
  await lendingApi.checkOverdue().catch(() => {});
  lendingList.value = await lendingApi.list({
    status: filterForm.status,
    jewelryId: filterForm.jewelryId,
  });
};

const loadJewelry = async () => {
  jewelryList.value = await jewelryApi.list();
};

const openLendDialog = () => {
  Object.assign(lendForm, {
    jewelryId: undefined,
    borrowerName: '',
    borrowerContact: '',
    lendDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: '',
    purpose: '',
    deposit: 0,
    conditionBeforeLend: '',
    notes: '',
  });
  lendDialogVisible.value = true;
};

const openReturnDialog = (item: Lending) => {
  returningItem.value = item;
  Object.assign(returnForm, {
    actualReturnDate: new Date().toISOString().split('T')[0],
    returnCondition: '',
    hasWear: false,
    compensationAmount: 0,
    notes: '',
  });
  returnDialogVisible.value = true;
};

const handleLendSubmit = async () => {
  await lendFormRef.value?.validate();
  await lendingApi.create(lendForm as any);
  ElMessage.success('借出登记成功');
  lendDialogVisible.value = false;
  loadList();
  loadJewelry();
};

const handleReturnSubmit = async () => {
  await returnFormRef.value?.validate();
  if (!returningItem.value) return;
  await lendingApi.returnJewelry(returningItem.value.id, returnForm as any);
  ElMessage.success('归还确认成功');
  returnDialogVisible.value = false;
  loadList();
  loadJewelry();
};

const handleDelete = async (item: Lending) => {
  try {
    await ElMessageBox.confirm('确定删除该借还记录吗？', '提示', { type: 'warning' });
    await lendingApi.delete(item.id);
    ElMessage.success('删除成功');
    loadList();
  } catch {}
};

const showDetail = async (item: Lending) => {
  currentDetail.value = await lendingApi.detail(item.id);
  detailVisible.value = true;
};

const formatDate = (d: string) => d?.split('T')[0] || '';

const isOverdue = (item: Lending) => {
  if (item.status === '已归还') return false;
  return new Date(item.expectedReturnDate) < new Date();
};

const overdueDays = (item: Lending) => {
  return Math.floor(
    (new Date().getTime() - new Date(item.expectedReturnDate).getTime()) / (1000 * 60 * 60 * 24),
  );
};

const statusType = (status: string) => {
  const map: Record<string, any> = {
    借出中: 'primary',
    逾期未还: 'danger',
    已归还: 'success',
  };
  return map[status] || 'info';
};

const statusClass = (status: string) => {
  const map: Record<string, string> = {
    借出中: 'lending',
    逾期未还: 'overdue',
    已归还: 'returned',
  };
  return map[status] || 'lending';
};

onMounted(() => {
  loadList();
  loadJewelry();
});
</script>

<style scoped>
.filter-card {
  margin-bottom: 0;
}

.lending-card {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.lending-status-bar {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.lending-status-bar.status-lending {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
}

.lending-status-bar.status-overdue {
  background: linear-gradient(135deg, #fef2f2, #fecaca);
}

.lending-status-bar.status-returned {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
}

.lending-deposit {
  font-weight: 700;
  font-size: 16px;
  color: #4c1d95;
}

.lending-jewelry-name {
  padding: 12px 16px 4px;
  font-size: 18px;
  font-weight: 600;
  color: #4c1d95;
  display: flex;
  align-items: center;
  gap: 6px;
}

.lending-borrower {
  padding: 4px 16px 12px;
  font-size: 14px;
  color: #6b4c8a;
  display: flex;
  align-items: center;
  gap: 6px;
}

.borrower-contact {
  color: #9ca3af;
  font-size: 12px;
  margin-left: 8px;
}

.lending-info {
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

.purpose-text {
  text-align: right;
  max-width: 60%;
}

.overdue-text {
  color: #ef4444;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.lending-wear-warning {
  padding: 8px 16px;
  background: #fef2f2;
  margin: 0 16px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: #dc2626;
  display: flex;
  align-items: center;
  gap: 6px;
}

.lending-actions {
  padding: 12px 16px;
  border-top: 1px solid #f3e8ff;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-header h2 {
  margin: 0;
}

.condition-block {
  margin-top: 12px;
}

.condition-block h4 {
  font-size: 13px;
  color: #8b5cf6;
  margin-bottom: 6px;
}

.condition-block p {
  color: #3c2a4d;
  line-height: 1.6;
  font-size: 14px;
  padding: 8px 12px;
  background: #faf5ff;
  border-radius: 6px;
}

.wear-result-block {
  margin-top: 16px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #fef2f2, #fff);
  border: 1px solid #fecaca;
  border-radius: 8px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.wear-result-block h4 {
  font-size: 14px;
  color: #dc2626;
  margin-bottom: 4px;
}

.wear-result-block p {
  font-size: 13px;
  color: #6b4c8a;
}
</style>

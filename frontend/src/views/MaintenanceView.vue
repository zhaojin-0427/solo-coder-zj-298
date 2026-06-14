<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">养护记录</h1>
      <el-button type="primary" @click="openDialog()" :icon="Plus">添加养护</el-button>
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
      </el-form>
    </el-card>

    <el-timeline style="margin-top: 24px">
      <el-timeline-item
        v-for="item in maintenanceList"
        :key="item.id"
        :timestamp="formatDate(item.date)"
        :type="timelineType(item.type)"
        placement="top"
        :icon="timelineIcon(item.type)"
      >
        <el-card class="card maintenance-card" shadow="hover">
          <div class="maintenance-header">
            <div class="maintenance-title">
              <el-tag :type="typeTagType(item.type)" effect="light" size="large">
                {{ item.type }}
              </el-tag>
              <el-tag type="primary" effect="plain" style="margin-left: 10px">
                {{ item.jewelry?.name }}
              </el-tag>
            </div>
            <el-button
              type="danger"
              link
              :icon="Delete"
              @click="handleDelete(item)"
            >删除</el-button>
          </div>
          <div class="maintenance-desc">
            <h4>养护说明</h4>
            <p>{{ item.description }}</p>
          </div>
          <div v-if="item.result" class="maintenance-result">
            <h4>养护结果</h4>
            <p>{{ item.result }}</p>
          </div>
        </el-card>
      </el-timeline-item>
    </el-timeline>

    <el-empty
      v-if="maintenanceList.length === 0"
      description="暂无养护记录，点击右上角添加"
      style="margin-top: 80px"
    />

    <el-dialog v-model="dialogVisible" title="添加养护记录" width="560px">
      <el-form :model="formData" label-width="100px" ref="formRef">
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
            <span>该首饰当前已被借出，暂无法进行养护操作</span>
          </div>
        </el-form-item>
        <el-form-item label="养护日期" prop="date" :rules="[{ required: true, message: '请选择日期' }]">
          <el-date-picker
            v-model="formData.date"
            type="date"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <div class="form-section-title">养护详情</div>
        <el-form-item label="养护类型" prop="type" :rules="[{ required: true, message: '请选择养护类型' }]">
          <el-select v-model="formData.type" placeholder="选择养护类型" style="width: 100%">
            <el-option label="擦拭清洁" value="擦拭清洁" />
            <el-option label="水洗清洁" value="水洗清洁" />
            <el-option label="专业清洗" value="专业清洗" />
            <el-option label="银饰除氧化" value="银饰除氧化" />
            <el-option label="金饰抛光" value="金饰抛光" />
            <el-option label="珠宝检查" value="珠宝检查" />
            <el-option label="加固检查" value="加固检查" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="养护描述" prop="description" :rules="[{ required: true, message: '请输入描述' }]">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="描述养护过程，如使用的工具、清洁溶液等"
          />
        </el-form-item>
        <el-form-item label="养护结果">
          <el-input
            v-model="formData.result"
            type="textarea"
            :rows="2"
            placeholder="可选：描述养护后的效果"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus';
import {
  Plus,
  Delete,
  MagicStick,
  BrushFilled,
  CircleCheck,
  Warning,
} from '@element-plus/icons-vue';
import type { Component } from 'vue';
import { maintenanceApi, jewelryApi } from '@/api';
import type { Maintenance, Jewelry } from '@/types';

const maintenanceList = ref<Maintenance[]>([]);
const jewelryList = ref<Jewelry[]>([]);
const dialogVisible = ref(false);
const formRef = ref<FormInstance>();

const filterForm = reactive({
  jewelryId: undefined as number | undefined,
});

const formData = reactive({
  jewelryId: undefined as number | undefined,
  date: new Date().toISOString().split('T')[0],
  type: '',
  description: '',
  result: '',
});

const loadList = async () => {
  maintenanceList.value = await maintenanceApi.list(filterForm.jewelryId);
};

const loadJewelry = async () => {
  jewelryList.value = await jewelryApi.list();
};

const openDialog = () => {
  Object.assign(formData, {
    jewelryId: undefined,
    date: new Date().toISOString().split('T')[0],
    type: '',
    description: '',
    result: '',
  });
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  await formRef.value?.validate();
  const data: any = { ...formData };
  await maintenanceApi.create(data);
  ElMessage.success('记录成功');
  dialogVisible.value = false;
  loadList();
};

const handleDelete = async (row: Maintenance) => {
  try {
    await ElMessageBox.confirm('确定删除该养护记录吗？', '提示', { type: 'warning' });
    await maintenanceApi.delete(row.id);
    ElMessage.success('删除成功');
    loadList();
  } catch {}
};

const formatDate = (d: string) => d?.split('T')[0] || '';

const timelineType = (type: string) => {
  const map: Record<string, string> = {
    专业清洗: 'success',
    银饰除氧化: 'warning',
    金饰抛光: 'warning',
    珠宝检查: 'primary',
    加固检查: 'danger',
  };
  return map[type] || 'primary';
};

const timelineIcon = (type: string): Component => {
  const map: Record<string, Component> = {
    专业清洗: BrushFilled,
    银饰除氧化: Warning,
    金饰抛光: Warning,
    珠宝检查: CircleCheck,
    加固检查: Warning,
  };
  return map[type] || MagicStick;
};

const typeTagType = (type: string) => {
  const map: Record<string, any> = {
    擦拭清洁: 'info',
    水洗清洁: 'success',
    专业清洗: 'success',
    银饰除氧化: 'warning',
    金饰抛光: 'warning',
    珠宝检查: 'primary',
    加固检查: 'danger',
    其他: 'info',
  };
  return map[type] || 'info';
};

const isLentOut = (j: Jewelry) => j.lendings && j.lendings.length > 0;
const isLentOutById = (id: number) => {
  const j = jewelryList.value.find((j) => j.id === id);
  return j ? isLentOut(j) : false;
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

.maintenance-card {
  margin: 8px 0;
}

.maintenance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.maintenance-title {
  display: flex;
  align-items: center;
}

.maintenance-desc,
.maintenance-result {
  margin-top: 12px;
}

.maintenance-desc h4,
.maintenance-result h4 {
  font-size: 13px;
  color: #8b5cf6;
  margin-bottom: 6px;
}

.maintenance-desc p,
.maintenance-result p {
  color: #3c2a4d;
  line-height: 1.6;
  font-size: 14px;
  padding: 8px 12px;
  background: #faf5ff;
  border-radius: 6px;
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
</style>

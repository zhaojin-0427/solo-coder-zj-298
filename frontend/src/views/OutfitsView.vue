<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">穿搭关联</h1>
      <el-button type="primary" @click="openDialog()" :icon="Plus">记录穿搭</el-button>
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

    <el-table :data="outfitList" style="margin-top: 16px" class="card" stripe>
      <el-table-column label="佩戴日期" width="140" prop="wearDate">
        <template #default="{ row }">
          <div class="date-cell">
            <el-icon :size="16" color="#a855f7"><Calendar /></el-icon>
            <span>{{ formatDate(row.wearDate) }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="首饰" width="180">
        <template #default="{ row }">
          <el-tag type="primary" effect="light">
            {{ row.jewelry?.name }}
          </el-tag>
          <span class="material-tag">{{ row.jewelry?.material }}</span>
        </template>
      </el-table-column>
      <el-table-column label="穿搭标签">
        <template #default="{ row }">
          <span
            v-for="tag in parseTags(row.outfitTags)"
            :key="tag"
            class="tag-item"
          >{{ tag }}</span>
        </template>
      </el-table-column>
      <el-table-column label="过敏" width="80">
        <template #default="{ row }">
          <el-tag v-if="row.isAllergic" type="danger" size="small">是</el-tag>
          <span v-else class="muted">否</span>
        </template>
      </el-table-column>
      <el-table-column label="掉色" width="80">
        <template #default="{ row }">
          <el-tag v-if="row.isFading" type="warning" size="small">是</el-tag>
          <span v-else class="muted">否</span>
        </template>
      </el-table-column>
      <el-table-column label="清洁情况" width="120" prop="cleanStatus">
        <template #default="{ row }">
          <el-tag :type="cleanTagType(row.cleanStatus)" size="small" effect="light">
            {{ row.cleanStatus }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="备注" show-overflow-tooltip prop="notes" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button
            type="danger"
            link
            :icon="Delete"
            @click="handleDelete(row)"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty
      v-if="outfitList.length === 0"
      description="暂无穿搭记录，点击右上角添加"
      style="margin-top: 80px"
    />

    <el-dialog v-model="dialogVisible" title="记录穿搭" width="560px">
      <el-form :model="formData" label-width="100px" ref="formRef">
        <div class="form-section-title">基本信息</div>
        <el-form-item label="选择首饰" prop="jewelryId" :rules="[{ required: true, message: '请选择首饰' }]">
          <el-select v-model="formData.jewelryId" placeholder="选择首饰" style="width: 100%">
            <el-option
              v-for="j in jewelryList"
              :key="j.id"
              :label="`${j.name} (${j.material})`"
              :value="j.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="佩戴日期" prop="wearDate" :rules="[{ required: true, message: '请选择日期' }]">
          <el-date-picker
            v-model="formData.wearDate"
            type="date"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <div class="form-section-title">穿搭与状态</div>
        <el-form-item label="穿搭标签" prop="outfitTags" :rules="[{ required: true, message: '请输入穿搭标签' }]">
          <el-select
            v-model="formData.outfitTags"
            multiple
            filterable
            allow-create
            default-first-option
            style="width: 100%"
            placeholder="选择或输入穿搭标签，如：OL风、甜美、休闲"
          >
            <el-option label="OL风" value="OL风" />
            <el-option label="甜美" value="甜美" />
            <el-option label="休闲" value="休闲" />
            <el-option label="运动" value="运动" />
            <el-option label="晚宴" value="晚宴" />
            <el-option label="复古" value="复古" />
            <el-option label="简约" value="简约" />
            <el-option label="度假" value="度假" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否过敏">
          <el-switch v-model="formData.isAllergic" />
          <span v-if="formData.isAllergic" style="color: #f56c6c; margin-left: 10px">
            ⚠️ 本次佩戴出现过敏反应
          </span>
        </el-form-item>
        <el-form-item label="是否掉色">
          <el-switch v-model="formData.isFading" />
          <span v-if="formData.isFading" style="color: #e6a23c; margin-left: 10px">
            ⚠️ 本次佩戴出现掉色
          </span>
        </el-form-item>
        <el-form-item label="清洁情况" prop="cleanStatus" :rules="[{ required: true, message: '请选择清洁情况' }]">
          <el-select v-model="formData.cleanStatus" placeholder="选择清洁情况" style="width: 100%">
            <el-option label="未清洁" value="未清洁" />
            <el-option label="已清洁" value="已清洁" />
            <el-option label="待专业清洁" value="待专业清洁" />
            <el-option label="无需清洁" value="无需清洁" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="formData.notes"
            type="textarea"
            :rows="3"
            placeholder="可选：记录佩戴感受、搭配的衣物等"
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
import { Plus, Delete, Calendar } from '@element-plus/icons-vue';
import { outfitApi, jewelryApi } from '@/api';
import type { Outfit, Jewelry } from '@/types';

const outfitList = ref<Outfit[]>([]);
const jewelryList = ref<Jewelry[]>([]);
const dialogVisible = ref(false);
const formRef = ref<FormInstance>();

const filterForm = reactive({
  jewelryId: undefined as number | undefined,
});

const formData = reactive({
  jewelryId: undefined as number | undefined,
  wearDate: new Date().toISOString().split('T')[0],
  outfitTags: [] as string[],
  isAllergic: false,
  isFading: false,
  cleanStatus: '未清洁',
  notes: '',
});

const loadList = async () => {
  outfitList.value = await outfitApi.list(filterForm.jewelryId);
};

const loadJewelry = async () => {
  jewelryList.value = await jewelryApi.list();
};

const openDialog = () => {
  Object.assign(formData, {
    jewelryId: undefined,
    wearDate: new Date().toISOString().split('T')[0],
    outfitTags: [],
    isAllergic: false,
    isFading: false,
    cleanStatus: '未清洁',
    notes: '',
  });
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  await formRef.value?.validate();
  const data: any = {
    jewelryId: formData.jewelryId,
    wearDate: formData.wearDate,
    outfitTags: Array.isArray(formData.outfitTags)
      ? formData.outfitTags.join('、')
      : formData.outfitTags,
    isAllergic: formData.isAllergic,
    isFading: formData.isFading,
    cleanStatus: formData.cleanStatus,
    notes: formData.notes,
  };
  await outfitApi.create(data);
  ElMessage.success('记录成功');
  dialogVisible.value = false;
  loadList();
};

const handleDelete = async (row: Outfit) => {
  try {
    await ElMessageBox.confirm('确定删除该穿搭记录吗？', '提示', { type: 'warning' });
    await outfitApi.delete(row.id);
    ElMessage.success('删除成功');
    loadList();
  } catch {}
};

const formatDate = (d: string) => d?.split('T')[0] || '';

const parseTags = (tags: string) =>
  tags
    ?.split(/[、,，\s]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0) || [];

const cleanTagType = (status: string) => {
  const map: Record<string, any> = {
    已清洁: 'success',
    未清洁: 'info',
    待专业清洁: 'warning',
    无需清洁: 'primary',
  };
  return map[status] || 'info';
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

.date-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.material-tag {
  font-size: 12px;
  color: #8b5cf6;
  margin-left: 8px;
}

.muted {
  color: #9ca3af;
}
</style>

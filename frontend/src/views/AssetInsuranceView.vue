<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">资产与保险管理</h1>
    </div>

    <el-tabs v-model="activeTab" type="border-card" class="asset-tabs">
      <el-tab-pane label="未投保首饰" name="uninsured">
        <div class="tab-header">
          <h3>未投保首饰清单</h3>
          <el-tag type="danger" effect="dark">{{ uninsuredList.length }} 件未投保</el-tag>
        </div>
        <el-table :data="uninsuredList" size="small" empty-text="所有首饰均已投保">
          <el-table-column label="首饰名称" prop="name" width="160" />
          <el-table-column label="材质" prop="material" width="100" />
          <el-table-column label="当前估值" width="120">
            <template #default="{ row }">
              <span v-if="row.currentValuation" class="value-text">¥{{ row.currentValuation.toLocaleString() }}</span>
              <span v-else-if="row.purchasePrice" class="value-text">¥{{ row.purchasePrice.toLocaleString() }}（购入价）</span>
              <span v-else class="muted">未估值</span>
            </template>
          </el-table-column>
          <el-table-column label="凭证数量" width="100">
            <template #default="{ row }">{{ row.credentialCount }} 份</template>
          </el-table-column>
          <el-table-column label="风险等级" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.currentValuation >= HIGH_VALUE_DISPLAY_THRESHOLD || row.purchasePrice >= HIGH_VALUE_DISPLAY_THRESHOLD" type="danger" effect="dark" size="small">高风险</el-tag>
              <el-tag v-else-if="row.currentValuation >= HIGH_VALUE_THRESHOLD || row.purchasePrice >= HIGH_VALUE_THRESHOLD" type="warning" effect="dark" size="small">中风险</el-tag>
              <el-tag v-else type="info" effect="light" size="small">低风险</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="即将到期保单" name="expiring">
        <div class="tab-header">
          <h3>即将到期保单（{{ INSURANCE_WARNING_DAYS }}天内）</h3>
          <el-tag type="warning" effect="dark">{{ expiringPolicies.length }} 件即将到期</el-tag>
        </div>
        <el-table :data="expiringPolicies" size="small" empty-text="暂无即将到期保单">
          <el-table-column label="首饰名称" prop="name" width="140" />
          <el-table-column label="保单编号" prop="policyNumber" width="160" />
          <el-table-column label="承保公司" prop="insuranceCompany" width="140" />
          <el-table-column label="到期日期" width="120">
            <template #default="{ row }">{{ formatDate(row.endDate) }}</template>
          </el-table-column>
          <el-table-column label="剩余天数" width="100">
            <template #default="{ row }">
              <el-tag :type="row.daysRemaining <= 7 ? 'danger' : 'warning'" effect="dark" size="small">
                {{ row.daysRemaining }} 天
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button size="small" type="primary" @click="openRenewDialog(row)">续保</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="估值过期" name="expired-valuation">
        <div class="tab-header">
          <h3>估值过期首饰</h3>
          <el-tag type="danger" effect="dark">{{ expiredValuations.length }} 件估值过期</el-tag>
        </div>
        <el-table :data="expiredValuations" size="small" empty-text="所有首饰估值均在有效期内">
          <el-table-column label="首饰名称" prop="name" width="160" />
          <el-table-column label="材质" prop="material" width="100" />
          <el-table-column label="上次估值" width="120">
            <template #default="{ row }">
              <span v-if="row.lastValuationValue">¥{{ row.lastValuationValue.toLocaleString() }}</span>
              <span v-else class="muted">从未估值</span>
            </template>
          </el-table-column>
          <el-table-column label="估值日期" width="120">
            <template #default="{ row }">
              <span v-if="row.lastValuationDate">{{ formatDate(row.lastValuationDate) }}</span>
              <el-tag v-else type="danger" effect="dark" size="small">从未估值</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="凭证缺失" name="missing-credentials">
        <div class="tab-header">
          <h3>凭证缺失首饰</h3>
          <el-tag type="warning" effect="dark">{{ missingCredentials.length }} 件凭证缺失</el-tag>
        </div>
        <el-table :data="missingCredentials" size="small" empty-text="所有首饰凭证齐全">
          <el-table-column label="首饰名称" prop="name" width="160" />
          <el-table-column label="材质" prop="material" width="100" />
          <el-table-column label="缺失凭证">
            <template #default="{ row }">
              <el-tag v-for="t in row.missingTypes" :key="t" type="danger" effect="light" size="small" style="margin-right: 4px">
                缺{{ t }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="已有凭证">
            <template #default="{ row }">
              <el-tag v-for="t in row.existingCredentialTypes" :key="t" type="success" effect="light" size="small" style="margin-right: 4px">
                {{ t }}
              </el-tag>
              <span v-if="row.existingCredentialTypes.length === 0" class="muted">无</span>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="高价值首饰" name="high-value">
        <div class="tab-header">
          <h3>高价值首饰清单（≥¥10,000）</h3>
          <el-tag type="success" effect="dark">{{ highValueList.length }} 件高价值</el-tag>
        </div>
        <el-table :data="highValueList" size="small" empty-text="暂无高价值首饰">
          <el-table-column label="首饰名称" prop="name" width="160" />
          <el-table-column label="材质" prop="material" width="100" />
          <el-table-column label="当前估值" width="140">
            <template #default="{ row }">
              <span class="value-text">¥{{ row.currentValue.toLocaleString() }}</span>
            </template>
          </el-table-column>
          <el-table-column label="投保状态" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.isInsured" type="success" effect="dark" size="small">已投保</el-tag>
              <el-tag v-else type="danger" effect="dark" size="small">未投保</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="估值日期" width="120">
            <template #default="{ row }">
              <span v-if="row.lastValuationDate">{{ formatDate(row.lastValuationDate) }}</span>
              <span v-else class="muted">—</span>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="凭证管理" name="credentials">
        <div class="tab-header">
          <h3>凭证信息管理</h3>
          <el-button type="primary" size="small" @click="openCredentialDialog()" :icon="Plus">录入凭证</el-button>
        </div>
        <el-table :data="credentialList" size="small" empty-text="暂无凭证记录">
          <el-table-column label="首饰" width="140">
            <template #default="{ row }">{{ row.jewelry?.name || '—' }}</template>
          </el-table-column>
          <el-table-column label="凭证类型" prop="type" width="120" />
          <el-table-column label="凭证编号" prop="credentialNumber" width="160" />
          <el-table-column label="描述" prop="description" />
          <el-table-column label="签发机构" prop="issuedBy" width="140" />
          <el-table-column label="签发日期" width="110">
            <template #default="{ row }">{{ row.issueDate ? formatDate(row.issueDate) : '—' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button size="small" @click="openCredentialDialog(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteCredential(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="估值记录" name="valuations">
        <div class="tab-header">
          <h3>估值记录</h3>
          <el-button type="primary" size="small" @click="openValuationDialog()" :icon="Plus">新增估值</el-button>
        </div>
        <el-table :data="valuationList" size="small" empty-text="暂无估值记录">
          <el-table-column label="首饰" width="140">
            <template #default="{ row }">{{ row.jewelry?.name || '—' }}</template>
          </el-table-column>
          <el-table-column label="估值金额" width="140">
            <template #default="{ row }">
              <span class="value-text">¥{{ row.currentValue.toLocaleString() }}</span>
            </template>
          </el-table-column>
          <el-table-column label="估值日期" width="120">
            <template #default="{ row }">{{ formatDate(row.valuationDate) }}</template>
          </el-table-column>
          <el-table-column label="估值机构" prop="valuationAgency" width="160" />
          <el-table-column label="备注" prop="notes" />
          <el-table-column label="操作" width="80">
            <template #default="{ row }">
              <el-button size="small" type="danger" @click="deleteValuation(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="保单管理" name="insurances">
        <div class="tab-header">
          <h3>保单管理</h3>
          <el-button type="primary" size="small" @click="openInsuranceDialog()" :icon="Plus">登记保单</el-button>
        </div>
        <el-table :data="insuranceList" size="small" empty-text="暂无保单记录">
          <el-table-column label="首饰" width="120">
            <template #default="{ row }">{{ row.jewelry?.name || '—' }}</template>
          </el-table-column>
          <el-table-column label="保单编号" prop="policyNumber" width="140" />
          <el-table-column label="承保公司" prop="insuranceCompany" width="120" />
          <el-table-column label="保险金额" width="120">
            <template #default="{ row }">¥{{ row.insuredAmount.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column label="保险起期" width="110">
            <template #default="{ row }">{{ formatDate(row.startDate) }}</template>
          </el-table-column>
          <el-table-column label="保险止期" width="110">
            <template #default="{ row }">{{ formatDate(row.endDate) }}</template>
          </el-table-column>
          <el-table-column label="免赔额" width="100">
            <template #default="{ row }">¥{{ row.deductible.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === '生效中' ? 'success' : row.status === '已过期' ? 'info' : 'warning'" effect="dark" size="small">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button v-if="row.status === '生效中'" size="small" type="primary" @click="openRenewDialogFromInsurance(row)">续保</el-button>
              <el-button size="small" @click="openInsuranceDialog(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteInsurance(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="valuationDialogVisible" :title="editingValuation ? '编辑估值' : '新增估值'" width="520px">
      <el-form :model="valuationForm" label-width="100px" ref="valuationFormRef">
        <el-form-item label="选择首饰" prop="jewelryId" :rules="[{ required: true, message: '请选择首饰' }]">
          <el-select v-model="valuationForm.jewelryId" placeholder="选择首饰" style="width: 100%" :disabled="!!editingValuation">
            <el-option v-for="j in jewelryList" :key="j.id" :label="j.name" :value="j.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="估值金额" prop="currentValue" :rules="[{ required: true, message: '请输入估值金额' }]">
          <el-input-number v-model="valuationForm.currentValue" :min="0" :precision="2" :step="1000" style="width: 100%" controls-position="right" />
        </el-form-item>
        <el-form-item label="估值日期" prop="valuationDate" :rules="[{ required: true, message: '请选择估值日期' }]">
          <el-date-picker v-model="valuationForm.valuationDate" type="date" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="估值机构" prop="valuationAgency" :rules="[{ required: true, message: '请输入估值机构' }]">
          <el-input v-model="valuationForm.valuationAgency" placeholder="如：中检集团、国家珠宝玉石质量监督检验中心" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="valuationForm.notes" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="valuationDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleValuationSubmit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="insuranceDialogVisible" :title="editingInsurance ? '编辑保单' : '登记保单'" width="600px">
      <el-form :model="insuranceForm" label-width="100px" ref="insuranceFormRef">
        <el-form-item label="选择首饰" prop="jewelryId" :rules="[{ required: true, message: '请选择首饰' }]">
          <el-select v-model="insuranceForm.jewelryId" placeholder="选择首饰" style="width: 100%" :disabled="!!editingInsurance">
            <el-option v-for="j in jewelryList" :key="j.id" :label="j.name" :value="j.id" />
          </el-select>
        </el-form-item>
        <div class="form-section-title">保单信息</div>
        <el-form-item label="保单编号" prop="policyNumber" :rules="[{ required: true, message: '请输入保单编号' }]">
          <el-input v-model="insuranceForm.policyNumber" placeholder="如：PICC-2026-XXXXX" />
        </el-form-item>
        <el-form-item label="承保公司" prop="insuranceCompany" :rules="[{ required: true, message: '请输入承保公司' }]">
          <el-input v-model="insuranceForm.insuranceCompany" placeholder="如：中国人保、中国平安" />
        </el-form-item>
        <el-form-item label="保险起期" prop="startDate" :rules="[{ required: true, message: '请选择保险起期' }]">
          <el-date-picker v-model="insuranceForm.startDate" type="date" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="保险止期" prop="endDate" :rules="[{ required: true, message: '请选择保险止期' }]">
          <el-date-picker v-model="insuranceForm.endDate" type="date" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <div class="form-section-title">保险金额</div>
        <el-form-item label="保险金额" prop="insuredAmount" :rules="[{ required: true, message: '请输入保险金额' }]">
          <el-input-number v-model="insuranceForm.insuredAmount" :min="0" :precision="2" :step="1000" style="width: 100%" controls-position="right" />
        </el-form-item>
        <el-form-item label="免赔额">
          <el-input-number v-model="insuranceForm.deductible" :min="0" :precision="2" :step="100" style="width: 100%" controls-position="right" />
        </el-form-item>
        <el-form-item label="理赔联系人" prop="claimsContact" :rules="[{ required: true, message: '请输入理赔联系人' }]">
          <el-input v-model="insuranceForm.claimsContact" placeholder="姓名及联系方式" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="insuranceForm.notes" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="insuranceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleInsuranceSubmit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="renewDialogVisible" title="保单续保" width="600px">
      <el-form :model="renewForm" label-width="100px" ref="renewFormRef">
        <el-alert type="info" :closable="false" style="margin-bottom: 16px">
          续保将把当前保单标记为"已过期"，并创建新的保单记录
        </el-alert>
        <el-form-item label="保单编号" prop="policyNumber" :rules="[{ required: true, message: '请输入新保单编号' }]">
          <el-input v-model="renewForm.policyNumber" placeholder="新保单编号" />
        </el-form-item>
        <el-form-item label="承保公司" prop="insuranceCompany" :rules="[{ required: true, message: '请输入承保公司' }]">
          <el-input v-model="renewForm.insuranceCompany" placeholder="承保公司" />
        </el-form-item>
        <el-form-item label="保险起期" prop="startDate" :rules="[{ required: true, message: '请选择' }]">
          <el-date-picker v-model="renewForm.startDate" type="date" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="保险止期" prop="endDate" :rules="[{ required: true, message: '请选择' }]">
          <el-date-picker v-model="renewForm.endDate" type="date" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="保险金额" prop="insuredAmount" :rules="[{ required: true, message: '请输入' }]">
          <el-input-number v-model="renewForm.insuredAmount" :min="0" :precision="2" :step="1000" style="width: 100%" controls-position="right" />
        </el-form-item>
        <el-form-item label="免赔额">
          <el-input-number v-model="renewForm.deductible" :min="0" :precision="2" :step="100" style="width: 100%" controls-position="right" />
        </el-form-item>
        <el-form-item label="理赔联系人">
          <el-input v-model="renewForm.claimsContact" placeholder="姓名及联系方式" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="renewForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renewDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleRenewSubmit">确认续保</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="credentialDialogVisible" :title="editingCredential ? '编辑凭证' : '录入凭证'" width="520px">
      <el-form :model="credentialForm" label-width="100px" ref="credentialFormRef">
        <el-form-item label="选择首饰" prop="jewelryId" :rules="[{ required: true, message: '请选择首饰' }]">
          <el-select v-model="credentialForm.jewelryId" placeholder="选择首饰" style="width: 100%" :disabled="!!editingCredential">
            <el-option v-for="j in jewelryList" :key="j.id" :label="j.name" :value="j.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="凭证类型" prop="type" :rules="[{ required: true, message: '请选择凭证类型' }]">
          <el-select v-model="credentialForm.type" placeholder="选择类型" style="width: 100%">
            <el-option v-for="opt in credentialTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="凭证编号">
          <el-input v-model="credentialForm.credentialNumber" placeholder="如证书编号、发票号等" />
        </el-form-item>
        <el-form-item label="签发机构">
          <el-input v-model="credentialForm.issuedBy" placeholder="如：国家珠宝玉石质量监督检验中心" />
        </el-form-item>
        <el-form-item label="签发日期">
          <el-date-picker v-model="credentialForm.issueDate" type="date" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="credentialForm.description" type="textarea" :rows="2" placeholder="凭证简要描述" />
        </el-form-item>
        <el-form-item label="文件链接">
          <el-input v-model="credentialForm.fileUrl" placeholder="上传后的文件URL或手动输入" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="credentialDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCredentialSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { assetApi, jewelryApi } from '@/api';
import {
  HIGH_VALUE_THRESHOLD,
  HIGH_VALUE_DISPLAY_THRESHOLD,
  INSURANCE_WARNING_DAYS,
  REQUIRED_CREDENTIAL_TYPES,
} from '@/utils/risk';
import type {
  Jewelry,
  Valuation,
  Insurance,
  Credential,
  UninsuredJewelry,
  ExpiredValuationJewelry,
  MissingCredentialJewelry,
  HighValueJewelry,
  ExpiringPolicy,
} from '@/types';

const activeTab = ref('uninsured');
const jewelryList = ref<Jewelry[]>([]);

const credentialTypeOptions = computed(() => [
  { label: REQUIRED_CREDENTIAL_TYPES[0], value: REQUIRED_CREDENTIAL_TYPES[0] },
  { label: REQUIRED_CREDENTIAL_TYPES[1], value: REQUIRED_CREDENTIAL_TYPES[1] },
  { label: '发票', value: '发票' },
  { label: '保修卡', value: '保修卡' },
  { label: '其他', value: '其他' },
]);

const uninsuredList = ref<UninsuredJewelry[]>([]);
const expiringPolicies = ref<ExpiringPolicy[]>([]);
const expiredValuations = ref<ExpiredValuationJewelry[]>([]);
const missingCredentials = ref<MissingCredentialJewelry[]>([]);
const highValueList = ref<HighValueJewelry[]>([]);
const valuationList = ref<Valuation[]>([]);
const insuranceList = ref<Insurance[]>([]);
const credentialList = ref<Credential[]>([]);

const valuationDialogVisible = ref(false);
const insuranceDialogVisible = ref(false);
const renewDialogVisible = ref(false);
const credentialDialogVisible = ref(false);

const editingValuation = ref<Valuation | null>(null);
const editingInsurance = ref<Insurance | null>(null);
const editingCredential = ref<Credential | null>(null);
const renewingInsuranceId = ref<number | null>(null);

const valuationFormRef = ref<FormInstance>();
const insuranceFormRef = ref<FormInstance>();
const renewFormRef = ref<FormInstance>();
const credentialFormRef = ref<FormInstance>();

const valuationForm = reactive({
  jewelryId: undefined as number | undefined,
  currentValue: 0,
  valuationDate: new Date().toISOString().split('T')[0],
  valuationAgency: '',
  notes: '',
});

const insuranceForm = reactive({
  jewelryId: undefined as number | undefined,
  policyNumber: '',
  insuranceCompany: '',
  startDate: '',
  endDate: '',
  insuredAmount: 0,
  deductible: 0,
  claimsContact: '',
  notes: '',
});

const renewForm = reactive({
  policyNumber: '',
  insuranceCompany: '',
  startDate: '',
  endDate: '',
  insuredAmount: 0,
  deductible: 0,
  claimsContact: '',
  notes: '',
});

const credentialForm = reactive({
  jewelryId: undefined as number | undefined,
  type: '',
  credentialNumber: '',
  issuedBy: '',
  issueDate: '',
  description: '',
  fileUrl: '',
});

const formatDate = (d: string) => d?.split('T')[0] || '';

const loadJewelry = async () => {
  jewelryList.value = await jewelryApi.list();
};

const loadUninsured = async () => {
  uninsuredList.value = await assetApi.getUninsured();
};

const loadExpiringPolicies = async () => {
  const policies = await assetApi.getExpiringPolicies(INSURANCE_WARNING_DAYS);
  expiringPolicies.value = policies.map((p: any) => ({
    id: p.id,
    name: p.jewelry?.name || '—',
    policyNumber: p.policyNumber,
    insuranceCompany: p.insuranceCompany,
    endDate: p.endDate,
    daysRemaining: Math.floor(
      (new Date(p.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    ),
  }));
};

const loadExpiredValuations = async () => {
  expiredValuations.value = await assetApi.getExpiredValuations();
};

const loadMissingCredentials = async () => {
  missingCredentials.value = await assetApi.getMissingCredentials();
};

const loadHighValue = async () => {
  highValueList.value = await assetApi.getHighValue();
};

const loadValuations = async () => {
  valuationList.value = await assetApi.getValuations();
};

const loadInsurances = async () => {
  insuranceList.value = await assetApi.getInsurances();
};

const loadCredentials = async () => {
  credentialList.value = await assetApi.getCredentials();
};

const openValuationDialog = (item?: Valuation) => {
  editingValuation.value = item || null;
  if (item) {
    Object.assign(valuationForm, {
      jewelryId: item.jewelryId,
      currentValue: item.currentValue,
      valuationDate: item.valuationDate?.split('T')[0] || '',
      valuationAgency: item.valuationAgency,
      notes: item.notes || '',
    });
  } else {
    Object.assign(valuationForm, {
      jewelryId: undefined,
      currentValue: 0,
      valuationDate: new Date().toISOString().split('T')[0],
      valuationAgency: '',
      notes: '',
    });
  }
  valuationDialogVisible.value = true;
};

const handleValuationSubmit = async () => {
  await valuationFormRef.value?.validate();
  await assetApi.createValuation(valuationForm as any);
  ElMessage.success('估值记录已保存');
  valuationDialogVisible.value = false;
  loadValuations();
  loadExpiredValuations();
  loadHighValue();
  loadUninsured();
};

const deleteValuation = async (item: Valuation) => {
  try {
    await ElMessageBox.confirm('确定删除该估值记录？', '提示', { type: 'warning' });
    await assetApi.deleteValuation(item.id);
    ElMessage.success('删除成功');
    loadValuations();
    loadExpiredValuations();
  } catch {}
};

const openInsuranceDialog = (item?: Insurance) => {
  editingInsurance.value = item || null;
  if (item) {
    Object.assign(insuranceForm, {
      jewelryId: item.jewelryId,
      policyNumber: item.policyNumber,
      insuranceCompany: item.insuranceCompany,
      startDate: item.startDate?.split('T')[0] || '',
      endDate: item.endDate?.split('T')[0] || '',
      insuredAmount: item.insuredAmount,
      deductible: item.deductible,
      claimsContact: item.claimsContact,
      notes: item.notes || '',
    });
  } else {
    Object.assign(insuranceForm, {
      jewelryId: undefined,
      policyNumber: '',
      insuranceCompany: '',
      startDate: '',
      endDate: '',
      insuredAmount: 0,
      deductible: 0,
      claimsContact: '',
      notes: '',
    });
  }
  insuranceDialogVisible.value = true;
};

const handleInsuranceSubmit = async () => {
  await insuranceFormRef.value?.validate();
  if (editingInsurance.value) {
    await assetApi.updateInsurance(editingInsurance.value.id, insuranceForm as any);
    ElMessage.success('保单已更新');
  } else {
    await assetApi.createInsurance(insuranceForm as any);
    ElMessage.success('保单已登记');
  }
  insuranceDialogVisible.value = false;
  loadInsurances();
  loadExpiringPolicies();
  loadUninsured();
  loadHighValue();
};

const deleteInsurance = async (item: Insurance) => {
  try {
    await ElMessageBox.confirm('确定删除该保单？', '提示', { type: 'warning' });
    await assetApi.deleteInsurance(item.id);
    ElMessage.success('删除成功');
    loadInsurances();
    loadExpiringPolicies();
    loadUninsured();
  } catch {}
};

const openRenewDialog = (policy: ExpiringPolicy) => {
  renewingInsuranceId.value = policy.id;
  Object.assign(renewForm, {
    policyNumber: '',
    insuranceCompany: policy.insuranceCompany,
    startDate: '',
    endDate: '',
    insuredAmount: 0,
    deductible: 0,
    claimsContact: '',
    notes: '',
  });
  renewDialogVisible.value = true;
};

const openRenewDialogFromInsurance = (item: Insurance) => {
  renewingInsuranceId.value = item.id;
  Object.assign(renewForm, {
    policyNumber: '',
    insuranceCompany: item.insuranceCompany,
    startDate: '',
    endDate: '',
    insuredAmount: item.insuredAmount,
    deductible: item.deductible,
    claimsContact: item.claimsContact,
    notes: '',
  });
  renewDialogVisible.value = true;
};

const handleRenewSubmit = async () => {
  await renewFormRef.value?.validate();
  if (!renewingInsuranceId.value) return;
  await assetApi.renewInsurance(renewingInsuranceId.value, renewForm as any);
  ElMessage.success('续保成功');
  renewDialogVisible.value = false;
  loadInsurances();
  loadExpiringPolicies();
  loadUninsured();
};

const openCredentialDialog = (item?: Credential) => {
  editingCredential.value = item || null;
  if (item) {
    Object.assign(credentialForm, {
      jewelryId: item.jewelryId,
      type: item.type,
      credentialNumber: item.credentialNumber || '',
      issuedBy: item.issuedBy || '',
      issueDate: item.issueDate?.split('T')[0] || '',
      description: item.description || '',
      fileUrl: item.fileUrl || '',
    });
  } else {
    Object.assign(credentialForm, {
      jewelryId: undefined,
      type: '',
      credentialNumber: '',
      issuedBy: '',
      issueDate: '',
      description: '',
      fileUrl: '',
    });
  }
  credentialDialogVisible.value = true;
};

const handleCredentialSubmit = async () => {
  await credentialFormRef.value?.validate();
  if (editingCredential.value) {
    await assetApi.updateCredential(editingCredential.value.id, credentialForm as any);
    ElMessage.success('凭证已更新');
  } else {
    await assetApi.createCredential(credentialForm as any);
    ElMessage.success('凭证已录入');
  }
  credentialDialogVisible.value = false;
  loadCredentials();
  loadMissingCredentials();
};

const deleteCredential = async (item: Credential) => {
  try {
    await ElMessageBox.confirm('确定删除该凭证？', '提示', { type: 'warning' });
    await assetApi.deleteCredential(item.id);
    ElMessage.success('删除成功');
    loadCredentials();
    loadMissingCredentials();
  } catch {}
};

onMounted(async () => {
  await loadJewelry();
  await Promise.all([
    loadUninsured(),
    loadExpiringPolicies(),
    loadExpiredValuations(),
    loadMissingCredentials(),
    loadHighValue(),
    loadValuations(),
    loadInsurances(),
    loadCredentials(),
  ]);
});
</script>

<style scoped>
.asset-tabs {
  border-radius: 12px;
  overflow: hidden;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.tab-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #4c1d95;
  margin: 0;
}

.value-text {
  font-weight: 700;
  color: #6b21a8;
}

.muted {
  color: #9ca3af;
}

.form-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #6b21a8;
  margin: 8px 0 12px 0;
  padding-left: 8px;
  border-left: 3px solid #a855f7;
}
</style>

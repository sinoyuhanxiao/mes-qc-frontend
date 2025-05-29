<template>
  <el-dialog
      :model-value="visible"
      @update:modelValue="emit('update:visible', $event)"
      fullscreen
      :title="qcFormTemplateName + ' - 审批详情: '"
      @close="handleClose"
  >
    <div class="approval-detail-dialog">

      <!-- ▶ 审批进度 el-steps -->
      <section class="section-block">
        <h3>审批流程</h3>
        <el-steps :space="200" direction="horizontal">
          <el-step
              v-for="(step, idx) in getSteps()"
              :key="idx"
              :title="step.title"
              :status="step.status"
          />
        </el-steps>
      </section>

      <!-- ▶ 表单当前内容 (readonly) -->
      <section class="section-block">
        <h3>质检记录</h3>
        <QcRecordsTable
            :records="versionRecords"
            :headers="versionHeaders"
            :loading="versionTableLoading"
            :tableHeight="computedTableHeight"
            @latest-submission-id="latestSubmissionId"
            @view-details="viewDetails"
            :qcFormTemplateId="parseInt(collectionName.split('_')[2])"
            search=""
            :dateRange="[]"
            :fromApprovalPage="true"
            @export-excel="exportToExcel"
        />
      </section>

      <!-- ▶ 审批记录 -->
      <section class="section-block">
        <h3>审批记录</h3>
        <el-table :data="filteredApprovalRecords" border style="width: 100%">
          <el-table-column prop="user_name" label="审批人" width="150" />

          <el-table-column label="角色" width="120">
            <template #default="scope">
              <el-tag
                  :type="{
                    'submitter': 'success',
                    'leader': 'primary',
                    'supervisor': 'warning'
                  }[scope.row.role]"
              >
                {{
                  {
                    'submitter': '填报员',
                    'leader': '班长',
                    'supervisor': '主管'
                  }[scope.row.role] || scope.row.role
                }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="审批状态" width="120">
            <template #default="scope">
              <el-tag :type="scope.row.status === 'completed' ? 'success' : 'info'">
                {{
                  {
                    'completed': '已完成',
                    'pending': '待操作',
                    'not_started': '未开始'
                  }[scope.row.status] || scope.row.status
                }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="审批时间" width="200">
            <template #default="scope">
              {{ formatDate(scope.row.timestamp) }}
            </template>
          </el-table-column>

          <el-table-column prop="comments" label="审批意见" />

          <el-table-column label="需要复检" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.suggest_retest ? 'danger' : 'info'">
                {{ scope.row.suggest_retest ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="审批人签字" width="180">
            <template #default="scope">
              <el-image
                  v-if="scope.row['e-signature']"
                  :src="scope.row['e-signature']"
                  :preview-src-list="[scope.row['e-signature']]"
                  :preview-teleported="true"
                  fit="contain"
                  style="max-height: 40px; max-width: 100%;"
              />
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
      </section>

      <!-- ▶ 需要复检 -->
      <section class="section-block">
        <h3>需要复检？</h3>
        <el-switch
            v-model="suggestRetest"
            active-text="是"
            inactive-text="否"
            size="large"
            inline-prompt
        />
      </section>

      <!-- ▶ 审批意见 -->
      <section class="section-block">
        <h3>审批意见</h3>
        <el-input
            type="textarea"
            v-model="comment"
            placeholder="请输入您的审批意见..."
            :rows="4"
        />
      </section>

      <!-- ▶ 导出功能 -->
      <section class="section-block">
        <h3>导出</h3>
        <el-button type="success" @click="exportApprovalAndRecordsToExcel(versionRecords, filteredApprovalRecords, qcFormTemplateName)">
          导出 Excel
        </el-button>
        <el-button type="primary" @click="handleExportPdf">
          导出 PDF
        </el-button>
      </section>

    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button
          type="primary"
          :disabled="!props.canApprove || props.approvalState === 'fully_approved'"
          @click="handleApprove"
      >
        提交
      </el-button>
    </template>
  </el-dialog>

  <QcRecordDetailDialog
      v-if="dialogVisible"
      :visible="dialogVisible"
      :selectedForm="{
        label: selectedSubmissionRow?.value?.label || '审批详情',
        qcFormTemplateId: parseInt(collectionName.split('_')[2])
      }"
      :groupedDetails="groupedDetails"
      :basicInfo="basicInfo"
      :systemInfo="systemInfo"
      :eSignature="eSignature"
      :alertInfo="alertInfo"
      :showAlerts="false"
      @export="exportToPdf"
      @close="dialogVisible = false"
      :from-approval-page="true"
  />

  <SignaturePadComponent
      v-if="showSignaturePad"
      :visible="showSignaturePad"
      @save="handleSignatureSaveAndApprove"
      @close="handleSignatureClose"
  />

</template>

<script setup>
import { submitApprovalAction } from '@/services/approval/approvalService';
import { useStore } from 'vuex';
import {ref, defineProps, watch, computed} from 'vue'
import QcRecordsTable from '@/components/common/qc/QcRecordsTable.vue'
import { getVersionHistory } from '@/services/approval/approvalService'
import {formatDate} from "@/utils/task-center/dateFormatUtils";
import QcRecordDetailDialog from '@/components/common/qc/QcRecordDetailDialog.vue'
import { getUserById } from '@/services/userService'
import { parseFormDocument } from '@/utils/formUtils'
import {getMyDocument} from "@/services/qcTaskSubmissionLogsService";
import SignaturePadComponent from '@/components/form-manager/SignaturePad.vue';
import { getApprovalInfo } from '@/services/approval/approvalService';
import { getStepsFromState } from '@/utils/helpers/approvalStepHelper';
import { useApprovalDetailExport } from '@/composables/useApprovalDetailExport'
const { exportApprovalAndRecordsToExcel, exportApprovalAndRecordsToPdf } = useApprovalDetailExport()

const props = defineProps({
  visible: Boolean,
  submissionId: String,
  qcFormTemplateName: String,
  collectionName: String,
  qcFormTemplateId: Number | String,
  records: {
    type: Array,
    default: () => []
  },
  approvalType: String,
  approvalState: String,
  canApprove: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible'])

const computedTableHeight = computed(() => {
  const rowCount = versionRecords.value.length
  const rowHeight = 100
  const maxHeight = 1000
  return Math.min(rowCount * rowHeight + 100, maxHeight)
})

const versionTableLoading = ref(false)
const versionRecords = ref([])
const versionHeaders = ref([])
const comment = ref('')

// view details:
const dialogVisible = ref(false)
const groupedDetails = ref({})
const basicInfo = ref({})
const systemInfo = ref({})
const eSignature = ref(null)
const selectedSubmissionRow = ref(null)

// Alert
const alertInfo = ref({});
const showAlerts = ref(true);

// Retest
const suggestRetest = ref(false);

// Signature
const showSignaturePad = ref(false);

// Approval History
const approvalRecords = ref([])
const filteredApprovalRecords = computed(() =>
    approvalRecords.value.filter((r) =>
        r.role !== 'submitter' &&
        r.role !== 'archive' &&
        r.status === 'completed'
    )
);

// approval action
const store = useStore();
const user = store.getters.getUser;
const approverId = user?.id;

// 🔽 Determine approver role string based on user's role ID
const approverRole = computed(() => {
  if (user?.role?.id === 1) return 'supervisor';
  if (user?.role?.id === 3) return 'leader';
  return null;
});

const handleClose = () => {
  emit('update:visible', false)
}

const handleApprove = () => {
  showSignaturePad.value = true;
}

const exportToPdf = () => {
  console.log('Exporting PDF')
}

// signature handler

function handleSignatureClose() {
  showSignaturePad.value = false;
}

function formatClientTime(utcDateTime) {
  if (!utcDateTime) return "-";
  const utcDate = new Date(utcDateTime + "Z"); // Ensure UTC interpretation
  return utcDate.toLocaleString("zh-CN", {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).replace(/\//g, "-");
}

async function viewDetails(row) {
  try {
    // 1. Fetch form document
    const res = await getMyDocument(row._id, props.qcFormTemplateId, row.created_by, props.collectionName);
    const rawData = res.data;

    // 2. Store meta info
    let selectedDetails = { ...rawData, submissionId: row._id };

    // 3. Resolve system fields
    systemInfo.value = {
      提交单号: selectedDetails.submissionId,
      提交时间: new Date(selectedDetails.created_at).toLocaleString("zh-CN", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false
      }),
      提交人: await getUserById(selectedDetails.created_by).then(res => res.data?.data?.name || "-")
    };

    // TODO: add a basicInfo field includes the 4 fields: 涉及产品，涉及批次，质检人员，所属班次
    basicInfo.value = {
      涉及产品: selectedDetails.uncategorized.related_products,
      涉及批次: selectedDetails.uncategorized.related_batches,
      质检人员: selectedDetails.uncategorized.related_inspectors,
      所属班次: selectedDetails.uncategorized.related_shifts,
      所属班组: selectedDetails.uncategorized.related_teams
    };

    // // add dummy data first
    // this.basicInfo = {
    //   涉及产品: '土豆条, 红薯球',        // dummy product names
    //   涉及批次: 'BATCH20240401, BATCH20240402',   // dummy batch codes
    //   质检人员: '张三, 李四, 王五',              // dummy inspector names
    //   所属班次: 'A班, B班'                       // dummy shifts
    // };

    // 4. Parse document
    const { groupedDetails: grouped, eSignature: signature } = parseFormDocument(selectedDetails);

    // 5.1 Remove all "related_" fields from 'uncategorized'
    if (grouped.uncategorized) {
      for (const key of Object.keys(grouped.uncategorized)) {
        if (key.startsWith("related_")) {
          delete grouped.uncategorized[key];
        }
        if (key === "approver_updated_at") {
          delete grouped.uncategorized[key];
        }
      }
    }

    groupedDetails.value = grouped;
    eSignature.value = signature;

    // 6. Open dialog
    dialogVisible.value = true;

  } catch (err) {
    console.error("Error fetching document details:", err);
  }
}

async function handleSignatureSaveAndApprove(signatureData) {
  try {
    await submitApprovalAction({
      submissionId: props.submissionId,
      collectionName: props.collectionName,
      approverId,
      role: approverRole.value,
      comment: comment.value,
      suggestRetest: suggestRetest.value,
      eSignature: signatureData
    });

    showSignaturePad.value = false;
    emit('update:visible', false); // Close the dialog
    emit('approved');              // Notify parent to refresh table
  } catch (err) {
    console.error('❌ 审批失败:', err);
  }
}


async function generatePdfVersionData() {
  const allVersionData = [];

  for (const row of versionRecords.value) {
    const submissionId = row._id;
    const createdBy = row.created_by;
    const createdAt = row['提交时间'];
    const formTemplateId = props.qcFormTemplateId;
    const collectionName = props.collectionName;

    // Step 1: 获取原始文档
    const res = await getMyDocument(submissionId, formTemplateId, createdBy, collectionName);
    const rawData = res.data;

    // Step 2: 解析字段
    const { groupedDetails, eSignature } = parseFormDocument(rawData);
    if (eSignature) {
      groupedDetails['e-signature'] = eSignature;
    }

    // Step 3: 清除 groupedDetails 中的 related_* 字段（只保留在 basicInfo）
    if (groupedDetails.uncategorized) {
      for (const key of Object.keys(groupedDetails.uncategorized)) {
        if (key.startsWith("related_")) {
          delete groupedDetails.uncategorized[key];
        }
      }
    }

    const singleBasicInfo = {
      涉及产品: rawData.uncategorized?.related_products,
      涉及批次: rawData.uncategorized?.related_batches,
      质检人员: rawData.uncategorized?.related_inspectors,
      所属班次: rawData.uncategorized?.related_shifts,
      所属班组: rawData.uncategorized?.related_teams,
    };

    const singleSystemInfo = {
      提交单号: submissionId,
      提交时间: createdAt,
      提交人: await getUserById(rawData.created_by).then(res => res.data?.data?.name || "-")
    };

    const approvalInfo = rawData.uncategorized?.approval_info || [];

    allVersionData.push({
      groupedDetails,
      basicInfo: singleBasicInfo,
      systemInfo: singleSystemInfo,
      approvalInfo
    });
  }

  return allVersionData;
}

async function handleExportPdf() {
  const versionData = await generatePdfVersionData();
  await exportApprovalAndRecordsToPdf(versionData, filteredApprovalRecords.value, props.qcFormTemplateName);
}


function getSteps() {
  return getStepsFromState(props.approvalType, props.approvalState)
}

watch(() => props.submissionId, async (newId) => {
  if (!newId || !props.collectionName) return
  try {
    const res = await getApprovalInfo(newId, props.collectionName)
    approvalRecords.value = res.data.data || []
  } catch (err) {
    console.error("获取审批记录失败", err)
    approvalRecords.value = []
  }
}, { immediate: true })

watch(() => props.submissionId, async (newId) => {
  if (!newId) return
  versionTableLoading.value = true
  try {
    // 👇 从 collectionName 中提取 formTemplateId（如 form_template_9_202405）
    const collectionName = props.collectionName
    const formTemplateId = parseInt(collectionName.split('_')[2])

    const response = await getVersionHistory(newId, collectionName)

    // for not showing the child relationships for this
    versionRecords.value = (response.data.data || []).map(record => {
      const { version_group_id, created_at, ...rest } = record
      return {
        ...rest,
        提交时间: formatDate(created_at)
      }
    })

    // this is the place to modify the data for this part
    if (versionRecords.value.length > 0) {
      const rawKeys = Object.keys(versionRecords.value[0])
      const filteredKeys = rawKeys.filter(k =>
          !['_id', 'created_by', 'created_at', 'e-signature', '提交人', 'version', 'approval_info', 'exceeded_info', 'version_group_id'].includes(k) &&
          !k.startsWith('related_')
      )
      versionHeaders.value = filteredKeys
    }

  } catch (err) {
    console.error('🛑 Error loading version history:', err)
  } finally {
    versionTableLoading.value = false
  }
}, { immediate: true })

</script>

<style scoped>
.approval-detail-dialog {
  padding: 20px;
}

.section-block {
  margin-bottom: 30px;
}

.form-readonly,
.history-table {
  background-color: #f9f9f9;
  padding: 20px;
  border: 1px dashed #ccc;
}
</style>

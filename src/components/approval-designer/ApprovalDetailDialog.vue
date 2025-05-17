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
          <el-step title="填报员" status="finish" />
          <el-step title="班长签名" status="finish" />
          <el-step title="主管签名" status="process" />
          <el-step title="归档" status="wait" />
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
        <el-table :data="hardcodedApprovalRecords" border style="width: 100%">
          <el-table-column prop="user_name" label="审批人" width="150" />
          <el-table-column prop="role" label="用户角色" width="120" />
          <el-table-column prop="status" label="审批状态" width="120" />
          <el-table-column prop="timestamp" label="审批时间" width="200" />
          <el-table-column prop="comments" label="审批意见" />
          <el-table-column prop="suggest_retest" label="复检建议" width="100" />
          <el-table-column label="审批人签字" width="180">
            <template #default="scope">
              <img
                  v-if="scope.row.signature"
                  :src="scope.row.signature"
                  alt="签名"
                  style="max-height: 50px;"
              />
              <span v-else>-</span>
            </template>
          </el-table-column>

        </el-table>
      </section>

      <!-- ▶ 复检建议 -->
      <section class="section-block">
        <h3>复检建议</h3>
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
<!--      <section class="section-block">-->
<!--        <h3>导出</h3>-->
<!--        <el-button type="primary" @click="exportToPdf">PDF</el-button>-->
<!--      </section>-->

    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button type="primary" @click="handleApprove">批准</el-button>
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
      :showAlerts="true"
      @export="exportToPdf"
      @close="dialogVisible = false"
  />

  <SignaturePadComponent
      v-if="showSignaturePad"
      :visible="showSignaturePad"
      @save="handleSignatureSave"
      @close="handleSignatureClose"
  />

</template>

<script setup>
import {ref, defineProps, watch, computed} from 'vue'
import QcRecordsTable from '@/components/common/qc/QcRecordsTable.vue'
import { getVersionHistory } from '@/services/approval/approvalService'
import {formatDate} from "@/utils/task-center/dateFormatUtils";
import QcRecordDetailDialog from '@/components/common/qc/QcRecordDetailDialog.vue'
import { getUserById } from '@/services/userService'
import { parseFormDocument } from '@/utils/formUtils'
import {getMyDocument} from "@/services/qcTaskSubmissionLogsService";
import SignaturePadComponent from '@/components/form-manager/SignaturePad.vue';


const props = defineProps({
  visible: Boolean,
  submissionId: String,
  qcFormTemplateName: String,
  collectionName: String,
  qcFormTemplateId: Number | String,
  records: {
    type: Array,
    default: () => []
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


const hardcodedApprovalRecords = ref([
  {
    role: 'submitter',
    user_name: '张三',
    status: 'completed',
    timestamp: '2025-05-15 08:29:32',
    comments: '数据正常',
    suggest_retest: '否'
  },
  {
    role: 'leader',
    user_name: '李四',
    status: 'pending',
    timestamp: '',
    comments: '',
    suggest_retest: ''
  }
])

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

function handleSignatureSave(signatureData) {
  console.log('签名数据 Base64:', signatureData);

  // TODO: 可以在这里调用后端 API，保存签名记录：
  // await saveApprovalSignature(props.submissionId, signatureData)

  showSignaturePad.value = false;
}

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
      所属班次: selectedDetails.uncategorized.related_shifts
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

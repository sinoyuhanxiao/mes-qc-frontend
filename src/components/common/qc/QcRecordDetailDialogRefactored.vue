<template>
  <el-dialog
      :model-value="visible"
      @update:modelValue="onClose"
      width="50%"
      @close="onClose"
  >
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 20px">{{ formLabel }} - {{ translate('FormDataSummary.detailDialog.titleSuffix') }}</span>
        <el-switch
            v-model="showAlerts"
            active-text="显示告警"
            inactive-text="隐藏告警"
            inline-prompt
            size="large"
            style="--el-switch-off-color: #989898; --el-switch-on-color: #409EFF;"
        />
      </div>
    </template>

  <el-skeleton :loading="loading" animated :rows="6">
    <template #default>
      <el-scrollbar max-height="500px">
      <!-- Unclassified Entries -->
      <el-descriptions
          v-if="displayableUncategorizedEntries.length > 0"
          :title="translate('FormDataSummary.recordTable.groupUncategorized')"
          border :column="1" style="margin: 10px 0" :label-width="descriptionLabelWidth">
        <el-descriptions-item
            v-for="([key, value]) in displayableUncategorizedEntries"
            :key="key"
            :label="key"
        >
          {{ Array.isArray(value) ? value.join(', ') : (value || " - ") }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- Grouped Details -->
      <template v-for="(fields, category) in groupedDetails" :key="category">
        <div v-if="category !== 'uncategorized' && category !== 'exceeded_info'">
          <el-descriptions :title="category" border :column="showAlerts ? 2 : 1"
                           style="margin: 10px 0" :label-width="descriptionLabelWidth">
            <template v-for="(value, key) in fields" :key="key">
              <el-descriptions-item :label="key">
                <span>
                  {{ Array.isArray(value) ? value.join(', ') : (value || " - ") }}
                  <el-icon v-if="showAlerts && getAlertIcon(groupedDetails, key)"
                           style="margin-left: 4px;" :style="getAlertStyle(groupedDetails, key)">
                    <component :is="getAlertIcon(groupedDetails, key)" />
                  </el-icon>
                </span>
              </el-descriptions-item>
              <el-descriptions-item v-if="showAlerts" label="合格范围" :key="key + '-range'">
                {{ getAlertTooltip(groupedDetails, key, { removePrefix: true }) }}
              </el-descriptions-item>
            </template>
          </el-descriptions>
        </div>
      </template>

      <!-- Basic Info -->
      <el-descriptions :title="translate('FormDataSummary.recordTable.groupBasicInfo')" :column="1" border
                       style="margin-top: 10px" :label-width="descriptionLabelWidth">
        <el-descriptions-item label="涉及产品">{{ basicInfo.涉及产品 || " - " }}</el-descriptions-item>
        <el-descriptions-item label="涉及批次">{{ basicInfo.涉及批次 || " - " }}</el-descriptions-item>
        <el-descriptions-item label="质检人员">{{ basicInfo.质检人员 || " - " }}</el-descriptions-item>
        <el-descriptions-item label="所属班次">{{ basicInfo.所属班次 || " - " }}</el-descriptions-item>
        <el-descriptions-item label="所属班组">{{ basicInfo.所属班组 || " - " }}</el-descriptions-item>
      </el-descriptions>

      <!-- System Info -->
      <el-descriptions :title="translate('FormDataSummary.recordTable.groupSystemInfo')" :column="1" border
                       style="margin-top: 10px" :label-width="descriptionLabelWidth">
        <el-descriptions-item :label="translate('FormDataSummary.detailDialog.submissionId')">
          {{ systemInfo.提交单号 || " - " }}
        </el-descriptions-item>
        <el-descriptions-item :label="translate('FormDataSummary.detailDialog.submitter')">
          {{ systemInfo.提交人 || " - " }}
        </el-descriptions-item>
        <el-descriptions-item :label="translate('FormDataSummary.detailDialog.submittedAt')">
          {{ systemInfo.提交时间 || " - " }}
        </el-descriptions-item>
      </el-descriptions>

      <div v-if="eSignature && eSignature.startsWith('data:image')" style="margin-top: 20px;">
        <h3>{{ translate('FormDataSummary.detailDialog.signatureTitle') }}</h3>
        <img :src="eSignature" alt="e-signature" style="width: 300px; height: auto;" />
      </div>
    </el-scrollbar>
    </template>
  </el-skeleton>

    <template #footer>
      <el-button type="info" @click="onClose">
        {{ translate('FormDataSummary.detailDialog.cancelButton') }}
      </el-button>
      <el-button type="primary" @click="exportSubmission">
        {{ translate('FormDataSummary.detailDialog.exportButton') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { translate } from '@/utils/i18n'
import { ref, watch, computed } from 'vue'
import { getMyDocument } from '@/services/qcTaskSubmissionLogsService'
import { parseFormDocument } from '@/utils/formUtils'
import { getUserById } from '@/services/userService'
import { useAlertHighlight } from '@/composables/useAlertHighlight'
import { exportSubmissionLogToPdf as exportToPdf } from '@/utils/exportUtils'
import { fetchFormTemplate } from '@/services/qcFormTemplateService'
import { nextTick } from 'vue'

const props = defineProps({
  visible: Boolean,
  submissionId: String,
  qcFormTemplateId: Number,
  createdAt: String,
  fromApprovalPage: Boolean,
  dangerLabel: String
})
const emit = defineEmits(['close'])
const loading = ref(false)
const showAlerts = ref(false)
const descriptionLabelWidth = '200px'
const basicInfo = ref({})
const systemInfo = ref({})
const groupedDetails = ref({})
const eSignature = ref(null)
const formLabel = ref('-')
const { getAlertIcon, getAlertStyle, getAlertTooltip } = useAlertHighlight(showAlerts)
const collectionName = computed(() => {
  const date = new Date(props.createdAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `form_template_${props.qcFormTemplateId}_${year}${month}`;
});

watch(() => props.visible, async (val) => {
  if (val) {
    await fetchDetails()
    await nextTick()
    await highlightDangerLabel() // for alert page only
  }
})

async function highlightDangerLabel() {
  if (!props.dangerLabel) return
  const tdElements = document.querySelectorAll('.el-descriptions__label')
  tdElements.forEach(td => {
    if (td.textContent?.trim() === props.dangerLabel) {
      td.style.backgroundColor = '#f47979'
      td.style.color = 'white'
    }
  })
}

async function fetchDetails() {
  loading.value = true
  try {
    const res = await getMyDocument(props.submissionId, props.qcFormTemplateId, 19, collectionName.value)
    const rawData = res.data

    const formTemplateRes = await fetchFormTemplate(props.qcFormTemplateId);
    formLabel.value = formTemplateRes?.data?.data.name || '-';

    systemInfo.value = {
      提交单号: props.submissionId,
      提交时间: new Date(rawData.created_at).toLocaleString("zh-CN", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false
      }),
      提交人: await getUserById(rawData.created_by).then(res => res.data?.data?.name || "-")
    }

    basicInfo.value = {
      涉及产品: rawData.uncategorized?.related_products,
      涉及批次: rawData.uncategorized?.related_batches,
      质检人员: rawData.uncategorized?.related_inspectors,
      所属班次: rawData.uncategorized?.related_shifts,
      所属班组: rawData.uncategorized?.related_teams,
    }

    const { groupedDetails: grouped, eSignature: signature } = parseFormDocument(rawData)
    if (grouped.uncategorized) {
      for (const key of Object.keys(grouped.uncategorized)) {
        if (key.startsWith("related_") || key === 'approver_updated_at') {
          delete grouped.uncategorized[key]
        }
      }
    }
    groupedDetails.value = grouped
    eSignature.value = signature
  } catch (err) {
    console.error("❌ Failed to fetch submission:", err)
  } finally {
    loading.value = false
  }
}

async function exportSubmission() {
  await exportToPdf({
    formLabel: formLabel.value,
    groupedDetails: groupedDetails.value,
    basicInfo: basicInfo.value,
    systemInfo: systemInfo.value,
    eSignature: eSignature.value,
    translate
  });
}

function onClose() {
  emit('close')
}

const displayableUncategorizedEntries = computed(() => {
  const excludedKeys = ['e-signature', 'exceeded_info', 'approval_info', 'version_group_id', 'version']
  if (!groupedDetails.value?.uncategorized) return []
  return Object.entries(groupedDetails.value.uncategorized).filter(([k, _]) => !excludedKeys.includes(k))
})
</script>

<style scoped></style>

<template>
  <el-dialog
      :model-value="visible"
      fullscreen
      :title="`${selectedForm?.label} - ${translate('FormDataSummary.detailDialog.titleSuffix')}`"
      @update:modelValue="$emit('update:visible', $event)"
  >
    <QcRecordsTable
        :records="records"
        :headers="headers"
        :search="search"
        :dateRange="dateRange"
        :loading="loading"
        :tableHeight="tableHeight"
        @view-details="viewDetails"
        @delete="deleteRecord"
        @export-excel="exportRecordsToExcel"
        @update:dateRange="handleDateRangeChange"
    />

    <QcRecordDetailDialog
        v-if="dialogVisible"
        :visible="dialogVisible"
        :selectedForm="selectedForm"
        :groupedDetails="groupedDetails"
        :basicInfo="basicInfo"
        :systemInfo="systemInfo"
        :eSignature="eSignature"
        @close="dialogVisible = false"
    />


    <template #footer>
      <el-button type="primary" @click="$emit('update:visible', false);">
        {{ translate('FormDataSummary.recordTable.closeButton') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import QcRecordsTable from "./qc/QcRecordsTable.vue";
import {translate, translateWithParams} from "@/utils/i18n";
import QcRecordDetailDialog from "@/components/common/qc/QcRecordDetailDialog.vue";
import {deleteTaskSubmissionLog, getMyDocument} from "@/services/qcTaskSubmissionLogsService";
import {getUserById} from "@/services/userService";
import {parseFormDocument} from "@/utils/formUtils";
import {ref} from "vue";
import {exportQcRecordsToExcel} from "@/utils/exportUtils";
import {ElMessage, ElMessageBox} from "element-plus";

const dialogVisible = ref(false);
const groupedDetails = ref({});
const basicInfo = ref({});
const systemInfo = ref({});
const eSignature = ref(null);

const props = defineProps([
  "visible", "records", "headers", "search", "dateRange",
  "loading", "tableHeight", "selectedForm"
]);

const emit = defineEmits([
  "update:visible"
]);

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

async function openDetailsDialog(row) {
  try {
    const createdAt = new Date(row["提交时间"]);
    const yearMonth = createdAt.getFullYear().toString() + (createdAt.getMonth() + 1).toString().padStart(2, "0");
    const collectionName = `form_template_${props.selectedForm.qcFormTemplateId}_${yearMonth}`;
    const response = await getMyDocument(row._id, props.selectedForm.qcFormTemplateId, row.created_by, collectionName);
    const rawData = response.data;

    basicInfo.value = {
      涉及产品: rawData.uncategorized.related_products,
      涉及批次: rawData.uncategorized.related_batches,
      质检人员: rawData.uncategorized.related_inspectors,
      所属班次: rawData.uncategorized.related_shifts
    };

    systemInfo.value = {
      提交单号: row._id,
      提交时间: new Date(rawData.created_at).toLocaleString("zh-CN", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false
      }),
      提交人: await getUserById(rawData.created_by).then(res => res.data?.data?.name || "-")
    };

    const { groupedDetails: grouped, eSignature: signature } = parseFormDocument(rawData);
    groupedDetails.value = grouped;
    eSignature.value = signature;
    dialogVisible.value = true;
  } catch (err) {
    console.error("Error in openDetailsDialog:", err);
  }
}

async function deleteRecord(row) {
  try {
    await ElMessageBox.confirm(
        translateWithParams("FormDataSummary.recordTable.deleteConfirmMessage", { id: row._id }),
        translate("FormDataSummary.recordTable.deleteConfirmTitle"),
        {
          confirmButtonText: translate("FormDataSummary.confirm"),
          cancelButtonText: translate("FormDataSummary.cancel"),
          type: "warning"
        }
    );
    await deleteTaskSubmissionLog(row._id, props.selectedForm.qcFormTemplateId, row["提交时间"]);
    ElMessage.success(translate("FormDataSummary.recordTable.deleteSuccess"));
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      ElMessage.error(translate("FormDataSummary.recordTable.deleteFailed"));
    } else {
      ElMessage.info(translate("FormDataSummary.recordTable.deleteCanceled"));
    }
  }
}

async function viewDetails(row) {
  try {
    const createdAt = new Date(row["提交时间"]);
    const yearMonth = createdAt.getFullYear().toString() + (createdAt.getMonth() + 1).toString().padStart(2, "0");
    const collectionName = `form_template_${props.selectedForm.qcFormTemplateId}_${yearMonth}`;
    const response = await getMyDocument(row._id, props.selectedForm.qcFormTemplateId, row.created_by, collectionName);
    const rawData = response.data;

    basicInfo.value = {
      涉及产品: rawData.uncategorized.related_products,
      涉及批次: rawData.uncategorized.related_batches,
      质检人员: rawData.uncategorized.related_inspectors,
      所属班次: rawData.uncategorized.related_shifts
    };

    systemInfo.value = {
      提交单号: row._id,
      提交时间: new Date(rawData.created_at).toLocaleString("zh-CN", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false
      }),
      提交人: await getUserById(rawData.created_by).then(res => res.data?.data?.name || "-")
    };

    const { groupedDetails: grouped, eSignature: signature } = parseFormDocument(rawData);
    groupedDetails.value = grouped;
    eSignature.value = signature;
    dialogVisible.value = true;
  } catch (err) {
    console.error("Error in viewDetails:", err);
  }
}

function exportRecordsToExcel() {
  if (!props.records.length) {
    ElMessage.warning(translate("FormDataSummary.messages.noExcelData"));
    return;
  }

  exportQcRecordsToExcel({
    records: props.records,
    label: props.selectedForm.label,
    translate
  });

  ElMessage.success(translate("FormDataSummary.messages.exportExcelSuccess"));
}

async function handleDateRangeChange() {
  if (!this.dateRange || this.dateRange.length !== 2) return;

  const formTemplateId = this.selectedForm ? this.selectedForm.qcFormTemplateId : null;
  const formatDate = (date) => date.toISOString().slice(0, 19).replace("T", " ");
  const startDateTime = formatDate(this.dateRange[0]);
  const endDateTime = formatDate(this.dateRange[1]);

  await this.fetchQcRecordsData(formTemplateId, startDateTime, endDateTime);
}

</script>

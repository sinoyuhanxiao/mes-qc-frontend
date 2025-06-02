<template>
  <el-dialog v-model="visible" title="导出质量报告" width="400px" @close="resetFilters">
    <div class="filter-fields">
      <el-date-picker
          v-model="filters.dateRange"
          type="daterange"
          unlink-panels
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :shortcuts="shortcuts"
          style="width: 94.5%;"
      />

      <el-select v-model="filters.teamId" placeholder="选择班组" filterable clearable>
        <el-option v-for="team in teamOptions" :key="team.id" :label="team.name" :value="team.id" />
      </el-select>

      <el-select v-model="filters.shiftId" placeholder="选择班次" filterable clearable>
        <el-option v-for="shift in shifts" :key="shift.id" :label="shift.name" :value="shift.id" />
      </el-select>

      <el-select v-model="filters.productId" placeholder="选择产品" filterable clearable>
        <el-option v-for="item in productOptions" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>

      <el-select v-model="filters.batchId" placeholder="选择批次" filterable clearable>
        <el-option v-for="item in batchOptions" :key="item.id" :label="item.code" :value="item.id" />
      </el-select>

      <div class="button-row">
        <el-button type="primary" @click="handleDocumentExport">导出</el-button>
        <el-button @click="visible = false">取消</el-button>
      </div>
    </div>
  </el-dialog>

  <DownloadProgress
      :visible="downloadingProgress.visible"
      :current="downloadingProgress.current"
      :total="downloadingProgress.total"
  />
</template>

<script setup>
  import {ref, reactive, onMounted, watch} from 'vue'
  import { getAllTeams } from '@/services/teamService'
  import { getAllShifts } from '@/services/shiftService'
  import { getAlActiveSuggestedProducts } from '@/services/production/suggestedProductService'
  import { getAllActiveSuggestedBatches } from '@/services/production/suggestedBatchService'
  import { getDocumentList, downloadPdfReport } from '@/services/summary/qcSummaryService'
  import { exportDocumentsToExcelZip, exportDocumentsToZip } from '@/utils/bulkExportUtil'
  import { convertDateRangeToUtc } from '@/utils/time_utils'
  import { ElMessage } from 'element-plus'
  import { translate } from '@/utils/i18n'
  import DownloadProgress from "@/components/export/DownloadProgress.vue";
  const downloadingProgress = reactive({ visible: false, total: 0, current: 0 });

  const props = defineProps({
    visible: Boolean,
    defaultTeamId: Number,
    defaultShiftId: Number,
    defaultDateRange: Array
  })
  const emit = defineEmits(['update:visible'])

  const visible = ref(props.visible)
  watch(() => props.visible, val => (visible.value = val))
  watch(visible, val => emit('update:visible', val))

  const filters = ref({
    productId: null,
    batchId: null,
    teamId: props.defaultTeamId ?? null,
    shiftId: props.defaultShiftId ?? null,
    dateRange: props.defaultDateRange ?? [],
  })

  const teamOptions = ref([])
  const shifts = ref([])
  const productOptions = ref([])
  const batchOptions = ref([])

  const shortcuts = [
    { text: '今天', value: [new Date(), new Date()] },
    { text: '最近7天', value: [new Date(Date.now() - 6 * 86400000), new Date()] },
    { text: '本月', value: [new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date()] }
  ]

  function resetFilters() {
    filters.value = { productId: null, batchId: null, teamId: null, shiftId: null, dateRange: [] }
  }

  function onProgress(current, total) {
    downloadingProgress.current = current;
    downloadingProgress.total = total;
    downloadingProgress.visible = true;
  }

  async function handleDocumentExport() {
    downloadingProgress.visible = true;
    downloadingProgress.total = 0;
    downloadingProgress.current = 0;
    const [startDateUtc, endDateUtc] = convertDateRangeToUtc(filters.value.dateRange);

    try {
      const res = await getDocumentList({
        start_date: startDateUtc,
        end_date: endDateUtc,
        team_id: filters.value.teamId,
        shift_id: filters.value.shiftId,
        product_id: filters.value.productId,
        batch_id: filters.value.batchId
      });

      // Set total to document count + 1 (for the summary PDF)
      const docs = res.data.data;
      downloadingProgress.total = docs.length + 1;
      downloadingProgress.current = 0;
      downloadingProgress.visible = true;

      await exportDocumentsToZip(docs, translate, onProgress);         // PDF
      await exportDocumentsToExcelZip(docs, translate, onProgress);    // Excel

      // Export AI summary report
      await downloadPdfReport({
        start_date: startDateUtc,
        end_date: endDateUtc,
        team_id: filters.value.teamId,
        shift_id: filters.value.shiftId,
        product_id: filters.value.productId,
        batch_id: filters.value.batchId
      });

      // update the current
      downloadingProgress.current = downloadingProgress.total;
      downloadingProgress.visible = false;
    } catch (err) {
      console.error("❌ 导出失败", err);
      downloadingProgress.visible = false;
    }
  }

  async function handleExport() {
    const [startDateUtc, endDateUtc] = convertDateRangeToUtc(filters.value.dateRange)

    try {
      const res = await getDocumentList({
        start_date: startDateUtc,
        end_date: endDateUtc,
        team_id: filters.value.teamId,
        shift_id: filters.value.shiftId,
        product_id: filters.value.productId,
        batch_id: filters.value.batchId
      })

      const docs = res.data.data
      const total = docs.length + 1

      await exportDocumentsToZip(docs, translate, onProgress)
      await exportDocumentsToExcelZip(docs, translate, onProgress)
      await downloadPdfReport({
        start_date: startDateUtc,
        end_date: endDateUtc,
        team_id: filters.value.teamId,
        shift_id: filters.value.shiftId,
        product_id: filters.value.productId,
        batch_id: filters.value.batchId
      })

      ElMessage.success('导出完成')
      visible.value = false
    } catch (e) {
      console.error(e)
      ElMessage.error('导出失败')
    }
  }

  async function loadFilters() {
    const [teamsRes, shiftsRes, productsRes, batchesRes] = await Promise.all([
      getAllTeams(),
      getAllShifts(),
      getAlActiveSuggestedProducts(),
      getAllActiveSuggestedBatches()
    ])

    teamOptions.value = teamsRes.data.data
    shifts.value = shiftsRes.data.data
    productOptions.value = productsRes.data
    batchOptions.value = batchesRes.data
  }


  onMounted(() => {
    loadFilters()
  })
</script>

<style scoped>
.filter-fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 10px;
}
.button-row {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}
</style>

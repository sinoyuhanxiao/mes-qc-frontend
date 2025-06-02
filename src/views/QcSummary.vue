<template>
  <div class="qc-summary-grid" v-loading="qcSummaryLoading">
    <!-- Header -->
    <div class="header-area" style="display: flex; justify-content: space-between; align-items: center;">
      <h2>质量汇总报告</h2>
      <div>
        <el-tooltip content="刷新" placement="top">
          <el-button
              class="refresh-button"
              type="primary"
              @click="loadSummary"
              circle
          >
            <el-icon><RefreshRight /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-area">
<!--      <el-select v-model="filters.formId" placeholder="表单类型" style="width: 150px">-->
<!--        <el-option label="原料检测" value="form1" />-->
<!--        <el-option label="成品检测" value="form2" />-->
<!--      </el-select>-->

      <!-- 班组 -->
      <el-select v-model="filters.teamId" placeholder="选择班组" filterable clearable style="width: 120px">
        <el-option
            v-for="team in teamOptions"
            :key="team.id"
            :label="team.name"
            :value="team.id"
        />
      </el-select>

      <!-- 班次 -->
      <el-select v-model="filters.shiftId" placeholder="选择班次" filterable clearable style="width: 100px">
        <el-option
            v-for="shift in shifts"
            :key="shift.id"
            :label="shift.name"
            :value="shift.id"
        />
      </el-select>

      <!-- 产品 -->
      <el-select v-model="filters.productId" placeholder="选择产品" filterable clearable style="width: 200px">
        <el-option
            v-for="item in productOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
        />
      </el-select>

      <!-- 批次号 -->
      <el-select v-model="filters.batchId" placeholder="选择批次" filterable clearable style="width: 150px">
        <el-option
            v-for="item in batchOptions"
            :key="item.id"
            :label="item.code"
            :value="item.id"
        />
      </el-select>

      <el-date-picker
          v-model="filters.dateRange"
          type="daterange"
          unlink-panels
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :shortcuts="shortcuts"
          :teleported="false"
          @blur="() => { }"
          style="width: 280px"
      />

      <el-radio-group v-model="filters.summaryType">
        <el-radio-button label="daily">日</el-radio-button>
        <el-radio-button label="weekly">周</el-radio-button>
        <el-radio-button label="monthly">月</el-radio-button>
      </el-radio-group>

      <el-button type="primary" style="margin-top: 0" @click="loadSummary">查询</el-button>
      <el-button type="warning" style="margin-top: 0; margin-left: 0" @click="resetFilters">重置</el-button>
    </div>

    <!-- Summary Cards -->
    <div class="card-area">
      <el-card class="summary-card">
        <el-statistic title="总检测批次" :value="animatedInt.total_batches" />
      </el-card>
      <el-card class="summary-card">
        <el-statistic title="异常批次" :value="animatedInt.abnormal_batches" />
      </el-card>
      <el-card :class="['summary-card', sourceSummary.batch_pass_rate < 0.8 ? 'danger-card' : '', sourceSummary.batch_pass_rate === 1 ? 'success-card' : '']">
      <el-statistic
            title="批次合格率（%）"
            :value="(sourceSummary.batch_pass_rate * 100).toFixed(1)"
      />
      </el-card>
      <el-card class="summary-card clickable-card" @click="scrollToSection('kpi-section')">
        <el-statistic title="总质检人员" :value="animatedInt.total_personnel" />
      </el-card>
      <el-card class="summary-card">
        <el-statistic title="总检测项目" :value="animatedInt.total_items" />
      </el-card>
      <el-card class="summary-card">
        <el-statistic title="异常项目" :value="animatedInt.abnormal_items" />
      </el-card>
      <el-card :class="['summary-card', sourceSummary.item_pass_rate < 0.8 ? 'danger-card' : '', sourceSummary.item_pass_rate === 1 ? 'success-card' : '']">
        <el-statistic
            title="项目合格率（%）"
            :value="(sourceSummary.item_pass_rate * 100).toFixed(1)"
        />
      </el-card>
    </div>

    <!-- Charts -->
    <div class="charts-area">
      <!-- 第一行 -->
      <el-card class="chart-box">
        <a @click="scrollToSection('tablePassRate')" class="chart-title-link">批次合格率趋势</a>
        <v-chart :option="chartBatchPassRateTrend" :autoresize="true" style="height: 360px; width: 100%;" />
      </el-card>
      <el-card class="chart-box">
        <a @click="scrollToSection('tableAbnormalTeam')" class="chart-title-link">班组质检项异常对比</a>
        <v-chart :option="chartTeamAbnormalComparison" :autoresize="true" style="height: 360px; width: 100%;" />
      </el-card>

      <!-- 第二行 -->
      <el-card class="chart-box">
        <a @click="scrollToSection('tableAbnormalField')" class="chart-title-link">异常类型分布</a>
        <v-chart :option="chartFieldAbnormalPie" :autoresize="true" style="height: 360px; width: 100%;" />
      </el-card>
      <el-card class="chart-box">
        <a @click="scrollToSection('tableAbnormalBatch')" class="chart-title-link">异常批次数对比</a>
        <v-chart :option="chartProductAbnormalBatches" :autoresize="true" style="height: 360px; width: 100%;" />
      </el-card>

      <!-- 第三行 -->
      <el-card class="chart-box">
        <a @click="scrollToSection('tableAbnormalHeatmap')" class="chart-title-link">产品 × 日期异常热力分布</a>
        <v-chart :option="chartHeatmapByProductDate" :autoresize="true" style="height: 360px; width: 100%;" />
      </el-card>
      <el-card class="chart-box">
        <a @click="scrollToSection('tableInspectorCount')" class="chart-title-link">人员检测项质检数量</a>
        <v-chart :option="chartInspectorFieldCount" :autoresize="true" style="height: 300px; width: 100%;" />
      </el-card>
    </div>

    <!-- 表格：批次合格率趋势 -->
    <el-card id="tablePassRate" class="chart-box">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>📊 批次合格率趋势</span>
          <el-tooltip content="导出为 Excel" placement="top">
            <el-icon style="cursor: pointer;" @click="exportPassRateToExcel"><Download /></el-icon>
          </el-tooltip>
        </div>
      </template>
      <el-table
          :data="paged(tablePassRateByDay, paginationPassRate)"
          size="large"
          border
          height="440"
          scrollbar-always-on
          :row-class-name="getSummaryRowClass"
      >
        <el-table-column label="日期" prop="snapshot_date" sortable />
        <el-table-column label="总批次" prop="total_batches" sortable />
        <el-table-column label="异常批次" prop="abnormal_batches" sortable />
        <el-table-column
            label="合格率"
        >
          <template #default="{ row }">{{ (row.pass_rate * 100).toFixed(2) }}%</template>
        </el-table-column>
      </el-table>
      <el-pagination
          v-model:current-page="paginationPassRate.page"
          :page-size="paginationPassRate.size"
          layout="prev, pager, next"
          :total="tablePassRateByDay.length"
          small
          background
          style="margin-top: 10px"
      />
    </el-card>

    <!-- 表格：班组异常检测项数 -->
    <el-card id="tableAbnormalTeam" class="chart-box">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>📊 班组异常检测项数</span>
          <el-tooltip content="导出为 Excel" placement="top">
            <el-icon style="cursor: pointer;" @click="exportAbnormalTeamToExcel"><Download /></el-icon>
          </el-tooltip>
        </div>
      </template>
      <el-table
          :data="paged(tableAbnormalByTeam, paginationTeam)"
          size="large"
          border
          height="440"
          scrollbar-always-on
          :row-class-name="getSummaryRowClass"
      >
        <el-table-column label="班组" prop="team_name" sortable />
        <el-table-column label="异常检测项" prop="abnormal_fields" sortable />
        <el-table-column label="正常检测项" prop="normal_fields" sortable />
        <el-table-column
            label="合格率"
        >
          <template #default="{ row }">{{ (row.pass_rate * 100).toFixed(2) }}%</template>
        </el-table-column>
      </el-table>
      <el-pagination
          v-model:current-page="paginationTeam.page"
          :page-size="paginationTeam.size"
          layout="prev, pager, next"
          :total="tableAbnormalByTeam.length"
          small
          background
          style="margin-top: 10px"
      />
    </el-card>

    <!-- 表格：异常检测项分布 -->
    <el-card id="tableAbnormalField" class="chart-box">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>📊 异常检测项分布</span>
          <el-tooltip content="导出为 Excel" placement="top">
            <el-icon style="cursor: pointer;" @click="exportAbnormalFieldToExcel"><Download /></el-icon>
          </el-tooltip>
        </div>
      </template>
      <el-table :data="paged(tableAbnormalRatioByFieldGrouped, paginationField)" size="large" border  height="440" scrollbar-always-on>
        <el-table-column label="检测项目" prop="label" sortable />
        <el-table-column label="异常数" prop="abnormal_count" sortable />
      </el-table>
      <el-pagination
          v-model:current-page="paginationField.page"
          :page-size="paginationField.size"
          layout="prev, pager, next"
          :total="tableAbnormalRatioByFieldGrouped.length"
          small
          background
          style="margin-top: 10px"
      />
    </el-card>

    <!-- 表格：异常批次数对比 -->
    <el-card id="tableAbnormalBatch" class="chart-box">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>📊 异常批次数对比</span>
          <el-tooltip content="导出为 Excel" placement="top">
            <el-icon style="cursor: pointer;" @click="exportAbnormalProductToExcel"><Download /></el-icon>
          </el-tooltip>
        </div>
      </template>
      <el-table
          :data="paged(tableAbnormalBatchesByProduct, paginationProduct)"
          size="large"
          border
          height="440"
          scrollbar-always-on
          :row-class-name="getSummaryRowClass"
      >
        <el-table-column label="产品名" prop="product_name" sortable />
        <el-table-column label="总批次" prop="total_batches" sortable />
        <el-table-column label="异常批次" prop="abnormal_batches" sortable />
        <el-table-column
            label="异常率"
            sortable
        >
          <template #default="{ row }">{{ (row.abnormal_ratio * 100).toFixed(2) }}%</template>
        </el-table-column>

      </el-table>
      <el-pagination
          v-model:current-page="paginationProduct.page"
          :page-size="paginationProduct.size"
          layout="prev, pager, next"
          :total="tableAbnormalBatchesByProduct.length"
          small
          background
          style="margin-top: 10px"
      />
    </el-card>

    <!-- 表格：产品 × 日期异常热力数据 -->
    <el-card id="tableAbnormalHeatmap" class="chart-box">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>📊 产品 × 日期异常数据数据</span>
          <el-tooltip content="导出为 Excel" placement="top">
            <el-icon style="cursor: pointer;" @click="exportAbnormalHeatmapToExcel"><Download /></el-icon>
          </el-tooltip>
        </div>
      </template>
      <el-table :data="paged(tableAbnormalHeatmap, paginationHeatmap)" size="large" border  height="440" scrollbar-always-on>
        <el-table-column label="日期" prop="snapshot_date" sortable />
        <el-table-column label="产品" prop="product_name" sortable />
        <el-table-column label="异常数" prop="abnormal_count" sortable />
      </el-table>
      <el-pagination
          v-model:current-page="paginationHeatmap.page"
          :page-size="paginationHeatmap.size"
          layout="prev, pager, next"
          :total="tableAbnormalHeatmap.length"
          small
          background
          style="margin-top: 10px"
      />
    </el-card>

    <!-- 表格：检验员检测项质检统计 -->
    <el-card id="tableInspectorCount" class="chart-box">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>📊 人员检测项质检统计</span>
          <el-tooltip content="导出为 Excel" placement="top">
            <el-icon style="cursor: pointer;" @click="exportInspectorCountToExcel"><Download /></el-icon>
          </el-tooltip>
        </div>
      </template>
      <el-table
          :data="paged(tableInspectionCountByPersonnel, paginationInspector)"
          size="large"
          border
          height="440"
          scrollbar-always-on
          :row-class-name="getSummaryRowClass"
      >
        <el-table-column label="检验员" prop="inspector_name" sortable />
        <el-table-column label="检测数" prop="inspection_count" sortable />
        <el-table-column label="正常数" prop="normal_count" sortable />
        <el-table-column label="异常数" prop="abnormal_count" sortable />
        <el-table-column
            label="合格率"
            sortable
        >
          <template #default="{ row }">{{ (row.pass_rate * 100).toFixed(2) }}%</template>
        </el-table-column>
      </el-table>
      <el-pagination
          v-model:current-page="paginationInspector.page"
          :page-size="paginationInspector.size"
          layout="prev, pager, next"
          :total="tableInspectionCountByPersonnel.length"
          small
          background
          style="margin-top: 10px"
      />
    </el-card>

    <!-- 表格：复检记录列表 -->
    <el-card id="tableRetestRecords" class="chart-box">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>📊 需要复检列表</span>
          <el-tooltip content="导出为 Excel" placement="top">
            <el-icon style="cursor: pointer;" @click="exportRetestRecordsToExcel"><Download /></el-icon>
          </el-tooltip>
        </div>
      </template>
      <el-table
          :data="paged(tableRetestRecords, paginationRetest)"
          size="large"
          border
          height="440"
          scrollbar-always-on
      >
        <el-table-column label="质检表单" width="200">
          <template #default="scope">
            <el-link
                type="primary"
                :underline="false"
                v-if="scope.row.qc_form_template_id"
                :href="`/form-display/${scope.row.qc_form_template_id}?usable=false&switchDisplayed=false`"
                target="_blank"
            >
              {{ scope.row.qc_form_template_name || '-' }}
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="审核人" prop="approver_name" :width="100" />
        <el-table-column label="备注" prop="comments" :width="240" />
        <el-table-column label="产品" prop="related_products" :width="200" />
        <el-table-column label="批次" prop="related_batches" :width="250" />
        <el-table-column label="班组" prop="related_teams" :width="100" />
        <el-table-column label="人员" prop="related_inspectors" :width="250" />
        <el-table-column label="班次" prop="related_shifts" :width="100" />
        <el-table-column label="操作" fixed="right" :width="100">
          <template #default="scope">
            <el-link type="primary" @click="viewDetails(scope.row)">
              查看
            </el-link>
          </template>
        </el-table-column>

      </el-table>
      <el-pagination
          v-model:current-page="paginationRetest.page"
          :page-size="paginationRetest.size"
          layout="prev, pager, next"
          :total="tableRetestRecords.length"
          small
          background
          style="margin-top: 10px"
      />
    </el-card>

    <!-- KPI Cards -->
    <div id="kpi-section" v-if="personnelKpi.length">
      <h3 style="margin-bottom: 10px">质检人员作业统计</h3>
      <div
          v-for="(row, idx) in groupedKpiRows"
          :key="'kpi-row-' + idx"
          class="kpi-area"
      >
        <el-card
            v-for="person in row"
            :key="person.inspector_id"
            class="kpi-card"
        >
          👤 {{ person.inspector_name }}：
          <span
              :class="{
        'danger-person': person.abnormal_rate > 0.5,
        'success-person': person.abnormal_rate === 0
      }"
          >
            异常率 {{
                      typeof person.abnormal_rate === 'number'
                          ? (person.abnormal_rate * 100).toFixed(1) + '%'
                          : '0.0%'
                    }}
          </span>，
          检测字段 {{ person.total_items_checked }}，
          共 {{ person.forms_submitted }} 张表
        </el-card>

      </div>
    </div>

    <div class="floating-download custom-download hoverable-icon">
      <el-tooltip content="导出报告" placement="left">
        <el-icon style="font-size: 30px;" @click="handleDocumentExport"><Download /></el-icon>
      </el-tooltip>
    </div>

    <el-backtop
        :right="60"
        :bottom="170"
        target=".content"
        style="z-index: 999;"
    >
      <div class="custom-backtop hoverable-icon">
        ⮝
      </div>
    </el-backtop>

  </div>

  <QcRecordDetailDialog
      :visible="dialogVisible"
      :selected-form="{ label: currentFormTemplateName }"
      :grouped-details="groupedDetails"
      :basic-info="basicInfo"
      :system-info="systemInfo"
      :e-signature="eSignature"
      :from-approval-page="true"
      @close="dialogVisible = false"
  />
</template>

<script setup>
import { getPersonnelKPI, getDocumentList } from '@/services/summary/qcSummaryService'
import { exportDocumentsToZip } from '@/utils/bulkExportUtil'
import {computed, nextTick, onMounted, reactive, ref, toRef} from 'vue';
import { watch } from 'vue';
import VChart from 'vue-echarts';
import {Download, RefreshRight} from "@element-plus/icons-vue";
import { useTransition } from '@vueuse/core'
import { convertDateRangeToUtc } from '@/utils/time_utils';

// Common fields API section
import { getAlActiveSuggestedProducts } from '@/services/production/suggestedProductService';
import { getAllActiveSuggestedBatches } from '@/services/production/suggestedBatchService';
import { getAllTeams } from '@/services/teamService';
import { getAllShifts } from '@/services/shiftService';

// Summary API section
import {
  getAbnormalHeatmap,
  getAbnormalRatioByField,
  getCardStats,
  getPassRateByDay
} from '@/services/summary/qcSummaryService'
import { getAbnormalByTeam } from '@/services/summary/qcSummaryService';
import { getAbnormalRatioByFieldGrouped } from '@/services/summary/qcSummaryService';
import { getAbnormalBatchesByProduct } from '@/services/summary/qcSummaryService';
import { getInspectionCountByPersonnel } from '@/services/summary/qcSummaryService';
import { getRetestRecords } from '@/services/summary/qcSummaryService';

// dialogs
import { useViewDetails } from '@/composables/useViewDetails'
// view details
const basicInfo = ref({})
const systemInfo = ref({})
const groupedDetails = ref({})
const eSignature = ref(null)
const dialogVisible = ref(false)
const currentFormTemplateName = ref('')
const { viewDetailsFromRetest } = useViewDetails(basicInfo, systemInfo, groupedDetails, eSignature, dialogVisible)

// Export Feature
import * as XLSX from 'xlsx';
import QcRecordDetailDialog from "@/components/common/qc/QcRecordDetailDialog.vue";
import {ElMessage} from "element-plus";
import {translate} from "@/utils/i18n";

const filters = ref({
  productId: null,
  batchId: null,
  teamId: null,
  shiftId: null,
  dateRange: [],
  summaryType: 'weekly'
});

const productOptions = ref([]);
const batchOptions = ref([]);
const teamOptions = ref([]);
const shifts = ref([]);
const personnelKpi = ref([])
const qcSummaryLoading = ref(false);
const chartDataReady = ref(false);
const loadingSummary = ref(false);
const groupedKpiRows = computed(() => {
  const rows = []
  for (let i = 0; i < personnelKpi.value.length; i += 2) {
    rows.push(personnelKpi.value.slice(i, i + 2))
  }
  return rows
})

const shortcuts = [
  { text: '今天', value: [new Date(), new Date()] },
  { text: '最近7天', value: [new Date(Date.now() - 6 * 86400000), new Date()] },
  { text: '本月', value: [new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date()] }
];

const sourceSummary = ref({
  total_batches: 0,
  abnormal_batches: 0,
  batch_pass_rate: 1,
  total_personnel: 0,
  total_items: 0,
  abnormal_items: 0,
  item_pass_rate: 1
})

// Apply transition
const animated = {
  total_batches: useTransition(toRef(sourceSummary.value, 'total_batches')),
  abnormal_batches: useTransition(toRef(sourceSummary.value, 'abnormal_batches')),
  batch_pass_rate: useTransition(toRef(sourceSummary.value, 'batch_pass_rate')),
  total_personnel: useTransition(toRef(sourceSummary.value, 'total_personnel')),
  total_items: useTransition(toRef(sourceSummary.value, 'total_items')),
  abnormal_items: useTransition(toRef(sourceSummary.value, 'abnormal_items')),
  item_pass_rate: useTransition(toRef(sourceSummary.value, 'item_pass_rate')),
}

// Round integers only
const animatedInt = {
  total_batches: computed(() => Math.round(animated.total_batches.value)),
  abnormal_batches: computed(() => Math.round(animated.abnormal_batches.value)),
  total_personnel: computed(() => Math.round(animated.total_personnel.value)),
  total_items: computed(() => Math.round(animated.total_items.value)),
  abnormal_items: computed(() => Math.round(animated.abnormal_items.value)),
}

// Leave rate fields as decimals
const animatedFloat = {
  batch_pass_rate: computed(() => {
    const val = animated.batch_pass_rate.value
    return typeof val === 'number' && !isNaN(val) ? val : 0
  }),
  item_pass_rate: computed(() => {
    const val = animated.item_pass_rate.value
    return typeof val === 'number' && !isNaN(val) ? val : 0
  }),
}

// column names and export section
const columnsPassRate = [
  { label: '日期', prop: 'snapshot_date' },
  { label: '总批次', prop: 'total_batches' },
  { label: '异常批次', prop: 'abnormal_batches' },
  { label: '合格率', prop: 'pass_rate' }
];

function exportPassRateToExcel() {
  exportTableToExcel(tablePassRateByDay.value, columnsPassRate, '批次合格率趋势', '批次合格率趋势.xlsx');
}

const columnsAbnormalTeam = [
  { label: '班组', prop: 'team_name' },
  { label: '异常检测项', prop: 'abnormal_fields' },
  { label: '正常检测项', prop: 'normal_fields' },
  { label: '合格率', prop: 'pass_rate' }
];

function exportAbnormalTeamToExcel() {
  exportTableToExcel(tableAbnormalByTeam.value, columnsAbnormalTeam, '班组异常检测项数', '班组异常检测项数.xlsx');
}

const columnsAbnormalField = [
  { label: '检测项目', prop: 'label' },
  { label: '异常数', prop: 'abnormal_count' }
];

function exportAbnormalFieldToExcel() {
  exportTableToExcel(tableAbnormalRatioByFieldGrouped.value, columnsAbnormalField, '异常检测项分布', '异常检测项分布.xlsx');
}

const columnsAbnormalProduct = [
  { label: '产品名', prop: 'product_name' },
  { label: '总批次', prop: 'total_batches' },
  { label: '异常批次', prop: 'abnormal_batches' },
  { label: '异常率', prop: 'abnormal_ratio' }
];

function exportAbnormalProductToExcel() {
  exportTableToExcel(tableAbnormalBatchesByProduct.value, columnsAbnormalProduct, '异常批次数对比', '异常批次数对比.xlsx');
}

const columnsAbnormalHeatmap = [
  { label: '日期', prop: 'snapshot_date' },
  { label: '产品', prop: 'product_name' },
  { label: '异常数', prop: 'abnormal_count' }
];

function exportAbnormalHeatmapToExcel() {
  exportTableToExcel(tableAbnormalHeatmap.value, columnsAbnormalHeatmap, '产品日期异常分布', '产品日期异常分布.xlsx');
}

const columnsInspectorCount = [
  { label: '检验员', prop: 'inspector_name' },
  { label: '检测数', prop: 'inspection_count' },
  { label: '正常数', prop: 'normal_count' },
  { label: '异常数', prop: 'abnormal_count' },
  { label: '合格率', prop: 'pass_rate' }
];

function exportInspectorCountToExcel() {
  exportTableToExcel(tableInspectionCountByPersonnel.value, columnsInspectorCount, '人员检测项质检统计', '人员检测项质检统计.xlsx');
}

const columnsRetestRecords = [
  { label: '表单名称', prop: 'qc_form_template_name' },
  { label: '审核人', prop: 'approver_name' },
  { label: '备注', prop: 'comments' },
  { label: '产品', prop: 'related_products' },
  { label: '批次', prop: 'related_batches' },
  { label: '班组', prop: 'related_teams' },
  { label: '人员', prop: 'related_inspectors' },
  { label: '班次', prop: 'related_shifts' }
]

function exportRetestRecordsToExcel() {
  exportTableToExcel(tableRetestRecords.value, columnsRetestRecords, '需复检列表', '需复检列表.xlsx');
}

// charts section
const chartBatchPassRateTrend = ref({
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    name: '日期',
    data: []
  },
  yAxis: {
    type: 'value',
    name: '合格率',
    nameTextStyle: {
      padding: [0, 20, 0, 0]
    },
    axisLabel: { formatter: '{value}%' }
  },
  series: [{ name: '合格率', type: 'line', data: [] }]
});

const chartTeamAbnormalComparison = ref({
  tooltip: { trigger: 'axis' },
  legend: { top: 10 },
  xAxis: {
    type: 'category',
    name: '班组',
    nameTextStyle: {
    },
    data: []
  },
  yAxis: {
    name: '异常数',
    nameTextStyle: {
      padding: [0, 20, 0, 0]
    },
    type: 'value'
  },
  series: []
});

const chartFieldAbnormalPie = ref({
  tooltip: { trigger: 'item' },
  legend: {
    top: 'bottom',
    left: 'center'
  },
  series: [{
    type: 'pie',
    radius: '60%',
    data: []
  }]
});

const chartProductAbnormalBatches = ref({
  tooltip: {},
  xAxis: {
    type: 'category',
    name: '产品',
    nameTextStyle: {
      padding: [10, 50, 0, 0]
    },
    data: [],
    axisLabel: {
      interval: 0,              // display all the labels
      rotate: 30,               // rotate clockwise 30°
      formatter: value => value.length > 7 ? value.slice(0, 7) + '…' : value  // cut too-long text
    }
  },
  yAxis: {
    type: 'value',
    name: '批次数',
    nameTextStyle: {
      padding: [0, 20, 0, 0]
    }
  },
  series: [{
    type: 'bar',
    data: [],
    itemStyle: { color: '#E6A23C' }
  }]
});

const chartHeatmapByProductDate = ref({
  tooltip: {},
  xAxis: { type: 'category', data: [] },
  yAxis: { type: 'category', data: [] },
  visualMap: { min: 0, max: 10, calculable: true, orient: 'horizontal', left: 'center' },
  series: [{ type: 'heatmap', data: [], label: { show: true } }]
});

const chartInspectorFieldCount = ref({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' }
  },
  legend: {},
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'value',
    name: '数量'
  },
  yAxis: {
    type: 'category',
    data: [],
    name: '质检人员'
  },
  series: [
    {
      name: '正常检测',
      type: 'bar',
      stack: 'total',
      label: { show: true },
      emphasis: { focus: 'series' },
      itemStyle: { color: '#409EFF' },
      data: []
    },
    {
      name: '异常检测',
      type: 'bar',
      stack: 'total',
      label: { show: true },
      emphasis: { focus: 'series' },
      itemStyle: { color: '#F56C6C' },
      data: []
    }
  ]
});

// table section
const tablePassRateByDay = ref([]);
const tableAbnormalByTeam = ref([]);
const tableAbnormalRatioByFieldGrouped = ref([]);
const tableAbnormalBatchesByProduct = ref([]);
const tableAbnormalHeatmap = ref([]);
const tableInspectionCountByPersonnel = ref([]);
const tableRetestRecords = ref([]);

// pagination
const paginationPassRate = ref({ page: 1, size: 10 });
const paginationTeam = ref({ page: 1, size: 10 });
const paginationField = ref({ page: 1, size: 10 });
const paginationProduct = ref({ page: 1, size: 10 });
const paginationHeatmap = ref({ page: 1, size: 10 });
const paginationInspector = ref({ page: 1, size: 10 });
const paginationRetest = ref({ page: 1, size: 10 });

function paged(source, { page, size }) {
  const start = (page - 1) * size;
  return source.slice(start, start + size);
}

function setDateRangeBySummaryType(type) {
  const today = new Date();
  if (type === 'daily') {
    filters.value.dateRange = [today, today];
  } else if (type === 'weekly') {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    filters.value.dateRange = [startOfWeek, today];
  } else if (type === 'monthly') {
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    filters.value.dateRange = [startOfMonth, today];
  }
}

function exportTableToExcel(data, columns, sheetName, fileName) {
  const exportData = data.map(item => {
    const row = {};
    columns.forEach(col => {
      row[col.label] = item[col.prop];
    });
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}

function getSummaryRowClass({ row }) {
  if (row.pass_rate !== undefined) {
    if (row.pass_rate === 1.0) {
      return 'success-row'
    }
    if (row.pass_rate < 0.8) {
      return 'warning-row'
    }
  }

  if (row.abnormal_ratio !== undefined && row.abnormal_ratio > 0.8) {
    return 'warning-row'
  }

  return ''
}


function resetFilters() {
  filters.value = {
    productId: null,
    batchId: null,
    teamId: null,
    shiftId: null,
    dateRange: [], // 清空先
    summaryType: 'weekly'
  }

  // 强制触发日期范围更新逻辑
  setTimeout(() => {
    setDateRangeBySummaryType(filters.value.summaryType)
    nextTick(() => {
      loadSummary()
    })
  }, 0)
}


function scrollToKpiSection() {
  const el = document.getElementById("kpi-section")
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" })
  }
}

// 加载下拉数据：产品、批次、班组
const fetchCommonFieldOptions = async () => {
  const productResp = await getAlActiveSuggestedProducts();
  const batchResp = await getAllActiveSuggestedBatches();
  const teamResp = await getAllTeams();

  productOptions.value = productResp.data || [];
  batchOptions.value = batchResp.data || [];
  teamOptions.value = teamResp.data.data || [];
};

// 加载班次数据（质检人员这页暂时不需要）
const fetchQcUsersAndShifts = async () => {
  const shiftResp = await getAllShifts();
  shifts.value = shiftResp.data.data || [];
};

async function loadSummary() {
  qcSummaryLoading.value = true;
  chartDataReady.value = false;
  try {
    const params = buildFilterParams();
    await Promise.all([
      fetchSummaryCards(params),
      loadBatchPassRateTrend(params),
      loadTeamAbnormalComparison(params),
      loadFieldAbnormal(params),
      loadProductBatchesAbnormal(params),
      loadProductDate(params),
      loadInspectorFieldCount(params),
      loadPersonnelKpi(params),
      loadRetestRecords(params)
    ]);
    chartDataReady.value = true;
  } catch (e) {
    console.error('加载图表失败：', e);
  } finally {
    qcSummaryLoading.value = false;
  }
}


async function loadPersonnelKpi(params) {
  const res = await getPersonnelKPI(params)
  personnelKpi.value = res.data
}

async function fetchSummaryCards() {
  loadingSummary.value = true;
  const params = buildFilterParams();
  const res = await getCardStats(params);
  if (res?.data?.length) {
    Object.assign(sourceSummary.value, res.data[0])
  }
  loadingSummary.value = false;
}

function buildFilterParams() {
  const [startDateUtc, endDateUtc] = convertDateRangeToUtc(filters.value.dateRange);

  return {
    start_date: startDateUtc,
    end_date: endDateUtc,
    team_id: filters.value.teamId,
    shift_id: filters.value.shiftId,
    product_id: filters.value.productId,
    batch_id: filters.value.batchId
  };
}
async function loadBatchPassRateTrend(params) {
  const res = await getPassRateByDay(params);
  chartBatchPassRateTrend.value.xAxis.data = res.data.map(item => item.snapshot_date);
  chartBatchPassRateTrend.value.series[0].data = res.data.map(item =>
      (item.pass_rate * 100).toFixed(2)
  );
  tablePassRateByDay.value = res.data;
}

async function loadTeamAbnormalComparison(params) {
  const res = await getAbnormalByTeam(params);
  const data = res.data;
  chartTeamAbnormalComparison.value.xAxis.data = data.map(d => d.team_name);
  chartTeamAbnormalComparison.value.series = [
    {
      name: '正常数',
      type: 'bar',
      stack: 'total',
      data: data.map(d => d.normal_fields),
      itemStyle: { color: '#5470c6' }
    },
    {
      name: '异常数',
      type: 'bar',
      stack: 'total',
      data: data.map(d => d.abnormal_fields),
      itemStyle: { color: '#F56C6C' }
    }
  ];
  tableAbnormalByTeam.value = data;
}

async function loadFieldAbnormal(params) {
  // 表格用原始数据（不合并）
  const tableData = await getAbnormalRatioByField(params);
  tableAbnormalRatioByFieldGrouped.value = tableData.data;

  // 图表用分组数据（合并为"其他"）
  const chartData = await getAbnormalRatioByFieldGrouped(params);
  chartFieldAbnormalPie.value.series[0].data = chartData.data.map(item => ({
    name: item.label,
    value: item.abnormal_count
  }));
}

async function loadProductBatchesAbnormal(params) {
  const res = await getAbnormalBatchesByProduct(params);
  const data = res.data.slice(0, 5); // TODO: 暂时读5条
  chartProductAbnormalBatches.value.xAxis.data = data.map(item => item.product_name);
  chartProductAbnormalBatches.value.series[0].data = data.map(item => item.abnormal_batches);
  tableAbnormalBatchesByProduct.value = res.data;
}

async function loadProductDate(params) {
  const res = await getAbnormalHeatmap(params);
  const raw = res.data;

  if (!raw || raw.length === 0) {
    chartHeatmapByProductDate.value.xAxis.data = [];
    chartHeatmapByProductDate.value.yAxis.data = [];
    chartHeatmapByProductDate.value.series[0].data = [];
    chartHeatmapByProductDate.value.visualMap.max = 10;
    tableAbnormalHeatmap.value = [];
    return;
  }

  const xDates = [...new Set(raw.map(item => item.snapshot_date))];
  const yProducts = [...new Set(raw.map(item => item.product_name))];

  chartHeatmapByProductDate.value.xAxis.data = xDates;
  chartHeatmapByProductDate.value.yAxis.data = yProducts;

  const data = raw.map(item => [
    xDates.indexOf(item.snapshot_date),
    yProducts.indexOf(item.product_name),
    item.abnormal_count
  ]);

  chartHeatmapByProductDate.value.series[0].data = data;

  const max = Math.max(...raw.map(item => item.abnormal_count));
  chartHeatmapByProductDate.value.visualMap.max = max || 10;

  tableAbnormalHeatmap.value = res.data;
}

async function loadInspectorFieldCount(params) {
  const res = await getInspectionCountByPersonnel(params);
  const topN = res.data.slice(0, 7);

  chartInspectorFieldCount.value.yAxis.data = topN.map(item => item.inspector_name);
  chartInspectorFieldCount.value.series[0].data = topN.map(item => item.normal_count);
  chartInspectorFieldCount.value.series[1].data = topN.map(item => item.abnormal_count);

  tableInspectionCountByPersonnel.value = res.data;
}

async function loadRetestRecords(params) {
  const res = await getRetestRecords(params);
  tableRetestRecords.value = res.data;
}

function scrollToSection(refName) {
  const el = document.getElementById(refName);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

async function viewDetails(row) {
    await viewDetailsFromRetest(row);
    currentFormTemplateName.value = row.qc_form_template_name;
    dialogVisible.value = true;
}

async function handleDocumentExport() {
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
    await exportDocumentsToZip(res.data.data, translate);
  } catch (err) {
    console.error("❌ 导出失败", err);
  }
}

watch(() => filters.value.summaryType, (newType) => {
  setDateRangeBySummaryType(newType);
});

onMounted(() => {
  fetchCommonFieldOptions(); // 加载产品、批次、班组
  fetchQcUsersAndShifts();  // 加载班次等
  setDateRangeBySummaryType(filters.value.summaryType); // 初始化日期范围
  nextTick(() => {
    loadSummary();
  });
});

</script>

<style scoped>
  .qc-summary-grid {
    display: grid;
    grid-template-rows: auto auto auto auto auto auto auto;
    gap: 10px;
    padding: 5px;
  }

  .header-area { display: flex; justify-content: space-between; align-items: center; }

  .filter-area {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }

  .card-area, .kpi-area {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 10px;
  }

  .summary-card, .kpi-card { text-align: center; font-weight: bold; }

  .charts-area {
    display: grid;
    grid-template-columns: repeat(2, 1fr); /* ✅ 明确 2 列 */
    gap: 20px;
  }

  @media (max-width: 900px) {
    .charts-area {
      grid-template-columns: 1fr; /* ✅ 小屏幕时单列堆叠 */
    }
  }

  .danger-card {
    background-color: var(--el-color-danger-light-9);
  }

  .success-card {
    background-color: var(--el-color-success-light-9);
  }

  .chart-box {
  }

  .export-area { display: flex; gap: 10px; justify-content: flex-end; }

  .refresh-button {
    width: 40px;
    height: 40px;
    font-size: 20px;
    background-color: #80cfff;
    border-color: #80cfff;
  }

  .refresh-button:hover {
    background-color: #66b5ff;
    border-color: #66b5ff;
    transform: rotate(360deg);
    transition: transform 0.3s ease-in-out, background-color 0.2s ease;
  }

  .export-button {
    background-color: var(--el-color-success);
    border-color: var(--el-color-success);
    color: white;
    size: 20px;
  }

  .export-button:hover {
    background-color: var(--el-color-success-dark-2);
    border-color: var(--el-color-success-dark-2);
    transform: scale(1.1);
    transition: transform 0.2s ease, background-color 0.2s ease;
  }

  .chart-title-link {
    cursor: pointer;
    color: black;
    transition: color 0.2s;
  }

  .chart-title-link:hover {
    color: #66b1ff;
  }

  :deep(.warning-row) {
    background-color: var(--el-color-warning-light-9) !important;
    color: #c0392b;
  }

  :deep(.success-row) {
    background-color: var(--el-color-success-light-9) !important;
    color: #1d7a44;
  }

  :deep(.danger-person) {
    color: #c0392b;
  }
  :deep(.success-person) {
    color: #36a363;
  }

  :deep(.el-statistic__head) {
    font-size: 13px;
    color: #333;
  }

  .clickable-card {
    cursor: pointer;
    transition: box-shadow 0.3s ease, transform 0.2s ease;
  }

  .clickable-card:hover {
    box-shadow: 0 0 12px rgba(64, 158, 255, 0.4);
    transform: translateY(-3px);
  }

  .export-float-button {
    position: fixed;
    right: 60px;
    bottom: 140px; /* 比 el-backtop 稍高 */
    background-color: var(--el-color-success);
    border-color: var(--el-color-success);
    color: white;
    z-index: 1000;
    box-shadow: 0 0 10px rgba(0,0,0,0.15);
    transition: transform 0.2s ease, background-color 0.2s ease;
  }

  .export-float-button:hover {
    background-color: var(--el-color-success-dark-2);
    border-color: var(--el-color-success-dark-2);
    transform: scale(1.1);
  }

  .custom-backtop {
    width: 55px !important;
    height: 55px !important;
    background-color: #409EFF;
    color: white;
    font-size: 30px;
    border-radius: 50% !important;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .custom-download {
    width: 55px !important;
    height: 55px !important;
    background-color: #67C23A;
    color: white;
    font-size: 30px;
    border-radius: 50% !important;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .el-backtop {
    width: 55px;
  }

  .floating-download {
    position: fixed;
    right: 60px;
    bottom: 80px;
    z-index: 999;
    cursor: pointer;
  }

  .hoverable-icon {
    transition: transform 0.3s, color 0.3s;
  }

  .hoverable-icon:hover {
    transform: scale(1.2);
  }
</style>

<template>
  <div class="qc-summary-grid">
    <!-- Header -->
    <div class="header-area" style="display: flex; justify-content: space-between; align-items: center;">
      <h2>质量汇总报告</h2>
      <el-tooltip content="刷新" placement="top">
        <el-button
            class="refresh-button"
            type="primary"
            circle
        >
          <el-icon><RefreshRight /></el-icon>
        </el-button>
      </el-tooltip>
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
      <el-card class="summary-card">总检测批次：{{ summary.totalBatches }}</el-card>
      <el-card class="summary-card">异常批次：{{ summary.abnormalBatches }}</el-card>
      <el-card class="summary-card">批次合格率：{{ summary.passRate }}%</el-card>
      <el-card class="summary-card">总质检人员：{{ 58 }}</el-card>
      <el-card class="summary-card">总检测项目：{{ summary.totalBatches }}</el-card>
      <el-card class="summary-card">异常项目：{{ summary.abnormalBatches }}</el-card>
      <el-card class="summary-card">项目合格率：{{ summary.passRate }}%</el-card>
    </div>

    <!-- Charts -->
    <div class="charts-area">
      <!-- 第一行 -->
      <el-card class="chart-box">
        <div>批次合格率趋势</div>
        <v-chart :option="chartBatchPassRateTrend " style="height: 260px; width: 100%;" />
      </el-card>
      <el-card class="chart-box">
        <div>班组质检项异常对比</div>
        <v-chart :option="chartTeamAbnormalComparison" style="height: 260px; width: 100%;" />
      </el-card>

      <!-- 第二行 -->
      <el-card class="chart-box">
        <div>异常类型分布</div>
        <v-chart :option="chartFieldAbnormalPie" style="height: 260px; width: 100%;" />
      </el-card>
      <el-card class="chart-box">
        <div>异常批次数对比</div>
        <v-chart :option="chartProductAbnormalBatches" style="height: 260px; width: 100%;" />
      </el-card>

      <!-- 第三行 -->
      <el-card class="chart-box">
        <div>产品 × 日期异常热力分布</div>
        <v-chart :option="chartHeatmapByProductDate" style="height: 360px; width: 100%;" />
      </el-card>
      <el-card class="chart-box">
        <div>检验员字段质检数量</div>
        <v-chart :option="chartInspectorInspectionCount" style="height: 260px; width: 100%;" />
      </el-card>
    </div>

    <!-- Dynamic Table -->
  <el-table :data="tableData" border stripe style="margin-top: 20px">
    <el-table-column label="日期" prop="date" />
    <el-table-column label="班组" prop="team" />
    <el-table-column label="SKU" prop="sku" />
    <el-table-column label="检验员" prop="inspector" />
    <el-table-column label="水分 (%)" prop="moisture" />
    <el-table-column label="灰分 (%)" prop="ash" />
    <el-table-column label="粘度 (mPa·s)" prop="viscosity" />
    <el-table-column label="PH值" prop="ph" />
    <el-table-column label="还原糖 (%)" prop="reducing_sugar" />
    <el-table-column label="蛋白质 (%)" prop="protein" />
    <el-table-column label="异常数" prop="abnormal" />
    <el-table-column label="是否合格" prop="qualified">
      <template #default="{ row }">
        <el-tag :type="row.qualified ? 'success' : 'danger'">
          {{ row.qualified ? '合格' : '不合格' }}
        </el-tag>
      </template>
    </el-table-column>
  </el-table>


    <!-- KPI Cards -->
    <div class="kpi-area">
      <el-card class="kpi-card">👤 赵建国：检测完成率 96%，异常率 4%，共 56 张表</el-card>
      <el-card class="kpi-card">👤 罗勇：检测完成率 90%，异常率 10%，共 63 张表</el-card>
    </div>
    <div class="kpi-area">
      <el-card class="kpi-card">👤 刘芳：检测完成率 98%，异常率 2%，共 49 张表</el-card>
      <el-card class="kpi-card">👤 王磊：检测完成率 92%，异常率 8%，共 58 张表</el-card>
    </div>
    <div class="kpi-area">
      <el-card class="kpi-card">👤 陈静：检测完成率 95%，异常率 5%，共 61 张表</el-card>
      <el-card class="kpi-card">👤 杨洋：检测完成率 97%，异常率 3%，共 53 张表</el-card>
    </div>
    <div class="kpi-area">
      <el-card class="kpi-card">👤 孙超：检测完成率 88%，异常率 12%，共 47 张表</el-card>
      <el-card class="kpi-card">👤 高峰：检测完成率 93%，异常率 7%，共 50 张表</el-card>
    </div>
    <div class="kpi-area">
      <el-card class="kpi-card">👤 丁洁：检测完成率 91%，异常率 9%，共 60 张表</el-card>
      <el-card class="kpi-card">👤 黄磊：检测完成率 94%，异常率 6%，共 52 张表</el-card>
    </div>

    <!-- Export Buttons -->
    <div class="export-area">
      <el-button type="success">导出 Excel</el-button>
      <el-button type="info">导出 PDF</el-button>
    </div>
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue';
import { watch } from 'vue';
import VChart from 'vue-echarts';
import {RefreshRight} from "@element-plus/icons-vue";

// Common fields API section
import { getAlActiveSuggestedProducts } from '@/services/production/suggestedProductService';
import { getAllActiveSuggestedBatches } from '@/services/production/suggestedBatchService';
import { getAllTeams } from '@/services/teamService';
import { getAllShifts } from '@/services/shiftService';

// Summary API section
import {getAbnormalHeatmap, getPassRateByDay} from '@/services/summary/qcSummaryService'
import { getAbnormalByTeam } from '@/services/summary/qcSummaryService';
import { getAbnormalRatioByFieldGrouped } from '@/services/summary/qcSummaryService';
import { getAbnormalBatchesByProduct } from '@/services/summary/qcSummaryService';

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
const chartLoading = ref(false);

const shortcuts = [
  { text: '今天', value: [new Date(), new Date()] },
  { text: '最近7天', value: [new Date(Date.now() - 6 * 86400000), new Date()] },
  { text: '本月', value: [new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date()] }
];

const summary = ref({
  totalBatches: 120,
  abnormalBatches: 6,
  passRate: 95.0,
  updateTime: '2025-05-23 14:00'
});

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

const chartInspectorInspectionCount = ref({
  tooltip: {},
  xAxis: { type: 'category', data: [] },
  yAxis: { type: 'value' },
  series: [{ type: 'bar', data: [] }]
});

const tableData = ref([
  { date: '5月16日', team: '微生物A班', sku: 'SKU001', inspector: '赵建国', moisture: 12.3, ash: 1.1, viscosity: 105, ph: 6.8, reducing_sugar: 4.2, protein: 2.1, abnormal: 1, qualified: false },
  { date: '5月17日', team: '原料B班', sku: 'SKU002', inspector: '罗勇', moisture: 11.5, ash: 0.9, viscosity: 115, ph: 6.9, reducing_sugar: 3.8, protein: 1.9, abnormal: 2, qualified: false },
  { date: '5月18日', team: '辅料C班', sku: 'SKU003', inspector: '刘芳', moisture: 10.9, ash: 1.2, viscosity: 108, ph: 7.0, reducing_sugar: 4.0, protein: 2.3, abnormal: 0, qualified: true },
  { date: '5月18日', team: '微生物A班', sku: 'SKU001', inspector: '赵建国', moisture: 12.0, ash: 1.0, viscosity: 100, ph: 6.7, reducing_sugar: 4.1, protein: 2.0, abnormal: 1, qualified: false },
  { date: '5月18日', team: '原料B班', sku: 'SKU002', inspector: '罗勇', moisture: 11.2, ash: 0.8, viscosity: 120, ph: 6.6, reducing_sugar: 3.5, protein: 2.1, abnormal: 0, qualified: true },
  { date: '5月18日', team: '辅料C班', sku: 'SKU003', inspector: '刘芳', moisture: 10.8, ash: 1.3, viscosity: 110, ph: 7.1, reducing_sugar: 3.9, protein: 2.4, abnormal: 0, qualified: true },
  { date: '5月16日', team: '微生物A班', sku: 'SKU001', inspector: '赵建国', moisture: 12.5, ash: 1.1, viscosity: 107, ph: 6.9, reducing_sugar: 4.4, protein: 2.2, abnormal: 1, qualified: false },
  { date: '5月17日', team: '原料B班', sku: 'SKU002', inspector: '罗勇', moisture: 11.4, ash: 0.7, viscosity: 113, ph: 6.8, reducing_sugar: 3.6, protein: 2.0, abnormal: 2, qualified: false },
  { date: '5月18日', team: '辅料C班', sku: 'SKU003', inspector: '刘芳', moisture: 10.7, ash: 1.4, viscosity: 112, ph: 7.0, reducing_sugar: 3.7, protein: 2.5, abnormal: 0, qualified: true },
  { date: '5月16日', team: '微生物A班', sku: 'SKU001', inspector: '赵建国', moisture: 12.2, ash: 1.0, viscosity: 106, ph: 6.6, reducing_sugar: 4.0, protein: 2.3, abnormal: 1, qualified: false }
]);

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

function resetFilters() {
  filters.value = {
    productId: null,
    batchId: null,
    teamId: null,
    shiftId: null,
    dateRange: [],
    summaryType: 'weekly'
  };
  setDateRangeBySummaryType('weekly'); // 同步默认日期
  loadSummary(); // ⏬重置后立即刷新数据
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
  chartLoading.value = true;
  try {
    const params = buildFilterParams();
    await Promise.all([
      loadBatchPassRateTrendChart(params),
      loadTeamAbnormalComparisonChart(params),
      loadFieldAbnormalPieChart(params),
      loadProductBatchesAbnormalChart(params),
      loadProductDateHeatmapChart(params)
    ]);
  } catch (e) {
    console.error('加载图表失败：', e);
  } finally {
    chartLoading.value = false;
  }
}

function buildFilterParams() {
  return {
    start_date: filters.value.dateRange?.[0]?.toISOString().split('T')[0],
    end_date: filters.value.dateRange?.[1]?.toISOString().split('T')[0],
    team_id: filters.value.teamId,
    shift_id: filters.value.shiftId,
    product_id: filters.value.productId,
    batch_id: filters.value.batchId
  };
}

async function loadBatchPassRateTrendChart(params) {
  const res = await getPassRateByDay(params);
  chartBatchPassRateTrend.value.xAxis.data = res.data.map(item => item.snapshot_date);
  chartBatchPassRateTrend.value.series[0].data = res.data.map(item =>
      (item.pass_rate * 100).toFixed(2)
  );
}

async function loadTeamAbnormalComparisonChart(params) {
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
}

async function loadFieldAbnormalPieChart(params) {
  const res = await getAbnormalRatioByFieldGrouped(params);
  chartFieldAbnormalPie.value.series[0].data = res.data.map(item => ({
    name: item.label,
    value: item.abnormal_count
  }));
}

async function loadProductBatchesAbnormalChart(params) {
  const res = await getAbnormalBatchesByProduct(params);
  const data = res.data.slice(0, 5); // TODO: 暂时读5条
  chartProductAbnormalBatches.value.xAxis.data = data.map(item => item.product_name);
  chartProductAbnormalBatches.value.series[0].data = data.map(item => item.abnormal_batches);
}

async function loadProductDateHeatmapChart(params) {
  const res = await getAbnormalHeatmap(params);
  const raw = res.data;

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

  // 自动调整 visualMap 最大值
  const max = Math.max(...raw.map(item => item.abnormal_count));
  chartHeatmapByProductDate.value.visualMap.max = max || 10;
}

watch(() => filters.value.summaryType, (newType) => {
  setDateRangeBySummaryType(newType);
});

onMounted(() => {
  fetchCommonFieldOptions(); // 加载产品、批次、班组
  fetchQcUsersAndShifts();  // 加载班次等
  setDateRangeBySummaryType(filters.value.summaryType); // 初始化日期范围
  loadSummary(); // 页面加载时自动加载汇总
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
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

.chart-box {
}

.export-area { display: flex; gap: 10px; justify-content: flex-end; }

.refresh-button {
  background-color: #80cfff;
  border-color: #80cfff;
}

.refresh-button:hover {
  background-color: #66b5ff;
  border-color: #66b5ff;
  transform: rotate(360deg);
  transition: transform 0.3s ease-in-out, background-color 0.2s ease;
}

</style>

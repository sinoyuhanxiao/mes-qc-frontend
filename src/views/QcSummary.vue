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
      <el-card class="summary-card">更新时间：{{ summary.updateTime }}</el-card>
      <el-card class="summary-card">总检测项目：{{ summary.totalBatches }}</el-card>
      <el-card class="summary-card">异常项目：{{ summary.abnormalBatches }}</el-card>
      <el-card class="summary-card">项目合格率：{{ summary.passRate }}%</el-card>
      <el-card class="summary-card">更新时间：{{ summary.updateTime }}</el-card>
    </div>

    <!-- Charts -->
    <div class="charts-area">
      <!-- 第一行 -->
      <el-card class="chart-box">
        <div>① 批次合格率趋势</div>
        <v-chart :option="charts.line" style="height: 240px; width: 100%;" />
      </el-card>
      <el-card class="chart-box">
        <div>② 班组异常对比</div>
        <v-chart :option="charts.bar" style="height: 240px; width: 100%;" />
      </el-card>

      <!-- 第二行 -->
      <el-card class="chart-box">
        <div>③ 异常类型分布</div>
        <v-chart :option="charts.pie" style="height: 240px; width: 100%;" />
      </el-card>
      <el-card class="chart-box">
        <div>④ 产品异常批次统计</div>
        <v-chart :option="charts.productAbnormal" style="height: 240px; width: 100%;" />
      </el-card>

      <!-- 第三行 -->
      <el-card class="chart-box">
        <div>⑤ 产品 × 日期异常热力图</div>
        <v-chart :option="charts.heatmap" style="height: 240px; width: 100%;" />
      </el-card>
      <el-card class="chart-box">
        <div>⑥ 检验员字段质检数量</div>
        <v-chart :option="charts.inspector" style="height: 240px; width: 100%;" />
      </el-card>
    </div>

    <!-- Dynamic Table -->
    <el-table :data="tableData" border stripe style="margin-top: 20px">
      <el-table-column label="日期" prop="date" />
      <el-table-column label="班组" prop="team" />
      <el-table-column label="SKU" prop="sku" />
      <el-table-column label="水分" prop="moisture" />
      <el-table-column label="灰分" prop="ash" />
      <el-table-column label="异常数" prop="abnormal" />
    </el-table>

    <!-- KPI Cards -->
    <div class="kpi-area">
      <el-card class="kpi-card">👤 张三：准时率 96%，异常率 4%，共 56 张表</el-card>
      <el-card class="kpi-card">👤 李四：准时率 90%，异常率 10%，共 63 张表</el-card>
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
import { getAlActiveSuggestedProducts } from '@/services/production/suggestedProductService';
import { getAllActiveSuggestedBatches } from '@/services/production/suggestedBatchService';
import { getAllTeams } from '@/services/teamService';
import { getAllShifts } from '@/services/shiftService';

// API section
import { getPassRateByDay } from '@/services/summary/qcSummaryService'

const filters = ref({
  productId: null,
  batchId: null,
  teamId: null,
  shiftId: null,
  dateRange: [],
  summaryType: 'daily'
});

const productOptions = ref([]);
const batchOptions = ref([]);
const teamOptions = ref([]);
const shifts = ref([]);

const shortcuts = [
  { text: '今天', value: [new Date(), new Date()] },
  { text: '最近7天', value: [new Date(Date.now() - 6 * 86400000), new Date()] },
  { text: '本月', value: [new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date()] }
];

const summary = ref({
  totalBatches: 120,
  abnormalBatches: 6,
  passRate: 95.0,
  updateTime: '2025-05-20 14:00'
});

const charts = ref({
  line: {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: [] }, // ← 替换静态数据
    yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
    series: [{ name: '合格率', type: 'line', data: [] }] // ← 替换静态数据
  },
  bar: {
    tooltip: {},
    xAxis: { type: 'category', data: ['A班', 'B班', 'C班'] },
    yAxis: { type: 'value' },
    series: [{ name: '异常批次', type: 'bar', data: [2, 3, 1], barWidth: 30 }]
  },
  pie: {
    tooltip: { trigger: 'item' },
    legend: { top: 'center', left: 'right' },
    series: [{
      type: 'pie',
      radius: '60%',
      data: [
        { value: 4, name: '菌落数超标' },
        { value: 2, name: '水分偏低' }
      ]
    }]
  },
  productAbnormal: {
    tooltip: {},
    xAxis: { type: 'category', data: [] },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: [] }]
  },
  heatmap: {
    tooltip: {},
    xAxis: { type: 'category', data: [] },
    yAxis: { type: 'category', data: [] },
    visualMap: { min: 0, max: 10, calculable: true, orient: 'horizontal', left: 'center' },
    series: [{ type: 'heatmap', data: [], label: { show: true } }]
  },
  inspector: {
    tooltip: {},
    xAxis: { type: 'category', data: [] },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: [] }]
  }
});

const tableData = ref([
  { date: '5月16日', team: 'A班', sku: 'SKU001', moisture: 12.3, ash: 1.1, abnormal: 1 },
  { date: '5月17日', team: 'B班', sku: 'SKU002', moisture: 11.5, ash: 0.9, abnormal: 2 },
  { date: '5月18日', team: 'C班', sku: 'SKU003', moisture: 10.9, ash: 1.2, abnormal: 0 }
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
    summaryType: 'daily'
  };
  setDateRangeBySummaryType('daily'); // 同步默认日期
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
  console.log('查询条件：', filters.value);

  // ① 构造查询参数
  const params = {
    start_date: filters.value.dateRange?.[0]?.toISOString().split('T')[0],
    end_date: filters.value.dateRange?.[1]?.toISOString().split('T')[0],
    team_id: filters.value.teamId,
    shift_id: filters.value.shiftId,
    product_id: filters.value.productId,
    batch_id: filters.value.batchId
  };

  // ② 调用后端 API
  const res = await getPassRateByDay(params);
  const chartData = res.data;

  // ③ 更新合格率趋势图表
  charts.value.line.xAxis.data = chartData.map(item => item.snapshot_date);
  charts.value.line.series[0].data = chartData.map(item =>
      (item.pass_rate * 100).toFixed(2) // 百分比
  );
}

watch(() => filters.value.summaryType, (newType) => {
  setDateRangeBySummaryType(newType);
});

onMounted(() => {
  fetchCommonFieldOptions(); // 加载产品、批次、班组
  fetchQcUsersAndShifts();  // 加载班次等
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

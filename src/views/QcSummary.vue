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

      <el-select v-model="filters.team" placeholder="班组" style="width: 120px" clearable>
        <el-option label="成品检测组" value="A" />
        <el-option label="微生物组" value="B" />
      </el-select>

      <el-select v-model="filters.shift" placeholder="班次" style="width: 120px" clearable>
        <el-option label="早班" value="morning" />
        <el-option label="晚班" value="night" />
      </el-select>

      <el-input v-model="filters.sku" placeholder="产品" style="width: 120px" />
      <el-input v-model="filters.batch" placeholder="批次号" style="width: 120px" />

      <el-date-picker
          v-model="filters.dateRange"
          type="daterange"
          unlink-panels
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :shortcuts="shortcuts"
          style="width: 280px"
      />

      <el-radio-group v-model="filters.summaryType">
        <el-radio-button label="daily">日</el-radio-button>
        <el-radio-button label="weekly">周</el-radio-button>
        <el-radio-button label="monthly">月</el-radio-button>
      </el-radio-group>

      <el-button type="primary" style="margin-top: 0" @click="loadSummary">查询</el-button>
      <el-button type="warning" style="margin-top: 0; margin-left: 0" @click="loadSummary">重置</el-button>
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
      <el-card>
        <div>合格率趋势</div>
        <v-chart :option="charts.line" style="height: 200px" />
      </el-card>
      <el-card>
        <div>班组异常对比</div>
        <v-chart :option="charts.bar" style="height: 200px" />
      </el-card>
      <el-card>
        <div>异常类型分布</div>
        <v-chart :option="charts.pie" style="height: 200px" />
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
import { ref } from 'vue';
import VChart from 'vue-echarts';
import {RefreshRight} from "@element-plus/icons-vue";

const filters = ref({
  formId: '',
  dateRange: [],
  team: '',
  shift: '',
  sku: '',
  batch: '',
  summaryType: 'daily'
});

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
    xAxis: { type: 'category', data: ['5月16日', '5月17日', '5月18日', '5月19日', '5月20日'] },
    yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
    series: [{ name: '合格率', type: 'line', data: [92, 94, 96, 95, 97] }]
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
  }
});

const tableData = ref([
  { date: '5月16日', team: 'A班', sku: 'SKU001', moisture: 12.3, ash: 1.1, abnormal: 1 },
  { date: '5月17日', team: 'B班', sku: 'SKU002', moisture: 11.5, ash: 0.9, abnormal: 2 },
  { date: '5月18日', team: 'C班', sku: 'SKU003', moisture: 10.9, ash: 1.2, abnormal: 0 }
]);

function loadSummary() {
  console.log('查询条件：', filters.value);
}
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
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
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

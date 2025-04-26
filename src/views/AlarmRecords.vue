<template>
  <div class="alert-page-grid">
    <!-- Header -->
    <div class="header-area" style="display: flex; justify-content: space-between">
      <h2 style="margin-bottom: 20px;">告警记录</h2>
      <el-button style="margin-top: 20px; margin-right: 5px" @click="openSettingsDialog" circle>
        <el-icon :class="{ rotate: autoRefresh.statusKey === 1 }" :size="30" style="display: flex; align-items: center; justify-content: center;">
          <Setting />
        </el-icon>
      </el-button>
    </div>

    <!-- Filters -->
    <div class="filter-area">
      <div style="gap: 20px; display: flex; justify-content: space-around">
        <el-select v-model="filters.filterRiskLevel" placeholder="预警等级" clearable filterable style="width: 100px;">
          <el-option label="高风险" value="高风险" />
          <el-option label="中风险" value="中风险" />
          <el-option label="低风险" value="低风险" />
        </el-select>

        <el-select v-model="filters.filterStatus" placeholder="状态" clearable filterable style="width: 100px;">
          <el-option label="处理中" value="处理中" />
          <el-option label="已关闭" value="已关闭" />
        </el-select>

        <el-select v-model="filters.filterProduct" placeholder="产品名称" clearable filterable  style="width: 100px;">
          <el-option v-for="item in filters.productOptions" :key="item" :label="item" :value="item" />
        </el-select>

        <el-select v-model="filters.filterInspectionItem" placeholder="检测项" clearable filterable  style="width: 100px;">
          <el-option v-for="item in filters.inspectionOptions" :key="item" :label="item" :value="item" />
        </el-select>

        <el-date-picker
            v-model="filters.filterDateRange"
            type="datetimerange"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 300px;"
            @clear="filters.filterDateRange = []"
            clearable
        />
      </div>
      <div>

      </div>
      <div style="gap: 20px; display: flex; justify-content: space-around">
        <el-input
            v-model="filters.generalSearch"
            placeholder="搜索..."
            clearable
            style="width: 200px; align-items: center;"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="success" @click="exportTable" style="margin: 0px;">导出</el-button> <!-- 修改这行 -->
        <el-button type="primary" @click="fetchAlertRecords" style="margin: 0px;">刷新</el-button>
      </div>
    </div>

    <!-- Charts -->
    <div class="charts-area">
      <el-card>
        <div>状态统计</div>
        <v-chart :option="statusPieOption" autoresize style="height: 140px;" />
      </el-card>
      <el-card>
        <div>风险等级统计</div>
        <v-chart :option="riskPieOption" autoresize style="height: 140px;" />
      </el-card>
      <el-card>
        <div>Top 3 告警产品</div>
        <v-chart :option="productBarOption" autoresize style="height: 140px;" />
      </el-card>
      <el-card>
        <div>Top 3 告警检测项</div>
        <v-chart :option="inspectionBarOption" autoresize style="height: 140px;" />
      </el-card>

    </div>

    <!-- Alert Records Table -->
    <el-table
        class="table-area"
        v-loading="table.loading"
        :data="paginatedAlerts"
        style="width: 100%; flex: 1 1 auto;"
        @sort-change="handleSortChange"
        :allow-drag-last-column="true"
        :row-class-name="renderRows"
    >
      <el-table-column label="告警编号" prop="alert_code" width="150" fixed="left">
        <template #default="scope">
          <span>{{ scope.row.alert_code }}</span>
        </template>
      </el-table-column>

      <el-table-column label="告警时间" prop="alert_time" width="180" sortable fixed="left">
        <template #default="scope">
          <span>{{ scope.row.alert_time }}</span>
        </template>
      </el-table-column>

      <el-table-column label="产品名称" prop="product_name" width="180" sortable>
        <template #default="scope">
          <el-tag>{{ scope.row.product_name }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="批次号" prop="batch_number" width="160" sortable />

      <el-table-column label="质检表单" prop="form_name" width="160" sortable />

      <el-table-column label="检测项" prop="inspection_item" width="180" sortable>
        <template #default="scope">
          {{ scope.row.inspection_item }} ({{ scope.row.unit }})
        </template>
      </el-table-column>

      <el-table-column label="检测值" prop="value" width="120" sortable>
        <template #default="scope">
          <span>{{ scope.row.value }}</span>
          <el-icon v-if="scope.row.value < scope.row.standard_min" style="color: #2c4cb3; margin-left: 4px;">
            <arrow-down-bold />
          </el-icon>
          <el-icon v-else-if="scope.row.value > scope.row.standard_max" style="color: #f46666; margin-left: 4px;">
            <arrow-up-bold />
          </el-icon>
        </template>
      </el-table-column>

      <el-table-column label="标准值范围" width="150">
        <template #default="scope">
          {{ scope.row.standard_min }} ~ {{ scope.row.standard_max }}
        </template>
      </el-table-column>

<!--      <el-table-column label="超限情况" prop="exceed_status" width="120">-->
<!--        <template #default="scope">-->
<!--          <el-tag :type="scope.row.exceed_status === '超标' ? 'danger' : 'success'">-->
<!--            {{ scope.row.exceed_status }}-->
<!--          </el-tag>-->
<!--        </template>-->
<!--      </el-table-column>-->

      <el-table-column label="RPN" prop="rpn" width="120" sortable>
        <template #header>
          <span>RPN</span>
          <el-tooltip content="点击查看 RPN 说明" placement="top">
            <el-icon style="cursor: pointer; margin-left: 5px;" @click.stop="dialogs.showRpnDialog = true">
              <QuestionFilled />
            </el-icon>
          </el-tooltip>
        </template>
        <template #default="scope">
          <el-input
              v-if="scope.row.isEditing"
              v-model="scope.row.rpn"
              size="small"
              style="width: 80px;"
          />
          <span v-else>{{ scope.row.rpn }}</span>
        </template>
      </el-table-column>

      <el-table-column label="预警等级" prop="risk_level" width="120" sortable>
        <template #default="scope">
          <el-tag :type="scope.row.risk_level === '高风险' ? 'danger' : scope.row.risk_level === '中风险' ? 'warning' : 'info'">
            {{ scope.row.risk_level }}
          </el-tag>
        </template>
      </el-table-column>


      <el-table-column label="质检人" prop="inspector" width="120">
        <template #default="scope">
          <span>{{ scope.row.inspector }}</span>
        </template>
      </el-table-column>

      <el-table-column label="审核人" prop="reviewer" width="120">
        <template #default="scope">
          <span>{{ scope.row.reviewer }}</span>
        </template>
      </el-table-column>

      <el-table-column label="状态" prop="status" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.status === '处理中' ? 'warning' : 'success'">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" fixed="right" width="200" align="center">
        <template #default="scope">
          <el-button size="small" type="primary" @click="viewDetails(scope.row)">查看</el-button>
          <el-button
              size="small"
              :type="scope.row.isEditing ? 'success' : 'plain'"
              @click="toggleEditRpn(scope.row)"
          >
            {{ scope.row.isEditing ? '保存' : '修改' }}
          </el-button>
          <el-button size="small" type="danger" @click="deleteRecord(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <el-pagination
        class="pager-area"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="pagination.currentPage"
        :page-size="pagination.pageSize"
        :page-sizes="[10, 20, 30, 50]"
        layout="total, sizes, prev, pager, next"
        :total="filteredAlerts.length"
    />
  </div>

  <el-dialog title="风险优先数 (RPN) 说明" v-model="dialogs.showRpnDialog" width="600px">
    <p><strong>RPN = 严重度 (Severity) × 发生概率 (Occurrence) × 检测难度 (Detection)</strong></p>
    <ul>
      <li><strong>严重度</strong>：失效发生后的严重程度，评分 1-10。</li>
      <li><strong>发生概率</strong>：失效发生的可能性，评分 1-10。</li>
      <li><strong>检测难度</strong>：在出厂前发现失效的难度，评分 1-10。</li>
    </ul>
    <p><strong>风险等级划分：</strong></p>
    <ul>
      <li>≥ 200 → 高风险</li>
      <li>100 - 199 → 中风险</li>
      <li>< 100 → 低风险</li>
    </ul>
  </el-dialog>

  <el-dialog title="设置" v-model="dialogs.showSettingsDialog" width="350px" @close="resetSettings">
    <el-form label-width="120px" style="padding-top: 20px">
      <el-form-item label="当前刷新状态">
        <el-tag :type="autoRefresh.statusSetting[autoRefresh.statusKey][1]">{{ autoRefresh.statusSetting[autoRefresh.statusKey][0] }}</el-tag> <!-- 添加这行 -->
      </el-form-item>
      <el-form-item label="启用自动刷新">
        <el-switch v-model="autoRefresh.enabled" />
      </el-form-item>
      <el-form-item label="自动刷新秒数">
        <el-input-number
            v-model="autoRefresh.interval"
            :min="autoRefresh.min"
            :max="autoRefresh.max"
            :disabled="!autoRefresh.enabled"
        />
        <div style="color: rgba(255,0,0,0.5);">
          {{autoRefresh.min}}秒 - {{autoRefresh.max}}秒之间
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogs.showSettingsDialog = false">关闭</el-button>
      <el-button type="primary" @click="applyAlarmSetting">应用</el-button>  <!-- 添加这行: 应用按钮 -->
    </template>
  </el-dialog>

</template>

<script>
import Mock from 'mockjs';
import { use } from "echarts/core";
import { PieChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import VChart from "vue-echarts";
import {ArrowDownBold, ArrowUpBold, QuestionFilled, Search, Setting} from "@element-plus/icons-vue";

use([PieChart, CanvasRenderer]);

export default {
  name: 'AlertRecordsTable',
  components: {ArrowUpBold, ArrowDownBold, Setting, QuestionFilled, Search, VChart },
  data() {
    return {
      // 表格数据
      table: {
        alertRecords: [],
        loading: false,
        indexesForEdit: {}
      },

      // 分页和排序
      pagination: {
        currentPage: 1,
        pageSize: 10,
        sortSettings: { prop: '', order: '' }
      },

      // 过滤条件
      filters: {
        filterRiskLevel: '',
        filterStatus: '',
        filterProduct: '',
        filterInspectionItem: '',
        filterDateRange: [],
        generalSearch: '',
        productOptions: ['产品A', '产品B', '产品C'],
        inspectionOptions: ['检测项1', '检测项2', '检测项3']
      },

      // 弹窗控制
      dialogs: {
        showRpnDialog: false,
        showSettingsDialog: false
      },

      // 自动刷新设置
      autoRefresh: {
        enabled: true,
        interval: 60,
        timer: null,
        min: 10,
        max: 3600,
        enabledTemp: false,
        intervalTemp: 60,
        statusKey: 1,
        statusSetting: {
          1: ['正常', 'success'],
          2: ['已停止', 'info'],
          3: ['编辑中被停止', 'warning']
        }
      }
    };
  },
  computed: {
    pausedByEdit() {
      return Object.values(this.table.indexesForEdit).some(list => list.length > 0);
    },
    filteredAlerts() {
      let data = this.table.alertRecords;
      if (this.filters.filterProduct) {
        data = data.filter(item => item.product_name === this.filters.filterProduct);
      }
      if (this.filters.filterInspectionItem) {
        data = data.filter(item => item.inspection_item === this.filters.filterInspectionItem);
      }
      if (this.filters.filterRiskLevel) {
        data = data.filter(item => item.risk_level === this.filters.filterRiskLevel);
      }
      if (this.filters.filterStatus) {
        data = data.filter(item => item.status === this.filters.filterStatus);
      }
      if (this.filters.generalSearch) {
        const keyword = this.filters.generalSearch.toLowerCase();
        data = data.filter(item =>
            Object.values(item).some(val =>
                String(val).toLowerCase().includes(keyword)
            )
        );
      }
      if (this.filters.filterDateRange.length === 2) {
        const [start, end] = this.filters.filterDateRange;
        data = data.filter(item => new Date(item.alert_time) >= new Date(start) && new Date(item.alert_time) <= new Date(end));
      }
      return data;
    },
    productBarOption() {
      const counts = {};
      this.filteredAlerts.forEach(item => {
        counts[item.product_name] = (counts[item.product_name] || 0) + 1;
      });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
      return {
        tooltip: {},
        grid: { top: 20, bottom: 20, left: 50, right: 20 },
        xAxis: { type: 'category', data: sorted.map(item => item[0]) },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', barWidth: 30, data: sorted.map(item => item[1]) }]
      };
    },
    inspectionBarOption() {
      const counts = {};
      this.filteredAlerts.forEach(item => {
        counts[item.inspection_item] = (counts[item.inspection_item] || 0) + 1;
      });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
      return {
        tooltip: {},
        grid: { top: 20, bottom: 20, left: 50, right: 20 },
        xAxis: { type: 'category', data: sorted.map(item => item[0]) },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', barWidth: 30, data: sorted.map(item => item[1]) }]
      };
    },
    paginatedAlerts() {
      const start = (this.pagination.currentPage - 1) * this.pagination.pageSize;
      return this.filteredAlerts.slice(start, start + this.pagination.pageSize);
    },
    statusPieOption() {
      return {
        tooltip: { trigger: 'item' },
        legend: { top: 'center', left: 'right', orient: 'vertical' },
        series: [{
          type: 'pie',
          radius: '70%',
          data: [
            { value: this.filteredAlerts.filter(item => item.status === '处理中').length, name: '处理中' },
            { value: this.filteredAlerts.filter(item => item.status === '已关闭').length, name: '已关闭' }
          ],
          label: { show: false },
          labelLine: { show: false }
        }]
      };
    },

    riskPieOption() {
      return {
        tooltip: { trigger: 'item' },
        legend: { top: 'center', left: 'right', orient: 'vertical' },
        color: ['#f46666', '#f1c07c', '#9ef476'],
        series: [{
          type: 'pie',
          radius: '70%',
          data: [
            { value: this.filteredAlerts.filter(item => item.risk_level === '高风险').length, name: '高风险' },
            { value: this.filteredAlerts.filter(item => item.risk_level === '中风险').length, name: '中风险' },
            { value: this.filteredAlerts.filter(item => item.risk_level === '低风险').length, name: '低风险' }
          ],
          label: { show: false },
          labelLine: { show: false }
        }]
      };
    }
  },
  watch: {
    'autoRefresh.enabled'(newVal) {
      this.updateRefreshStatus();
    },
    'table.indexesForEdit': {
      handler() {
        this.updateRefreshStatus();
      },
      deep: true
    }
  },
  methods: {
    fetchAlertRecords() {
      this.table.loading = true;
      setTimeout(() => {
        // 用 Mock.js 生成数据
        this.table.alertRecords = Mock.mock({
          'data|55': [{
            'id|+1': 1,
            'product_name': '@cword(3,5)薯条',
            'batch_number': 'B@date("yyyyMMdd")',
            'form_name': '@ctitle(4, 7)',
            'inspection_item': '@cword(3,6)',
            'value|80-200': 1,
            'unit': '@pick(["mg/L", "ppm", "℃", "%", "mL"])',
            'standard_min|80-100': 1,
            'standard_max|150-200': 1,
            'exceed_status': '@pick(["超标", "正常"])',
            'risk_level': '@pick(["高风险", "中风险", "低风险"])',
            'inspector': '@cname',
            'reviewer': '@cname',
            'status': '@pick(["处理中", "已关闭"])',
            'alert_time': '@datetime("yyyy-MM-dd HH:mm:ss")',
            'alert_code': function() {
              return `AL${Mock.Random.date('yyyyMMdd')}-${this.id}`;
            },
            'isEditing': false,
            'rpn': function() {
              const rpn = Mock.Random.integer(1, 1000);
              this.risk_level = rpn >= 200 ? '高风险' : rpn >= 100 ? '中风险' : '低风险';  // risk_level 赋值
              return rpn;  // 返回 RPN 数值
            }
          }]
        }).data;
        this.table.loading = false;

        this.table.indexesForEdit = {}
      }, 1000);
    },
    deleteRecord(row) {
      this.$confirm('确定要删除该记录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟删除（前后端分离：只操作前端数据）
        const index = this.table.alertRecords.findIndex(item => item.id === row.id);  // 通过 id 找位置
        if (index !== -1) {
          this.table.alertRecords.splice(index, 1);  // 删除该项
          this.$message.success('删除成功');
        }
      }).catch(() => {
        // 取消删除
      });
    },
    openSettingsDialog() {
      this.autoRefresh.enabledTemp = this.autoRefresh.enabled;
      this.autoRefresh.intervalTemp = this.autoRefresh.interval;
      this.dialogs.showSettingsDialog = true;
    },
    resetSettings() {
      this.autoRefresh.enabled = this.autoRefresh.enabledTemp;
      this.autoRefresh.interval = this.autoRefresh.intervalTemp;
    },
    exportTable() {
      console.log('导出假数据：', this.filteredAlerts);  // 模拟导出，后续可加 CSV/PDF
    },
    renderRows({ row, rowIndex }) {
      const currentPage = this.pagination.currentPage;
      const editIndexes = this.table.indexesForEdit[currentPage] || [];
      if (editIndexes.includes(rowIndex)) {
        return 'warning-row';
      }
      return '';
    },
    updateRefreshStatus() {
      const hasEdit = Object.values(this.table.indexesForEdit).some(list => list.length > 0);
      if (hasEdit) {
        this.autoRefresh.statusKey = 3;
      } else if (!this.autoRefresh.enabled) {
        this.autoRefresh.statusKey = 2;
      } else {
        this.autoRefresh.statusKey = 1;
      }
    },
    toggleEditRpn(row) {
      const index = this.paginatedAlerts.indexOf(row);
      const currentPage = this.pagination.currentPage;

      if (!this.table.indexesForEdit[currentPage]) {
        this.table.indexesForEdit[currentPage] = [];
      }

      this.autoRefresh.pausedByEdit = Object.values(this.table.indexesForEdit).some(list => list.length > 0);

      if (!row.isEditing) {
        row.isEditing = true;
        this.table.indexesForEdit[currentPage].push(index);
      } else {
        row.isEditing = false;
        const idx = this.table.indexesForEdit[currentPage].indexOf(index);
        if (idx !== -1) this.table.indexesForEdit[currentPage].splice(idx, 1);

        const oldRpn = row.rpn;
        const rpn = Number(row.rpn);
        row.risk_level = rpn >= 200 ? '高风险' : rpn >= 100 ? '中风险' : '低风险';
        this.$message({
          type: 'success',
          dangerouslyUseHTMLString: true,
          message: `保存成功，RPN值: <span style="color: #2c4cb3">${oldRpn}</span> → <span style="color: #f46666">${rpn}</span>`
        });
      }

      // 判断所有页 indexesForEdit 是否为空
      const isEditing = Object.values(this.table.indexesForEdit).some(arr => arr.length > 0);

      if (isEditing && this.autoRefresh.enabled && this.autoRefresh.timer) {  // 编辑中暂停刷新
        clearInterval(this.autoRefresh.timer);
        this.autoRefresh.timer = null;
        this.$message.warning('编辑中，自动刷新已暂停');
      } else if (!isEditing && this.autoRefresh.enabled && !this.autoRefresh.timer) {  // 无编辑恢复刷新
        this.autoRefresh.timer = setInterval(() => {
          this.fetchAlertRecords();
        }, this.autoRefresh.interval * 1000);
        this.$message.success('自动刷新已恢复');
      }
    },
    handleSortChange({ prop, order }) {
      this.pagination.sortSettings = { prop, order };
      if (prop && order) {
        const sorted = [...this.table.alertRecords].sort((a, b) => {
          const valA = a[prop];
          const valB = b[prop];
          return order === 'ascending' ? valA - valB : valB - valA;
        });
        this.table.alertRecords = sorted;
      }
    },
    handleSizeChange(size) {
      this.pagination.pageSize = size;
    },
    handleCurrentChange(page) {
      this.pagination.currentPage = page;
    },
    viewDetails(row) {
      this.$message.info(`查看告警记录 ID: ${row.id}`);
    },
    applyAlarmSetting() {
      this.autoRefresh.enabledTemp = this.autoRefresh.enabled;
      this.autoRefresh.intervalTemp = this.autoRefresh.interval;

      clearInterval(this.autoRefresh.timer);
      if (this.autoRefresh.enabled) {
        this.autoRefresh.timer = setInterval(() => {
          this.fetchAlertRecords();
        }, this.autoRefresh.interval * 1000);
      }
      this.autoRefresh.pausedByEdit = false;
      this.dialogs.showSettingsDialog = false;
      this.$message.success(
          this.autoRefresh.enabled
              ? `自动刷新已启用，刷新间隔: ${this.autoRefresh.interval}秒`
              : '自动刷新已关闭'
      );
    }
  },
  mounted() {
    this.fetchAlertRecords();
    if (this.autoRefresh.enabled) {  // 添加这行: 判断是否启用自动刷新
      this.autoRefresh.timer = setInterval(() => {
        this.fetchAlertRecords();
      }, this.autoRefresh.interval * 1000);
    }
    this.updateRefreshStatus();
  },
  beforeUnmount() {
    clearInterval(this.autoRefresh.timer);
  }
};
</script>

<style scoped>

.tableContainer {
  overflow-x: auto;
  max-width: 100%;
}

::v-deep(.warning-row) {
  background-color: var(--el-color-warning-light-9) !important;
}

.rotate {
  animation: spin 2s linear infinite;
  color: #409EFF;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.alert-page-grid { /* 整个页面的 Grid 容器 */
  display: grid;
  grid-template-rows: auto auto auto 1fr auto; /* 5行：header, filter, charts, table, pager */
  grid-template-areas:
    "header"
    "filter"
    "charts"
    "table"
    "pager";
  height: calc(100vh - 20px); /* 占满整个视口高度 */
  gap: 10px; /* 区域间隔 */
}

/* 每个区域的 grid-area 绑定 */
.header-area { grid-area: header; }
.filter-area {
  grid-area: filter;
  display: grid; /* 改成 grid */
  grid-template-columns: 3fr 1fr 1fr; /* 左侧筛选项占3份，右侧按钮占1份 */
  align-items: center; /* 垂直居中 */
  gap: 20px; /* 左右区域间距 */
}
.charts-area {
  grid-area: charts;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* 自动换行，每个最小300px，最大1fr */
  gap: 20px; /* 卡片间距 */
}
.table-area {
  grid-area: table;
  overflow: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.pager-area { grid-area: pager; }


</style>

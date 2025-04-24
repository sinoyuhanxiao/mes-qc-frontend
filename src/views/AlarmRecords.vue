<template>
  <div>
    <h2 style="margin-bottom: 20px;">告警记录</h2>
    <!-- Toolbar with Filters -->
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; gap: 10px;">
        <el-select v-model="filterRiskLevel" placeholder="预警等级" clearable style="width: 120px;">
          <el-option label="高风险" value="高风险" />
          <el-option label="中风险" value="中风险" />
          <el-option label="低风险" value="低风险" />
        </el-select>

        <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 120px;">
          <el-option label="处理中" value="处理中" />
          <el-option label="已关闭" value="已关闭" />
        </el-select>

        <el-select v-model="filterProduct" placeholder="产品名称" clearable style="width: 140px;">
          <el-option v-for="item in productOptions" :key="item" :label="item" :value="item" />
        </el-select>

        <el-select v-model="filterInspectionItem" placeholder="检测项" clearable style="width: 140px;">
          <el-option v-for="item in inspectionOptions" :key="item" :label="item" :value="item" />
        </el-select>

        <el-date-picker
            v-model="filterDateRange"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px;"
        />
      </div>
      <div>
        <el-input
            v-model="generalSearch"
            placeholder="搜索..."
            clearable
            style="width: 200px; align-items: center; margin-right: 10px"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="success" @click="exportTable" style="padding-bottom: 4px; margin-top: 0px;">导出</el-button> <!-- 修改这行 -->
        <el-button type="primary" @click="fetchAlertRecords" style="margin-top: 0px;">刷新</el-button>

      </div>
    </div>

    <div style="margin-bottom: 20px; display: flex; gap: 40px; justify-content: space-between;">
      <el-card style="width: 320px; height: 200px;">
        <div>状态统计</div>
        <v-chart :option="statusPieOption" autoresize style="height: 140px;" />
      </el-card>
      <el-card style="width: 320px; height: 200px;">
        <div>风险等级统计</div>
        <v-chart :option="riskPieOption" autoresize style="height: 140px;" />
      </el-card>
      <el-card style="width: 400px; height: 200px;">
        <div>Top 3 告警产品</div>
        <v-chart :option="productBarOption" autoresize style="height: 140px;" />
      </el-card>
      <el-card style="width: 400px; height: 200px;">
        <div>Top 3 告警检测项</div>
        <v-chart :option="inspectionBarOption" autoresize style="height: 140px;" />
      </el-card>

    </div>

    <!-- Alert Records Table -->
    <el-table v-loading="loading" :data="paginatedAlerts" :height="tableHeight" style="width: 100%;" @sort-change="handleSortChange">
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

      <el-table-column label="检测项" prop="inspection_item" width="180" sortable />

      <el-table-column label="检测值" prop="value" width="100" sortable />

      <el-table-column label="标准值范围" width="150">
        <template #default="scope">
          {{ scope.row.standard_min }} ~ {{ scope.row.standard_max }}
        </template>
      </el-table-column>

      <el-table-column label="超限情况" prop="exceed_status" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.exceed_status === '超标' ? 'danger' : 'success'">
            {{ scope.row.exceed_status }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="RPN" prop="rpn" width="120">
        <template #header>
          <span>RPN</span>
          <el-tooltip content="点击查看 RPN 说明" placement="top">
            <el-icon style="cursor: pointer; margin-left: 5px;" @click.stop="showRpnDialog = true">
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

      <el-table-column label="预警等级" prop="risk_level" width="120">
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

      <el-table-column label="操作" fixed="right" width="140" align="center">
        <template #default="scope">
          <el-button size="small" type="primary" @click="viewDetails(scope.row)">查看</el-button>
          <el-button
              size="small"
              type="warning"
              @click="toggleEditRpn(scope.row)"
          >
            {{ scope.row.isEditing ? '保存' : '修改' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
        style="margin-top: 10px;"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="[10, 20, 30, 50]"
        layout="total, sizes, prev, pager, next"
        :total="filteredAlerts.length"
    />
  </div>

  <el-dialog title="风险优先数 (RPN) 说明" v-model="showRpnDialog" width="600px">
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

</template>

<script>
import Mock from 'mockjs';
import { use } from "echarts/core";
import { PieChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import VChart from "vue-echarts";
import { QuestionFilled, Search } from "@element-plus/icons-vue";

use([PieChart, CanvasRenderer]);

export default {
  name: 'AlertRecordsTable',
  components: {QuestionFilled, Search, VChart },
  data() {
    return {
      alertRecords: [],
      loading: false,
      filterRiskLevel: '',
      filterStatus: '',
      filterDateRange: [],
      currentPage: 1,
      pageSize: 10,
      tableHeight: 0,
      sortSettings: { prop: '', order: '' },
      filterProduct: '',
      filterInspectionItem: '',
      productOptions: ['产品A', '产品B', '产品C'],
      inspectionOptions: ['检测项1', '检测项2', '检测项3'],
      generalSearch: '',
      showRpnDialog: false
    };
  },
  computed: {
    filteredAlerts() {
      let data = this.alertRecords;
      if (this.filterProduct) {
        data = data.filter(item => item.product_name === this.filterProduct);
      }
      if (this.filterInspectionItem) {
        data = data.filter(item => item.inspection_item === this.filterInspectionItem);
      }
      if (this.filterRiskLevel) {
        data = data.filter(item => item.risk_level === this.filterRiskLevel);
      }
      if (this.filterStatus) {
        data = data.filter(item => item.status === this.filterStatus);
      }
      if (this.generalSearch) {
        const keyword = this.generalSearch.toLowerCase();
        data = data.filter(item =>
            Object.values(item).some(val =>
                String(val).toLowerCase().includes(keyword)
            )
        );
      }
      if (this.filterDateRange.length === 2) {
        const [start, end] = this.filterDateRange;
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
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredAlerts.slice(start, start + this.pageSize);
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
  methods: {
    fetchAlertRecords() {
      this.loading = true;
      setTimeout(() => {
        // 用 Mock.js 生成数据
        this.alertRecords = Mock.mock({
          'data|55': [{
            'id|+1': 1,
            'product_name': '@cword(3,5)薯条',
            'batch_number': 'B@date("yyyyMMdd")',
            'form_name': '@ctitle(4, 7)',
            'inspection_item': '@cword(3,6)',
            'value|80-200': 1,
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
        this.loading = false;
      }, 1000);
    },
    exportTable() {
      console.log('导出假数据：', this.filteredAlerts);  // 模拟导出，后续可加 CSV/PDF
    },
    toggleEditRpn(row) {  // 添加这行
      if (!row.isEditing) {
        row.isEditing = true;  // 开启编辑模式
      } else {
        row.isEditing = false;  // 保存后退出编辑
        // 更新预警等级
        const rpn = Number(row.rpn);
        if (rpn >= 200) row.risk_level = '高风险';
        else if (rpn >= 100) row.risk_level = '中风险';
        else row.risk_level = '低风险';
      }
    },  // 添加这行
    updateTableHeight() {
      const heightToSubtract = 460;
      this.tableHeight = window.innerHeight - heightToSubtract;
    },
    handleSortChange({ prop, order }) {
      this.sortSettings = { prop, order };
      if (prop && order) {
        const sorted = [...this.alertRecords].sort((a, b) => {
          const valA = a[prop];
          const valB = b[prop];
          return order === 'ascending' ? valA - valB : valB - valA;
        });
        this.alertRecords = sorted;
      }
    },
    handleSizeChange(size) {
      this.pageSize = size;
    },
    handleCurrentChange(page) {
      this.currentPage = page;
    },
    viewDetails(row) {
      this.$message.info(`查看告警记录 ID: ${row.id}`);
    }
  },
  mounted() {
    this.fetchAlertRecords();
    window.addEventListener('resize', this.updateTableHeight);
    this.updateTableHeight();
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateTableHeight);
  }
};
</script>

<style scoped>
.tableContainer {
  overflow-x: auto;
  max-width: 100%;
}
</style>

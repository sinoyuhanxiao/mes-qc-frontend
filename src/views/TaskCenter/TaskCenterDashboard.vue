<template>
  <div class="task-center-dashboard">
    <!-- Top Statistics Cards -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <el-icon class="stat-icon">
                <i class="el-icon-s-data"></i>
              </el-icon>
              <div>
                <div class="stat-title">Total Tasks</div>
                <div class="stat-value">350,897</div>
                <div class="stat-difference">⬆️ 3.48% Since last month</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <el-icon class="stat-icon">
                <i class="el-icon-s-unfold"></i>
              </el-icon>
              <div>
                <div class="stat-title">Future Tasks</div>
                <div class="stat-value">2,356</div>
                <div class="stat-difference">⬆️ 3.48% Since last month</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <el-icon class="stat-icon">
                <i class="el-icon-s-check"></i>
              </el-icon>
              <div>
                <div class="stat-title">Overdue Tasks</div>
                <div class="stat-value">924</div>
                <div class="stat-difference">⬆️ 3.48% Since last month</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <el-icon class="stat-icon">
                <i class="el-icon-pie-chart"></i>
              </el-icon>
              <div>
                <div class="stat-title">Completion Rate</div>
                <div class="stat-value">49.65%</div>
                <div class="stat-difference">⬆️ 3.48% Since last month</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- Sales Value and Performance Graphs -->
    <div class="charts-section">
      <el-row :gutter="20">
        <el-col :span="16">
          <el-card class="chart-card">
            <div class="chart-title">Task Progress</div>
            <el-button-group class="time-toggle">
              <el-button size="small">Month</el-button>
              <el-button size="small">Week</el-button>
            </el-button-group>
            <div id="sales-chart" class="chart"></div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="chart-card">
            <div class="chart-title">Task Categories</div>
            <div id="performance-chart" class="chart"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
import * as echarts from "echarts";

export default {
  name: "TaskCenterDashboard",
  mounted() {
    this.initCharts();
  },
  methods: {
    initCharts() {
      const salesChart = echarts.init(document.getElementById("sales-chart"));
      const performanceChart = echarts.init(document.getElementById("performance-chart"));

      const salesOption = {
        xAxis: {
          type: "category",
          data: ["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            data: [10, 20, 15, 40, 30, 50, 35, 60],
            type: "line",
            smooth: true,
          },
        ],
      };

      const performanceOption = {
        xAxis: {
          type: "category",
          data: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            data: [20, 15, 30, 10, 25, 30],
            type: "bar",
            barWidth: "50%",
            itemStyle: {
              color: "#FF5722",
            },
          },
        ],
      };

      salesChart.setOption(salesOption);
      performanceChart.setOption(performanceOption);
    },
  },
};
</script>

<style scoped>
.task-center-dashboard {
  padding: 20px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-icon {
  font-size: 36px;
  color: #409eff;
}

.stat-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin: 5px 0;
  color: #409eff;
}

.stat-difference {
  font-size: 14px;
  color: #67c23a;
}

.charts-section {
  margin-top: 20px;
}

.chart-card {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 10px;
}

.chart-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
}

.chart {
  height: 300px;
}

.time-toggle {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}
</style>

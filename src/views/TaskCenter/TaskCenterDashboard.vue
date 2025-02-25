
<template>
  <div class="task-center-dashboard">
    <el-row :gutter="20" class="row-bg" justify="space-between">
      <el-col :span="10"><h1> {{ name }}的个人任务看板</h1></el-col>
      <el-col :span="3.5" style="align-self: center;">
        <el-button @click="showDevelopingPopup">New</el-button>
        <el-button @click="showDevelopingPopup">Filter</el-button>
      </el-col>
    </el-row>

    <!-- Card for Statistics -->
    <div class="card">
      <TaskCenterCardStatistics />
    </div>

    <!-- Row 1: Bar Chart and Pie Chart -->
    <el-row :gutter="20">
      <el-col :span="16">
        <div class="card">
          <div class="content-border">
            <QuarterlyTaskCompletionVolumeBarChart />
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="card">
          <div class="content-border">
            <OverduePercentagePieChart />
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- Row 2: Line Chart and Radar Chart -->
    <el-row :gutter="20">
      <el-col :span="16">
        <div class="card">
          <div class="content-border">
            <CreatedVsCompletedLineChart />
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="card">
          <div class="content-border">
          <TaskCompletionAcrossCategoriesRadar />
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>


<script setup>
  import QuarterlyTaskCompletionVolumeBarChart
    from "@/components/task-center/dashboard/QuarterlyTaskCompletionVolumeBarChart.vue";
  import OverduePercentagePieChart from "@/components/task-center/dashboard/OverduePercentagePieChart.vue";
  import CreatedVsCompletedLineChart from "@/components/task-center/dashboard/CreatedVsCompletedLineChart.vue";
  import TaskCompletionAcrossCategoriesRadar
    from "@/components/task-center/dashboard/TaskCompletionAcrossCategoriesRadar.vue";
  import TaskCenterCardStatistics from "@/components/task-center/dashboard/TaskCenterCardStatistics.vue";
  import {ElMessageBox} from "element-plus";
  import { computed } from "vue";
  import { useStore } from "vuex";

  const store = useStore();
  const name = computed(() => store.getters.getName);

  const showDevelopingPopup = () => {
    ElMessageBox.alert('此功能正在开发中，感谢您的点击', '提示', {
      confirmButtonText: '确定',
    })
  }
</script>

<style scoped>
/* Add spacing between rows */
.el-row {
  margin-bottom: 20px; /* Adds 20px space between rows */
}

/* Add padding inside each card */
.card {
  padding: 10px; /* Adds 5px of padding inside the cards */
  background-color: #ffffff; /* White background */
  border-radius: 5px; /* Rounded corners */
  transition: transform 0.2s
}

.card > .content-border {
  border: 1px solid #e0e0e0; /* Apply the border inside the card */
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1); /* Subtle shadow */
  border-radius: 5px; /* Match the card's border radius */
  overflow: hidden; /* Prevent overflow issues */
  height: 530px; /* Default height for larger resolutions */
}

/* Adjust height for smaller screens */
@media (max-width: 1750px) {
  .card > .content-border {
    height: 400px; /* Reduced height for smaller resolutions */
  }
}

/* Background for the entire page */
.task-center-dashboard {
  /* background: linear-gradient(to bottom, #0085a4 10%, #ffffff 90%); */
  padding: 20px;
  min-height: 100vh; /* Ensures full-screen background */
  display: grid;
}

/* Hover effect for cards */
.card > .content-border:hover {
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.15); /* Stronger shadow on hover */
}

/* Chart inside the card */
.chart-card {
  padding: 20px; /* Ensure space for content inside cards */
}

</style>

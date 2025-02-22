
<template>
  <div class="card">
    <Chart type="bar" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup>
import Chart from 'primevue/chart';
import { ref, onMounted } from "vue";
import { fetchQuarterlyTaskStatistics } from "@/services/taskStats";
import store from "@/store";  // Add this import

onMounted(async () => {  // Move API call inside onMounted
  const userId = store.getters.getUser.id;
  try {
    const response = await fetchQuarterlyTaskStatistics(userId);
    const quarterlyData = response.data.data.quarterlyTasks;
    console.log(quarterlyData);

    chartData.value = setChartData(quarterlyData);  // Pass data dynamically
    chartOptions.value = setChartOptions();
  } catch (error) {
    console.error("Error fetching quarterly task statistics:", error);
  }
});

const chartData = ref();
const chartOptions = ref();

const setChartData = (quarterlyData) => {  // Accept parameter
  return {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: '季度任务安排数量',
        data: [quarterlyData.Q1, quarterlyData.Q2, quarterlyData.Q3, quarterlyData.Q4],  // Fix duplicated Q1 values
        backgroundColor: ['rgba(249, 115, 22, 0.2)', 'rgba(6, 182, 212, 0.2)', 'rgb(107, 114, 128, 0.2)', 'rgba(139, 92, 246, 0.2)'],
        borderColor: ['rgb(249, 115, 22)', 'rgb(6, 182, 212)', 'rgb(107, 114, 128)', 'rgb(139, 92, 246)'],
        borderWidth: 1
      }
    ]
  };
};

const setChartOptions = () => {
  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue('--p-text-color');
  const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
  const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

  return {
    plugins: {
      legend: {
        labels: {
          color: textColor
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: textColorSecondary
        },
        grid: {
          borderWidth: 0
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: textColorSecondary
        },
        grid: {
          borderWidth: 0
        }
      }
    }
  };
}
</script>

<style scoped>
</style>

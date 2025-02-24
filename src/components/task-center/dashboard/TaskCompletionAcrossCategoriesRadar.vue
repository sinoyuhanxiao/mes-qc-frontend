<template>
  <div class="card relative">
    <div class="content-border relative">
      <!-- Chart Wrapper with Overlay -->
      <div class="chart-wrapper">
        <Chart type="radar" :data="chartData" :options="chartOptions" class="w-full md:w-[30rem] chart-overlay" />
        <div class="overlay-text" v-if="isUnavailable">
          暂不可用
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, onMounted} from "vue";
import Chart from 'primevue/chart';

const isUnavailable = ref(true); // 控制是否显示“暂不可用”

onMounted(() => {
  chartData.value = setChartData();
  chartOptions.value = setChartOptions();
});

const chartData = ref();
const chartOptions = ref();

const setChartData = () => {
  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue('--p-text-color');

  return {
    labels: ['Low', 'Medium', 'High', 'Urgent', 'Critical', 'Optional', 'Trivial'],
    datasets: [
      {
        label: 'Completed',
        borderColor: documentStyle.getPropertyValue('--p-gray-400'),
        pointBackgroundColor: documentStyle.getPropertyValue('--p-gray-400'),
        pointBorderColor: documentStyle.getPropertyValue('--p-gray-400'),
        pointHoverBackgroundColor: textColor,
        pointHoverBorderColor: documentStyle.getPropertyValue('--p-gray-400'),
        data: [65, 59, 90, 81, 56, 55, 40]
      },
      {
        label: 'Overdue',
        borderColor: documentStyle.getPropertyValue('--p-pink-400'),
        pointBackgroundColor: documentStyle.getPropertyValue('--p-pink-400'),
        pointBorderColor: documentStyle.getPropertyValue('--p-pink-400'),
        pointHoverBackgroundColor: textColor,
        pointHoverBorderColor: documentStyle.getPropertyValue('--p-pink-400'),
        data: [28, 48, 40, 19, 96, 27, 100]
      }
    ]
  };
};

const setChartOptions = () => {
  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue('--p-text-color');
  const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');

  return {
    plugins: {
      legend: {
        labels: {
          color: textColor
        }
      }
    },
    scales: {
      r: {
        grid: {
          color: textColorSecondary
        }
      }
    }
  };
};
</script>

<style scoped>
/* 让图表变透明 */
.chart-overlay {
  opacity: 0.3; /* 透明度降低 */
  pointer-events: none;
}

/* 让“暂不可用”文字正确居中相对图表 */
.overlay-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.5rem;
  font-weight: bold;
  color: gray;
  padding: 10px 20px;
  border-radius: 8px;
  pointer-events: none; /* 避免鼠标 hover 影响文字 */
  user-select: none; /* 禁止选中文字 */
}

/* 确保 chart-wrapper 是相对定位的，使 overlay 正确对齐 */
.chart-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>

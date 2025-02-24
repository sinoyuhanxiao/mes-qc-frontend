<template>
  <div class="card">
    <div class="content-border relative">
      <!-- Wrapper ensures overlay text is centered inside the chart only -->
      <div class="chart-wrapper">
        <Chart type="line" :data="chartData" :options="chartOptions" class="h-[30rem] chart-overlay" />
        <div class="overlay-text" v-if="isUnavailable">
          暂不可用
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Chart from 'primevue/chart';

const isUnavailable = ref(true); // 控制是否显示“Unavailable for now”

onMounted(() => {
  chartData.value = setChartData();
  chartOptions.value = setChartOptions();
});

const chartData = ref();
const chartOptions = ref();

const setChartData = () => {
  const documentStyle = getComputedStyle(document.documentElement);

  return {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'QC Tasks Created',
        fill: false,
        borderColor: documentStyle.getPropertyValue('--p-cyan-500'),
        yAxisID: 'y',
        tension: 0.4,
        data: [29, 59, 80, 19, 86, 55, 90]
      },
      {
        label: 'QC Tasks Completed',
        fill: false,
        borderColor: documentStyle.getPropertyValue('--p-gray-500'),
        yAxisID: 'y1',
        tension: 0.4,
        data: [28, 48, 40, 19, 56, 27, 89]
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
    stacked: false,
    maintainAspectRatio: true,
    aspectRatio: 2,
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
          color: surfaceBorder
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        ticks: {
          color: textColorSecondary
        },
        grid: {
          color: surfaceBorder
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        ticks: {
          color: textColorSecondary
        },
        grid: {
          drawOnChartArea: false,
          color: surfaceBorder
        }
      }
    }
  };
};
</script>

<style scoped>
/* Wrapper to properly position the chart and overlay */
.chart-wrapper {
  position: relative; /* This makes overlay text position inside it */
  width: 100%;
  height: 100%;
}

/* Make the chart slightly transparent */
.chart-overlay {
  opacity: 0.3;
  pointer-events: none;
}

/* Center the overlay text relative to the chart */
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
  pointer-events: none; /* Prevents interaction */
  user-select: none; /* Prevents text selection */
}
</style>

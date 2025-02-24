<template>
  <div class="card flex justify-center">
    <Chart type="pie" :data="chartData" :options="chartOptions" class="w-full md:w-[30rem]" />
  </div>
</template>

<script setup>
import Chart from 'primevue/chart';
import {ref, onMounted} from "vue";
import {fetchTaskStateStatistics} from "@/services/taskStats";
import {useStore} from "vuex";

const store = useStore();
const chartData = ref();
const chartOptions = ref();

onMounted(async () => {
  const userId = store.getters.getUser.id; // Get userId from store
  try {
    const response = await fetchTaskStateStatistics(userId);
    console.log("Task State Statistics:", response.data);

    // Extract data from response
    const {pendingCount, inProgressCount, completedCount} = response.data.data;

    // Set chart data dynamically
    chartData.value = setChartData(pendingCount, inProgressCount, completedCount);
    chartOptions.value = setChartOptions();
  } catch (error) {
    console.error("Error fetching task state statistics:", error);
  }
});

const setChartData = (pending, inProgress, completed) => {
  return {
    labels: ['Pending', 'In Progress', 'Completed'],
    datasets: [
      {
        data: [pending, inProgress, completed], // Dynamically set data from backend response
        backgroundColor: ['rgba(249, 115, 22, 0.2)', 'rgba(6, 182, 212, 0.2)', 'rgba(107, 114, 128, 0.2)'],
        hoverBackgroundColor: ['rgba(249, 115, 22, 0.1)', 'rgba(6, 182, 212, 0.1)', 'rgba(107, 114, 128, 0.1)']
      }
    ]
  };
};

const setChartOptions = () => {
  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue('--p-text-color');

  return {
    plugins: {
      legend: {
        labels: {
          usePointStyle: true,
          color: textColor
        }
      }
    }
  };
};
</script>

<style scoped></style>

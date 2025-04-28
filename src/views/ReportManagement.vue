<template>
  <div>
    <h2>Report Management</h2>

    <!-- ECharts Container -->
    <div ref="chart" style="width: 600px; height: 400px;"></div>

    <!-- Export to PDF Button with Loading State -->
    <button @click="exportToPdf" :disabled="isLoading">
      <span v-if="isLoading">Exporting...</span>
      <span v-else>Export to PDF</span>
    </button>

    <!-- Success Message -->
    <p v-if="isSuccess" style="color: green; margin-top: 10px;">PDF exported successfully!</p>
  </div>
</template>

<script>
import * as echarts from "echarts";
import axios from "axios";

export default {
  data() {
    return {
      isLoading: false, // Tracks loading state
      isSuccess: false  // Tracks success message
    };
  },
  mounted() {
    this.initChart();
  },
  methods: {
    initChart() {
      const chartDom = this.$refs.chart;
      this.chart = echarts.init(chartDom);
      const option = {
        title: {
          text: "Distribution of Quality Control",
          subtext: "Fake Data"
        },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "cross" }
        },
        toolbox: {
          show: true,
          feature: { saveAsImage: {} }
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: [
            "00:00", "01:15", "02:30", "03:45", "05:00", "06:15", "07:30",
            "08:45", "10:00", "11:15", "12:30", "13:45", "15:00", "16:15",
            "17:30", "18:45", "20:00", "21:15", "22:30", "23:45"
          ]
        },
        yAxis: {
          type: "value",
          axisLabel: { formatter: "{value} W" },
          axisPointer: { snap: true }
        },
        visualMap: {
          show: false,
          dimension: 0,
          pieces: [
            { lte: 6, color: "green" },
            { gt: 6, lte: 8, color: "red" },
            { gt: 8, lte: 14, color: "green" },
            { gt: 14, lte: 17, color: "red" },
            { gt: 17, color: "green" }
          ]
        },
        series: [
          {
            name: "Electricity",
            type: "line",
            smooth: true,
            data: [
              300, 280, 250, 260, 270, 300, 550, 500, 400, 390, 380, 390,
              400, 500, 600, 750, 800, 700, 600, 400
            ],
            markArea: {
              itemStyle: { color: "rgba(255, 173, 177, 0.4)" },
              data: [
                [{ name: "Morning Peak", xAxis: "07:30" }, { xAxis: "10:00" }],
                [{ name: "Evening Peak", xAxis: "17:30" }, { xAxis: "21:15" }]
              ]
            }
          }
        ]
      };
      this.chart.setOption(option);
    },
    exportToPdf() {
      this.isLoading = true;
      this.isSuccess = false;

      // Convert ECharts chart to a Base64 image
      const chartImage = this.chart.getDataURL({
        type: "png",
        pixelRatio: 2
      });

      // Send the image to the backend
      axios
          .post("http://10.10.12.68:8090/generate-pdf-with-chart", {chartImage}, {responseType: "blob"})
          .then((response) => {
            // Create a download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "report.pdf");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Show success message
            this.isSuccess = true;
          })
          .catch((error) => {
            console.error("Error exporting PDF:", error);
          })
          .finally(() => {
            this.isLoading = false;
          });
    }
  }
};
</script>

<style>
button {
  margin-top: 10px;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:disabled {
  background-color: #999;
  cursor: not-allowed;
}
</style>

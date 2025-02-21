<template>
  <div ref="chartContainer" class="chart"></div>
</template>

<script>
import * as echarts from "echarts";

export default {
  name: "PieChart",
  props: {
    chartTitle: {
      type: String,
      default: "质检产品合格率",
    },
    chartData: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      chart: null, // Store chart instance here (renamed for consistency)
    };
  },
  mounted() {
    this.initChart();
  },
  watch: {
    chartData: {
      deep: true,
      handler() {
        this.updateChart();
      },
    },
  },
  methods: {
    /**
     * Retrieve the chart as a Base64 image
     */
    getChartImage() {
      return this.chart ? this.chart.getDataURL({type: "png", pixelRatio: 2}) : "";
    },

    /**
     * Initialize the chart and store the instance
     */
    initChart() {
      const chartDom = this.$refs.chartContainer;
      this.chart = echarts.init(chartDom); // Store instance in `this.chart`
      this.updateChart();
    },

    /**
     * Update the chart with new data
     */
    updateChart() {
      if (!this.chart) return;

      const option = {
        title: {
          text: this.chartTitle,
          left: "center",
        },
        tooltip: {
          trigger: "item",
        },
        legend: {
          top: "10%",
          orient: "vertical",
          left: "left",
        },
        toolbox: {
          show: true,
          feature: {
            dataView: {show: true, readOnly: false},
            restore: {show: true},
            saveAsImage: {show: true},
          },
        },
        series: [
          {
            name: "分类",
            type: "pie",
            radius: ["40%", "70%"],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: "#fff",
              borderWidth: 2,
            },
            label: {
              show: false,
              position: "center",
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 20,
                fontWeight: "bold",
              },
            },
            labelLine: {
              show: false,
            },
            data: this.chartData,
          },
        ],
      };

      this.chart.setOption(option);
    },
  },
};
</script>

<style scoped>
.chart {
  width: 100%;
  height: 400px;
}
</style>

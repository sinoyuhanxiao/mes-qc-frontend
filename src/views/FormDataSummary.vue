<template>
  <el-container>
    <el-aside width="25%">
      <FormTree @select-form="selectForm" @add-form="addForm" />
    </el-aside>

    <el-main width="75%" style="max-height: 100vh; overflow-y: auto;">
      <div v-if="selectedForm">
        <h1>{{ selectedForm.label }} 汇总</h1>
      </div>

      <!-- Loop through all widgets that have chartData and render LineCharts -->
      <div v-for="widget in lineChartWidgets" :key="widget.name">
        <LineChart
            :chartTitle="widget.label"
            :chartData="widget.chartData"
            :xaxisData="widget.xaxisData"
        />
      </div>

      <!-- Loop through all widgets that have optionItems and create PieCharts -->
      <div v-for="widget in pieChartWidgets" :key="widget.name">
        <PieChart
            :chartTitle="widget.label"
            :chartData="widget.chartData"
        />
      </div>
    </el-main>
  </el-container>
</template>

<script>
import FormTree from '@/components/form-manager/FormTree.vue';
import PieChart from '@/components/charts/pie001.vue';
import LineChart from '@/components/charts/line001.vue';
import { extractWidgetDataWithCounts } from "@/services/qcReportingService";

export default {
  components: { FormTree, PieChart, LineChart },
  data() {
    return {
      selectedForm: null, // Stores the selected form template
      pieChartWidgets: [], // Stores PieChart data
      lineChartWidgets: [], // Stores LineChart data
    };
  },
  methods: {
    async selectForm(form) {
      this.selectedForm = form;

      if (form.qcFormTemplateId) {
        await this.fetchChartData(form.qcFormTemplateId);
      }
    },
    async fetchChartData(formTemplateId) {
      try {
        // Call extractWidgetDataWithCounts with only formTemplateId
        const countResponse = await extractWidgetDataWithCounts(formTemplateId);

        // Process PieChart widgets (for option-based items)
        this.pieChartWidgets = countResponse.data
            .filter(widget => widget.optionItems.length > 0) // Only include widgets with options
            .map(widget => ({
              name: widget.name,
              label: widget.label,
              chartData: widget.optionItems.map(option => ({
                name: option.label,
                value: option.count
              }))
            }));

        // Process LineChart widgets (for number-type items)
        this.lineChartWidgets = countResponse.data
            .filter(widget => widget.type === "number") // Filter out only number fields
            .map(widget => ({
              name: widget.name,
              label: widget.label,
              chartData: widget.chartData, // Directly use extracted numerical data
              xaxisData: widget.xaxisData, // Use formatted timestamps
            }));

      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    },
  },
};
</script>

<style scoped>
/*
  #app > div > div {
     overflow-y: hidden
  }
 */

</style>

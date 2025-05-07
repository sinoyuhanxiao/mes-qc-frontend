<template>
  <el-container v-loading="pdfLoading" :element-loading-text="translate('FormDataSummary.loadingText')" element-loading-background="rgba(0, 0, 0, 0.4)" class="qcsum-container">
    <el-aside width="25%">
      <FormTree @select-form="selectForm" @add-form="addForm" />
    </el-aside>

    <el-main width="75%" style="max-height: 100vh; overflow-y: auto;" v-show="isMainDisplayed">
      <div v-if="selectedForm" class="form-header">
        <h1 style="width: 200px">{{ selectedForm.label }} {{ translate('FormDataSummary.summaryTitle') }}</h1>
        <el-date-picker
            style="width: 320px; margin-left: 150px; margin-right: 20px"
            v-model="dateRange"
            type="datetimerange"
            :shortcuts="shortcuts"
            :range-separator="translate('FormDataSummary.dateRangeSeparator')"
            :start-placeholder="translate('FormDataSummary.startPlaceholder')"
            :end-placeholder="translate('FormDataSummary.endPlaceholder')"
            @change="refreshChartData"
        />
        <el-button type="success" style="margin-top: 0;" @click="exportChartReportToPdf">{{ translate('FormDataSummary.generatePdf') }}</el-button>
        <el-button
            type="primary"
            @click="openQcRecordsDialog(selectedForm, dateRange)"
            style="margin-top: 0"
        >
          {{ translate('FormDataSummary.viewRecords') }}
        </el-button>
      </div>

      <el-skeleton v-if="loadingCharts" :rows="6" animated />

      <QcCharts
          :lineChartWidgets="lineChartWidgets"
          :pieChartWidgets="pieChartWidgets"
      />
    </el-main>

    <!-- 质检记录弹窗组件 -->
    <QcRecordsDialog
        v-model:visible="qcRecordsDialogVisible"
        :records="qcRecords"
        :headers="displayedColumnHeaders"
        :search="searchQuery"
        :dateRange="dateRange"
        :loading="loadingQcRecords"
        :tableHeight="tableHeight"
        :selectedForm="selectedForm"
        @delete="deleteRecord"
        @export-excel="exportQcRecordsToExcel"
        @update:dateRange="handleDateRangeChange"
        @close="closeQcRecordsDialog"
    />

  </el-container>
</template>

<script>
import FormTree from '@/components/form-manager/FormTree.vue';
import PieChart from '@/components/charts/pie001.vue';
import LineChart from '@/components/charts/line001.vue';
import {extractWidgetDataWithCounts, fetchQcRecords, generateQcReport} from "@/services/qcReportingService";
import {translate} from "@/utils/i18n";
import QcCharts from "@/components/common/qc/QcCharts.vue";
import { provide } from "vue";
import {exportChartReportToPdf} from "@/utils/exportUtils";
import {useQcRecordsDialog} from "@/composables/useQcRecordsDialog";
import QcRecordsDialog from "@/components/common/QcRecordsDialog.vue";

export default {
  components: {QcRecordsDialog, QcCharts, FormTree, PieChart, LineChart },
  setup() {
    const lineChartRefs = [];
    const pieChartRefs = [];

    provide("lineChartRefs", lineChartRefs);
    provide("pieChartRefs", pieChartRefs);

    const {
      qcRecordsDialogVisible,
      loadingQcRecords,
      qcRecords,
      reorderedColumnHeaders,
      openDialog,
      fetchRecordsData
    } = useQcRecordsDialog();

    const openQcRecordsDialog = async (selectedForm, dateRange) => {
      if (selectedForm && dateRange && dateRange.length === 2) {
        qcRecordsDialogVisible.value = true;
        await openDialog(selectedForm.qcFormTemplateId, dateRange);
        await fetchRecordsData(selectedForm.qcFormTemplateId, dateRange);
      }
    };

    return {
      lineChartRefs,
      pieChartRefs,
      qcRecordsDialogVisible,
      loadingQcRecords,
      qcRecords,
      reorderedColumnHeaders,
      openQcRecordsDialog
    };
  },
  data() {
    return {
      tableHeight: window.innerHeight - 220,
      pdfLoading: false,
      isMainDisplayed: true,
      lineChartRefs: [],
      pieChartRefs: [],
      dateRange: [this.getStartOfMonth(), this.getEndOfMonth()], // Default to current month
      loadingCharts: false,
      shortcuts: [
        {
          text: translate('FormDataSummary.shortcuts.thisWeek'),
          value: () => {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - start.getDay() + 1);
            return [start, end];
          },
        },
        {
          text: translate('FormDataSummary.shortcuts.thisMonth'),
          value: () => [this.getStartOfMonth(), this.getEndOfMonth()],
        },
        {
          text: translate('FormDataSummary.shortcuts.lastMonth'),
          value: () => {
            const start = new Date(this.getStartOfMonth());
            start.setMonth(start.getMonth() - 1);
            const end = new Date(this.getEndOfMonth());
            end.setMonth(end.getMonth() - 1);
            return [start, end];
          },
        },
        {
          text: translate('FormDataSummary.shortcuts.lastThreeMonths'),
          value: () => {
            const end = new Date();
            const start = new Date();
            start.setMonth(start.getMonth() - 3);
            return [start, end];
          },
        },
      ],
      searchQuery: "",
      selectedForm: null,
      pieChartWidgets: [],
      lineChartWidgets: [],
      columnHeaders: [], // ✅ Also initialized as an empty array
      currentPage: 1,
      pageSize: 15,
    };
  },
  mounted() {
    window.addEventListener('resize', this.updateTableHeight);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateTableHeight); // 添加这行
  },
  updateTableHeight() {
    this.tableHeight = window.innerHeight - 200;
  },
  computed: {
    filteredQcRecords() {
      if (!this.searchQuery) return this.qcRecords;
      return this.qcRecords.filter(record =>
          Object.values(record).some(value =>
              String(value).toLowerCase().includes(this.searchQuery.toLowerCase())
          )
      );
    },
    displayedColumnHeaders() {
      return this.reorderedColumnHeaders.filter(header =>
          !["提交人", "提交时间", "_id", "e-signature"].includes(header)
      );
    },
    // 在 `computed: { reorderedColumnHeaders() }` 这个函数里，确保 `created_at` 和 `created_by` 排在最前
    reorderedColumnHeaders() {
      let headers = Object.keys(this.qcRecords[0] || {});
      headers = headers.filter(header => header !== "created_by" && header !== "created_at");
      headers.unteam("created_at", "created_by"); // 确保这两个字段在最前
      headers = headers.map(header => (header === "created_at" ? "提交时间" : header));
      return headers;
    },

    paginatedQcRecords() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredQcRecords.slice(start, end);
    },

    columns() {
      // Filter out _id to avoid displaying it
      const filteredEntries = Object.entries(this.selectedDetails)
          .filter(([key]) => key !== "_id" && key !== "created_at" && key !== "created_by");

      // Split into chunks of 10 fields per column
      const chunkSize = 10;
      const result = [];
      for (let i = 0; i < filteredEntries.length; i += chunkSize) {
        result.push(Object.fromEntries(filteredEntries.slice(i, i + chunkSize)));
      }
      return result;
    }
  },
  watch: {
    qcRecordsDialogVisible(newVal) {
      this.refreshChartData();
      // if (!newVal) {
      //   this.dateRange = [this.getStartOfMonth(), this.getEndOfMonth()];
      // }
    }
  },
  methods: {
    translate,
    async exportChartReportToPdf() {
      this.pdfLoading = true;
      await exportChartReportToPdf({
        lineChartWidgets: this.lineChartWidgets,
        pieChartWidgets: this.pieChartWidgets,
        lineChartRefs: this.lineChartRefs,
        pieChartRefs: this.pieChartRefs,
        selectedForm: this.selectedForm,
        dateRange: this.dateRange,
        translate,
        formatDate: this.formatDate,
        generateQcReport,
        $message: this.$message,
        $nextTick: this.$nextTick
      });
      this.pdfLoading = false;
    },
    formatDate(date) { // convert to the client local time also to the YYYY-MM-DD HH:MM:SS string in 24 hours
      if (!date) return "";
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ` +
          `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
    },
    handlePageChange(newPage) {
      this.currentPage = newPage;
    },
    async refreshChartData() {
      if (!this.selectedForm || !this.dateRange || this.dateRange.length !== 2) return;

      const formTemplateId = this.selectedForm.qcFormTemplateId;
      const startDateTime = this.formatDate(this.dateRange[0]);
      const endDateTime = this.formatDate(this.dateRange[1]);
      // console log the dates here
      // log formTemplateId
      console.log("📋 Form Template ID:", formTemplateId)
      console.log("📅 Start Date:", startDateTime);
      console.log("📅 End Date:", endDateTime);

      // Reset the arrays before fetching new data
      this.pieChartWidgets = [];
      this.lineChartWidgets = [];

      await this.fetchChartData(formTemplateId, startDateTime, endDateTime);
    },
    getStartOfMonth() {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    },
    getEndOfMonth() {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    },
    async selectForm(form) {
      this.selectedForm = form;
      this.isMainDisplayed = this.selectedForm.nodeType !== "folder";

      if (this.selectedForm?.qcFormTemplateId && this.dateRange?.length === 2) {
        await this.refreshChartData(); // ✅ this will use selectedForm + dateRange
      }
    },
    async fetchChartData(formTemplateId, startDateTime, endDateTime) {
      this.loadingCharts = true; // Start loading indicator

      try {
        // Call extractWidgetDataWithCounts with formTemplateId
        const countResponse = await extractWidgetDataWithCounts(formTemplateId, startDateTime, endDateTime);

        // Function to convert UTC timestamp to client local time
        const convertToLocalTime = (utcDateTime) => {
          const utcDate = new Date(utcDateTime + "Z"); // Ensure it's treated as UTC
          const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          return utcDate.toLocaleString("zh-CN", { timeZone: userTimezone, hour12: false });
        };

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
              xaxisData: widget.xaxisData.map(convertToLocalTime) // Convert x-axis timestamps to local time
            }));

      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        this.loadingCharts = false; // Stop loading indicator
      }
    },
    async fetchQcRecordsData(formTemplateId, startDateTime, endDateTime) {
      if (!formTemplateId) {
        console.error("No formTemplateId selected");
        return;
      }

      try {
        const response = await fetchQcRecords(formTemplateId, startDateTime, endDateTime);
        this.qcRecords = response.data;

        // Ensure column headers remain in sync
        if (Array.isArray(this.qcRecords) && this.qcRecords.length > 0) {
          let headers = Object.keys(this.qcRecords[0]);

          // Move `_id` to the last column and remove `created_by`
          headers = headers.filter(header => header !== "_id" && header !== "created_by");

          // Rename `created_at` to `提交时间`
          headers = headers.map(header => (header === "created_at" ? "提交时间" : header));

          headers.push("_id"); // Ensure `_id` is last
          this.reorderedColumnHeaders = headers;

          // Format `created_at` correctly
          this.qcRecords = this.qcRecords.map(record => {
            if (record.created_at) {
              const localDate = new Date(record.created_at);
              const formattedDate = localDate.toLocaleString("zh-CN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              }).replace(/\//g, "-");

              record["提交时间"] = formattedDate;
              delete record.created_at;
            }
            return record;
          });
        }
      } catch (error) {
        console.error("Error fetching QC records:", error);
      } finally {
        this.loadingQcRecords = false;
      }
    }
  },
};
</script>

<style scoped>

.form-header {
    display: flex;
    justify-content: space-between; /* Left and Right Alignment */
    align-items: center; /* Vertically Center */
  }

  .chart-card {
    margin: 20px 0;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .chart-card.hover-effect:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  .el-table {
    overflow-x: auto;
    display: block;
    max-width: 100%;
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .group-header .cell {
    font-weight: bold !important;
    font-size: 16px; /* Adjust the size as needed */
    text-align: center;
  }
</style>

<template>
  <el-container>
    <el-aside width="25%">
      <FormTree @select-form="selectForm" @add-form="addForm" />
    </el-aside>

    <el-main width="75%" style="max-height: 100vh; overflow-y: auto;">
      <div v-if="selectedForm" class="form-header">
        <h1 style="width: 200px">{{ selectedForm.label }} 汇总</h1>
        <el-date-picker
            style="width: 320px; margin-left: 150px; margin-right: 20px"
            v-model="dateRange"
            type="datetimerange"
            :shortcuts="shortcuts"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="refreshChartData"
        />
        <el-button type="primary" @click="openQcRecordsDialog" style="margin-top: 0">查看</el-button>
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

    <!-- Full-Screen Dialog for QC Records Table -->
    <el-dialog v-model="qcRecordsDialogVisible" title="提交记录" fullscreen>

      <!-- Search and Date Picker Container -->
      <div class="toolbar">
        <el-input
            v-model="searchQuery"
            placeholder="搜索..."
            clearable
            style="width: 300px; margin-right: 500px"
        />

        <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            :shortcuts="shortcuts"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleDateRangeChange"
        />
      </div>

      <el-table
          v-if="qcRecords.length > 0"
          v-loading="loadingQcRecords"
          :data="paginatedQcRecords"
          border
          style="width: 100%; white-space: nowrap;"
          :scroll-x="true"
      >
        <el-table-column
            v-for="(header, index) in reorderedColumnHeaders"
            v-if="header !== 'created_by'"
            :key="index"
            :prop="header"
            :label="header === '_id' ? '提交单号' : header"
            sortable
            :width="header === '_id' ? 300 : header === '提交时间' ? 200 : 150"
        />

        <!-- Fixed 操作 column on the right -->
        <el-table-column label="操作" fixed="right" width="120">
          <template #default="scope">
            <el-link type="primary" @click="viewDetails(scope.row)">查看</el-link>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
          v-if="qcRecords.length > 0"
          v-model:currentPage="currentPage"
          :page-size="pageSize"
          layout="prev, pager, next"
          :total="filteredQcRecords.length"
          @current-change="handlePageChange"
      />

      <p v-else class="empty-message">暂无数据</p> <!-- If empty, show message -->
      <template #footer>
        <el-button type="primary" @click="closeQcRecordsDialog">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog title="提交记录" v-model="dialogVisible" width="50%" @close="closeDetailsDialog">
      <el-row gutter="20">
        <el-col
            v-for="(columnItems, columnIndex) in columns"
            :key="columnIndex"
            :span="Math.min(24 / columns.length, 12)"
        >
          <el-form label-position="left" label-width="120px" class="task-details">
            <el-form-item
                v-for="(value, key) in columnItems"
                :key="key"
                :label="key === 'submissionId' ? '提交单号' : key"
            >
              <span>{{ Array.isArray(value) ? value.join(', ') : (value || " - ") }}</span>
            </el-form-item>
          </el-form>
        </el-col>
      </el-row>
      <template #footer>
        <el-button type="primary" @click="generatePdf(selectedDetails)">导出</el-button>
      </template>
    </el-dialog>

  </el-container>
</template>

<script>
import FormTree from '@/components/form-manager/FormTree.vue';
import PieChart from '@/components/charts/pie001.vue';
import LineChart from '@/components/charts/line001.vue';
import { extractWidgetDataWithCounts, fetchQcRecords } from "@/services/qcReportingService";
import {exportDocumentToPDF, getMyDocument} from "@/services/qcTaskSubmissionLogsService";

export default {
  components: { FormTree, PieChart, LineChart },
  data() {
    return {
      selectedDetails: {},
      dateRange: [this.getStartOfMonth(), this.getEndOfMonth()], // Default to current month
      shortcuts: [
        {
          text: '本周',
          value: () => {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - start.getDay() + 1);
            return [start, end];
          },
        },
        {
          text: '本月',
          value: () => [this.getStartOfMonth(), this.getEndOfMonth()],
        },
        {
          text: '上个月',
          value: () => {
            const start = new Date(this.getStartOfMonth());
            start.setMonth(start.getMonth() - 1);
            const end = new Date(this.getEndOfMonth());
            end.setMonth(end.getMonth() - 1);
            return [start, end];
          },
        },
        {
          text: '最近三个月',
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
      qcRecordsDialogVisible: false,
      dialogVisible: false,
      qcRecords: [], // ✅ Ensure this is always an array
      columnHeaders: [], // ✅ Also initialized as an empty array
      loadingQcRecords: false,
      reorderedColumnHeaders: [],
      currentPage: 1,
      pageSize: 10,
    };
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
    formatDate(date) {
      if (!date) return "";
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ` +
          `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
    },
    handlePageChange(newPage) {
      this.currentPage = newPage;
    },
    async viewDetails(row) {
      try {
        // Extract year and month from row.created_at
        const createdAt = new Date(row['提交时间']);
        const yearMonth = createdAt.getFullYear().toString() +
            (createdAt.getMonth() + 1).toString().padStart(2, "0");

        // Generate inputCollectionName dynamically
        const inputCollectionName = `form_template_${this.selectedForm.qcFormTemplateId}_${yearMonth}`;

        // Fetch document details using the dynamically created collection name
        const response = await getMyDocument(row._id, this.selectedForm.qcFormTemplateId, row.created_by, inputCollectionName);

        this.selectedDetails = { ...response.data, "submissionId": row._id };
        console.log("this selectedDetails: ", this.selectedDetails);

        this.dialogVisible = true;
      } catch (err) {
        console.error("Error fetching document details:", err);
      }
    },
    closeDetailsDialog() {
      this.dialogVisible = false;
      this.selectedDetails = null;
    },
    async refreshChartData() {
      if (!this.selectedForm || !this.dateRange || this.dateRange.length !== 2) return;

      const formTemplateId = this.selectedForm.qcFormTemplateId;
      const startDateTime = this.formatDate(this.dateRange[0]);
      const endDateTime = this.formatDate(this.dateRange[1]);

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
    async closeQcRecordsDialog() {
      this.qcRecordsDialogVisible = false;
    },
    updateDateRange() {
      this.openQcRecordsDialog(); // Refresh data when the date range changes
    },
    async selectForm(form) {
      this.selectedForm = form;

      if (form.qcFormTemplateId) {
        await this.fetchChartData(this.selectedForm.qcFormTemplateId, this.formatDate(this.dateRange[0]), this.formatDate(this.dateRange[1]));
      }
    },
    // TODO: generate the pdf
    async generatePdf(selectedDetails) {
      if (!selectedDetails || !selectedDetails._id) {
        this.$message.error("请选择要导出的记录!");
        return;
      }

      try {
        const createdAt = new Date(selectedDetails.created_at);
        const yearMonth = createdAt.getFullYear().toString() + (createdAt.getMonth() + 1).toString().padStart(2, "0");

        const inputCollectionName = `form_template_${this.selectedForm.qcFormTemplateId}_${yearMonth}`;

        const response = await exportDocumentToPDF(
            selectedDetails.submissionId,
            this.selectedForm.qcFormTemplateId,
            selectedDetails.created_by,
            inputCollectionName
        );

        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `task_submission_${selectedDetails.submissionId}.pdf`);
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.$message.success("PDF 下载成功!");
      } catch (err) {
        console.error("Error generating PDF:", err);
        this.$message.error("PDF 下载失败，请重试!");
      }
    },
    async fetchChartData(formTemplateId, startDateTime, endDateTime) {
      try {
        // Call extractWidgetDataWithCounts with only formTemplateId
        const countResponse = await extractWidgetDataWithCounts(formTemplateId, startDateTime, endDateTime);

        // Process PieChart widgets (for option-based items
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
    async fetchQcRecordsData(formTemplateId, startDateTime, endDateTime) {
      if (!formTemplateId) {
        console.error("No formTemplateId selected");
        this.loadingQcRecords = false;
        return;
      }

      try {
        this.loadingQcRecords = true;
        const response = await fetchQcRecords(formTemplateId, startDateTime, endDateTime);
        this.qcRecords = response.data;

        console.log("Updated qcRecords: ", this.qcRecords);

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
    },

    async handleDateRangeChange() {
      if (!this.dateRange || this.dateRange.length !== 2) return;

      const formTemplateId = this.selectedForm ? this.selectedForm.qcFormTemplateId : null;
      const formatDate = (date) => date.toISOString().slice(0, 19).replace("T", " ");
      const startDateTime = formatDate(this.dateRange[0]);
      const endDateTime = formatDate(this.dateRange[1]);

      await this.fetchQcRecordsData(formTemplateId, startDateTime, endDateTime);
    },

    // async openQcRecordsDialog() {
    //   this.qcRecordsDialogVisible = true;
    //
    //   const formTemplateId = this.selectedForm ? this.selectedForm.qcFormTemplateId : null;
    //   const now = new Date();
    //   const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    //   const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    //
    //   const formatDate = (date) => date.toISOString().slice(0, 19).replace("T", " ");
    //   const startDateTime = formatDate(startOfMonth);
    //   const endDateTime = formatDate(endOfMonth);
    //
    //   await this.fetchQcRecordsData(formTemplateId, startDateTime, endDateTime);
    // }

    async openQcRecordsDialog() {
      this.qcRecordsDialogVisible = true;

      const formTemplateId = this.selectedForm ? this.selectedForm.qcFormTemplateId : null;

      // Use the same date range selected above the charts
      const startDateTime = this.formatDate(this.dateRange[0]);
      const endDateTime = this.formatDate(this.dateRange[1]);

      await this.fetchQcRecordsData(formTemplateId, startDateTime, endDateTime);
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

</style>

<template>
  <el-container v-loading="pdfLoading" element-loading-text="正在生成PDF报告..." element-loading-background="rgba(0, 0, 0, 0.4)" class="qcsum-container">
    <el-aside width="25%">
      <FormTree @select-form="selectForm" @add-form="addForm" />
    </el-aside>

    <el-main width="75%" style="max-height: 100vh; overflow-y: auto;" v-show="isMainDisplayed">
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
        <el-button type="success" style="margin-top: 0;" @click="exportToPdf">生成 PDF</el-button>
        <el-button type="primary" @click="openQcRecordsDialog" style="margin-top: 0">查看质检记录</el-button>
      </div>

      <el-skeleton v-if="loadingCharts" :rows="6" animated />

      <template v-else>
        <div v-for="widget in lineChartWidgets" :key="widget.name" class="chart-card hover-effect">
          <LineChart
              ref="lineChartRefs"
              :chartTitle="widget.label"
              :chartData="widget.chartData"
              :xaxisData="widget.xaxisData"
          />
        </div>

        <div v-for="widget in pieChartWidgets" :key="widget.name" class="chart-card hover-effect">
          <PieChart
              ref="pieChartRefs"
              :chartTitle="widget.label"
              :chartData="widget.chartData"
          />
        </div>
      </template>
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

        <el-button type="success" style="margin-top: 0; margin-right: 20px" @click="exportToExcel">导出 Excel</el-button>

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
            <el-link type="danger" style="margin-left: 10px" @click="deleteRecord(scope.row)">删除</el-link>
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

      <template #footer>
        <el-button type="primary" @click="closeQcRecordsDialog">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog title="提交记录" v-model="dialogVisible" width="50%" @close="closeDetailsDialog">
      <el-scrollbar max-height="500px">
        <div v-for="(fields, category) in groupedDetails" :key="category">
          <el-descriptions :title="category" border style="margin-top: 10px"> <!-- 这是 divider -->
            <el-descriptions-item v-for="(value, key) in fields" :key="key" :label="key">
              {{ Array.isArray(value) ? value.join(', ') : (value || " - ") }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-scrollbar>
      <template #footer>
        <el-button type="primary" @click="generatePdf(selectedDetails)">导出</el-button>
      </template>
    </el-dialog>

  </el-container>
</template>

<script>
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import FormTree from '@/components/form-manager/FormTree.vue';
import PieChart from '@/components/charts/pie001.vue';
import LineChart from '@/components/charts/line001.vue';
import {extractWidgetDataWithCounts, fetchQcRecords, generateQcReport} from "@/services/qcReportingService";
import {deleteTaskSubmissionLog, exportDocumentToPDF, getMyDocument} from "@/services/qcTaskSubmissionLogsService";

export default {
  components: { FormTree, PieChart, LineChart },
  data() {
    return {
      pdfLoading: false,
      isMainDisplayed: true,
      lineChartRefs: [],
      pieChartRefs: [],
      selectedDetails: {},
      dateRange: [this.getStartOfMonth(), this.getEndOfMonth()], // Default to current month
      loadingCharts: false,
      groupedDetails: {},
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
      loadingQcRecords: true,
      reorderedColumnHeaders: [],
      currentPage: 1,
      pageSize: 15,
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
    async exportToPdf() {
      if (!this.lineChartWidgets.length && !this.pieChartWidgets.length) {
        this.$message.warning("暂无图表数据可导出!");
        return;
      }

      this.pdfLoading = true;

      // 等待 Vue 渲染完成
      await this.$nextTick();

      // 获取所有 LineChart 的图片
      const lineChartImages = this.lineChartWidgets.map((widget, index) => ({
        name: widget.name,
        image: this.$refs.lineChartRefs?.[index]?.getChartImage() || "" // 逐个获取
      }));

      // 获取所有 PieChart 的图片
      const pieChartImages = this.pieChartWidgets.map((widget, index) => ({
        name: widget.name,
        image: this.$refs.pieChartRefs?.[index]?.getChartImage() || "" // 逐个获取
      }));

      console.log("🖼️ Line Chart Images:", lineChartImages);
      console.log("🖼️ Pie Chart Images:", pieChartImages);

      // 构造要发送给后端的报告数据
      const reportData = {
        qcFormName: this.selectedForm.label,
        startDateTime: this.formatDate(this.dateRange[0]),
        endDateTime: this.formatDate(this.dateRange[1]),
        charts: [
          // 绑定 LineChart 数据
          ...this.lineChartWidgets.map(widget => ({
            chartImage: lineChartImages.find(img => img.name === widget.name)?.image || "",
            chartType: "line",
            min: Math.min(...widget.chartData),
            max: Math.max(...widget.chartData),
            average: (widget.chartData.reduce((sum, val) => sum + val, 0) / widget.chartData.length).toFixed(2),
            total: widget.chartData.length
          })),
          // 绑定 PieChart 数据
          ...this.pieChartWidgets.map(widget => {
            const totalValue = widget.chartData.reduce((sum, val) => sum + val.value, 0); // 计算总值

            return {
              chartImage: pieChartImages.find(img => img.name === widget.name)?.image || "",
              chartType: "pie",
              info: widget.chartData.map(item => ({
                label: item.name,
                count: item.value,
                percentage: totalValue === 0 ? "0.00" : ((item.value / totalValue) * 100).toFixed(2) // 避免除以 0
              })),
              total: totalValue
            };
          })
        ]
      };

      console.log("🚀 发送给后端的报告数据:", reportData);

      // 调用后端 API 生成 PDF
      try {
        await generateQcReport(reportData);
        this.$message.success("PDF 下载成功!");
      } catch (err) {
        console.error("❌ 生成 PDF 失败:", err);
        this.$message.error("PDF 生成失败，请重试!");
      } finally {
        this.pdfLoading = false;
      }
    },
    exportToExcel() {
      if (!this.qcRecords.length) {
        this.$message.warning("暂无数据可导出");
        return;
      }

      // Exclude `_id` and `created_by`
      const tableData = this.qcRecords.map(record => {
        const { _id, created_by, ...filteredRecord } = record;
        return {
          提交时间: record.created_at || "-",
          ...filteredRecord
        };
      });

      // Extract headers (excluding `_id` and `created_by`)
      const headers = Object.keys(tableData[0] || {}).map(header =>
          header === "created_at" ? "提交时间" : header
      );

      // Convert JSON to Excel format
      const worksheet = XLSX.utils.json_to_sheet(tableData, {
        header: headers,
        skipHeader: false
      });

      // Create and save workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, this.selectedForm.label + "提交记录");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(blob, this.selectedForm.label + "提交记录.xlsx");

      this.$message.success("Excel 导出成功！");
    },
    formatDate(date) {
      if (!date) return "";
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ` +
          `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
    },
    handlePageChange(newPage) {
      this.currentPage = newPage;
    },
    // Add this method inside the methods section
    async deleteRecord(row) {
      try {
        this.$confirm(`确认删除提交单号 ${row._id} 的记录吗？`, "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }).then(async () => {
          await deleteTaskSubmissionLog(row._id, this.selectedForm.qcFormTemplateId, row["提交时间"]);

          this.qcRecords = this.qcRecords.filter(record => record._id !== row._id);
          this.$message.success("记录删除成功！");
        }).catch(() => {
          this.$message.info("删除已取消");
        });
      } catch (error) {
        console.error("Error deleting record:", error);
        this.$message.error("删除失败，请重试");
      }
    },
    async viewDetails(row) {
      try {
        const createdAt = new Date(row['提交时间']);
        const yearMonth = createdAt.getFullYear().toString() +
            (createdAt.getMonth() + 1).toString().padStart(2, "0");

        const inputCollectionName = `form_template_${this.selectedForm.qcFormTemplateId}_${yearMonth}`;

        const response = await getMyDocument(row._id, this.selectedForm.qcFormTemplateId, row.created_by, inputCollectionName);
        this.selectedDetails = { ...response.data, "submissionId": row._id };

        // **Step 1: First, determine all `el-descriptions` sections**
        const groupedDetails = {};
        Object.entries(this.selectedDetails).forEach(([key, value]) => {
          if (["_id", "created_at", "created_by", "submissionId"].includes(key)) return; // Ignore base fields

          // **Identify if this key belongs to a section (divider)**
          if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            // If value is an object, it represents a `divider` section
            groupedDetails[key] = value;
          } else {
            // If it's a standalone value, place it under "未分类"
            if (!groupedDetails["未分类"]) {
              groupedDetails["未分类"] = {};
            }
            groupedDetails["未分类"][key] = value;
          }
        });

        this.groupedDetails = groupedDetails;
        console.log("Grouped Details: ", this.groupedDetails);

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
    async closeQcRecordsDialog() {
      this.qcRecordsDialogVisible = false;
    },
    updateDateRange() {
      this.openQcRecordsDialog(); // Refresh data when the date range changes
    },
    async selectForm(form) {
      this.selectedForm = form;

      this.isMainDisplayed = this.selectedForm.nodeType !== "folder";

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
      this.loadingCharts = true; // Start loading indicator

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
      this.loadingQcRecords = true;

      const formTemplateId = this.selectedForm ? this.selectedForm.qcFormTemplateId : null;

      // Use the same date range selected above the charts
      const startDateTime = this.formatDate(this.dateRange[0]);
      const endDateTime = this.formatDate(this.dateRange[1]);

      await this.fetchQcRecordsData(formTemplateId, startDateTime, endDateTime);
      this.loadingQcRecords = false;
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
</style>

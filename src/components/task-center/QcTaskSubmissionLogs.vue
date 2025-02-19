<template>
  <el-container>
    <el-header class="header">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <!-- Left Section: Title and Refresh Button -->
        <div style="display: flex; align-items: center; gap: 10px;">
          <h2 style="margin: 0;">{{ title }}</h2>
          <el-tooltip content="Refresh table" placement="top">
            <el-button
                class="refresh-button"
                type="primary"
                style="margin-top: 0"
                circle
                @click="refreshTable"
            >
              <el-icon style="color: #004085;"><RefreshRight /></el-icon>
            </el-button>
          </el-tooltip>
        </div>

        <!-- Right Section: Search Input -->
        <div style="display: flex; align-items: center; gap: 10px;">
          <!-- make this button vertically align center -->
          <el-tooltip>
            <el-button
                type="primary"
                style="margin-top: 0"
                @click="downloadExcel"
            >
              <el-icon><Download /></el-icon>
            </el-button>
            <template #content>
              <span>下载你的质检提交记录</span>
            </template>
          </el-tooltip>
          <el-input
              v-model="searchTerm"
              placeholder="Search by ID or Submission ID"
              clearable
              style="width: 300px;"
              @input="applyFilter"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>
    </el-header>
    <el-main>
      <el-table
          :data="paginatedData"
          border
          style="width: 100%;"
      >
        <el-table-column
            v-for="key in columnList"
            :key="key"
            :prop="key"
            :label="columnHeaders[key]"
            :width="columnWidths[key]"
        >
        </el-table-column>

        <!-- Operations -->
        <el-table-column fixed="right" label="操作" width="120px">
          <template #default="scope">
            <el-button
                link
                type="primary"
                size="small"
                @click="viewDetails(scope.row)"
            >
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <el-pagination
          style="margin-top: 10px"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 30, 40]"
          layout="total, sizes, prev, pager, next"
          :total="filteredData.length"
      />
    </el-main>
  </el-container>

  <el-dialog
      title="提交记录"
      v-model="dialogVisible"
      width="50%"
      @close="closeDetailsDialog"
  >
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
              :label="key"
          >
            <span>{{ Array.isArray(value) ? value.join(', ') : value || " - " }}</span>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>
    <template #footer>
      <!-- add a download button to download this record in pdf -->
      <el-button type="primary" style="margin-right: 10px" @click="downloadPdf">导出</el-button>
    </template>
  </el-dialog>

</template>

<script>
import {Download, RefreshRight, Search} from "@element-plus/icons-vue";
import {
  exportDocumentsToExcel,
  exportDocumentToPDF,
  getAllTaskLogs,
  getMyDocument
} from "@/services/qcTaskSubmissionLogsService"; // Import the backend service
import { formatDate } from "@/utils/task-center/dateFormatUtils";
import TaskDetail from "@/components/task-center/TaskDetail.vue";

export default {
  name: "QcTaskSubmissionLogs",
  components: {
    Download,
    TaskDetail,
    RefreshRight,
    Search,
  },
  props: {
    createdBy: {
      type: String,
      required: true,
    },
    dispatchedTaskId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      title: "质检任务提交记录",
      selectedIds: {
        qc_form_template_id: null,
        submission_id: null,
        inputCollectionName: null
      },
      searchTerm: "",
      tableData: [], // Backend data
      filteredData: [],
      dialogVisible: false,
      selectedDetails: null, // Stores the selected details for the dialog
      columnList: [
        "id",
        "submission_id",
        "created_at",
        "created_by",
        "dispatched_task_id",
        "qc_form_template_id",
        "comment",
        // "status",
      ],
      columnHeaders: {
        id: "ID",
        submission_id: "提交单号",
        created_at: "提交时间",
        created_by: "提交人号码",
        comment: "备注",
        dispatched_task_id: "任务派遣ID",
        qc_form_template_id: "质检表单ID",
        status: "状态"
      },
      columnWidths: {
        id: "100px",
        submission_id: "300px",
        created_at: "200px",
        created_by: "150px",
        comment: "400px",
        dispatched_task_id: "200px",
        qc_form_template_id: "200px",
        status: "100px",
      },
      currentPage: 1,
      pageSize: 20,
      qc_form_template_id: null,
    };
  },
  computed: {
    filteredDetails() {
      return Object.fromEntries(
          Object.entries(this.selectedDetails).filter(([key]) => key !== '_id' && key !== 'created_at' && key !== 'created_by')
      );
    },
    columns() {
      // Split the details into arrays of 10 items each for each column
      const entries = Object.entries(this.filteredDetails); // Convert object to [key, value] pairs
      const result = [];
      for (let i = 0; i < entries.length; i += 10) {
        result.push(Object.fromEntries(entries.slice(i, i + 10))); // Create a new object for each column
      }
      return result;
    },
    paginatedData() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredData.slice(start, end);
    },
  },
  methods: {
    async fetchTableData() {
      try {
        const response = await getAllTaskLogs(this.createdBy, this.dispatchedTaskId);
        // get the qc_form_template_id from the first row of the response
        this.qc_form_template_id = response.data[0].qc_form_template_id;
        // Map response to the fields used in the table
        this.tableData = response.data.map((log) => ({
          id: log.id,
          submission_id: log.submission_id || " - ",
          created_at: formatDate(log.created_at) || " - ",
          created_by: log.created_by || " - ",
          comment: log.comment || " - ",
          dispatched_task_id: log.dispatched_task_id || " - ",
          qc_form_template_id: log.qc_form_template_id || " - ",
          status: log.status,
        }));
        this.filteredData = [...this.tableData]; // Apply the fetched data to filteredData
      } catch (err) {
        console.error("Error fetching task logs:", err);
      }
    },
    async downloadExcel() {
      // This will call the excel_documents_for_user endpoint by providing qcFormTemplateId and user id.
      this.isLoading = true; // Set loading indicator
      try {
        console.log("Downloading Excel...");
        console.log("qc_form_template_id: ", this.qc_form_template_id);
        console.log("user id: ", this.$store.getters.getUser.id);
        const response = await exportDocumentsToExcel(
            this.qc_form_template_id,
            this.$store.getters.getUser.id
        );

        const excelData = response.data;
        const blob = new Blob([excelData], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        // change the name to task_logs_currentdatetime
        const currentDateTime = new Date().toISOString().replace(/[-:.]/g, '');
        const fileName = `task_logs_${currentDateTime}.xlsx`;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();

        // Clean up the DOM
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Show success message
        this.$message.success("Excel downloaded successfully!");
      } catch (err) {
        console.error("Error downloading Excel:", err);
        // Show error message
        this.$message.error("Failed to download Excel. Please try again.");
      } finally {
        this.isLoading = false; // Reset loading indicator
      }
    },
    refreshTable() {
      console.log("Refreshing table...");
      this.fetchTableData(); // Fetch fresh data
    },
    applyFilter() {
      const term = this.searchTerm.trim().toLowerCase();
      this.filteredData = this.tableData.filter(
          (row) =>
              row.id.toString().includes(term) || row.submission_id.toLowerCase().includes(term)
      );
    },
    async viewDetails(row) {
      try {
        // Extract year and month from row.created_at
        const createdAt = new Date(row.created_at);
        const yearMonth = createdAt.getFullYear().toString() +
            (createdAt.getMonth() + 1).toString().padStart(2, "0");

        // Generate inputCollectionName dynamically
        const inputCollectionName = `form_template_${row.qc_form_template_id}_${yearMonth}`;

        // Fetch document details using the dynamically created collection name
        const response = await getMyDocument(row.submission_id, row.qc_form_template_id, row.created_by, inputCollectionName);

        this.selectedDetails = response.data; // Populate the details
        this.selectedIds.qc_form_template_id = row.qc_form_template_id
        this.selectedIds.submission_id = row.submission_id
        this.selectedIds.inputCollectionName = inputCollectionName
        this.dialogVisible = true; // Show the dialog
      } catch (err) {
        console.error("Error fetching document details:", err);
      }
    },
    async downloadPdf() {
      try {
        const response = await exportDocumentToPDF(
            this.selectedIds.submission_id,
            this.selectedIds.qc_form_template_id,
            this.$store.getters.getUser.id,
            this.selectedIds.inputCollectionName
        );

        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `task_submission_${this.selectedDetails.submission_id}.pdf`);
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.$message.success("PDF 下载成功!");
      } catch (err) {
        console.error("Error downloading PDF:", err);
        this.$message.error("PDF 下载失败，请重试!");
      }
    },
    // Close the details dialog
    closeDetailsDialog() {
      this.dialogVisible = false; // Close the dialog
      this.currentTask = null; // Reset currentTask
    },
    handlePageSizeChange(newSize) {
      this.pageSize = newSize;
    },
    handlePageChange(newPage) {
      this.currentPage = newPage;
    },
  },
  mounted() {
    this.fetchTableData(); // Fetch data on mount
  },
};
</script>


<style scoped>
.header {
  padding-bottom: 10px;
  border-bottom: 1px solid #dcdcdc;
}

.refresh-button {
  background-color: #80cfff;
  border-color: #80cfff;
}

.refresh-button:hover {
  background-color: #66b5ff;
  border-color: #66b5ff;
  transform: rotate(360deg);
  transition: transform 0.3s ease-in-out, background-color 0.2s ease;
}
</style>

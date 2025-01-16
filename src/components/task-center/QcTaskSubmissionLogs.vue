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
                circle
                @click="refreshTable"
            >
              <el-icon style="color: #004085;"><RefreshRight /></el-icon>
            </el-button>
          </el-tooltip>
        </div>

        <!-- Right Section: Search Input -->
        <el-input
            v-model="searchTerm"
            placeholder="搜索任务表单名称或任务名称"
            clearable
            style="width: 300px;"
            @input="applyFilter"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
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
          <template #header>
            <span v-if="key === 'formName'">
              {{ columnHeaders[key] }}
              <el-tooltip content="点击查看提交内容" placement="top">
                <el-icon style="margin-left: 5px;"><QuestionFilled /></el-icon>
              </el-tooltip>
            </span>
            <span v-else>
              {{ columnHeaders[key] }}
            </span>
          </template>
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
              Detail
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
</template>

<script>
import { RefreshRight, Search, QuestionFilled } from "@element-plus/icons-vue";

export default {
  name: "QcTaskSubmissionLogs",
  components: {
    RefreshRight,
    Search,
    QuestionFilled,
  },
  data() {
    return {
      title: "提交历史记录",
      searchTerm: "",
      staticData: [
        {
          formName: "质检表单 A",
          taskName: "任务 1",
          submissionTime: "2025-01-10 10:00:00",
          submitter: "张三",
          reviewTime: "2025-01-11 14:00:00",
          reviewer: "李四",
          remark: "备注 A",
        },
        {
          formName: "质检表单 B",
          taskName: "任务 2",
          submissionTime: "2025-01-09 15:00:00",
          submitter: "王五",
          reviewTime: "2025-01-10 12:00:00",
          reviewer: "赵六",
          remark: "备注 B",
        },
        {
          formName: "质检表单 C",
          taskName: "任务 3",
          submissionTime: "2025-01-08 09:00:00",
          submitter: "陈七",
          reviewTime: "2025-01-09 10:30:00",
          reviewer: "孙八",
          remark: "备注 C",
        },
        {
          formName: "质检表单 D",
          taskName: "任务 4",
          submissionTime: "2025-01-12 08:30:00",
          submitter: "周九",
          reviewTime: "2025-01-12 11:00:00",
          reviewer: "吴十",
          remark: "备注 D",
        },
        {
          formName: "质检表单 E",
          taskName: "任务 5",
          submissionTime: "2025-01-11 16:20:00",
          submitter: "朱十一",
          reviewTime: "2025-01-12 13:45:00",
          reviewer: "何十二",
          remark: "备注 E",
        },
      ],
      columnList: [
        "formName",
        "taskName",
        "submissionTime",
        "submitter",
        "reviewTime",
        "reviewer",
        "remark",
      ],
      columnHeaders: {
        formName: "质检任务表单",
        taskName: "任务名称",
        submissionTime: "提交时间",
        submitter: "提交人",
        reviewTime: "审核时间",
        reviewer: "审核人",
        remark: "备注",
      },
      columnWidths: {
        formName: "150px",
        taskName: "150px",
        submissionTime: "200px",
        submitter: "100px",
        reviewTime: "200px",
        reviewer: "100px",
        remark: "150px",
      },
      filteredData: [],
      currentPage: 1,
      pageSize: 10,
    };
  },
  computed: {
    paginatedData() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredData.slice(start, end);
    },
  },
  methods: {
    refreshTable() {
      console.log("Table refreshed");
    },
    applyFilter() {
      const term = this.searchTerm.trim().toLowerCase();
      this.filteredData = this.staticData.filter(
          (row) =>
              row.formName.toLowerCase().includes(term) ||
              row.taskName.toLowerCase().includes(term)
      );
    },
    viewDetails(row) {
      console.log("Viewing details for row:", row);
    },
    handlePageSizeChange(newSize) {
      this.pageSize = newSize;
    },
    handlePageChange(newPage) {
      this.currentPage = newPage;
    },
  },
  mounted() {
    this.filteredData = [...this.staticData]; // Initialize with full data
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

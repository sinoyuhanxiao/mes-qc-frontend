<template>
  <div>

    <!-- Search Input -->
    <el-input
        v-model="searchInput"
        style="width: 240px; margin: 10px;"
        placeholder="输入计划任务ID搜索"
        clearable
        :prefix-icon="Search"
        v-if="showSearchBox"
    />

    <!-- Table -->
    <el-table
        :data="paginatedTasks"
        border
        style="width: 100%"
        :default-sort="{ prop: 'dispatch_time', order: 'descending' }"
    >
      <!-- 查看提交记录 -->
      <el-table-column label="操作" width="150">
        <template #default="scope">
          <el-button
              type="primary"
              v-if="scope.row.dispatched_task_state_id !== 1 && scope.row.dispatched_task_state_id !== 4"
              @click="openTaskLogTab(scope.row)"
          >
            查看提交记录
          </el-button>
        </template>
      </el-table-column>

      <!-- ID -->
      <el-table-column prop="id" label="ID" width="90" sortable></el-table-column>

      <!-- Dispatch ID -->
      <el-table-column prop="dispatch_id" label="计划任务ID" width="90" sortable></el-table-column>

      <!-- Name -->
      <el-table-column prop="name" label="计划任务名称" width="150" sortable>
        <template #default="scope">
          {{ scope.row.name || "-" }}
        </template>
      </el-table-column>

      <!-- Personnel -->
      <el-table-column prop="user_id" label="人员" width="110">
        <template #default="scope">
          <el-tag
              v-if="getUserById(scope.row.user_id)"
              type="primary"
              size="small"
              effect="light"
          >
            <el-popover
                effect="light"
                trigger="hover"
                placement="top"
                width="auto"
            >
              <template #default>
                <div>姓名: {{ getUserById(scope.row.user_id).name }}</div>
                <div>用户名: {{ getUserById(scope.row.user_id).username }}</div>
                <div>企业微信: {{ getUserById(scope.row.user_id).wecom_id }}</div>
              </template>
              <template #reference>
                {{ getUserById(scope.row.user_id).name }}
              </template>
            </el-popover>
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>

      <!-- Form -->
      <el-table-column prop="qc_form_tree_node_id" label="质检表单" width="200">
        <template #default="scope">
          <el-tag
              v-if="getFormById(scope.row.qc_form_tree_node_id)"
              type="success"
              size="small"
              effect="light"
          >
            <el-popover
                effect="light"
                trigger="hover"
                placement="top"
                width="auto"
            >
              <template #default>
                <div>ID: {{ scope.row.qc_form_tree_node_id }}</div>
                <div>质检表单名: {{ getFormById(scope.row.qc_form_tree_node_id) }}</div>
              </template>
              <template #reference>
                {{ getFormById(scope.row.qc_form_tree_node_id) }}
              </template>
            </el-popover>
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>

      <el-table-column prop="dispatched_task_state_id" label="派发任务状态" width="120" sortable>
        <template #default="scope">
          <el-tag :type="stateTagType(scope.row.dispatched_task_state_id)">
            {{ stateName(scope.row.dispatched_task_state_id) }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- Dispatch Time -->
      <el-table-column prop="dispatch_time" label="推送时间" width="180" sortable>
        <template #default="scope">
          {{ formatDate(scope.row.dispatch_time) }}
        </template>
      </el-table-column>

      <!-- Due Date -->
      <el-table-column prop="due_date" label="到期时间" width="150" sortable>
        <template #default="scope">
          <el-tag style="font-weight: bold" :type="remainingTimeTag(scope.row['due_date'])">
            {{ calculateRemainingTime(scope.row['due_date']) }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- Notes -->
      <el-table-column prop="notes" label="备注" width="200">
        <template #default="scope">
          {{ scope.row.notes || "-" }}
        </template>
      </el-table-column>


    </el-table>

    <!-- Pagination -->
    <el-pagination
        class="mt-4"
        background
        layout="prev, pager, next, jumper, ->, total"
        :total="totalFilteredRows"
        :page-size="pageSize"
        :current-page="currentPage"
        @current-change="handlePageChange"
    />
  </div>
</template>

<script>
import dayjs from "dayjs";
import {Search} from "@element-plus/icons-vue";

export default {
  name: "DispatchedTasksTable",
  props: {
    dispatchedTasks: {
      type: Array,
      required: true,
    },
    formMap: {
      type: Object,
      required: true, // Form ID to Form Name mapping
    },
    userMap: {
      type: Object,
      required: true, // Personnel ID to Personnel Details mapping
    },
    showSearchBox: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      currentPage: 1,
      pageSize: 10, // Number of rows per page
      searchInput: "",
    };
  },
  watch: {
    // Reset to page 1 when search changes to prevent empty pages
    searchInput() {
      this.currentPage = 1;
    },
  },
  computed: {
    Search() {
      return Search
    },
    filteredTasks() {
      return this.dispatchedTasks.filter((task) => {
        if (!this.searchInput.trim()) return true;

        const searchTerm = this.searchInput.toLowerCase();
        return (
            task.id.toString().includes(searchTerm) ||
            (task.name && task.name.toLowerCase().includes(searchTerm)) ||
            task.dispatch_id.toString().includes(searchTerm)
        );
      });
    },
    totalFilteredRows() {
      return this.filteredTasks.length;
    },
    paginatedTasks() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredTasks.slice(start, end);
    },
  },
  methods: {
    formatDate(dateString) {
      return dateString ? dayjs(dateString).format("YYYY-MM-DD HH:mm:ss") : "-";
    },
    statusTagType(status) {
      const statusMap = {
        PENDING: "warning",
        COMPLETED: "success",
        FAILED: "danger",
      };
      return statusMap[status] || "info";
    },
    getFormById(formId) {
      return this.formMap[formId] || "未知表单";
    },
    getUserById(userId) {
      return this.userMap[userId] || null;
    },
    handlePageChange(page) {
      this.currentPage = page;
    },
    stateTagType(stateId) {
      const stateMap = {
        1: "warning", // Pending
        2: "primary", // In Progress
        3: "success", // Completed
        4: "info", // Canceled
        5: "danger", // Overdue
      };
      return stateMap[stateId] || "info"; // Default to 'info' if stateId is undefined
    },
    stateName(stateId) {
      const stateMap = {
        1: "Pending",
        2: "In Progress",
        3: "Completed",
        4: "Canceled",
        5: "Overdue",
      };
      return stateMap[stateId] || "Unknown"; // Default to 'Unknown' if stateId is undefined
    },
    calculateRemainingTime(dueDate) {
      if (!dueDate) return "-";

      const now = dayjs();
      const due = dayjs(dueDate);
      const diffInMinutes = due.diff(now, "minute");

      if (diffInMinutes <= 0) return "已过期";

      const days = Math.floor(diffInMinutes / (60 * 24));
      const hours = Math.floor((diffInMinutes % (60 * 24)) / 60);
      const minutes = diffInMinutes % 60;

      if (days > 0) {
        return `${days} 天 ${hours} 小时 ${minutes} 分钟`;
      } else if (hours > 0) {
        return `${hours} 小时 ${minutes} 分钟`;
      } else {
        return `${minutes} 分钟`;
      }
    },
    remainingTimeTag(dueDate) {
      if (!dueDate) return "info";

      const now = dayjs();
      const due = dayjs(dueDate);
      const diffInMinutes = due.diff(now, "minute");

      if (diffInMinutes > 24 * 60) {
        return "info";
      } else if (diffInMinutes > 60) {
        return "primary";
      } else if (diffInMinutes > 30) {
        return "warning";
      } else {
        return "danger";
      }
    },
    openTaskLogTab(row){
      const url = this.$router.resolve({
        name: "TaskLog",
        params: {
          createdBy: row.user_id, // Pass user_id as :createdBy
          dispatchedTaskId: row.id, // Pass id as :dispatchedTaskId
        },
      }).href;

      // Open the URL in a new tab
      window.open(url, "_blank");
    },
  },
};
</script>

<style scoped>
.mt-4 {
  margin-top: 16px;
}
</style>
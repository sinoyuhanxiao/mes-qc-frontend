<template>
  <el-container>
    <el-header class="header">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2>{{ title }}</h2>
        <el-input
            v-model="formFilter"
            placeholder="搜索任务表单名称"
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
          :data="paginatedTasks"
          border
          style="width: 100%"
          :default-sort="{ prop: 'dispatch_time', order: 'descending' }"
      >
        <el-table-column
            v-for="(key, index) in columnList"
            :key="index"
            :prop="key"
            :label="keyMap[key] || key"
            width="200"
        >
          <template #default="scope">
            <span v-if="key === 'qc_form_tree_node_id'">
              <span
                  class="clickable-form-name"
                  @click="handleFormNameClick(scope.row[key])"
              >
                {{ getFormNameById(scope.row[key]) || '未知表单' }}
              </span>
            </span>
            <span v-else-if="key === 'dispatched_task_state_id'">
              <el-tag :type="stateTagType(scope.row[key])">
                {{ stateName(scope.row[key]) }}
              </el-tag>
            </span>
            <span v-else-if="key === 'due_date' || key === 'dispatch_time' || key === 'created_at' || key === 'updated_at'">
              {{ formatDate(scope.row[key]) }}
            </span>
            <span v-else-if="key === 'remaining_time'">
              <el-tag style="font-weight: bold" :type="remainingTimeTag(scope.row['due_date'])">
                {{ calculateRemainingTime(scope.row['due_date']) }}
              </el-tag>
            </span>
            <span v-else-if="key === 'is_overdue'">
              <el-tag :type="scope.row[key] ? 'danger' : 'info'">
                {{ scope.row[key] ? '是' : '否' }}
              </el-tag>
            </span>
            <span v-else-if="key === 'status'">
              <el-tag :type="scope.row[key] === 0 ? 'info' : 'primary'">
                {{ scope.row[key] === 0 ? '是' : '否' }}
              </el-tag>
            </span>
            <span v-else-if="key === 'created_by' || key === 'updated_by' || key === 'user_id'">
              <el-popover effect="light" trigger="hover" placement="top" width="auto">
                <template #default>
                  <div>姓名: {{ personnelMap[scope.row[key]]?.name || '未知' }}</div>
                  <div>企业微信: {{ personnelMap[scope.row[key]]?.wecom_id || '未知' }}</div>
<!--                  <div>角色: {{ personnelMap[scope.row[key]]?.role || '未知' }}</div>-->
                </template>
                <template #reference>
                  <el-tag type="primary">
                    {{ personnelMap[scope.row[key]]?.name || '未知' }}
                  </el-tag>
                </template>
              </el-popover>
            </span>
            <span v-else>
              {{ scope.row[key] || '-' }}
            </span>
          </template>
        </el-table-column>

        <!-- Operations -->
        <el-table-column fixed="right" label="操作" min-width="200">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="showDetails(scope.row)">
              Detail
            </el-button>
            <el-button link type="info" size="small" @click="editTask(scope.row)">
              Edit
            </el-button>
            <el-button link type="success" size="small" @click="completeTask(scope.row)">
              Complete
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <el-pagination
          style="margin-top: 10px"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[15, 30, 45, 60]"
          layout="total, sizes, prev, pager, next"
          :total="filteredTasks.length"
          :hide-on-single-page="true"
      />

      <!-- Popup for Details -->
      <el-dialog
          title="任务详情"
          v-model="isDetailsDialogVisible"
          width="50%"
          @close="closeDetailsDialog"
      >
        <TaskDetail
            v-if="currentTask"
            :task="currentTask"
            :form-map="formMap"
            :personnel-map="personnelMap"
            @edit="editTask(currentTask)"
            @delete="deleteTask(currentTask)"
        />
      </el-dialog>
    </el-main>
  </el-container>
</template>

<script>
import dayjs from "dayjs";
import TaskDetail from "@/components/task-center/TaskDetail.vue";
import { Search } from "@element-plus/icons-vue";
import { fetchFormNodes } from "@/services/formNodeService";
import { fetchUsers } from "@/services/userService";
import {
  fetchFutureTasks,
  fetchHistoricalTasks,
  fetchOverdueTasks,
  fetchTodayTasks,
  updateDispatchedTask
} from "@/services/taskCenterService";
import * as formNodeService from "@/services/formNodeService";

export default {
  name: "MyTaskTable",
  props: {
    title: {
      type: String,
      default: "任务表",
    },
    columnList: {
      type: Array,
      required: true,
    },
    userId: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: true,
    }
  },
  components: {
    TaskDetail,
    Search,
  },
  data() {
    return {
      dispatchedTasks: [],
      formMap: {},
      personnelMap: {},
      isDetailsDialogVisible: false,
      currentTask: null,
      currentPage: 1,
      pageSize: 15,
      formFilter: "",
      filteredTasks: [],
    };
  },
  computed: {
    paginatedTasks() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredTasks.slice(start, end);
    },
    keyMap() {
      return {
        qc_form_tree_node_id: "质检任务表单",
        dispatched_task_state_id: "任务状态",
        name: "任务名称",
        remaining_time: "剩余时间",
        due_date: "到期时间",
        description: "任务描述",
        notes: "备注",
        dispatch_time: "派发时间",
        user_id: "派发给",
        created_at: "创建时间",
        created_by: "派发人",
        updated_at: "最新更新时间",
        updated_by: "更新人",
        status: "归档状态",
        id: "任务号码",
        dispatch_id: "派发号码",
        is_overdue: "是否过期",
        finished_at: "完成时间"
      };
    },
  },
  methods: {
    async fetchDispatchedTasks() {
      try {
        let response;
        switch (this.type) {
          case "today":
            response = await fetchTodayTasks(this.userId);
            break;
          case "future":
            response = await fetchFutureTasks(this.userId);
            break;
          case "history":
            response = await fetchHistoricalTasks(this.userId);
            break;
          case "overdue":
            response = await fetchOverdueTasks(this.userId);
            break;
          default:
            throw new Error(`Invalid task type: ${this.type}`);
        }
        this.dispatchedTasks = response.data.data;
        this.filteredTasks = this.dispatchedTasks; // Initialize filteredTasks
      } catch (error) {
        console.error("Error fetching dispatched tasks:", error);
        this.$message.error("无法加载任务列表，请重试。");
      }
    },
    async fetchPersonnelMap() {
      try {
        const response = await fetchUsers();
        this.personnelMap = response.data.data.reduce((map, person) => {
          map[person.id] = person;
          return map;
        }, {});
        console.log("Personnel Map:", this.personnelMap);
      } catch (error) {
        console.error("Error fetching personnel data:", error);
        this.$message.error("无法加载人员信息，请重试。");
      }
    },
    startPolling() {
      this.pollingInterval = setInterval(() => {
        this.fetchDispatchedTasks();
      }, 10000); // Poll every 10 seconds
    },
    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    },
    async applyFilter() {
      if (this.formFilter.trim() === "") {
        this.filteredTasks = this.dispatchedTasks; // Reset to all tasks if filter is empty
      } else {
        this.filteredTasks = this.dispatchedTasks.filter((task) =>
            this.getFormNameById(task.qc_form_tree_node_id).includes(this.formFilter)
        );
      }
    },
    async fetchFormMap() {
      try {
        const response = await fetchFormNodes();

        // Recursive function to process all nodes
        const processNodes = (nodes, map) => {
          nodes.forEach((node) => {
            // Add the current node to the map
            map[node.id] = node.label;

            // If the node has children, process them recursively
            if (node.children && node.children.length > 0) {
              processNodes(node.children, map);
            }
          });
        };

        // Initialize the map and process the top-level nodes
        const formMap = {};
        processNodes(response.data, formMap);

        // Assign the result to the component's formMap
        this.formMap = formMap;

      } catch (error) {
        console.error("Error fetching form nodes:", error);
        this.$message.error("无法加载表单信息，请重试。");
      }
    },
    async handleFormNameClick(nodeId) {
      console.log("Redirecting to form display with nodeId:", nodeId);

      try {
        // Fetch the qc form template id asynchronously
        const response = await formNodeService.fetchFormNodesById(nodeId);
        const qcFormTemplateId = response.data?.qcFormTemplateId;

        if (!qcFormTemplateId) {
          console.error("Failed to fetch qcFormTemplateId for nodeId:", nodeId);
          this.$message.error("无法加载表单模板，请重试。");
          return;
        }

        // Construct the URL for the route
        const newTabUrl = this.$router.resolve({
          name: 'FormDisplay',
          params: {
            qcFormTemplateId: qcFormTemplateId,
            usable: false,
            switchDisplayed: false
          },
        }).href;

        // Open the URL in a new tab
        window.open(newTabUrl, '_blank');
      } catch (error) {
        console.error("Error fetching qcFormTemplateId for nodeId:", nodeId, error);
        this.$message.error("加载表单模板时出错，请稍后重试。");
      }
    },
    formatDate(dateString) {
      return dateString ? dayjs(dateString).format("YYYY-MM-DD HH:mm:ss") : "-";
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
    getFormNameById(formId) {
      return this.formMap[formId] || "未知表单";
    },
    showDetails(row) {
      this.currentTask = row;
      this.isDetailsDialogVisible = true;
    },
    editTask(row) {
      console.log("Edit task:", row);
    },
    completeTask(row) {
      console.log("complete task:", row);

      // Show a confirmation popup
      this.$confirm(
          "If you mark this task as completed, you will no longer be able to submit this form. Are you sure you want to continue?",
          "Confirm Completion",
          {
            confirmButtonText: "Yes, Complete",
            cancelButtonText: "Cancel",
            type: "warning",
          }
      )
          .then(() => {
            console.log("Task marked as completed:", row);
            updateDispatchedTask(row.id, { dispatched_task_state_id: 3}) // mark this task as complete, add error handling in the future
          })
          .catch(() => {
            console.log("Task completion canceled.");
          });
    },
    closeDetailsDialog() {
      this.isDetailsDialogVisible = false;
      this.currentTask = null;
    },
    handleSizeChange(size) {
      this.pageSize = size;
    },
    handleCurrentChange(page) {
      this.currentPage = page;
    },
  },
  async mounted() {
    await this.fetchDispatchedTasks();
    await this.fetchFormMap();
    await this.startPolling();
    await this.fetchPersonnelMap();
  },
  async beforeUnmount() {
    this.stopPolling();
  }
};
</script>

<style scoped>
.header {
  padding-bottom: 10px;
  border-bottom: 1px solid #dcdcdc;
}

.clickable-form-name {
  color: #409eff;
  cursor: pointer;
  text-decoration: underline;
}

.clickable-form-name:hover {
  color: #66b1ff;
}
</style>

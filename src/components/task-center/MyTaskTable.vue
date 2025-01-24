<template>
  <el-container>
    <el-header class="header">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <!-- Left Section: Title -->
        <div style="display: flex; align-items: center;">
          <h2 style="margin-right: 20px;">{{ title }}</h2>
          <el-input
              v-model="formFilter"
              placeholder="搜索关键字"
              clearable
              style="width: 300px;"
              @input="applyFilter"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <!-- Right Section: Search Input, Tooltip, and Refresh Button -->
        <div style="display: flex; align-items: center; gap: 10px; margin-left: auto;">
          <el-tooltip content="Refresh table" placement="top">
            <el-button
                class="refresh-button"
                type="primary"
                circle
                @click="showFeatureDevelopmentMessage"
            >
              <el-icon style="color: #004085;"><RefreshRight /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="请求新任务给我做" placement="top">
            <el-button type="primary" @click="showFeatureDevelopmentMessage"> + 请求新任务</el-button>
          </el-tooltip>
        </div>
      </div>
    </el-header>
    <el-main>
      <el-table
          :data="paginatedTasks"
          border
          style="width: 100%"
          :default-sort="{ prop: 'due_date', order: 'ascending' }"
          @sort-change="handleSortChange"
      >
        <el-table-column
            v-for="(key, index) in columnList"
            :key="index"
            :prop="key"
            :label="keyMap[key] || key"
            :width="getColumnWidth(key)"
            sortable
        >
          <template #header>
            <span v-if="key === 'qc_form_tree_node_id'">
                {{ keyMap[key] || key }}
                <el-tooltip content="任务过期、未来30分钟后或已完成则无法填写。" placement="top">
                    <el-icon><QuestionFilled /></el-icon>
                </el-tooltip>
            </span>
                <span v-else>
                {{ keyMap[key] || key }}
            </span>
          </template>
          <template #default="scope">
            <span v-if="key === 'qc_form_tree_node_id'">
              <span
                  :class="{
                    'usable-form-name': isTaskUsable(scope.row.due_date, scope.row.dispatched_task_state_id),
                    'unusable-form-name': !isTaskUsable(scope.row.due_date, scope.row.dispatched_task_state_id)
                  }"
                  @click="handleFormNameClick(scope.row[key], scope.row)"
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
            <el-button link type="info" size="small" style="cursor: not-allowed" disabled @click="editTask(scope.row)">
              Edit
            </el-button>
            <el-button
                link
                :type="['3', '4', '5'].includes(String(scope.row.dispatched_task_state_id)) ? 'info' : 'success'"
                size="small"
                :style="['3', '4', '5'].includes(String(scope.row.dispatched_task_state_id)) ? 'cursor: not-allowed;' : ''"
                :disabled="['3', '4', '5'].includes(String(scope.row.dispatched_task_state_id))"
                @click="['3', '4', '5'].includes(String(scope.row.dispatched_task_state_id)) ? null : completeTask(scope.row)"
            >
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
import {Plus, QuestionFilled, RefreshRight, Search} from "@element-plus/icons-vue";
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
import { Base64 } from 'js-base64';
import isTaskUsable from "@/utils/task-center/taskUtils.js";
import {ElNotification} from "element-plus";

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
    RefreshRight,
    QuestionFilled,
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
      sortSettings: {
        prop: 'due_date', // Default sorting column
        order: 'ascending', // Default sorting order
      },
    };
  },
  computed: {
    Plus() {
      return Plus
    },
    paginatedTasks() {
      // Apply pagination directly to already sorted filteredTasks
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
    isTaskUsable,
    getColumnWidth(key) {
      if (['description'].includes(key)) {
        return '350';
      } else if (['dispatched_task_state_id', 'remaining_time'].includes(key)) {
        return '150';
      } else {
        return '200';
      }
    },
    showFeatureDevelopmentMessage() {
      this.$message({
        type: 'info',
        message: '此功能正在开发中，感谢您的点击。',
      });
    },
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

        // Re-apply the filter if one is active
        if (this.formFilter.trim() !== "") {
          this.applyFilter();
        }

        if (this.type === "today") {
          this.notifyDueSoonTasks();
          this.notifyTasksDueToday();
        }

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
    handleSortChange({ prop, order }) {
      this.sortSettings = { prop, order }; // Save the sorting settings

      // Sort the entire dispatchedTasks array
      this.dispatchedTasks.sort((a, b) => {
        const valA = a[prop];
        const valB = b[prop];

        // Default sorting logic
        if (order === "ascending") return valA > valB ? 1 : valA < valB ? -1 : 0;
        if (order === "descending") return valA < valB ? 1 : valA > valB ? -1 : 0;
        return 0;
      });

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
        this.filteredTasks = this.dispatchedTasks; // Reset to all tasks if the filter is empty
      } else {
        const searchText = this.formFilter.trim().toLowerCase();

        this.filteredTasks = this.dispatchedTasks.filter((task) => {
          return Object.keys(task).some((key) => {
            let value;

            // Dynamically map displayed values for each column
            switch (key) {
              case 'qc_form_tree_node_id':
                value = this.getFormNameById(task[key]); // Use the function to get the display name
                break;

              case 'dispatched_task_state_id':
                value = this.stateName(task[key]); // Use function to map state to displayed name
                break;

              case 'due_date':
              case 'dispatch_time':
              case 'created_at':
              case 'updated_at':
                value = this.formatDate(task[key]); // Format date for display
                break;

              case 'remaining_time':
                value = this.calculateRemainingTime(task['due_date']); // Use dynamic calculated value
                break;

              case 'created_by':
              case 'updated_by':
              case 'user_id':
                value = this.personnelMap[task[key]]?.name; // Display personnel name
                break;

              default:
                value = task[key]; // Use raw value for other keys
            }

            if (value === null || value === undefined) return false; // Skip null/undefined values
            return String(value).toLowerCase().includes(searchText); // Match against the transformed value
          });
        });
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
    async handleFormNameClick(nodeId, row) {
      console.log("Redirecting to form display with nodeId:", nodeId)

      // Determine if the task is not usable
      let taskUsable = isTaskUsable(row.due_date, row.dispatched_task_state_id);
      if (!taskUsable) {
        this.$message.warning("任务不可填写。");
      } else {
        if (row.dispatched_task_state_id !== 2) {
          await updateDispatchedTask(row.id, { dispatched_task_state_id: 2 });
          row.dispatched_task_state_id = 2;
          this.$message.success("任务状态已更新为进行中。");
        }
      }

      try {        // Fetch the qc form template id asynchronously
        const response = await formNodeService.fetchFormNodesById(nodeId);
        const qcFormTemplateId = response.data?.qcFormTemplateId;

        if (!qcFormTemplateId) {
          console.error("Failed to fetch qcFormTemplateId for nodeId:", nodeId);
          this.$message.error("无法加载表单模板，请重试。");
          return;
        }

        // Encode query parameters into a Base64 string
        console.log("taskUsable: " + taskUsable)
        // const queryParams = { usable: taskUsable, switchDisplayed: false };
        const queryParams = { usable: taskUsable, switchDisplayed: false, dispatchedTaskId: row.id};
        const encodedQuery = Base64.encode(JSON.stringify(queryParams));

        // Construct the URL
        const newTabUrl = this.$router.resolve({
          name: 'FormDisplay',
          params: { qcFormTemplateId }, // Path parameter
          query: queryParams, // Encoded query
        }).href;


        // Open the URL in a new tab
        window.open(newTabUrl, '_blank');
      } catch (error) {
        console.error("Error fetching qcFormTemplateId for nodeId:", nodeId, error);
        this.$message.error("加载表单模板时出错，请稍后重试。");
      }
    },
    notifyDueSoonTasks() {
      const now = dayjs();
      const dueSoonTasks = this.dispatchedTasks.filter((task) => {
        const dueDate = dayjs(task.due_date);
        return dueDate.diff(now, "minute") <= 30 && dueDate.isAfter(now);
      });

      if (dueSoonTasks.length > 0) {
        ElNotification({
          title: "警告",
          message: `您有 ${dueSoonTasks.length} 个任务即将到期！`,
          type: "warning",
          duration: 5000,
        });
      }
    },
    notifyTasksDueToday() {
      const today = dayjs().startOf("day");
      const tomorrow = dayjs().add(1, "day").startOf("day");

      const todayTasks = this.dispatchedTasks.filter((task) => {
        const dueDate = dayjs(task.due_date);
        return dueDate.isAfter(today) && dueDate.isBefore(tomorrow);
      });

      if (todayTasks.length > 0) {
        ElNotification({
          title: "信息",
          message: `您今天一共有 ${todayTasks.length} 个任务。`,
          type: "info",
          offset: 100,
          duration: 5000,
        });
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
          .then(async () => {
            console.log("Task marked as completed:", row);
            await updateDispatchedTask(row.id, {dispatched_task_state_id: 3}) // mark this task as complete, add error handling in the future
            // Refresh table
            await this.fetchDispatchedTasks();
            this.$message.success("任务已标记为完成");
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
    // await this.startPolling();
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
  }

  .clickable-form-name {
    color: #409eff;
    cursor: pointer;
    text-decoration: underline;
  }

  .clickable-form-name:hover {
    color: #66b1ff;
  }

  .usable-form-name {
    color: #409eff;
    cursor: pointer;
    text-decoration: underline;
  }

  .usable-form-name:hover {
    color: #66b1ff;
  }

  .unusable-form-name {
    color: #4d6c85;
    text-decoration: underline;
    cursor: pointer;
  }

  .refresh-button {
    background-color: #80cfff; /* Slightly lighter shade of primary color */
    border-color: #80cfff; /* Match lighter background */
  }

  .refresh-button:hover {
    background-color: #66b5ff; /* Slightly darker hover effect */
    border-color: #66b5ff;
    transform: rotate(360deg); /* Rotate on hover */
    transition: transform 0.3s ease-in-out, background-color 0.2s ease; /* Smooth animation */
  }

</style>

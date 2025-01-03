<template>
  <el-container>
    <el-header class="header">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2>当前任务</h2>
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
        <!-- Task Form -->
        <el-table-column prop="form_id" label="任务表单" width="300">
          <template #default="scope">
            <span
                class="clickable-form-name"
                @click="handleFormNameClick(scope.row.form_id)"
            >
              {{ getFormById(scope.row.form_id) || '未知表单' }}
            </span>
          </template>
        </el-table-column>

        <!-- Personnel -->
        <el-table-column prop="personnel_id" label="派发对象" width="200">
          <template #default="scope">
            <el-tag
                v-if="getPersonnelById(scope.row.personnel_id)"
                type="info"
                size="small"
                effect="dark"
            >
              <el-popover
                  effect="light"
                  trigger="hover"
                  placement="top"
                  width="auto"
              >
                <template #default>
                  <div>姓名: {{ getPersonnelById(scope.row.personnel_id).name }}</div>
                  <div>用户名: {{ getPersonnelById(scope.row.personnel_id).username }}</div>
                  <div>企业微信: {{ getPersonnelById(scope.row.personnel_id).wecom_id }}</div>
                </template>
                <template #reference>
                  {{ getPersonnelById(scope.row.personnel_id).name }}
                </template>
              </el-popover>
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <!-- Dispatch Time -->
        <el-table-column prop="dispatch_time" label="派发时间" width="180" sortable>
          <template #default="scope">
            {{ formatDate(scope.row.dispatch_time) }}
          </template>
        </el-table-column>

        <!-- Status -->
        <el-table-column prop="status" label="状态" width="120" sortable>
          <template #default="scope">
            <el-tag :type="statusTagType(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Notes -->
        <el-table-column prop="notes" label="备注" width="400">
          <template #default="scope">
            {{ scope.row.notes || "-" }}
          </template>
        </el-table-column>

        <!-- Operations -->
        <el-table-column fixed="right" label="操作" min-width="120">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="showDetails(scope.row)">
              Detail
            </el-button>
            <el-button link type="primary" size="small" @click="editTask(scope.row)">
              Edit
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
          layout="total, sizes, prev, pager, next"
          :total="dispatchedTasks.length"
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
import { getAllDispatchedTasks } from "@/services/dispatchService";
import { fetchFormNodes } from "@/services/formNodeService";
import { fetchUsers } from "@/services/userService";
import TaskDetail from "@/components/task-center/TaskDetail.vue";
import { Search } from "@element-plus/icons-vue";


export default {
  components: {
    TaskDetail,
    Search
  },
  data() {
    return {
      dispatchedTasks: [],
      formMap: {},
      personnelMap: {},
      isDetailsDialogVisible: false,
      currentTask: null,
      currentPage: 1,
      pageSize: 10,
      formFilter: "",
      filteredTasks: []
    };
  },
  computed: {
    paginatedTasks() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredTasks.slice(start, end);
    },
  },
  methods: {
    async fetchDispatchedTasks() {
      try {
        const response = await getAllDispatchedTasks();
        this.dispatchedTasks = response.data.data;
        this.filteredTasks = this.dispatchedTasks; // Initialize filteredTasks
      } catch (error) {
        console.error("Error fetching dispatched tasks:", error);
        this.$message.error("无法加载我的任务，请重试。");
      }
    },
    async applyFilter() {
      if (this.formFilter.trim() === "") {
        this.filteredTasks = this.dispatchedTasks; // Reset to all tasks if filter is empty
      } else {
        this.filteredTasks = this.dispatchedTasks.filter((task) =>
            this.getFormById(task.form_id).includes(this.formFilter)
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
    async fetchPersonnelMap() {
      try {
        const response = await fetchUsers();
        this.personnelMap = response.data.data.reduce((map, person) => {
          map[person.id] = person;
          return map;
        }, {});
      } catch (error) {
        console.error("Error fetching personnel data:", error);
        this.$message.error("无法加载人员信息，请重试。");
      }
    },
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
    getPersonnelById(personnelId) {
      return this.personnelMap[personnelId] || null;
    },
    showDetails(row) {
      console.log("Selected Task Row:", row);
      this.currentTask = row;
      this.isDetailsDialogVisible = true;
    },
    editTask(row) {
      // Placeholder for edit functionality
      console.log("Edit task:", row);
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
    await Promise.all([
      this.fetchDispatchedTasks(),
      this.fetchFormMap(),
      this.fetchPersonnelMap(),
    ]);
  },
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

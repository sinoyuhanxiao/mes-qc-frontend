<template>
  <el-container class="dispatcher-page">
    <!-- Top Section -->
    <div class="top-section">
      <div class="top-left">
        <h2>任务派发管理</h2>
        <el-input
            v-model="searchInput"
            placeholder="输入名称或ID搜索"
            clearable
            style="width: 300px; margin-left: 20px"
        >
          <template #append>
            <el-button>
              <el-icon>
                <Search />
              </el-icon>
            </el-button>
          </template>
        </el-input>
      </div>

      <div class="top-right">
        <!-- Refresh Button -->
        <el-tooltip content="刷新列表" placement="top">
          <el-button
              class="refresh-button"
              type="primary"
              circle
              @click="loadAllQcOrders"
          >
            <el-icon style="color: #004085;">
              <RefreshRight />
            </el-icon>
          </el-button>
        </el-tooltip>

        <!-- New QC Order Button -->
        <el-button type="primary" @click="handleNewQcOrderButtonClick">
          新增QC工单
        </el-button>

        <!-- View All Tasks Button -->
        <el-button type="info" @click="openViewDispatchedTestsDialog">
          查看全部派发任务
        </el-button>

        <!-- Delete Button -->
        <el-button
            v-if="selectedRows.length > 0"
            type="danger"
            @click="confirmDeleteSelectedRows"
        >
          删除
        </el-button>
      </div>
    </div>

    <!-- QC Order Table -->
    <el-main class="table-section">
      <QcOrderList
          :qc-order-list="filteredAndSortedQcOrderList"
          @order-clicked="handleOrderClicked"
          @selection-change="updateSelectedRows"
      />

      <!-- Pagination -->
      <el-pagination
          v-if="filteredAndSortedQcOrderList.length > 0"
          style="margin-top: 16px; text-align: right;"
          background
          layout="total, sizes, prev, pager, next"
          :total="filteredAndSortedQcOrderList.length"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          :current-page="currentPage"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
      />
    </el-main>

    <!-- QC Order Details Dialog -->
    <el-dialog
        title="工單详情"
        v-model="isDetailsDialogVisible"
        width="50%"
        :close-on-click-modal="false"
        @close="closeAndResetDetailsDialog"
        @resume="handleResumeDispatch"
        @pause="handlePauseDispatch"
        @edit="handleEditQcOrder"
        @delete="handleDeleteQcOrder"

    >
      <template v-if="isDetailsDialogVisible && !isEditMode && currentOrder">
        <qc-order-details
            :order="currentOrder"
            :user-map="userMap"
            :form-map="formMap"
            :dispatched-tasks-map="dispatchedTaskMap"
        />
      </template>

      <template v-else-if="isDetailsDialogVisible && isEditMode">
        <dispatch-configurator
            :current-order="currentOrder"
            :is-edit-mode="isEditMode"
            @on-submit="handleOrderSubmit"
            @on-cancel="closeAndResetDetailsDialog"
        />
      </template>
    </el-dialog>

    <!-- Dispatched Tasks Dialog -->
    <el-dialog
        title="已派发任務"
        v-model="isDispatchedTestsDialogVisible"
        width="70%"
        @close="closeViewDispatchedTestsDialog"
    >
      <DispatchedTasksList
          :dispatched-tasks="filteredAndSortedDispatchedTaskList"
          :form-map="formMap"
          :user-map="userMap"
          :show-search-box="true"
      />
    </el-dialog>
  </el-container>
</template>

<script>

import {getAllQcOrders, deleteQcOrder, resumeDispatch, pauseDispatch} from "@/services/qcOrderService";
import { Search, RefreshRight } from "@element-plus/icons-vue";
import QcOrderList from "@/components/dispatch/QcOrderList.vue";
import QcOrderDetails from "@/components/dispatch/QcOrderDetails.vue";
import DispatchConfigurator from "@/components/dispatch/DispatchConfigurator.vue";
import {fetchFormNodes} from "@/services/formNodeService";
import {generateFormMap} from "@/utils/dispatch-utils";
import {fetchUsers} from "@/services/userService";
import {getAllDispatchedTasks} from "@/services/dispatchService";
import DispatchedTasksList from "@/components/dispatch/DispatchedTaskList.vue";

export default {
  components: {
    DispatchedTasksList,
    DispatchConfigurator,
    QcOrderList,
    QcOrderDetails,
    Search,
    RefreshRight,
  },
  data() {
    return {
      isDetailsDialogVisible: false,
      isDispatchedTestsDialogVisible: false,
      isEditMode: false,
      currentOrder: null,
      selectedRows: [],
      searchInput: "",
      qcOrderList: [],
      currentPage: 1,
      pageSize: 10,
      formMap: {},
      userMap: {},
      dispatchedTasks: [],
    };
  },
  computed: {
    filteredAndSortedQcOrderList() {
      return this.filterAndSortList(
          this.qcOrderList,
          (order) =>
              (
                  (order.status === 1) &&
                  (!this.searchInput ||
                  this.matchesSearch(order.name, this.searchInput) ||
                  this.matchesSearch(order.order_id, this.searchInput))),
          ["created_at", "updated_at"]
      );
    },
    filteredAndSortedDispatchedTaskList() {
      return this.filterAndSortList(
          this.dispatchedTasks,
          (task) =>
              task.status !== 0,
          ["updated_at","created_at"]);
    },
    paginatedQcOrderList() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredAndSortedQcOrderList.slice(start, end);
    },
    dispatchedTaskMap() {
      const map = {};
      this.currentOrder.dispatches.forEach(dispatch => {
        map[dispatch.id] = this.dispatchedTasks.filter(task => task.dispatch_id === dispatch.id);
      });
      return map;
    }
  },
  methods: {
    async loadAllQcOrders() {
      try {
        const response = await getAllQcOrders();
        this.qcOrderList = response.data.data;
      } catch (error) {
        this.$message.error("无法加载QC工单列表，请重试。");
      }
    },
    handleNewQcOrderButtonClick() {
      this.currentOrder = null;
      this.isEditMode = true;
      this.isDetailsDialogVisible = true;
    },
    handleOrderClicked(order) {
      this.currentOrder = { ...order };
      this.isEditMode = false;
      this.isDetailsDialogVisible = true;
    },
    async handleOrderSubmit(order) {
      await this.loadAllQcOrders();
      this.closeAndResetDetailsDialog();
    },
    async confirmDeleteOrder(orderId) {
      try {
        await this.$confirm("确认删除工单吗？", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });
        const userId = this.$store.getters.getUser.id;
        const response = await deleteQcOrder(orderId, userId);
        this.$message.success("工单已删除！");
        await this.loadAllQcOrders();
      } catch (error) {
        this.$message.error("删除失败，请重试。");
      }
    },
    confirmDeleteSelectedRows() {
      if (this.selectedRows.length === 0) {
        this.$message.warning("请选择至少一个工单进行删除！");
        return;
      }

      this.$confirm("确认删除选中的工单吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
          .then(async () => {
            const userId = this.$store.getters.getUser.id;
            const idsToDelete = this.selectedRows.map((row) => row.order_id);
            await Promise.all(idsToDelete.map((id) => deleteQcOrder(id, userId)));
            this.$message.success("选中的工单已删除！");
            await this.loadAllQcOrders();
            this.selectedRows = [];
          })
          .catch((error) => {
            this.$message.error("删除失败，请重试。");
          });
    },
    closeAndResetDetailsDialog() {
      this.currentOrder = null;
      this.isEditMode = false;
      this.isDetailsDialogVisible = false;
    },
    updateSelectedRows(selected) {
      this.selectedRows = selected;
    },
    handleSizeChange(newSize) {
      this.pageSize = newSize;
      this.currentPage = 1; // Reset to the first page on size change
    },
    handlePageChange(newPage) {
      this.currentPage = newPage;
    },
    async handleResumeDispatch(dispatchId) {
      const userId = this.$store.getters.getUser.id;
      await resumeDispatch(this.currentOrder.order_id, dispatchId, userId);
    },
    async handlePauseDispatch(dispatchId) {
      const userId = this.$store.getters.getUser.id;
      await pauseDispatch(this.currentOrder.order_id, dispatchId, userId);
    },
    handleEditQcOrder() {

    },
    handleDeleteQcOrder() {

    },
    filterAndSortList(list, filterFn, sortFields) {
      const filtered = list.filter(filterFn);
      return filtered.sort((a, b) => {
        const dateA = sortFields
            .map((field) => new Date(a[field]))
            .find((date) => !isNaN(date));
        const dateB = sortFields
            .map((field) => new Date(b[field]))
            .find((date) => !isNaN(date));
        return dateB - dateA;
      });
    },
    matchesSearch(value, searchInput) {
      if (!value || !searchInput) return false;
      return value.toString().toLowerCase().includes(searchInput.toLowerCase());
    },
    async loadAllData() {
      try {
        await Promise.all([
          this.loadAllQcOrders(),
          this.loadDispatchedTasks(),
          this.loadFormNodes(),
          this.loadUserMap(),
        ]);
      } catch (error) {
        console.error("Failed to load data during polling:", error);
      }
    },
    async loadFormNodes() {
      try {
        const response = await fetchFormNodes();
        const updatedFormMap = generateFormMap(response.data);

        if (JSON.stringify(this.formMap) !== JSON.stringify(updatedFormMap)) {
          // this.$notify({
          //   title: "表单列表更新",
          //   message: "表单列表已更新。",
          //   type: "success",
          // });
          this.formMap = updatedFormMap;
        }
      } catch (error) {
        this.$message.error("无法加载表单，请重试。");
      }
    },
    async loadUserMap() {
      try {
        const response = await fetchUsers();
        const updatedUserMap = response.data.data.reduce((map, user) => {
          map[user.id] = user;
          return map;
        }, {});

        if (JSON.stringify(this.userMap) !== JSON.stringify(updatedUserMap)) {
          // this.$notify({
          //   title: "人员列表更新",
          //   message: "人员列表已更新。",
          //   type: "success",
          // });
          this.userMap = updatedUserMap;
        }
      } catch (error) {
        this.$message.error("无法加载人员信息，请重试。");
      }
    },
    async loadDispatchedTasks() {
      try {
        const response = await getAllDispatchedTasks();
        const updatedTasks = response.data.data;

        if (JSON.stringify(this.dispatchedTasks) !== JSON.stringify(updatedTasks)) {
          // this.$notify({
          //   title: "任务列表更新",
          //   message: "任务列表已更新。",
          //   type: "success",
          // });
          this.dispatchedTasks = updatedTasks;
        }
      } catch (error) {
        this.$message.error("无法加载任务列表，请重试。");
      }
    },
    openViewDispatchedTestsDialog() {
      this.isDispatchedTestsDialogVisible = true;
      this.loadDispatchedTasks();
    },
    closeViewDispatchedTestsDialog() {
      this.isDispatchedTestsDialogVisible = false;
    },
  },
  mounted() {
    this.loadAllData();
  },
};
</script>

<style scoped>
.dispatcher-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 100%;
  overflow: hidden;
}

.top-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
}

.top-left {
  display: flex;
  align-items: center;
}

.top-right {
  display: flex;
  gap: 10px;
}

.table-section {
  flex: 1;
  padding: 20px;
}
</style>

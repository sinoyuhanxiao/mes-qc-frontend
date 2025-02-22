<template>
  <el-container style="display: flex; flex-direction: column; height: fit-content; max-width: 100%; max-height: 100vh; overflow-y: hidden;">
    <!-- Top Section -->
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center;">
        <!-- Title Label -->
        <h2>任务派发管理</h2>
        <!-- Search Box -->
        <el-input
            v-model="searchInput"
            placeholder="搜索关键字"
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

      <div style="display: flex; gap: 10px;">
        <!-- Refresh Button -->
        <el-tooltip content="刷新列表" placement="top">
          <el-button
              class="refresh-button"
              type="primary"
              circle
              @click="handleRefreshButton"
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
    <el-main style="padding: 0;   margin-top: 20px;">
      <QcOrderList
          :qc-order-list="qcOrders"
          :form-map="formMap"
          :user-map="userMap"
          :search-input="searchInput"
          @order-clicked="handleOrderClicked"
          @selection-change="updateSelectedRows"

      />
    </el-main>

    <!-- Dialog (QC Order Detail/Dispatch Configurator(Qc Order Form/Quick Dispatch Form)) -->
    <el-dialog
        title="工單详情"
        v-model="isDetailsDialogVisible"
        width="80%"
        top="5vh"
        :close-on-click-modal="false"
        @close="closeAndResetDetailsDialog"
        style="max-width: 1200px; max-height: 90vh; overflow: hidden;">
      <template v-if="isDetailsDialogVisible && !isEditMode && currentOrder">
        <qc-order-details
            :key="refreshKey"
            :currentOrder="currentOrder"
            :user-map="userMap"
            :form-map="formMap"
            @on-edit="handleEditQcOrder"
            @on-delete="handleDeleteQcOrder"
            @refresh-order="refreshCurrentOrder(currentOrder.id)"
        />
      </template>

      <template v-else-if="isDetailsDialogVisible && isEditMode">
        <div style="max-height: 80vh;  overflow-y: hidden; padding: 10px;">
          <dispatch-configurator
              :current-order="currentOrder"
              :is-edit-mode="isEditMode"
              :form-map="formMap"
              @on-submit="handleOrderSubmit"
              @on-cancel="closeAndResetDetailsDialog"
          />
        </div>
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
          :form-map="formMap"
          :user-map="userMap"
          :show-search-box="true"
          :key="refreshKey"/>

    </el-dialog>
  </el-container>
</template>

<script>

import {
  getAllQcOrders,
  deleteQcOrder,
  createQcOrder,
  updateQcOrder,
  getQcOrderById,
  updateQcOrderStates
} from "@/services/qcOrderService";
import { Search, RefreshRight } from "@element-plus/icons-vue";
import QcOrderList from "@/components/dispatch/QcOrderList.vue";
import QcOrderDetails from "@/components/dispatch/QcOrderDetails.vue";
import DispatchConfigurator from "@/components/dispatch/DispatchConfigurator.vue";
import {fetchFormNodes} from "@/services/formNodeService";
import {generateFormMap} from "@/utils/dispatch-utils";
import {fetchUsers} from "@/services/userService";
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
      refreshKey: 0,
      isDetailsDialogVisible: false,
      isDispatchedTestsDialogVisible: false,
      isEditMode: false,
      currentOrder: null,
      selectedRows: [],
      searchInput: "",
      formMap: [],
      userMap: [],
      qcOrders: [],
    };
  },
  computed: {
  },
  methods: {
    async loadAllQcOrders() {
      try {
        const response = await getAllQcOrders();
        if (response && response.status === 200) {
          this.qcOrders = response.data.data;
        } else {
          this.qcOrders = [];
        }
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
      console.log('handleOrderSubmit')
      try {
        let response = null;
        if (this.currentOrder && this.currentOrder.id != null) {
          // update call
          console.log("update order");
          console.log(order);
          response = await updateQcOrder(this.currentOrder.id, order);
        } else {
          // create call
          console.log("create order");
          console.log(order);
          response = await createQcOrder(order);
        }
        if (response && response.status === 200) {
          this.$message.success("工单已创建！");
        }

          await this.loadAllQcOrders();
          this.closeAndResetDetailsDialog();
      } catch (error) {
        console.error("Error creating QC Order:", error);
        this.$message.error("Failed to create QC Order. Please try again.");
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
            const idsToDelete = this.selectedRows.map((row) => row.id);
            await Promise.all(idsToDelete.map((id) => deleteQcOrder(id, userId)));
            this.$message.success("选中的工单已删除！");
            await this.loadAllQcOrders();
            this.selectedRows = [];
          })
          .catch((error) => {
            this.$message.error("删除失败，请重试。");
            console.log(error);
          });
    },
    closeAndResetDetailsDialog() {
      console.log('closeAndResetDetailsDialog')
      this.currentOrder = null;
      this.isEditMode = false;
      this.isDetailsDialogVisible = false;
    },
    updateSelectedRows(selected) {
      this.selectedRows = selected;
    },
    handleEditQcOrder() {
      console.log('handleEditQcOrder');
      if (this.currentOrder && this.currentOrder.id != null) {
        this.isEditMode = true;
        console.log('set edit mode to true')
      }
    },
    async handleDeleteQcOrder() {
      try {
        console.log('handleDeleteQcOrder');
        const response = await deleteQcOrder(this.currentOrder.id, this.$store.getters.getUser.id);
        if (response && response.status === 200) {
          this.$message.success("选中的工单已删除");
          await this.loadAllQcOrders();
          this.isDetailsDialogVisible = false;
        }
      } catch (e) {
        console.log("Delete action canceled or failed.");
      }
    },
    async refreshCurrentOrder(id) {
      if (!id) return;

      try {
        const response = await getQcOrderById(id);
        const updatedOrder = response.data?.data;
        this.refreshKey++;

        if (updatedOrder) {
          this.currentOrder = { ...updatedOrder };

          const orderIndex = this.originalQcOrders.findIndex(order => order.id === updatedOrder.id);
          if (orderIndex !== -1) {
            this.originalQcOrders.splice(orderIndex, 1, updatedOrder);
          }
        }
      } catch (error) {
        console.error("Failed to refresh current order:", error);
        this.$message.error("无法更新工单信息，请重试！");
      }
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
    async loadAllData() {
      try {
        await Promise.all([
          updateQcOrderStates(),
          this.loadAllQcOrders(),
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
    openViewDispatchedTestsDialog() {
      this.isDispatchedTestsDialogVisible = true;
    },
    closeViewDispatchedTestsDialog() {
      this.isDispatchedTestsDialogVisible = false;
    },
    async handleRefreshButton() {
      this.searchQuery = "";
      await this.loadAllData()
      this.$notify({
        title: "提示",
        message: "列表已更新。",
        type: "success",
      });
    },
  },
  mounted() {
    this.loadAllData();
  },
};
</script>

<style scoped>
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

.refresh-button el-icon {
  color: #004085; /* Darker primary-like color for the refresh icon */
}

</style>

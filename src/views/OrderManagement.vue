<template>
  <el-container class="dispatcher-page">
    <!-- Top Section -->
    <div class="top-section">
      <div class="top-left">
        <h2>QC 订单管理</h2>
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
          新增QC订单
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
        title="QC 订单详情"
        v-model="isDetailsDialogVisible"
        width="50%"
        :close-on-click-modal="false"
        @close="closeAndResetDetailsDialog"
    >
      <template v-if="isDetailsDialogVisible && !isEditMode && currentOrder">
        <qc-order-details
            :order="currentOrder"
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
  </el-container>
</template>

<script>

import { getAllQcOrders, deleteQcOrder } from "@/services/qcOrderService";
import { Search, RefreshRight } from "@element-plus/icons-vue";
import QcOrderList from "@/components/dispatch/QcOrderList.vue";
import QcOrderDetails from "@/components/dispatch/QcOrderDetails.vue";
import DispatchConfigurator from "@/components/dispatch/DispatchConfigurator.vue";

export default {
  components: {
    DispatchConfigurator,
    QcOrderList,
    QcOrderDetails,
    Search,
    RefreshRight,
  },
  data() {
    return {
      isDetailsDialogVisible: false,
      isEditMode: false,
      currentOrder: null,
      selectedRows: [],
      searchInput: "",
      qcOrderList: [], // List of QC orders
      currentPage: 1,
      pageSize: 10,
    };
  },
  computed: {
    filteredAndSortedQcOrderList() {
      return this.filterAndSortList(
          this.qcOrderList,
          (order) =>
              (!this.searchInput ||
                  this.matchesSearch(order.name, this.searchInput) ||
                  this.matchesSearch(order.order_id, this.searchInput)),
          ["created_at", "updated_at"]
      );
    },
    paginatedQcOrderList() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredAndSortedQcOrderList.slice(start, end);
    },
  },
  methods: {
    async loadAllQcOrders() {
      try {
        const response = await getAllQcOrders();
        this.qcOrderList = response.data.data;
      } catch (error) {
        this.$message.error("无法加载QC订单列表，请重试。");
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
        await this.$confirm("确认删除QC订单吗？", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });

        await deleteQcOrder(orderId);
        this.$message.success("QC订单已删除！");
        await this.loadAllQcOrders();
      } catch (error) {
        this.$message.error("删除失败，请重试。");
      }
    },
    confirmDeleteSelectedRows() {
      if (this.selectedRows.length === 0) {
        this.$message.warning("请选择至少一个QC订单进行删除！");
        return;
      }

      this.$confirm("确认删除选中的QC订单吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
          .then(async () => {
            const idsToDelete = this.selectedRows.map((row) => row.order_id);
            await Promise.all(idsToDelete.map((id) => deleteQcOrder(id)));
            this.$message.success("选中的QC订单已删除！");
            await this.loadAllQcOrders();
            this.selectedRows = [];
          })
          .catch(() => {
            this.$message.info("取消删除操作。");
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
  },
  mounted() {
    this.loadAllQcOrders();
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

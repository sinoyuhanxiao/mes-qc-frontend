<template>
  <el-container class="dispatcher-page">
    <!-- Top Section -->
    <el-header class="header">
      <h2>派发管理</h2>
      <el-button-group>
        <!-- Refresh Button -->
        <el-tooltip content="刷新列表" placement="top">
          <el-button
              class="refresh-button"
              type="primary"
              circle
              @click="loadDispatches"
          >
            <el-icon style="color: #004085;"><RefreshRight /></el-icon>
          </el-button>
        </el-tooltip>
        <el-button type="primary" @click="handleNewDispatchButtonClick">新增派发</el-button>
        <el-button type="info" @click="openViewDispatchedTestsDialog">查看全部派发任务</el-button>
        <el-button type="info" @click="openViewDispatchStatusDialog">查看派发状态</el-button>
        <el-button
            v-if="selectedRows.length > 0"
            type="danger"
            @click="confirmDeleteSelectedRows"
        >
          删除
        </el-button>
      </el-button-group>
      <!--        </el-col>-->
      <!--      </el-row>-->
    </el-header>

    <!-- Search Input -->
    <el-input
        v-model="searchInput"
        style="width: 240px; margin: 10px;"
        placeholder="输入名称搜索"
        clearable
        :prefix-icon="Search"
    />

    <!-- Dispatch Table -->
    <el-main class="table-section">
      <DispatchList
          :dispatch-list="paginatedDispatchList"
          :form-map="formMap"
          @column-click="handleNameColumnClicked"
          @selection-change="updateSelectedRows"
      />

      <!-- Pagination -->
      <el-pagination
          v-if="filteredAndSortedDispatchList.length > 0"
          style="margin-top: 16px; text-align: right;"
          background
          layout="total, sizes, prev, pager, next"
          :total="filteredAndSortedDispatchList.length"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          :current-page="currentPage"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
      />
    </el-main>

    <!-- Dispatch Details Dialog -->
    <el-dialog
        title="派发详情"
        v-model="isDetailsDialogVisible"
        width="50%"
        @close="closeAndResetDetailsDialog"
    >
      <template v-if="isDetailsDialogVisible && !isEditMode && currentDispatch">
        <DispatchDetails
            :dispatch="currentDispatch"
            :form-map="formMap"
            :user-map="userMap"
            :dispatched-tasks="getDispatchedTasksById(currentDispatch.id)"
            @edit="enableEditMode"
            @delete="confirmDeleteDispatch"
        />
      </template>

      <template v-else-if="isDetailsDialogVisible && isEditMode">
        <dispatch-configurator
             :current-dispatch="currentDispatch"
             @on-submit="handleDispatchSubmit"
             @on-cancel="handleCancelDispatchForm"
             @on-manual-submit="handleManualDispatchSubmit"
        />

      </template>

<!--      <template v-else-if="isDetailsDialogVisible && isEditMode">-->
<!--        <dispatch-configurator/>-->

<!--      </template>-->

      <template v-else>
        <p>加载中或没有选中的任务。</p> <!-- Placeholder for empty state -->
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

    <!-- Dispatched Status Dialog -->
    <el-dialog
        title="派发状态列表"
        v-model="isDispatchStatusDialogVisible"
        width="70%"
        @close="closeViewDispatchStatusDialog">
      <DispatchStatusRowList
        :dispatch-statuses="dispatchStatuses"
      />
    </el-dialog>
  </el-container>
</template>

<script>
import DispatchForm from "@/components/dispatch/DispatchForm.vue";
import DispatchList from "@/components/dispatch/DispatchList.vue";
import DispatchDetails from "@/components/dispatch/DispatchDetails.vue";
import DispatchedTasksList from "@/components/dispatch/DispatchedTaskList.vue";
import DispatchConfigurator from "@/components/dispatch/DispatchConfigurator.vue";
import DispatchStatusRowList from "@/components/dispatch/DispatchStatusRowList.vue";
import {
  createDispatch,
  deleteDispatch,
  getAllDispatches,
  updateDispatch,
  getAllDispatchedTasks,
  getScheduledTasks, createManualDispatch
} from "@/services/dispatchService";
import {cleanPayload, generateFormMap} from "@/utils/dispatch-utils";
import {Search, RefreshRight} from "@element-plus/icons-vue";
import {fetchFormNodes} from "@/services/formNodeService";
import {fetchUsers} from "@/services/userService";


export default {
  components: {
    DispatchConfigurator,
    DispatchForm,
    DispatchList,
    DispatchedTasksList,
    DispatchDetails,
    DispatchStatusRowList,
    RefreshRight,
  },

  // To derive or calculate data dynamically without directly mutating it.
  // Automatically updates when dependencies change.
  // Commonly used for filtering, sorting, or formatting data for display.
  computed: {
    Search() {
      return Search;
    },
    filteredAndSortedDispatchList() {
      const filtered = this.dispatchList
          .filter((dispatch) =>
              dispatch.status !== 0 &&
              (this.searchInput
                  ? dispatch.name.toLowerCase().includes(this.searchInput.toLowerCase())
                  : true)
          ); // Filter by search input

      return filtered.sort((a, b) => {
        const dateA = a.updated_at || a.created_at;
        const dateB = b.updated_at || b.created_at;
        return new Date(dateB) - new Date(dateA); // Sort by updated_at or created_at
      });
    },
    filteredAndSortedDispatchedTaskList() {
      const filtered = this.dispatchedTasks
          .filter((dispatchTask) => dispatchTask.status === 1) // Filter by active status

      return filtered.sort((a, b) => {
        const dateA = a.updated_at || a.created_at;
        const dateB = b.updated_at || b.created_at;
        return new Date(dateB) - new Date(dateA); // Sort by updated_at or created_at
      });
    },
    paginatedDispatchList() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredAndSortedDispatchList.slice(start, end);
    },
  },
  data() {
    return {
      isDetailsDialogVisible: false,
      isDispatchedTestsDialogVisible: false,
      isDispatchStatusDialogVisible: false,
      isEditMode: false,
      dispatchList: [],
      dispatchedTasks: [],
      dispatchStatuses: [],
      currentDispatch: null,
      selectedRows: [],
      searchInput: "",
      formMap: {},
      userMap: {},
      currentPage: 1,
      pageSize: 10,
    };
  },
  methods: {
    async loadDispatches() {
      try {
        const response = await getAllDispatches();
        this.dispatchList = response.data.data;
      } catch (error) {
        this.$message.error("无法加载派发列表，请重试。");
      }
    },
    async loadDispatchedTasks() {
      try {
        const response = await getAllDispatchedTasks();
        this.dispatchedTasks = response.data.data;
      } catch (error) {
        this.$message.error("无法加载任務列表，请重试。");
      }
    },
    async loadDispatchStatuses() {
      try {
        const response = await getScheduledTasks();
        this.dispatchStatuses = response.data.data;
      } catch (error) {
        this.$message.error("无法加载派发状态列表，请重试。");
      }
    }
    ,
    async loadFormNodes() {
      try {
        const response = await fetchFormNodes(); // API call to fetch form nodes
        this.formMap = generateFormMap(response.data); // Generate the map
      } catch (error) {
        console.error("Failed to load form nodes:", error);
      }
    },
    async loadUserMap() {
      try {
        const response = await fetchUsers(); // Fetch all personnel
        this.userMap = response.data.data.reduce((map, user) => {
          map[user.id] = user; // Map each person's ID to their details
          return map;
        }, {});
      } catch (error) {
        console.error("Error loading personnel data:", error);
        this.$message.error("无法加载人员信息，请重试。");
      }
    },
    handleNewDispatchButtonClick() {
      // console.log('current user is:' ,JSON.parse(localStorage.getItem('current_user')) || {});
      console.log('current user is:' ,this.$store.getters.getUser.id);
      this.resetCurrentDispatch();
      this.isEditMode = true;
      this.isDetailsDialogVisible = true;
    },
    handleNameColumnClicked(dispatch) {
      this.currentDispatch = { ...dispatch }; // Use a copy to avoid unintended mutations
      this.isEditMode = false;
      this.isDetailsDialogVisible = true;
    },
    handleCancelDispatchForm() {
      if (this.currentDispatch) {
        // Editing existing dispatch: show details view
        this.isEditMode = false;
      } else {
        // New dispatch: close dialog completely
        this.closeAndResetDetailsDialog();
      }
    },
    closeAndResetDetailsDialog() {
      this.resetCurrentDispatch();
      this.isEditMode = false;
      this.isDetailsDialogVisible = false;
    },
    openViewDispatchedTestsDialog() {
      this.isDispatchedTestsDialogVisible = true;
      this.loadDispatchedTasks();
    },
    openViewDispatchStatusDialog() {
      this.isDispatchStatusDialogVisible = true;
      this.loadDispatchStatuses();
    },
    closeViewDispatchedTestsDialog() {
      this.isDispatchedTestsDialogVisible = false;
    },
    closeViewDispatchStatusDialog() {
      this.isDispatchStatusDialogVisible = false;
    },
    enableEditMode() {
      if (!this.currentDispatch) {
        this.$message.error("没有选中的派发可以编辑。");
        this.closeAndResetDetailsDialog(); // Reset the dialog for safety
        return;
      }

      this.isEditMode = true;
    },
    async handleDispatchSubmit(form) {
      try {
        const isEdit = Boolean(this.currentDispatch && this.currentDispatch.id); // Check currentDispatch for edit
        const cleanFormPayload = cleanPayload(form);

        if (isEdit) {
          cleanFormPayload.updatedBy = this.$store.getters.getUser.id;
          await updateDispatch(this.currentDispatch.id, cleanFormPayload); // Edit
          this.$message.success("派发更新成功！");
        } else {
          cleanFormPayload.createdBy = this.$store.getters.getUser.id;
          cleanFormPayload.updatedBy = null;
          await createDispatch(cleanFormPayload); // New
          this.$message.success("派发创建成功！");
        }

        await this.loadDispatches();
        this.closeAndResetDetailsDialog();
      } catch (error) {
        console.error("Error in handleDispatchSubmit:", error);
        this.$message.error("保存派发失败，请重试。");
      }
    },
    async handleManualDispatchSubmit(form) {
      try {
        const isEdit = Boolean(this.currentDispatch && this.currentDispatch.id); // Check currentDispatch for edit
        const cleanFormPayload = cleanPayload(form);

        if (isEdit) {
          cleanFormPayload.updatedBy = this.$store.getters.getUser.id;
          await updateDispatch(this.currentDispatch.id, cleanFormPayload); // Edit
          this.$message.success("派发更新成功！");
        } else {
          cleanFormPayload.createdBy = this.$store.getters.getUser.id;
          cleanFormPayload.updatedBy = null;
          await createManualDispatch(cleanFormPayload); // New
          this.$message.success("派发创建成功！");
        }

        await this.loadDispatches();
        this.closeAndResetDetailsDialog();
      } catch (error) {
        console.error("Error in handleDispatchSubmit:", error);
        this.$message.error("保存派发失败，请重试。");
      }
    },
    async confirmDeleteDispatch() {
      try {
        await this.$confirm("确认删除派发吗？", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });

        await deleteDispatch(this.currentDispatch.id);
        this.$message.success("派发已删除！");
        await this.loadDispatches();
        this.closeAndResetDetailsDialog();
      } catch (error) {
        this.$message.error("删除派发失败，请重试。");
      }
    },
    async confirmDeleteSelectedRows() {
      if (this.selectedRows.length === 0) {
        this.$message.warning("请选择至少一条派发进行删除！");
        return;
      }

      // try {
      //   await this.$confirm("确认设置选中的任务派发为无效吗？", "提示", {
      //     confirmButtonText: "确定",
      //     cancelButtonText: "取消",
      //     type: "warning",
      //   });
      //
      //   const updates = this.selectedRows.map(row => ({
      //     id: row.id,
      //     active: false,
      //   }));
      //
      //   // Send PUT requests to update `active` status
      //   await Promise.all(
      //       updates.map(update =>
      //           updateDispatch(update.id, { active: update.active })
      //       )
      //   );
      //
      //   this.$message.success("选中的任务派发已设置为无效！");
      //   await this.loadDispatches();
      //   this.selectedRows = []; // Clear selection after updating
      // } catch (error) {
      //   console.error("Error updating active status:", error);
      //   this.$message.error("更新任务派发状态失败，请重试。");
      // }

      try {
        await this.$confirm("确认删除选中的派发吗？", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });

        const idsToDelete = this.selectedRows.map(row => row.id);
        await Promise.all(idsToDelete.map(id => deleteDispatch(id)));
        this.$message.success("选中的派发已删除！");
        await this.loadDispatches();
        this.selectedRows = [];
      } catch (error) {
        this.$message.error("删除失败，请重试。");
      }
    },
    resetCurrentDispatch() {
      this.currentDispatch = null;
    },
    updateSelectedRows(selected) {
      this.selectedRows = selected;
    },
    openDetailsDialogForEdit() {
      if (!this.currentDispatch) {
        this.$message.error("没有选中的派发可以编辑。");
        this.closeAndResetDetailsDialog();
        return;
      }
      this.isEditMode = true;
      this.isDetailsDialogVisible = true;
    },
    openDetailsDialogForNew() {
      this.resetCurrentDispatch();
      this.isEditMode = true;
      this.isDetailsDialogVisible = true;
    },
    handleSizeChange(newSize) {
      this.pageSize = newSize;
      this.currentPage = 1; // Reset to first page on size change
    },
    handlePageChange(newPage) {
      this.currentPage = newPage;
    },
    getDispatchedTasksById(id) {
      return this.dispatchedTasks.filter((task) => task.dispatch_id === id);
    }

  },
  mounted() {
    this.loadDispatches();
    this.loadDispatchedTasks()
    this.loadFormNodes();
    this.loadUserMap();
    this.loadDispatchStatuses()
  },
};
</script>

<style scoped>
.dispatcher-page {
  display: flex;
  flex-direction: column;

  height: 100vh; /* Fit the viewport height */
  max-width: 100%; /* Prevent horizontal scrolling */
  overflow: hidden; /* Prevent unwanted scrollbars */
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
}

.table-section {
  flex: 1;
  padding: 20px;
}


.pagination {
  margin-top: 16px;
  text-align: right;
  padding: 0 20px;
}

.readonly-info p {
  margin: 5px 0;
  word-wrap: break-word;
}

</style>

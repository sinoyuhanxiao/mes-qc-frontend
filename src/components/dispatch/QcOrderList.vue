<template>
  <el-table
      ref="qcOrderTable"
      :data="paginatedQcOrderList"
      style="width: 100%;"
      @selection-change="onSelectionChange"
      @sort-change="handleSortChange"
      :default-sort="{ prop: 'id', order: 'descending' }"
  >
    <!-- Row Selection -->
    <el-table-column type="selection" width="55"></el-table-column>

    <!-- QC Order Name -->
    <el-table-column
        prop="name"
        label="QC 工单名称"
        width="200"
        sortable
        show-overflow-tooltip
    >
      <template #default="scope">
        <span class="clickable-name" @click="clickedNameColumn(scope.row)">
          {{ scope.row.name }}
        </span>
      </template>
    </el-table-column>

    <!-- Order ID -->
    <el-table-column prop="id" label="工单 ID" width="100" sortable></el-table-column>

    <!-- Order State -->
    <el-table-column prop="state" label="工单状态" width="170" sortable>
      <template #default="scope">
        <el-tag :type="getQcOrderStateTagData(scope.row.state).type" size="small" >
          {{ getQcOrderStateTagData(scope.row.state).label }}
        </el-tag>
      </template>
    </el-table-column>

    <!-- Assigned User -->
    <el-table-column prop="assignedUsersCount" label="分配用户" width="200" sortable>
      <template #default="scope">
        <div >
          <el-tag
              v-for="(user, index) in getAssignedUsers(scope.row).slice(0, 3)"
              :key="user.id"
              type="primary"
              size="small"
              effect="light"
              class="tab-container"
          >
            {{ user.name }}
          </el-tag>
          <el-tag v-if="getAssignedUsers(scope.row).length > 3" type="info" size="small">
            +{{ getAssignedUsers(scope.row).length - 3 }}
          </el-tag>
        </div>
      </template>
    </el-table-column>

    <!-- Assigned Form -->
    <el-table-column prop="assignedFormsCount" label="分配表单" width="200" sortable>
      <template #default="scope">
        <div>
          <el-tag
              v-for="(form, index) in getAssignedForms(scope.row).slice(0, 3)"
              :key="form.id"
              type="success"
              size="small"
              effect="light"
              class="tab-container"
          >
            {{ form.name }}
          </el-tag>
          <el-tag v-if="getAssignedForms(scope.row).length > 3" type="info" size="small">
            +{{ getAssignedForms(scope.row).length - 3 }}
          </el-tag>
        </div>
      </template>
    </el-table-column>


    <!-- Dispatch Count -->
    <el-table-column prop="dispatches.length" label="任务数量" width="120" sortable>
      <template #default="scope">
        {{ scope.row.dispatches.length }}
      </template>
    </el-table-column>

    <!-- Created At -->
    <el-table-column prop="created_at" label="创建时间" width="180" sortable>
      <template #default="scope">
        <time-slot :value="scope.row.created_at" />
      </template>
    </el-table-column>

    <!-- Created By -->
    <el-table-column prop="created_by" label="创建者" width="180" sortable>
      <template #default="scope">
        <UserReference :user-id="scope.row.created_by"/>
      </template>
    </el-table-column>
  </el-table>

  <!-- Pagination -->
  <el-pagination
      v-if="filteredQcOrders.length > 0"
      style="margin-top: 16px; text-align: right;"
      background
      layout="total, sizes, prev, pager, next"
      :total="filteredQcOrders.length"
      :page-sizes="[15, 30, 45, 60]"
      :page-size="pageSize"
      :current-page="currentPage"
      @size-change="handleSizeChange"
      @current-change="handlePageChange"
  />
</template>

<script>
import {formatDate, getQcOrderStateTagData} from "@/utils/dispatch-utils";
import TimeSlot from "@/components/dispatch/TimeSlot.vue";
import UserReference from "@/components/dispatch/UserReference.vue";

export default {
  emits: ["order-clicked", "selection-change"],
  components: {
    UserReference,
    TimeSlot,
  },
  data() {
    return {
      originalQcOrders: [],
      filteredQcOrders: [],
      sortSettings: {prop: '', order: ''}, // store sorting column and order
      currentPage: 1,
      pageSize: 15,
    }
  },
  props: {
    qcOrderList: {
      type: Array,
      required: true,
    },
    userMap:{
      type: Object,
      required: true,
    },
    formMap:{
      type: Object,
      required: true,
    },
    searchInput: {
      type: String,
      required: true,
    }
  },
  methods: {
    getQcOrderStateTagData,
    clickedNameColumn(row) {
      console.log("Clicked Order:", row);
      this.$emit("order-clicked", row);
    },
    onSelectionChange(selected) {
      console.log("Selection changed:", selected);
      this.$emit("selection-change", selected);
    },
    formatDate(date) {
      return formatDate(date);
    },
    getAssignedUsers(order) {
      if (!order.dispatches || !this.userMap) return [];

      // Get unique user IDs from all dispatches
      const userIds = [...new Set(order.dispatches.flatMap(dispatch => dispatch.user_ids || []))];
      // Ensure userMap is structured correctly and fetch names
      return userIds
          .map(id => ({id, name: this.userMap[id]?.name?.trim() || `用户${id}`}))
          .filter(user => user.name);  // Remove any invalid entries
    },
    getAssignedForms(order) {
      if (!order.dispatches) return [];
      // Get unique form IDs from all dispatches
      const formIds = [...new Set(order.dispatches.flatMap(dispatch => dispatch.form_ids || []))];
      // Map IDs to form objects with name
      return formIds.map(id => ({id, name: this.formMap[id]})).filter(form => form.name);
    },
    filterTable(input) {
      const searchText = input.toLowerCase();
      this.filteredQcOrders = this.originalQcOrders.filter((item) => {
        // Convert state to text label for searching
        const stateText = getQcOrderStateTagData(item.state)?.label?.toLowerCase() || "";

        // Get assigned usernames as a single string
        const assignedUsers = this.getAssignedUsers(item)
            .map(user => user.name.toLowerCase())
            .join(" ");

        // Get assigned form names as a single string
        const assignedForms = this.getAssignedForms(item)
            .map(form => form.name.toLowerCase())
            .join(" ");

        return (
            (item.id && String(item.id).toLowerCase().includes(searchText)) ||
            (item.name && item.name.toLowerCase().includes(searchText)) ||
            (item.dispatches && item.dispatches.length.toString().toLowerCase().includes(searchText)) ||
            (item.created_at && item.created_at.toString().toLowerCase().includes(searchText)) ||
            (item.created_by && item.created_by.toString().toLowerCase().includes(searchText)) ||
            (stateText.includes(searchText)) || // Search QC Order State
            (assignedUsers.includes(searchText)) || // Search Assigned Users
            (assignedForms.includes(searchText)) // Search Assigned Forms
        );
      });
    },
    handleSizeChange(newSize) {
      this.pageSize = newSize;
      this.currentPage = 1; // Reset to the first page on size change
    },
    handlePageChange(newPage) {
      this.currentPage = newPage;
    },
    handleSortChange({prop, order}) {
      this.sortSettings = { prop, order };
    },
  },
  computed: {
    paginatedQcOrderList() {
      // Sorting from columns
      const sortedData = [...this.filteredQcOrders].sort((a, b) => {
        const { prop, order } = this.sortSettings;
        let valueA, valueB;

        if (!prop || !order) {
          // if sort setting does not exist, default sort in descending by row's updated_at or if updated_at is null use created_at field
          valueA = a.updated_at? new Date(a.updated_at) : new Date(a.created_at);
          valueB = b.updated_at? new Date(b.updated_at) : new Date(b.created_at);
        } else {
          // Extract values based on the column being sorted
          if (prop === "created_at" || prop === "updated_at") {
            valueA = a[prop] ? new Date(a[prop]) : new Date(0);
            valueB = b[prop] ? new Date(b[prop]) : new Date(0);
          } else if (prop === "dispatches.length") {
            valueA = a.dispatches.length;
            valueB = b.dispatches.length;
          }  else if (prop === "assignedUsersCount") {
            valueA = this.getAssignedUsers(a).length;
            valueB = this.getAssignedUsers(b).length;
          } else if (prop === "assignedFormsCount") {
            valueA = this.getAssignedForms(a).length;
            valueB = this.getAssignedForms(b).length;
          } else {
            valueA = a[prop];
            valueB = b[prop];
          }
        }

        // Convert undefined or null values to 0 for sorting consistency
        valueA = valueA ?? 0;
        valueB = valueB ?? 0;

        // Fix sorting order logic
        if (order === "ascending") return valueA - valueB;
        if (order === "descending") return valueB - valueA;  // Fix for incorrect descending order

        // Tie-breaker: Use created_at for consistent sorting
        const tieBreakerA = new Date(a.created_at);
        const tieBreakerB = new Date(b.created_at);
        return tieBreakerA - tieBreakerB;
      });

      // Pagination
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return sortedData.slice(start, end);
    },
  },
  watch: {
    // Watch for changes in the qcOrderList prop
    qcOrderList: {
      immediate: true,
      deep: true,
      handler(newList) {
        // Load original orders from prop
        this.originalQcOrders = JSON.parse(JSON.stringify(newList));
        this.filteredQcOrders = [...this.originalQcOrders]; // Copy to filtered list
      }
    },
    // Reapply filtering when searchInput changes
    searchInput: {
      immediate: true,
      handler(val) {
        this.filterTable(val);
      }
    }
  }
};
</script>

<style scoped>
.clickable-name {
  color: #409eff;
  cursor: pointer;
  text-decoration: underline;
}

.clickable-name:hover {
  text-decoration: none;
}

.tab-container {
  margin-right: 8px;
}
</style>

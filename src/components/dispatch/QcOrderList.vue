<template>
  <el-table
      ref="qcOrderTable"
      :data="qcOrderList"
      border
      style="width: 100%"
      @selection-change="onSelectionChange"
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
    <el-table-column prop="state" label="工单状态" width="120" sortable>
      <template #default="scope">
        <el-tag :type="getStateTagType(scope.row.state).type" size="small" >
          {{ getStateTagType(scope.row.state).label }}
        </el-tag>
      </template>
    </el-table-column>

    <!-- Assigned User -->
    <el-table-column label="分配用户" width="200">
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
    <el-table-column label="分配表单" width="200">
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
</template>

<script>
import { formatDate } from "@/utils/dispatch-utils";
import TimeSlot from "@/components/dispatch/TimeSlot.vue";
import UserReference from "@/components/dispatch/UserReference.vue";

export default {
  components: {
    UserReference,
    TimeSlot,
  },
  props: {
    qcOrderList: {
      type: Array,
      required: true,
    },
    userMap:{
      type: Array,
      required: true,
    },
    formMap:{
      type: Array,
      required: true,
    }
  },
  methods: {
    clickedNameColumn(row) {
      console.log("Clicked Order:", row);
      this.$emit("order-clicked", row);
    },
    onSelectionChange(selected) {
      console.log("Selection changed:", selected);
      this.$emit("selection-change", selected);
    },
    getStateTagType(state) {
      const stateMap = {
        1: { label: "运行中", type: "success" },
        2: { label: "非活跃", type: "info" },
        3: { label: "已过期", type: "danger" },
        4: { label: "已达派发上限", type: "warning" },
        5: { label: "暂停", type: "primary" },
      };
      return stateMap[state] || { label: "未知", type: "default" };
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
          .map(id => ({ id, name: this.userMap[id]?.name?.trim() || `用户${id}` }))
          .filter(user => user.name);  // Remove any invalid entries
    },
    getAssignedForms(order) {
      if (!order.dispatches) return [];

      // Get unique form IDs from all dispatches
      const formIds = [...new Set(order.dispatches.flatMap(dispatch => dispatch.form_ids || []))];

      // Map IDs to form objects with name
      return formIds.map(id => ({ id, name: this.formMap[id] })).filter(form => form.name);
    }
  },
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

.el-table .el-button {
  margin-left: 5px;
}

.tab-container {
  margin-right: 8px;
}
</style>

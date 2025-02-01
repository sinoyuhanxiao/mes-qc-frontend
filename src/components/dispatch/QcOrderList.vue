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
    <el-table-column prop="name" label="QC 工单名称" width="200" sortable>
      <template #default="scope">
        <span class="clickable-name" @click="clickedNameColumn(scope.row)">
          {{ scope.row.name }}
        </span>
      </template>
    </el-table-column>

    <!-- Order ID -->
    <el-table-column prop="order_id" label="工单 ID" width="65" sortable></el-table-column>

    <!-- Order State -->
    <el-table-column prop="state" label="工单状态" width="120" sortable>
      <template #default="scope">
        <el-tag :type="getStateTagType(scope.row.state).type" size="small">
          {{ getStateTagType(scope.row.state).label }}
        </el-tag>
      </template>
    </el-table-column>

    <!-- Created At -->
    <el-table-column prop="created_at" label="创建时间" width="180" sortable>
      <template #default="scope">
        <time-slot :value="scope.row.created_at" />
      </template>
    </el-table-column>

    <!-- Updated At -->
    <el-table-column prop="updated_at" label="更新时间" width="180" sortable>
      <template #default="scope">
        <time-slot :value="scope.row.updated_at" />
      </template>
    </el-table-column>

    <!-- Dispatch Count -->
    <el-table-column prop="dispatches.length" label="任务数量" width="120" sortable>
      <template #default="scope">
        {{ scope.row.dispatches.length }}
      </template>
    </el-table-column>

  </el-table>
</template>

<script>
import { formatDate } from "@/utils/dispatch-utils";
import TimeSlot from "@/components/dispatch/TimeSlot.vue";

export default {
  components: {
    TimeSlot,
  },
  props: {
    qcOrderList: {
      type: Array,
      required: true,
    },
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
    editOrder(order) {
      this.$emit("edit-order", order);
    },
    deleteOrder(orderId) {
      this.$emit("delete-order", orderId);
    },
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
</style>

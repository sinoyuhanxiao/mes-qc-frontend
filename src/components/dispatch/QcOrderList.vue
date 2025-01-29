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
    <el-table-column prop="name" label="QC 订单名称" width="200" sortable>
      <template #default="scope">
        <span class="clickable-name" @click="clickedNameColumn(scope.row)">
          {{ scope.row.name }}
        </span>
      </template>
    </el-table-column>

    <!-- Order ID -->
    <el-table-column prop="order_id" label="订单 ID" width="65" sortable></el-table-column>

    <!-- Order State -->
    <el-table-column prop="state" label="订单状态" width="120" sortable>
      <template #default="scope">
        <el-tag :type="getStateTagType(scope.row.state).type" size="medium">
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

    <!-- Dispatch Count -->
    <el-table-column prop="dispatches.length" label="派发数量" width="120" sortable>
      <template #default="scope">
        {{ scope.row.dispatches.length }}
      </template>
    </el-table-column>

    <!-- Actions -->
    <el-table-column label="操作" width="180">
      <template #default="scope">
        <el-button size="small" type="primary" @click="editOrder(scope.row)">编辑</el-button>
        <el-button size="small" type="danger" @click="deleteOrder(scope.row.order_id)">删除</el-button>
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

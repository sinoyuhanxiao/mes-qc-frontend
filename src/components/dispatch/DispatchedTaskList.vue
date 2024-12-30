<template>
  <el-table
      :data="dispatchedTasks"
      border
      style="width: 100%"
      :default-sort="{ prop: 'dispatch_time', order: 'descending' }"
  >
    <!-- ID -->
    <el-table-column prop="id" label="ID" width="80" sortable></el-table-column>

    <!-- Dispatch ID -->
    <el-table-column prop="dispatch_id" label="推送ID" width="100" sortable></el-table-column>

    <!-- Personnel ID -->
    <el-table-column prop="personnel_id" label="人员ID" width="100" sortable></el-table-column>

    <!-- Form ID -->
    <el-table-column prop="form_id" label="表单ID" width="100" sortable></el-table-column>

    <!-- Dispatch Time -->
    <el-table-column prop="dispatch_time" label="推送时间" width="180" sortable>
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
    <el-table-column prop="notes" label="备注" width="200">
      <template #default="scope">
        {{ scope.row.notes || "-" }}
      </template>
    </el-table-column>

    <!-- Updated At -->
    <el-table-column prop="updated_at" label="更新时间" width="180" sortable>
      <template #default="scope">
        {{ formatDate(scope.row.updated_at) }}
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
import dayjs from "dayjs";

export default {
  name: "DispatchedTasksTable",
  props: {
    dispatchedTasks: {
      type: Array,
      required: true,
    },
  },
  methods: {
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
  },
};
</script>

<style scoped>
</style>

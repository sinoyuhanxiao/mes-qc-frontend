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
    <el-table-column prop="dispatch_id" label="派发ID" width="100" sortable></el-table-column>

    <!-- Personnel -->
    <el-table-column prop="personnel_id" label="人员" width="200">
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

    <!-- Form -->
    <el-table-column prop="form_id" label="表单" width="200">
      <template #default="scope">
        <el-tag
            v-if="getFormById(scope.row.form_id)"
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
              <div>ID: {{ scope.row.form_id }}</div>
              <div>表单名: {{ getFormById(scope.row.form_id) }}</div>
            </template>
            <template #reference>
              {{ getFormById(scope.row.form_id) }}
            </template>
          </el-popover>
        </el-tag>
        <span v-else>-</span>
      </template>
    </el-table-column>

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
    formMap: {
      type: Object,
      required: true, // Form ID to Form Name mapping
    },
    personnelMap: {
      type: Object,
      required: true, // Personnel ID to Personnel Details mapping
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
    getFormById(formId) {
      return this.formMap[formId] || "未知表单";
    },
    getPersonnelById(personnelId) {
      return this.personnelMap[personnelId] || null;
    },
  },
};
</script>

<style scoped>
</style>



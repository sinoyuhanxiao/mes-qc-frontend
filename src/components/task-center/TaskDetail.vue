<template>
  <el-form label-position="left" label-width="120px" class="task-details">
    <div class="details-header">
      <!-- Action Buttons -->
      <el-button-group>
        <el-button type="success" @click="$emit('edit')">编辑</el-button>
        <el-button type="danger" @click="$emit('delete')">删除</el-button>
      </el-button-group>
    </div>

    <el-form-item label="派发ID">
      {{ task.dispatch_id }}
    </el-form-item>

    <el-form-item label="任务表单">
      {{ getFormById(task.form_id) }}
    </el-form-item>

    <el-form-item label="节点编号">
      {{ task.form_id }}
    </el-form-item>

    <el-form-item label="派发对象">
      {{ getPersonnelById(task.personnel_id)?.name || "未知人员" }}
    </el-form-item>

    <el-form-item label="派发时间">
      {{ formatDate(task.dispatch_time) }}
    </el-form-item>

    <el-form-item label="状态">
      <el-tag :type="statusTagType(task.status)">
        {{ task.status }}
      </el-tag>
    </el-form-item>

    <el-form-item label="备注">
      {{ task.notes || "-" }}
    </el-form-item>

    <el-form-item label="更新时间">
      {{ formatDate(task.updated_at) }}
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  props: {
    task: {
      type: Object,
      required: true,
    },
    formMap: {
      type: Object,
      required: true,
    },
    personnelMap: {
      type: Object,
      required: true,
    },
  },
  methods: {
    getFormById(formId) {
      return this.formMap[formId] || "未知表单";
    },
    getPersonnelById(personnelId) {
      return this.personnelMap[personnelId] || null;
    },
    formatDate(dateString) {
      return dateString ? new Date(dateString).toLocaleString() : "-";
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
.task-details {
  padding: 10px;
}

.details-header {
  display: flex;
  justify-content: flex-end;
}
</style>

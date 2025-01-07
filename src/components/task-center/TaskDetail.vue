<template>
  <el-form label-position="left" label-width="120px" class="task-details">
    <div class="details-header">
      <!-- Action Buttons -->
      <el-button-group>
        <el-button
            type="primary"
            :disabled="false"
            @click="showDevelopmentPopup"
        >
          查看提交记录
        </el-button>
<!--        <el-button-->
<!--            type="info"-->
<!--            :disabled="true"-->
<!--            class="forbidden-button"-->
<!--            @click="$emit('edit')"-->
<!--        >-->
<!--          编辑-->
<!--        </el-button>-->
<!--        <el-button-->
<!--            type="info"-->
<!--            :disabled="true"-->
<!--            class="forbidden-button"-->
<!--            @click="$emit('delete')"-->
<!--        >-->
<!--          删除-->
<!--        </el-button>-->
      </el-button-group>

    </div>

    <el-form-item label="任务名称">
      {{ task.name || "未命名任务" }}
    </el-form-item>

    <el-form-item label="描述">
      {{ task.description || "无描述" }}
    </el-form-item>

    <el-form-item label="派发ID">
      {{ task.dispatch_id || "无" }}
    </el-form-item>

    <el-form-item label="任务表单">
      {{ getFormNameById(task.qc_form_tree_node_id) }}
    </el-form-item>

    <el-form-item label="节点编号">
      {{ task.qc_form_tree_node_id }}
    </el-form-item>

    <el-form-item label="派发对象">
      {{ getUserById(task.user_id)?.name || "未知人员" }}
    </el-form-item>

    <el-form-item label="派发时间">
      {{ formatDate(task.dispatch_time) }}
    </el-form-item>

    <el-form-item label="任务状态">
      <el-tag :type="stateTagType(task.dispatched_task_state_id)">
        {{ stateName(task.dispatched_task_state_id) }}
      </el-tag>
    </el-form-item>

    <el-form-item label="备注">
      {{ task.notes || "-" }}
    </el-form-item>

    <el-form-item label="创建时间">
      {{ formatDate(task.created_at) }}
    </el-form-item>

    <el-form-item label="创建者">
      {{ task.created_by || "无" }}
    </el-form-item>

    <el-form-item label="更新时间">
      {{ formatDate(task.updated_at) }}
    </el-form-item>

    <el-form-item label="更新者">
      {{ task.updated_by || "无" }}
    </el-form-item>

    <el-form-item label="截止时间">
      {{ formatDate(task.due_date) }}
    </el-form-item>

    <el-form-item label="是否逾期">
      <el-tag :type="task.is_overdue ? 'danger' : 'success'">
        {{ task.is_overdue ? "是" : "否" }}
      </el-tag>
    </el-form-item>

    <el-form-item label="完成时间">
      {{ formatDate(task.finished_at) || "未完成" }}
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
    getFormNameById(formId) {
      return this.formMap[formId] || "未知表单";
    },
    getUserById(personnelId) {
      return this.personnelMap[personnelId] || null;
    },
    formatDate(dateString) {
      return dateString ? new Date(dateString).toLocaleString() : "-";
    },
    showDevelopmentPopup() {
      this.$message({
        message: "此功能正在开发中，感谢您的点击！",
        type: "info",
        duration: 3000,
      });
    },
    stateTagType(stateId) {
      const stateMap = {
        1: "warning", // Pending
        2: "primary", // In Progress
        3: "success", // Completed
        4: "info",    // Canceled
        5: "danger",  // Overdue
      };
      return stateMap[stateId] || "info";
    },
    stateName(stateId) {
      const stateMap = {
        1: "Pending",
        2: "In Progress",
        3: "Completed",
        4: "Canceled",
        5: "Overdue",
      };
      return stateMap[stateId] || "Unknown";
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

.forbidden-button {
  cursor: not-allowed !important; /* Show forbidden cursor */
  pointer-events: none; /* Prevent any interaction */
}
</style>

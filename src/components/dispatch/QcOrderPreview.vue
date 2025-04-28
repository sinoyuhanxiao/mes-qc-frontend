<template>
  <!-- Schedule Summary -->
  <el-card class="mt-4" shadow="always">
    <h4>工单预览</h4>
    <p><strong>工单名称:</strong> {{ qcOrderForm.name }}</p>
    <p><strong>工单备注:</strong> {{ qcOrderForm.description || "无" }}</p>
    <p><strong>派发计划总数:</strong> {{ qcOrderForm.dispatches?.length }}</p>
    <div v-for="(dispatch, index) in qcOrderForm.dispatches" :key="dispatch.id" class="dispatch-preview">
      <h5>派发计划 {{ index + 1 }}</h5>
      <ul class="dispatch-details">
        <li v-if="dispatch.name">
          名称: <strong>{{ dispatch.name }}</strong>
        </li>
        <li>
          类型: <strong>{{ dispatch.type === 'regular' ? '周期计划' : '单次计划' }}</strong>
        </li>
        <li v-if="dispatch.type === 'regular'">
          执行计划: <strong>{{ formatCronExpression(dispatch.cron_expression) }}</strong>
        </li>
        <li v-if="dispatch.type === 'regular'">
          执行周期: <strong>{{ formatDateRange(dispatch.date_range) }}</strong>
        </li>
        <li v-else>
          执行时间: <strong>{{ formatDate(dispatch.custom_time) }}</strong>
        </li>
        <li v-if="dispatch.type === 'regular'">
          派发次数上限:
          <strong>{{ dispatch.isUnlimited === true ? "无限制" : dispatch.dispatch_limit }}</strong>
        </li>
        <li>
          派发任务时限:
          <strong> {{ dispatch.due_date_offset_minute }} 分钟 </strong>
        </li>
        <li>
          人员: <strong>{{ formatUsers(dispatch.user_ids) }}</strong>
        </li>
        <li>
          表单: <strong>{{ formatForms(dispatch.form_ids) }}</strong>
        </li>
      </ul>
    </div>
  </el-card>
</template>
<script>

import {humanizeCronInChinese} from "cron-chinese";

export default {
  props: {
    qcOrderForm: {
      type: Object,
      required: true
    },
    formMap: {
      type: Object,
      required:true,
    },
    userMap: {
      type: Object,
      required:true,
    },
    teamMap: {
      type: Object,
      required:true,
    }
  },
  methods: {
    // Format a date in '2025/1/16 00:00:00' format (Order summary helper)
    formatDate(date) {
      if (!date) return "无";
      return new Date(date).toLocaleString("zh-CN", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    },
    // Format a date range (Order summary helper)
    formatDateRange(range) {
      if (!Array.isArray(range) || range.length !== 2) return "无";
      return `${this.formatDate(range[0])} 至 ${this.formatDate(range[1])}`;
    },
    // Format user list (Order summary helper)
    formatUsers(userIds) {
      if (!userIds || userIds.length === 0) return "无";
      return userIds
          .map((id) => this.userMap[id]?.name || "未知用户")
          .join(", ");
    },
    // Format form list (Order summary helper)
    formatForms(formIds) {
      if (!formIds) return "无";

      const formNames = formIds.map(id => this.formMap[id] ||  `未知表单 (${id})`)

      return formNames.join(", ");
    },
    // Format cron expression to Chinese (Order summary helper)
    formatCronExpression(cron) {
      if (!cron) return "无效的 Cron 表达式";
      try {
        return humanizeCronInChinese(cron);
      } catch {
        return "无法解析 Cron 表达式";
      }
    },
  }
}

</script>

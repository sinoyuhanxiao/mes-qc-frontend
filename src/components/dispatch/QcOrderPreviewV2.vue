<template>
  <!-- Schedule Summary -->
  <el-card class="mt-4" shadow="always">
    <h4>预览</h4>
    <p><strong>工单名称:</strong> {{ qcOrderForm.name }}</p>
    <p><strong>工单备注:</strong> {{ qcOrderForm.description }}</p>
    <p><strong>派发计划总数:</strong> {{ qcOrderForm.dispatches?.length }}</p>
    <div v-for="(dispatch, index) in qcOrderForm.dispatches" :key="dispatch.id" class="dispatch-preview">
      <h5>派发计划 {{ index + 1 }}</h5>
      <ul class="dispatch-details">
        <li v-if="dispatch.name">
          <strong>名称: </strong>{{ dispatch.name }}
        </li>
        <li>
          <strong>类型: </strong>{{ dispatch.type === 'regular' ? '周期计划' : '单次计划' }}
        </li>
        <li v-if="dispatch.type === 'regular'">
          <strong>执行频率: </strong> {{ formatCronExpression(dispatch.cron_expression) }}
        </li>
        <li v-if="dispatch.type === 'regular'">
          <strong>执行周期: </strong>
          <span :class="{'missing-field': !dispatch.date_range || dispatch.date_range.length !== 2}">
          {{ formatDateRange(dispatch.date_range) }}
          </span>
        </li>
        <li v-else>
          <strong>执行时间: </strong> {{ formatDate(dispatch.custom_time) }}
        </li>
        <li v-if="dispatch.type === 'regular' && dispatch.source !== 'shift'">
          <strong>派发次数上限: </strong>
          {{ dispatch.isUnlimited === true ? "无限制" : dispatch.dispatch_limit }}
        </li>
        <li v-if="dispatch.type === 'regular' && dispatch.source !== 'shift'">
          <strong>派发任务时限: </strong>
           {{ dispatch.due_date_offset_minute }} 分钟
        </li>
        <li v-if="dispatch.source === 'shift'">
          <strong>派发任务时限: </strong>24小时
        </li>
        <li>
          <strong>班组: </strong> {{ formatShift(dispatch.shift_id) }}
        </li>
        <li>
          <strong>人员: </strong>
          <span :class="{'missing-field': !dispatch.user_ids || dispatch.user_ids.length === 0}">
            {{ formatUsers(dispatch.user_ids) }}
          </span>
        </li>
        <li>
          <strong>表单: </strong>
          <span :class="{'missing-field': !dispatch.form_ids || dispatch.form_ids.length === 0}">
             {{ formatForms(dispatch.form_ids) }}
          </span>
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
    shiftMap: {
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
    formatShift(shiftId) {
      if (!shiftId) {
        return "无";
      }

      return this.shiftMap[shiftId]?.name || "未知班组";
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
      if (!formIds || formIds.length === 0) return "无";

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

<style scoped>

.missing-field {
  color: red;
  font-weight: bold;
}
</style>

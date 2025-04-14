<template>
  <!-- Schedule Summary -->
  <el-card class="mt-4" shadow="always">
    <h4>{{ translate('orderManagement.orderFormDialog.orderPreview') }}</h4>
    <p><strong>{{ translate('orderManagement.orderDetailDialog.orderName') }}</strong>: {{ qcOrderForm.name }}</p>
    <p>{{ translate('orderManagement.description') }}: {{ qcOrderForm.description }}</p>
    <p>{{ translate('orderManagement.orderTable.planCount') }}: {{ qcOrderForm.dispatches?.length }}</p>
    <div v-for="(dispatch, index) in qcOrderForm.dispatches" :key="dispatch.id" class="dispatch-preview">
      <h5>{{ translate('orderManagement.dispatchPlan') }} {{ index + 1 }}</h5>
      <ul class="dispatch-details">
        <li v-if="dispatch.name">
          <strong>{{ translate('orderManagement.dispatchPlanName') }}</strong>: {{ dispatch.name }}
        </li>
        <li>
          <strong>{{ translate('orderManagement.type') }}</strong>: {{ dispatch.type === 'regular' ? translate('orderManagement.orderFormDialog.periodicPlan') : translate('orderManagement.orderFormDialog.oneTimePlan') }}
        </li>
        <li v-if="dispatch.type === 'regular'">
          <strong>{{ translate('orderManagement.orderDetailDialog.executionLogic') }}</strong>: {{ formatCronExpression(dispatch.cron_expression) }}
        </li>
        <li v-if="dispatch.type === 'regular'">
          <strong>{{ translate('orderManagement.orderFormDialog.executionPeriod') }}</strong>:
          <span :class="{'missing-field': !dispatch.date_range || dispatch.date_range.length !== 2}">
          {{ formatDateRange(dispatch.date_range) }}
          </span>
        </li>
        <li v-else>
          <strong>{{ translate('orderManagement.orderFormDialog.executionTime') }} </strong> {{ formatDate(dispatch.custom_time) }}
        </li>
        <li v-if="dispatch.type === 'regular' && dispatch.source !== 'shift'">
          <strong>{{ translate('orderManagement.orderDetailDialog.dispatchLimit') }}: </strong>
          {{ dispatch.isUnlimited === true ? translate('orderManagement.orderFormDialog.unlimited') : dispatch.dispatch_limit }}
        </li>
        <li v-if="dispatch.type === 'regular' && dispatch.source !== 'shift'">
          {{translateWithParams('orderManagement.orderFormDialog.taskDueDateOffset', {input: dispatch.due_date_offset_minute})}}
        </li>
        <li v-if="dispatch.source === 'shift'">
          <strong>{{translate('orderManagement.shiftPopulatePlanDialog.shiftPlanDueDate')}}</strong>
        </li>
        <li>
          <strong>{{ translate('orderManagement.orderFormDialog.shift') }}: </strong> {{ formatShift(dispatch.shift_id) }}
        </li>
        <li>
          <strong>{{ translate('orderManagement.dispatchedTaskTable.user') }}: </strong>
          <span :class="{'missing-field': !dispatch.user_ids || dispatch.user_ids.length === 0}">
            {{ formatUsers(dispatch.user_ids) }}
          </span>
        </li>
        <li>
          <strong>{{ translate('orderManagement.dispatchedTaskTable.form') }}: </strong>
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
import {translate, translateWithParams} from "@/utils/i18n";
import cronstrue from 'cronstrue';
import { getCurrentLanguage } from "@/utils/dispatch-utils";

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
    translateWithParams,
    translate,
    // Format a date in '2025/1/16 00:00:00' format (Order summary helper)
    formatDate(date) {
      if (!date) return translate('orderManagement.orderFormDialog.missing');
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
      if (!Array.isArray(range) || range.length !== 2) return translate('orderManagement.orderFormDialog.missing');
      return `${this.formatDate(range[0])} ${translate('FormDataSummary.dateRangeSeparator')} ${this.formatDate(range[1])}`;
    },
    formatShift(shiftId) {
      if (!shiftId) {
        return translate('orderManagement.orderFormDialog.missing');
      }

      return this.shiftMap[shiftId]?.name || translate('orderManagement.orderFormDialog.unknownShift');
    },
    // Format user list (Order summary helper)
    formatUsers(userIds) {
      if (!userIds || userIds.length === 0) return translate('orderManagement.orderFormDialog.missing');
      return userIds
          .map((id) => this.userMap[id]?.name || translate('orderManagement.orderFormDialog.unknownUser'))
          .join(", ");
    },
    // Format form list (Order summary helper)
    formatForms(formIds) {
      if (!formIds || formIds.length === 0) return translate('orderManagement.orderFormDialog.missing');

      const formNames = formIds.map(id => this.formMap[id] || (translate('orderManagement.orderFormDialog.unknownForm') + `(${id})`));

      return formNames.join(", ");
    },
    // Format cron expression to Chinese (Order summary helper)
    formatCronExpression(cron) {
      if (!cron) return translate('orderManagement.orderFormDialog.unknownExecutionLogic');
      try {
        if (getCurrentLanguage() === 'en-US'){
          return cronstrue.toString(cron)
        } else {
          return humanizeCronInChinese(cron);
        }
      } catch {
        return translate('orderManagement.orderFormDialog.unknownExecutionLogic');
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

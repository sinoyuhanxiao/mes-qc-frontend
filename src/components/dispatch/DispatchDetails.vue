<template>
  <div class="dispatch-details">
    <div class="details-header">
      <!-- Action Buttons -->
      <el-button-group>
        <el-button type="success" @click="$emit('edit')">编辑</el-button>
        <el-button type="danger" @click="$emit('delete')">删除</el-button>
      </el-button-group>
    </div>
    <div class="readonly-info">
      <!-- Name -->
      <div v-if="dispatch">
        <p v-if="dispatch.name"><strong>任务名称:</strong> {{ dispatch.name }}</p>

        <!-- Schedule Type -->
        <p v-if="dispatch.schedule_type"><strong>计划类型:</strong> {{ formatScheduleType(dispatch.schedule_type) }}</p>

        <!-- Specific Time -->
        <p v-if="dispatch.time_of_day"><strong>指定时间:</strong> {{ dispatch.time_of_day }}</p>

        <!-- Start Time -->
        <p v-if="dispatch.start_time"><strong>激活时间:</strong> {{ formatDate(dispatch.start_time) }}</p>

        <!-- Interval Minutes -->
        <p v-if="dispatch.interval_minutes"><strong>时间间隔（分钟）:</strong> {{ dispatch.interval_minutes }}</p>

        <!-- Repeat Count -->
        <p v-if="dispatch.repeat_count"><strong>重复次数:</strong> {{ dispatch.repeat_count }}</p>

        <!-- Specific Days -->
        <p v-if="dispatch.schedule_type === 'SPECIFIC_DAYS' && dispatch.dispatch_days.length">
          <strong>具体日期:</strong> {{ formattedSpecificDays }}
        </p>

        <!-- Forms -->
        <p><strong>表单:</strong>
          <span v-if="dispatch.dispatch_forms.length">
            {{ dispatch.dispatch_forms.join(", ") }}
          </span>
          <span v-else>-</span>
        </p>

        <!-- Personnel -->
        <p><strong>人员:</strong>
          <span v-if="dispatch.dispatch_personnel.length">
            {{ formattedPersonnel }}
          </span>
          <span v-else>-</span>
        </p>
      </div>
      <div v-else>
        <p>没有选中的任务派发。</p>
      </div>
    </div>
  </div>
</template>

<script>
import { formatDate, formatScheduleType } from "@/utils/dispatch-utils";

export default {
  props: {
    dispatch: {
      type: Object,
      required: true,
    },
  },
  computed: {
    formattedSpecificDays() {
      const weekDaysMap = {
        MONDAY: "星期一",
        TUESDAY: "星期二",
        WEDNESDAY: "星期三",
        THURSDAY: "星期四",
        FRIDAY: "星期五",
        SATURDAY: "星期六",
        SUNDAY: "星期日",
      };
      return this.dispatch.dispatch_days
          .map(day => weekDaysMap[day] || day)
          .join(", ");
    },
    formattedPersonnel() {
      return this.dispatch.dispatch_personnel
          .map(person => person.name)
          .join(", ");
    },
  },
  methods: {
    formatDate,
    formatScheduleType,
  },
};
</script>

<style scoped>
.dispatch-details {
  padding: 10px;
}

.details-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.readonly-info {
  padding: 10px;
  line-height: 1.8;
}

.readonly-info p {
  margin: 5px 0;
  word-wrap: break-word; /* Ensure text wraps properly */
}
</style>

<template>
  <el-form label-position="left" label-width="140px" class="dispatch-details">

    <div class="details-header">
      <!-- Action Buttons -->
      <el-button-group>
        <el-button type="success" @click="$emit('edit')">编辑</el-button>
        <el-button type="danger" @click="$emit('delete')">删除</el-button>
      </el-button-group>
    </div>

    <el-form-item label="派发名称">
      {{ dispatch.name }}
    </el-form-item>

    <el-form-item label="ID">
      {{ dispatch.id }}
    </el-form-item>

    <el-form-item label="类型">
      {{ formatScheduleType(dispatch.type) }}
    </el-form-item>

    <el-form-item label="备注" v-if="dispatch.remark">
      {{ dispatch.remark }}
    </el-form-item>

    <el-form-item label="Cron 表达式" v-if="dispatch.cron_expression">
      {{ dispatch.cron_expression }}
    </el-form-item>

    <el-form-item label="派发开始运行时间" v-if="dispatch.start_time">
      {{ formatDate(dispatch.start_time) }}
    </el-form-item>

    <el-form-item label="派发停止运行时间" v-if="dispatch.end_time">
      {{ formatDate(dispatch.end_time) }}
    </el-form-item>
    <!-- Is Schedule -->
    <el-form-item label="运行状态">
      <status-circle :status="isSchedule" />
    </el-form-item>

    <!-- Next Execution Time -->
    <el-form-item label="下次派发时间">
      <el-tag style="font-weight: bold" type="info">
        {{ calculateRemainingTime(nextExecutionTime) }}
      </el-tag>
    </el-form-item>

    <el-form-item label="派发次数上限" v-if="dispatch.dispatch_limit">
      {{ dispatch.dispatch_limit === -1 ? "无限制" : dispatch.dispatch_limit }}
    </el-form-item>

    <el-form-item label="已执行次数">
      {{ dispatch.executed_count }}
    </el-form-item>

    <el-form-item label="任务时限 (分钟)" v-if="dispatch.due_date_offset_minute">
      {{ dispatch.due_date_offset_minute }}
    </el-form-item>


    <el-form-item label="表单">
      <div v-if="dispatch.dispatch_forms.length > 0" class="form-tags">
        <el-tag
            v-for="(formId, index) in dispatch.dispatch_forms"
            :key="formId"
            type="success"
            size="small"
            effect="light"
        >
          <el-popover effect="light" trigger="hover" placement="top" width="auto">
            <template #default>
              <div>ID: {{ formId }}</div>
              <div>表单名: {{ getFormById(formId) }}</div>
            </template>
            <template #reference>
              {{ getFormById(formId) }}
            </template>
          </el-popover>
        </el-tag>
      </div>
      <div v-else>-</div>
    </el-form-item>

    <el-form-item label="人员">
      <div v-if="dispatch.dispatch_users.length > 0" class="user-tags">
        <el-tag
            v-for="user in dispatch.dispatch_users"
            :key="user.id"
            type="primary"
            size="small"
            effect="light"
        >
          <el-popover effect="light" trigger="hover" placement="top" width="auto">
            <template #default>
              <div>姓名: {{ user.name }}</div>
              <div>用户名: {{ user.username }}</div>
              <div>企业微信: {{ user.wecom_id }}</div>
            </template>
            <template #reference>
              {{ user.name }}
            </template>
          </el-popover>
        </el-tag>
      </div>
      <div v-else>-</div>
    </el-form-item>


    <el-form-item label="创建时间" v-if="dispatch.created_at">
      {{ formatDate(dispatch.created_at) }}
    </el-form-item>

    <el-form-item label="更新时间" v-if="dispatch.updated_at">
      {{ formatDate(dispatch.updated_at) }}
    </el-form-item>

  </el-form>
</template>

<script>
import { formatDate, formatScheduleType } from "@/utils/dispatch-utils";
import {getDispatchNextExecutionTime, getIsScheduled} from "@/services/dispatchService";
import dayjs from "dayjs";
import StatusCircle from "@/components/dispatch/StatusCircle.vue";

export default {
  components: {StatusCircle},
  props: {
    dispatch: {
      type: Object,
      required: true,
    },
    formMap: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      nextExecutionTime: null, // Store next execution time
      isSchedule: 0,
    };
  },
  methods: {
    formatDate,
    formatScheduleType,
    formatDay(day) {
      const dayMap = {
        MONDAY: "星期一",
        TUESDAY: "星期二",
        WEDNESDAY: "星期三",
        THURSDAY: "星期四",
        FRIDAY: "星期五",
        SATURDAY: "星期六",
        SUNDAY: "星期日",
      };
      return dayMap[day] || day;
    },
    getFormById(id) {
      return this.formMap[id] || "未知表单";
    },
    async fetchNextExecutionTime() {
      if (!this.dispatch || !this.dispatch.id) return;
      try {
        const response = await getDispatchNextExecutionTime(this.dispatch.id);
        console.log(response);
        this.nextExecutionTime = response.data.data; // Save next execution time
        console.log('dispatch id:' + this.dispatch.id + ' next-execute-time: ' + response.data.data);
      } catch (error) {
        console.error("Failed to fetch next execution time:", error);
        this.nextExecutionTime = null; // Fallback in case of error
      }
    },
    async fetchIsScheduled() {
      if (!this.dispatch || !this.dispatch.id) return;
      try {
        const response = await getIsScheduled(this.dispatch.id);
        if (response.data.data === true) {
          this.isSchedule = 1;
        }
      } catch (error) {
        console.error("Failed to fetch is schedule for dispatch :", this.dispatch.id);
        this.isSchedule = 0; // Fallback in case of error
      }
    },
    calculateRemainingTime(dueDate) {
      if (!dueDate) return "-";

      const now = dayjs();
      const due = dayjs(dueDate);
      const diffInMinutes = due.diff(now, "minute");

      if (diffInMinutes <= 0) return "已过期";

      const days = Math.floor(diffInMinutes / (60 * 24));
      const hours = Math.floor((diffInMinutes % (60 * 24)) / 60);
      const minutes = diffInMinutes % 60;

      if (days > 0) {
        return `${days} 天 ${hours} 小时 ${minutes} 分钟`;
      } else if (hours > 0) {
        return `${hours} 小时 ${minutes} 分钟`;
      } else {
        return `${minutes} 分钟`;
      }
    },
  },
  mounted() {
    this.fetchNextExecutionTime(); // Fetch next execution time on mount
    this.fetchIsScheduled();
  },
};
</script>

<style scoped>
.dispatch-details {
  padding: 10px;
}

.days-tags,
.user-tags,
.form-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.details-header {
  display: flex;
  justify-content: flex-end;
}

</style>


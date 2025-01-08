<template>
  <el-form label-position="left" label-width="120px" class="dispatch-details">

    <div class="details-header">
      <!-- Action Buttons -->
      <el-button-group>
        <el-button type="success" @click="$emit('edit')">编辑</el-button>
        <el-button type="danger" @click="$emit('delete')">删除</el-button>
      </el-button-group>
    </div>

    <el-form-item label="派发名称" v-if="dispatch.name">
      {{ dispatch.name }}
    </el-form-item>

    <el-form-item label="类型" v-if="dispatch.schedule_type">
      {{ formatDispatchType(dispatch.schedule_type) }}
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

    <el-form-item label="派发次数上限" v-if="dispatch.dispatch_limit">
      {{ dispatch.dispatch_limit === -1 ? "无限制" : dispatch.dispatch_limit }}
    </el-form-item>

    <el-form-item label="已执行次数" v-if="dispatch.executed_count">
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

export default {
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


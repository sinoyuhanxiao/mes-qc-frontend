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

    <el-form-item label="计划类型" v-if="dispatch.schedule_type">
      {{ formatScheduleType(dispatch.schedule_type) }}
    </el-form-item>

    <el-form-item label="指定时间" v-if="dispatch.time_of_day">
      {{ dispatch.time_of_day }}
    </el-form-item>

    <el-form-item label="激活时间" v-if="dispatch.start_time">
      {{ formatDate(dispatch.start_time) }}
    </el-form-item>

    <el-form-item label="时间间隔 (分钟)" v-if="dispatch.interval_minutes">
      {{ dispatch.interval_minutes }}
    </el-form-item>

    <el-form-item label="重复次数" v-if="dispatch.repeat_count">
      {{ dispatch.repeat_count }}
    </el-form-item>

    <el-form-item label="具体日期" v-if="dispatch.schedule_type === 'SPECIFIC_DAYS' && dispatch.dispatch_days.length">
      <div class="days-tags">
        <el-tag
            v-for="(day, index) in dispatch.dispatch_days"
            :key="day"
            type="info"
            size="small"
            effect="light"
        >
          {{ formatDay(day) }}
        </el-tag>
      </div>
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
      <div v-if="dispatch.dispatch_personnel.length > 0" class="personnel-tags">
        <el-tag
            v-for="(person, index) in dispatch.dispatch_personnel"
            :key="person.id"
            type="primary"
            size="small"
            effect="light"
        >
          <el-popover effect="light" trigger="hover" placement="top" width="auto">
            <template #default>
              <div>姓名: {{ person.name }}</div>
              <div>用户名: {{ person.username }}</div>
              <div>企业微信: {{ person.wecom_id }}</div>
            </template>
            <template #reference>
              {{ person.name }}
            </template>
          </el-popover>
        </el-tag>
      </div>
      <div v-else>-</div>
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
.personnel-tags,
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


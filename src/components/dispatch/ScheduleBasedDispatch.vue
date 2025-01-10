<template>
  <el-form :model="dispatchForm" :rules="validationRules" ref="formRef" label-width="200px">
    <!-- Dispatch Name -->
    <el-form-item label="任务名称" required>
      <el-input v-model="dispatchForm.name" placeholder="请输入任务名称"></el-input>
    </el-form-item>

    <el-form-item label="派发开始运行时间" required>
      <el-date-picker
          v-model="dispatchForm.startTime"
          type="datetime"
          placeholder="请选择时间"
      ></el-date-picker>
    </el-form-item>

    <el-form-item label="派发停止运行时间" required>
      <el-date-picker
          v-model="dispatchForm.endTime"
          type="datetime"
          placeholder="请选择时间"
      ></el-date-picker>
    </el-form-item>

    <!-- Cron Expression -->
    <el-form-item label="派发计划" required>
      <cron-element-plus
          v-model="dispatchForm.cronExpression"
          :button-props="{ type: 'primary' }"
          @error="error = $event"
      />
<!--      <p class="text-lightest pt-2">当前 Cron 表达式: {{ normalizedCronExpression }}</p>-->
    </el-form-item>


    <!-- Dispatch Limit -->
    <el-form-item label="派发次数上限 (-1 为无限制)">
      <el-input-number v-model="dispatchForm.dispatchLimit" :min="-1"></el-input-number>
    </el-form-item>

    <!-- Due Date Offset (Minutes) -->
    <el-form-item label="任务时限(分钟)" required>
      <el-input-number v-model="dispatchForm.dueDateOffsetMinute" :min="0"></el-input-number>
    </el-form-item>

<!--    <el-divider>具体日期</el-divider>-->

<!--    <el-form-item label="选择派发日">-->
<!--      <el-checkbox-->
<!--          v-model="selectAllDays"-->
<!--          :indeterminate="isPartialDaysSelected"-->
<!--          @change="toggleAllDays">-->
<!--        每天-->
<!--      </el-checkbox>-->
<!--    </el-form-item>-->
<!--    <el-form-item>-->
<!--      <el-checkbox-group-->
<!--          v-model="dispatchForm.dispatch_days"-->
<!--          @change="updatePartialDaysState"-->
<!--      >-->
<!--        <el-checkbox-->
<!--            v-for="day in weekDaysMap"-->
<!--            :key="day.key"-->
<!--            :label="day.key"-->
<!--        >-->
<!--          {{ day.display }}-->
<!--        </el-checkbox>-->
<!--      </el-checkbox-group>-->
<!--    </el-form-item>-->
<!--    <el-form-item label="时间">-->
<!--      <el-time-picker-->
<!--          v-model="dispatchForm.timeOfDay"-->
<!--          placeholder="请选择时间"-->
<!--          format="HH:mm"-->
<!--          value-format="HH:mm"-->
<!--          :step="60"-->
<!--      ></el-time-picker>-->
<!--    </el-form-item>-->


<!--    <el-divider>设置重复派发</el-divider>-->

<!--    <el-form-item label="时间间隔(分钟)">-->
<!--      <el-input-number v-model="dispatchForm.intervalMinutes" :min="1"></el-input-number>-->
<!--    </el-form-item>-->
<!--    <el-form-item label="重复次数">-->
<!--      <el-input-number v-model="dispatchForm.repeatCount" :min="1"></el-input-number>-->
<!--    </el-form-item>-->

    <!-- User Selection -->
    <el-divider>人员</el-divider>

    <el-form-item label="选择人员" required>
      <el-select
          v-model="dispatchForm.userIds"
          multiple
          filterable
          placeholder="请选择人员"
          :loading="isLoadingUser"
          @focus="loadUserOptions"
      >
        <el-option
            v-for="user in userOptions"
            :key="user.id"
            :label="user.name"
            :value="user.id"
        />
      </el-select>
    </el-form-item>

    <el-divider>表单</el-divider>

    <!-- Form Tree -->
    <el-form-item label="选择表单" required>
      <DispatchFormTreeSelect
          :selected-form-ids="dispatchForm.formIds"
          @update-selected-forms="handleSelectedForms"/>
    </el-form-item>

    <!-- Remark -->
    <el-form-item label="备注">
      <el-input type="textarea" v-model="dispatchForm.remark" placeholder="请输入备注"></el-input>
    </el-form-item>

    <!-- Schedule Summary -->
    <el-card class="mt-4" shadow="always">
      <h4>派发计划预览</h4>
      <p>计划: <strong>{{ chineseSchedule }}</strong></p>
      <p>开始运行时间: <strong>{{ formattedStartTime }}</strong></p>
      <p>停止运行时间: <strong>{{ formattedEndTime }}</strong></p>
      <p>派发表单: <strong>{{ selectedFormNames.join(", ") }}</strong></p>
      <p>派发给: <strong>{{ selectedUsers }}</strong></p>
    </el-card>


    <!-- Action Buttons -->
    <el-form-item>
      <el-button type="primary" :disabled="!isFormModified" @click="submitForm">提交</el-button>
      <el-button @click="resetForm" type="warning">重置</el-button>
      <el-button @click="$emit('on-cancel')">取消</el-button>
    </el-form-item>

<!--    <div>-->
<!--      <cron-element-plus-->
<!--          v-model="value"-->
<!--          :button-props="{ type: 'primary' }"-->
<!--          @error="error=$event" />-->

<!--      <p class="text-lightest pt-2">cron expression: {{value}}</p>-->

<!--    </div>-->

  </el-form>
</template>

<script>
import {fetchUsers} from "@/services/userService";
import DispatchFormTreeSelect from "@/components/form-manager/DispatchFormTreeSelect.vue";
import isEqual from "lodash/isEqual";


function parseCronExpression(cronExpression) {

  // Normalize to include seconds if missing
  const normalizedExpression = normalizeCronExpression(cronExpression);

  const parts = normalizedExpression.split(" ");
  const [second, minute, hour, day, month, weekday] = parts;

  const dayMap = {
    "0": "周日",
    "1": "周一",
    "2": "周二",
    "3": "周三",
    "4": "周四",
    "5": "周五",
    "6": "周六",
    "7": "周日", // Allow for both 0 and 7 as Sunday
  };

  // Helper function to parse ranges or lists
  const parseListOrRange = (value, unit) => {
    if (value === "*") return null;
    if (value.includes("-")) {
      const [start, end] = value.split("-").map(v => `${v}${unit}`);
      return `${start}-${end}`;
    }
    return value
        .split(",")
        .map(v => `${v}${unit}`)
        .join(", ");
  };

  const minuteText =
      minute === "*"
          ? "每分钟"
          : minute.startsWith("*/")
              ? `每${minute.slice(2)}分钟`
              : `第${parseListOrRange(minute, "分")}`;

  const hourText =
      hour === "*"
          ? "每小时"
          : hour.startsWith("*/")
              ? `每${hour.slice(2)}小时`
              : `第${parseListOrRange(hour, "时")}`;

  const dayText = day === "*" ? "" : `每月${day.split(",").join(",")}号`;

  const monthText =
      month === "*"
          ? ""
          : `每年${month.split(",").map(v => `${v}月`).join(",")}`;

  const weekdayText =
      weekday === "*"
          ? ""
          : weekday.includes("-")
              ? `每周${parseListOrRange(weekday, "")}`
              : `每周${weekday.split(",").map(v => dayMap[v.trim()] || `未知周${v.trim()}`).join(",")}`;

  // Combine parts with appropriate logic to remove redundancy
  const timeText = `${hourText}: ${minuteText}`;
  return [dayText, weekdayText, monthText, timeText]
      .filter(Boolean)
      .join(", ");
}

function normalizeCronExpression(cronExpression) {
  return cronExpression.trim().split(" ").length === 5
      ? `0 ${cronExpression}` // Add "0" as the seconds field
      : cronExpression;
}

export default {
  components: {DispatchFormTreeSelect},
  props: {
    formData: {
      type: Object,
      required: true, // Expect this prop to always be provided
    },
  },
  data() {
    return {
      dispatchForm: {
        name: "",
        type: "SCHEDULED",
        remark: "",
        cronExpression: "* * * * *",
        startTime: null,
        endTime: null,
        dispatchLimit: -1,
        dueDateOffsetMinute: 60,
        formIds: [],
        userIds: [],
        created_by: null, // Assign in submitForm
        updated_by: null, // Assign in submitForm
      },
      validationRules: {
        name: [{ required: true, message: "请输入任务名称", trigger: "blur" }],
        type: [{ required: true, message: "请选择派发类型", trigger: "change" }],
        startTime: [{ required: true, message: "请选择派发开始运行时间", trigger: "change" }],
        endTime: [{ required: true, message: "请选择派发停止运行时间", trigger: "change" }],
        cronExpression: [{ required: true, message: "请输入 Cron 表达式", trigger: "change" }],
        userIds: [{ required: true, message: "请选择人员", trigger: "change" }],
        formIds: [{ required: true, message: "请选择表单", trigger: "change" }],
      },
      selectedFormNames: [], // For displaying form names in preview
      userOptions: [],
      isLoadingUser: false,
      selectAllDays: false,
      isPartialDaysSelected: false,
      weekDaysMap: [
        { key: "MONDAY", display: "星期一" },
        { key: "TUESDAY", display: "星期二" },
        { key: "WEDNESDAY", display: "星期三" },
        { key: "THURSDAY", display: "星期四" },
        { key: "FRIDAY", display: "星期五" },
        { key: "SATURDAY", display: "星期六" },
        { key: "SUNDAY", display: "星期日" },
      ],
    };
  },
  computed:{
    formattedStartTime() {
      return this.dispatchForm.startTime
          ? new Date(this.dispatchForm.startTime).toLocaleString("zh-CN", {
            timeZone: "Asia/Shanghai",
          })
          : "未设置";
    },
    formattedEndTime() {
      return this.dispatchForm.endTime
          ? new Date(this.dispatchForm.endTime).toLocaleString("zh-CN", {
            timeZone: "Asia/Shanghai",
          })
          : "未设置";
    },
    chineseSchedule() {
      if (!this.dispatchForm.cronExpression) return "无效的 Cron 表达式";
      try {
        return parseCronExpression(this.dispatchForm.cronExpression);
      } catch {
        return "无法解析 Cron 表达式";
      }
    },
    selectedForms() {
      return this.dispatchForm.formIds.join(", ");
    },
    selectedUsers() {
      const selected = this.userOptions.filter(user => this.dispatchForm.userIds.includes(user.id));
      return selected.map(user => user.name).join(", ");
    },
    normalizedCronExpression() {
      const cronExpression = this.dispatchForm.cronExpression || "* * * * *";
      return cronExpression.trim().split(" ").length === 5
          ? `0 ${cronExpression}` // Add "0" as the seconds field
          : cronExpression;
    },
    isFormModified() {
      // Check if `dispatchForm` matches the original `formData`
      const transformedData = this.transformDispatchData(this.formData || {});
      return !isEqual(transformedData, this.dispatchForm);
    }
  },
  watch: {
    formData: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.dispatchForm = this.transformDispatchData(newVal || {});
          // this.updatePartialDaysState();
          this.loadUserOptions(); //Load personnel options when form data changes
        }
      },
    },
  },
  methods: {
    transformDispatchData(data) {
      return {
        name: data.name || "",
        type: "SCHEDULED",
        remark: data.remark || "",
        cronExpression: data.cronExpression || "* * * * *",
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        dispatchLimit: data.dispatchLimit ?? -1,
        dueDateOffsetMinute: data.dueDateOffsetMinute || 60,
        formIds: data.formIds || [],
        userIds: data.userIds || [],
        created_by: data.created_by || null,
        updated_by: data.updated_by || null,
      };
    },
    toggleAllDays(isChecked) {
      this.dispatchForm.dispatch_days = isChecked
          ? this.weekDaysMap.map(day => day.key)
          : [];
      this.updatePartialDaysState();
    },
    updatePartialDaysState() {
      const checkedCount = Array.isArray(this.dispatchForm.dispatch_days)
          ? this.dispatchForm.dispatch_days.length
          : 0;
      this.selectAllDays = checkedCount === this.weekDaysMap.length;
      this.isPartialDaysSelected =
          checkedCount > 0 && checkedCount < this.weekDaysMap.length;
    },
    async loadUserOptions() {
      if (this.isLoadingUser || this.userOptions.length > 0) return;
      this.isLoadingUser = true;
      try {
        const response = await fetchUsers();
        this.userOptions = response.data.data.map(user => ({
          id: user.id,
          name: user.name,
        }));
      } catch (error) {
        console.error("Error loading user:", error);
        this.$message.error("加载人员失败，请重试");
      } finally {
        this.isLoadingUser = false;
      }
    },
    submitForm() {
      const normalizedCron = normalizeCronExpression(this.dispatchForm.cronExpression);
      const payload = {
        ...this.dispatchForm,
        created_by: this.$store.getters.getUser.id, // Example: Set the user ID dynamically
        cronExpression: normalizedCron,
        updated_by: null,
      };
      this.$emit("on-submit", payload);
      console.log('payload in scheduleBasedDispatch component' + payload)
    },
    resetForm() {
      this.dispatchForm = this.transformDispatchData(this.formData || {});
      // this.updatePartialDaysState();
      // Emit updated forms to reset the tree
      this.updateSelectedForms(this.dispatchForm.formIds);
    },
    handleSelectedForms(selectedForms) {
      this.dispatchForm.formIds = selectedForms.map((form) => form.id); // API-ready IDs
      this.selectedFormNames = selectedForms.map((form) => form.label); // Names for display
    },
  },
};
</script>

<style>
.mt-4 {
  margin-top: 16px;
}
</style>

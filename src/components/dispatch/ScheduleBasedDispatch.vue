<template>
  <el-form :model="dispatchForm"
           :rules="validationRules"
           ref="formRef"
           label-position="left"
           label-width="200px">
    <!-- Dispatch Name -->
    <el-form-item label="任务名称" required prop="name">
      <el-input v-model="dispatchForm.name" placeholder="请输入任务名称"></el-input>
    </el-form-item>

    <!-- Start/End Time -->
    <el-form-item label="派发运行时间" required prop="dateRange">
      <el-date-picker
          v-model="dispatchForm.dateRange"
          type="datetimerange"
          range-separator="To"
          start-placeholder="开始时间"
          end-placeholder="停止时间"
          :format="dateFormat"
          :value-format="valueFormat"
      ></el-date-picker>
    </el-form-item>

    <!-- Cron Expression -->
    <el-form-item label="派发计划" required prop="cronExpression">
      <cron-element-plus
          v-model="dispatchForm.cronExpression"
          :button-props="{ type: 'primary' }"
      />
<!--      <p class="text-lightest pt-2">当前 Cron 表达式: {{ normalizedCronExpression }}</p>-->
    </el-form-item>

    <!-- Dispatch Limit -->
    <el-form-item label="派发次数上限 (-1 为无限制)" required prop="dispatchLimit">
      <el-input-number v-model="dispatchForm.dispatchLimit" :min="-1"></el-input-number>
    </el-form-item>

    <!-- Due Date Offset (Minutes) -->
    <el-form-item label="任务时限(分钟)" required prop="dueDateOffsetMinute">
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

    <el-form-item label="选择人员" required prop="userIds">
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
    <el-form-item label="选择表单" required prop="formIds">
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
      <h4>派发预览</h4>
      <p>计划: <strong>{{ chineseSchedule }}</strong></p>
      <p>运行时间: <strong>{{ displayActiveRange }}</strong></p>
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
import {normalizeCronExpression, unnormalizeCronExpression, parseCronExpressionToChinese } from "@/utils/dispatch-utils";
import { humanizeCronInChinese } from "cron-chinese";

export default {
  components: {DispatchFormTreeSelect},
  props: {
    currentDispatch: {
      type: Object,
      required: false,
    },
  },
  data() {
    return {
      dateFormat: "YYYY-MM-DD HH:mm:ss",
      valueFormat: "YYYY-MM-DDTHH:mm:ssZ", // Backend ISO format, update if necessary
      dispatchForm: {
        name: "",
        type: "SCHEDULED",
        remark: "",
        cronExpression: "* * * * *",
        dateRange: [],
        dispatchLimit: -1,
        dueDateOffsetMinute: 60,
        formIds: [],
        userIds: [],
        createdBy: null, // Assign in submitForm
        updatedBy: null, // Assign in submitForm
      },
      validationRules: {
        name: [{ required: true, message: "请输入任务名称", trigger: "blur" }],
        type: [{ required: true, message: "请选择派发类型", trigger: "change" }],
        dateRange: [{ required: true, message: "请选择派发运行时间", trigger: "change" }],
        cronExpression: [{ required: true, message: "请输入派发计划", trigger: "change" }],
        dispatchLimit: [{ required: true, message: "请输入派发计划", trigger: "change" }],
        dueDateOffsetMinute: [{ required: true, message: "请输入派发计划", trigger: "change" }],
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
    displayActiveRange() {
      if (!Array.isArray(this.dispatchForm.dateRange) || this.dispatchForm.dateRange.length < 2) {
        return "未设置"; // Default message if dateRange is missing
      }

      const formattedDates = this.dispatchForm.dateRange.map(dateStr =>
      {
        const date = new Date(dateStr);
        // return date;
        return date.toLocaleString("zh-CN")
      });

        return `${formattedDates[0]} 到 ${formattedDates[1]}`;
    },
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
        // return parseCronExpressionToChinese(this.dispatchForm.cronExpression);
        return humanizeCronInChinese(this.dispatchForm.cronExpression);
      } catch {
        return "无法解析 Cron 表达式";
      }
    },
    selectedUsers() {
      const selected = this.userOptions.filter(user => this.dispatchForm.userIds.includes(user.id));
      return selected.map(user => user.name).join(", ");
    },
    isFormModified() {
      // Check if `dispatchForm` matches the original `currentDispatch`
      const transformedData = this.transformDispatchData(this.currentDispatch || {});
      return !isEqual(transformedData, this.dispatchForm);
    },
  },
  watch: {
    currentDispatch: {
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
    humanizeCronInChinese,
    transformDispatchData(data) {
      // Called when resetting form, prefill form when currentDispatch is changed, check if there are changes
      return {
        name: data.name || "",
        type: data.type || "",
        remark: data.remark || "",
        cronExpression: unnormalizeCronExpression(data.cron_expression) || "* * * * *",
        dispatchLimit: data.dispatch_limit ?? -1,
        dueDateOffsetMinute: data.due_date_offset_minute || 60,
        dateRange: [
          data.start_time ? this.formatToLocalISO(data.start_time) : null,
          data.end_time ? this.formatToLocalISO(data.end_time) : null
        ],
        formIds: data.dispatch_forms || [],
        userIds: data.dispatch_users?.map(user => user.id) || [],
        createdBy: data.created_by || null,
        updatedBy: data.updated_by || null,
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
      this.$refs.formRef.validate((valid) => {
        if (!valid) {
          this.$message.error("请填写所有必填字段！");
          return;
        }

        const normalizedCron = normalizeCronExpression(this.dispatchForm.cronExpression);
        const payload = {
          ...this.dispatchForm,
          cronExpression: normalizedCron,
          startTime: this.dispatchForm.dateRange[0],
          endTime: this.dispatchForm.dateRange[1],
          isActive: true,
        };

        // remove dateRange since endpoint require in startDate, endDate format
        delete payload.dateRange;
        this.$emit("on-submit", payload);
        console.log(payload);
      });
    },
    resetForm() {
      this.dispatchForm = this.transformDispatchData(this.currentDispatch || {});
      // this.updatePartialDaysState();
      // Emit updated forms to reset the tree
      this.updateSelectedForms(this.dispatchForm.formIds);
    },
    handleSelectedForms(selectedForms) {
      this.dispatchForm.formIds = selectedForms.map((form) => form.id); // API-ready IDs
      this.selectedFormNames = selectedForms.map((form) => form.label); // Names for display
    },
    formatToLocalISO(utcDateString) {
      const date = new Date(utcDateString);

      // Get timezone offset in minutes
      const timezoneOffset = date.getTimezoneOffset();

      // Convert offset to hours and minutes
      const offsetHours = String(Math.abs(Math.floor(timezoneOffset / 60))).padStart(2, "0");
      const offsetMinutes = String(Math.abs(timezoneOffset % 60)).padStart(2, "0");

      // Determine offset sign
      const offsetSign = timezoneOffset > 0 ? "-" : "+";

      // Convert to ISO string without 'Z' (which represents UTC)
      const isoString = date.toISOString().replace("Z", "");

      // Attach correct timezone offset
      return `${isoString}${offsetSign}${offsetHours}:${offsetMinutes}`;
    }
  }
};
</script>

<style>
.mt-4 {
  margin-top: 16px;
}
</style>

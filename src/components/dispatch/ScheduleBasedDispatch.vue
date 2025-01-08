<template>
  <el-form :model="dispatchForm" :rules="validationRules" ref="formRef" label-width="150px">
    <!-- Dispatch Name -->
    <el-form-item label="任务名称">
      <el-input v-model="dispatchForm.name" placeholder="请输入任务名称"></el-input>
    </el-form-item>

    <!-- Dispatch Type -->
    <el-form-item label="派发类型" required>
      <el-select v-model="dispatchForm.type" placeholder="请选择派发类型">
        <el-option label="定时派发" value="SCHEDULED"></el-option>
        <el-option label="手动派发" value="MANUAL"></el-option>
      </el-select>
    </el-form-item>

    <el-form-item label="派发开始运行时间">
      <el-date-picker
          v-model="dispatchForm.startTime"
          type="datetime"
          placeholder="请选择时间"
      ></el-date-picker>
    </el-form-item>

    <el-form-item label="派发停止运行时间">
      <el-date-picker
          v-model="dispatchForm.endTime"
          type="datetime"
          placeholder="请选择时间"
      ></el-date-picker>
    </el-form-item>

    <!-- Cron Expression -->
    <el-form-item label="Cron 表达式" required>
      <cron-element-plus
          v-model="dispatchForm.cronExpression"
          :button-props="{ type: 'primary' }"
          @error="error = $event"
      />
      <p class="text-lightest pt-2">当前 Cron 表达式: {{ dispatchForm.cronExpression }}</p>
    </el-form-item>

    <!-- Dispatch Limit -->
    <el-form-item label="派发次数上限">
      <el-input-number v-model="dispatchForm.dispatchLimit" :min="-1" placeholder="输入派发限制 (-1 为无限制)"></el-input-number>
    </el-form-item>

    <!-- Due Date Offset (Minutes) -->
    <el-form-item label="任务时限(分钟)">
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


    <el-divider>人员</el-divider>
    <!-- User Selection -->
    <el-form-item label="选择人员">
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

    <el-form-item label="选择表单">
      <!-- Form Tree -->
      <DispatchFormTreeSelect
          :selected-form-ids="dispatchForm.dispatch_forms"
          @update-selected-forms="updateSelectedForms"/>
    </el-form-item>

    <!-- Remark -->
    <el-form-item label="备注">
      <el-input type="textarea" v-model="dispatchForm.remark" placeholder="请输入备注"></el-input>
    </el-form-item>

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
import { fetchUsers } from "@/services/userService";
import DispatchFormTreeSelect from "@/components/form-manager/DispatchFormTreeSelect.vue";
import isEqual from "lodash/isEqual";

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
        cronExpression: "",
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
      selectAllDays: false,
      isPartialDaysSelected: false,
      userOptions: [],
      formOptions: [
        { id: 101, name: "质量检查表 A" },
        { id: 102, name: "质量检查表 B" },
        { id: 103, name: "安全检查表" },
        { id: 104, name: "维护检查表" },
      ],
      isLoadingUser: false,
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
        type: data.type || "SCHEDULED",
        remark: data.remark || "",
        cronExpression: data.cronExpression || "",
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
      const payload = {
        ...this.dispatchForm,
        created_by: this.$store.getters.getUser.id, // Example: Set the user ID dynamically
        updated_by: null,
      };
      this.$emit("submit", payload);
    },
    resetForm() {
      this.dispatchForm = this.transformDispatchData(this.formData || {});
      // this.updatePartialDaysState();
      // Emit updated forms to reset the tree
      this.dispatch
      this.updateSelectedForms(this.dispatchForm.dispatch_forms);
    },
    updateSelectedForms(formIds) {
      this.dispatchForm.dispatch_forms = formIds;
    },
  },
};
</script>

<style>

</style>

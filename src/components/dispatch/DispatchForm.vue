<template>
  <el-form :model="dispatchForm" :rules="validationRules" ref="formRef" label-width="120px">
    <!-- Dispatch Name -->
    <el-form-item label="任务名称">
      <el-input v-model="dispatchForm.name" placeholder="请输入任务名称"></el-input>
    </el-form-item>

    <!-- Schedule Type -->
    <el-form-item label="计划类型">
      <el-select v-model="dispatchForm.scheduleType" placeholder="请选择计划类型">
        <el-option label="指定日期" value="SPECIFIC_DAYS"></el-option>
        <el-option label="时间间隔" value="INTERVAL"></el-option>
      </el-select>
    </el-form-item>

    <!-- Specific Days Section -->
    <template v-if="dispatchForm.scheduleType === 'SPECIFIC_DAYS'">
      <el-form-item label="具体日期">
        <el-checkbox
            v-model="selectAllDays"
            :indeterminate="isPartialDaysSelected"
            @change="toggleAllDays">
          每天
        </el-checkbox>
        </el-form-item>
        <el-form-item>
        <el-checkbox-group
            v-model="dispatchForm.dispatch_days"
            @change="updatePartialDaysState"
        >
          <el-checkbox
              v-for="day in weekDaysMap"
              :key="day.key"
              :label="day.key"
          >
            {{ day.display }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="时间">
        <el-time-picker
            v-model="dispatchForm.timeOfDay"
            placeholder="请选择时间"
            format="HH:mm"
            value-format="HH:mm"
            :step="60"
        ></el-time-picker>
      </el-form-item>
    </template>

    <!-- Interval Section -->
    <template v-if="dispatchForm.scheduleType === 'INTERVAL'">
      <el-form-item label="开始时间">
        <el-date-picker
            v-model="dispatchForm.startTime"
            type="datetime"
            placeholder="请选择开始时间"
        ></el-date-picker>
      </el-form-item>
      <el-form-item label="时间间隔(分钟)">
        <el-input-number v-model="dispatchForm.intervalMinutes" :min="1"></el-input-number>
      </el-form-item>
      <el-form-item label="重复次数">
        <el-input-number v-model="dispatchForm.repeatCount" :min="1"></el-input-number>
      </el-form-item>
    </template>

    <!-- Personnel Selection -->
    <el-form-item label="选择人员">
      <el-select
          v-model="dispatchForm.personnelIds"
          multiple
          filterable
          placeholder="请选择人员"
          :loading="isLoadingPersonnel"
          @focus="loadPersonnelOptions"
      >
        <el-option
            v-for="person in personnelOptions"
            :key="person.id"
            :label="person.name"
            :value="person.id"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="选择表单">
    <!-- Form Tree -->
      <DispatchFormTreeSelect @update-selected-forms="updateSelectedForms"/>
    </el-form-item>


    <!-- Action Buttons -->
    <el-form-item>
      <el-button type="primary" @click="submitForm">提交</el-button>
      <el-button @click="resetForm">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
import { fetchUsers } from "@/services/userService";
import DispatchFormTreeSelect from "@/components/form-manager/DispatchFormTreeSelect.vue";

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
        id: null,
        name: "",
        scheduleType: null,
        timeOfDay: "",
        intervalMinutes: null,
        repeatCount: null,
        executeCount: null,
        startTime: null,
        dispatch_days: [],
        personnelIds: [],
        dispatch_forms: [],
        active: true,
      },
      validationRules: {
        name: [{ required: true, message: "请输入任务名称", trigger: "blur" }],
        scheduleType: [
          { required: true, message: "请选择计划类型", trigger: "change" },
        ],
      },
      selectAllDays: false,
      isPartialDaysSelected: false,
      personnelOptions: [],
      formOptions: [
        { id: 101, name: "质量检查表 A" },
        { id: 102, name: "质量检查表 B" },
        { id: 103, name: "安全检查表" },
        { id: 104, name: "维护检查表" },
      ],
      isLoadingPersonnel: false,
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
  watch: {
    formData: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.dispatchForm = this.transformDispatchData(newVal);
          this.updatePartialDaysState();
        }
      },
    },
  },
  methods: {
    transformDispatchData(data) {
      return {
        name: data.name || "",
        scheduleType: data.schedule_type || null,
        timeOfDay: data.time_of_day || "",
        dispatch_days: (data.dispatch_days || []).map(day =>
            this.weekDaysMap.find(item => item.key === day)?.key || day
        ),
        startTime: data.start_time || "",
        intervalMinutes: data.interval_minutes || null,
        repeatCount: data.repeat_count || null,
        personnelIds: (data.dispatch_personnel || []).map(person => person.id), // Map personnel IDs
        dispatch_forms: data.dispatch_forms || [],
        active: data.active || true,
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
    async loadPersonnelOptions() {
      if (this.isLoadingPersonnel || this.personnelOptions.length > 0) return;
      this.isLoadingPersonnel = true;
      try {
        const response = await fetchUsers();
        this.personnelOptions = response.data.data.map(user => ({
          id: user.id,
          name: user.name,
        }));
      } catch (error) {
        console.error("Error loading personnel:", error);
        this.$message.error("加载人员失败，请重试");
      } finally {
        this.isLoadingPersonnel = false;
      }
    },
    submitForm() {
      this.$emit("submit", this.dispatchForm);
    },
    resetForm() {
      this.dispatchForm = this.transformDispatchData(this.formData || {});
      this.updatePartialDaysState();
    },
    updateSelectedForms(formIds) {
      this.dispatchForm.dispatch_forms = formIds;
    },
  },
};
</script>

<style>

</style>

<template>
  <el-form :model="dispatchForm" :rules="validationRules" ref="formRef" label-width="150px">

    <!-- Dispatch Name -->
    <el-form-item label="派发名称" prop="name">
      <el-input v-model="dispatchForm.name" placeholder="请输入派发名称" />
    </el-form-item>

    <!-- Due Date Offset (Minutes) -->
    <el-form-item label="任务时限(分钟)" required prop="dueDateOffsetMinute">
      <el-input-number v-model="dispatchForm.dueDateOffsetMinute" :min="0"></el-input-number>
    </el-form-item>

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

    <!-- Form Tree -->
    <el-divider>表单</el-divider>
    <el-form-item label="选择表单" required prop="formIds">
      <DispatchFormTreeSelect
          :selected-form-ids="dispatchForm.formIds"
          @update-selected-forms="handleSelectedForms"/>
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
  </el-form>
</template>

<script>
import DispatchFormTreeSelect from "@/components/form-manager/DispatchFormTreeSelect.vue";
import {fetchUsers} from "@/services/userService";
import dispatchForm from "@/components/dispatch/DispatchForm.vue";
import {normalizeCronExpression, unnormalizeCronExpression} from "@/utils/dispatch-utils";
import isEqual from "lodash/isEqual";

export default {
  components: {DispatchFormTreeSelect},
  props: {
    currentDispatch: {
      type: Object,
      required: false,
    },
  },
  computed: {
    isFormModified() {
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
  data() {
    return {
      dispatchForm: {
        name: "",
        type: "MANUAL",
        remark: "",
        cronExpression: null,
        dateRange: [],
        dispatchLimit: -1,
        dueDateOffsetMinute: 60,
        formIds: [],
        userIds: [],
        createdBy: null, // Assign in submitForm
        updatedBy: null, // Assign in submitForm
        // start time, end time , is active
      },
      selectedFormNames: [], // For displaying form names in preview
      userOptions: [],
      isLoadingUser: false,
      validationRules: {
        name: [{ required: true, message: "请输入派发名称", trigger: "blur" }],
        userIds: [{ required: true, message: "请选择人员", trigger: "change" }],
        formIds: [{ required: true, message: "请选择表单", trigger: "change" }],
        dueDateOffsetMinute: [{ required: true, message: "请输入派发计划", trigger: "change" }],
      },
    };
  },
  methods: {
    submitForm() {
      this.$refs.formRef.validate((valid) => {
        if (!valid) {
          this.$message.error("请填写所有必填字段！");
          return;
        }

        const payload = {
          ...this.dispatchForm,
          startTime: null,
          endTime: null,
          cronExpression: null,
        };

        // remove dateRange since endpoint require in startDate, endDate format
        delete payload.dateRange;
        this.$emit("on-submit", payload);
        console.log(payload);
      });
    },
    resetForm() {
      this.$refs.formRef.resetFields();
      // this.dispatchForm = this.transformDispatchData(this.currentDispatch || {});
      // this.updatePartialDaysState();
      // Emit updated forms to reset the tree
      // this.updateSelectedForms(this.dispatchForm.formIds);
    },
    handleSelectedForms(selectedForms) {
      this.dispatchForm.formIds = selectedForms.map((form) => form.id); // API-ready IDs
      this.selectedFormNames = selectedForms.map((form) => form.label); // Names for display
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
    transformDispatchData(data) {
      // Called when resetting form, prefill form when currentDispatch is changed, check if there are changes
      return {
        name: data.name || "",
        type: data.type || "",
        remark: data.remark || "",
        cronExpression: unnormalizeCronExpression(data.cron_expression) || null,
        dispatchLimit: data.dispatch_limit ?? -1,
        dueDateOffsetMinute: data.due_date_offset_minute || 60,
        startTime: null,
        endTime: null,
        formIds: data.dispatch_forms || [],
        userIds: data.dispatch_users?.map(user => user.id) || [],
        createdBy: data.created_by || null,
        updatedBy: data.updated_by || null,
      };
    },
  },
};
</script>

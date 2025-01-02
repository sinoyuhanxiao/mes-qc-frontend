<template>
  <el-form :model="manualDispatchForm" :rules="validationRules" ref="formRef" label-width="150px">
    <el-form-item label="任务派发名称" prop="name">
      <el-input v-model="manualDispatchForm.name" placeholder="请输入任务派发名称" />
    </el-form-item>

    <!-- Personnel Selection -->
    <el-form-item label="选择人员">
      <el-select
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
      <DispatchFormTreeSelect
          :selected-form-ids="dispatchForm.dispatch_forms"
          @update-selected-forms="updateSelectedForms"/>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="submitForm">提交</el-button>
      <el-button @click="resetForm" type="warning">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
import DispatchFormTreeSelect from "@/components/form-manager/DispatchFormTreeSelect.vue";
import {fetchUsers} from "@/services/userService";
import dispatchForm from "@/components/dispatch/DispatchForm.vue";

export default {
  computed: {
    dispatchForm() {
      return dispatchForm
    }
  },
  components: {DispatchFormTreeSelect},
  data() {
    return {
      manualDispatchForm: {
        name: "",
        personnel: [],
      },
      personnelOptions: [
        { id: 1, name: "人员 A" },
        { id: 2, name: "人员 B" },
        { id: 3, name: "人员 C" },
      ],
      validationRules: {
        name: [{ required: true, message: "请输入任务派发名称", trigger: "blur" }],
        personnel: [
          { required: true, message: "请选择至少一个人员", trigger: "change" },
        ],
      },
      isLoadingPersonnel: false,
    };
  },
  methods: {
    submitForm() {
      this.$refs.formRef.validate((valid) => {
        if (valid) {
          this.$emit("on-submit", this.manualDispatchForm);
        } else {
          this.$message.error("表单验证失败，请检查输入！");
        }
      });
    },
    resetForm() {
      this.$refs.formRef.resetFields();
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
    updateSelectedForms(formIds) {
      this.dispatchForm.dispatch_forms = formIds;
    },
  },
};
</script>

<template>
  <el-form :model="location" ref="locationFormRef" label-width="120px" :rules="validationRules">
    <!-- Name (Required) -->
    <el-form-item label="名称" prop="name">
      <el-input v-model="location.name" placeholder="输入采样点名称" />
    </el-form-item>

    <!-- Description (Optional) -->
    <el-form-item label="描述">
      <el-input type="textarea" v-model="location.description" placeholder="输入采样点描述" />
    </el-form-item>

    <!-- Buttons -->
    <el-form-item>
      <el-button type="primary" @click="validateAndSubmit">提交</el-button>
      <el-button @click="$emit('cancel')">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  props: {
    location: {
      type: Object,
      required: true,
    },
    isEditMode: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      validationRules: {
        name: [{ required: true, message: "请输入采样点名称", trigger: "blur" }],
      },
    };
  },
  methods: {
    validateAndSubmit() {
      this.$refs.locationFormRef.validate((valid) => {
        if (valid) {
          const payload = {...this.location};
          payload.status = 1;
          if (payload.id == null) {
            payload.created_by = this.$store.getters.getUser.id;
            payload.created_at = new Date().toISOString();
          } else {
            payload.updated_by = this.$store.getters.getUser.id;
            payload.updated_at = new Date().toISOString();
          }
          this.$emit("submit", payload);
        } else {
          console.error("Form validation failed!");
        }
      });
    },
  },
};
</script>

<style scoped>
</style>

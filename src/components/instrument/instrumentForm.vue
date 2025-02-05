<template>
  <el-form :model="instrument" ref="instrumentFormRef" label-width="120px" :rules="validationRules">
    <!-- Name (Required) -->
    <el-form-item label="名称" prop="name">
      <el-input v-model="instrument.name" placeholder="输入仪器名称" />
    </el-form-item>

    <!-- Type (Optional) -->
    <el-form-item label="类型">
      <el-input v-model="instrument.type" placeholder="输入仪器类型" />
    </el-form-item>

    <!-- Manufacturer (Optional) -->
    <el-form-item label="制造商">
      <el-input v-model="instrument.manufacturer" placeholder="输入制造商" />
    </el-form-item>

    <!-- Model Number (Optional) -->
    <el-form-item label="型号">
      <el-input v-model="instrument.modelNumber" placeholder="输入仪器型号" />
    </el-form-item>

    <!-- Description (Optional) -->
    <el-form-item label="描述">
      <el-input type="textarea" v-model="instrument.description" placeholder="输入仪器描述" />
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
    instrument: {
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
        name: [{ required: true, message: "请输入仪器名称", trigger: "blur" }],
      },
    };
  },
  methods: {
    validateAndSubmit() {
      this.$refs.instrumentFormRef.validate((valid) => {
        if (valid) {
          this.$emit("submit", this.instrument);
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

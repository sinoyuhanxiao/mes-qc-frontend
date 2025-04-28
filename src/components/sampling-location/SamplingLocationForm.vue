<template>
  <el-form :model="location" ref="locationFormRef" label-width="120px" :rules="validationRules">
    <!-- Name (Required) -->
    <el-form-item :label="translate('orderManagement.name')" prop="name">
      <el-input v-model="location.name" :placeholder="translate('samplingLocationManagement.namePlaceholder')" maxlength="255"/>
    </el-form-item>

    <!-- Description (Optional) -->
    <el-form-item :label="translate('orderManagement.description')">
      <el-input type="textarea" v-model="location.description" :placeholder="translate('samplingLocationManagement.descriptionPlaceholder')" />
    </el-form-item>

    <!-- Buttons -->
    <el-form-item>
      <el-button type="primary" @click="validateAndSubmit">{{ translate('orderManagement.confirm') }}</el-button>
      <el-button @click="$emit('cancel')">{{ translate('orderManagement.cancel') }}</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
import {translate} from "@/utils/i18n";

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
        name: [{ required: true, message: translate('samplingLocationManagement.validation.nameRequired'), trigger: "blur" }],
      },
    };
  },
  methods: {
    translate,
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

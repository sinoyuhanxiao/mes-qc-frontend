<template>
  <el-form :model="instrument" ref="instrumentFormRef" label-width="120px" :rules="validationRules">
    <!-- Name (Required) -->
    <el-form-item :label="translate('orderManagement.name')" prop="name">
      <el-input
          v-model="instrument.name"
          :placeholder="translate('instrumentManagement.namePlaceholder')"
          maxlength="255"/>
    </el-form-item>

    <!-- Type (Optional) -->
    <el-form-item :label="translate('instrumentManagement.type')">
      <el-input v-model="instrument.type" :placeholder="translate('instrumentManagement.typePlaceholder')" />
    </el-form-item>

    <!-- Manufacturer (Optional) -->
    <el-form-item :label="translate('instrumentManagement.vendor')">
      <el-input v-model="instrument.manufacturer" :placeholder="translate('instrumentManagement.typePlaceholder')" />
    </el-form-item>

    <!-- Model Number (Optional) -->
    <el-form-item :label="translate('instrumentManagement.modelNumber')">
      <el-input v-model="instrument.modelNumber" :placeholder="translate('instrumentManagement.modelNumberPlaceholder')" />
    </el-form-item>

    <!-- Description (Optional) -->
    <el-form-item :label="translate('orderManagement.description')">
      <el-input type="textarea" v-model="instrument.description" :placeholder="translate('instrumentManagement.descriptionPlaceholder')" />
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
        name: [{ required: true, message: translate('instrumentManagement.validation.nameRequired'), trigger: "blur" }],
      },
    };
  },
  methods: {
    translate,
    validateAndSubmit() {
      this.$refs.instrumentFormRef.validate((valid) => {
        if (valid) {
          const payload = {...this.instrument};
          payload.status = 1;
          if (payload.id == null) {
            payload.created_by = this.$store.getters.getUser.id;
            payload.created_at = new Date().toISOString();
          } else {
            payload.updated_by = this.$store.getters.getUser.id;
            payload.updated_at = new Date().toISOString();
          }
          this.$emit("submit", payload);
          console.log(payload);
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

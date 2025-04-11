<template>
  <el-form
      :model="testSubject"
      ref="testSubjectFormRef"
      label-width="120px"
      :rules="validationRules"
  >
    <!-- Name (Required) -->
    <el-form-item
        :label="translate('orderManagement.name')"
        prop="name"
        maxlength="255"
    >
      <el-input v-model="testSubject.name" :placeholder="translate('testSubjectManagement.namePlaceholder')" />
    </el-form-item>

    <!-- Description (Optional) -->
    <el-form-item :label="translate('orderManagement.description')">
      <el-input
          type="textarea"
          v-model="testSubject.description"
          :placeholder="translate('testSubjectManagement.descriptionPlaceholder')" />
    </el-form-item>

    <!-- Buttons -->
    <el-form-item>
      <el-button
          type="primary"
          @click="validateAndSubmit"
      >
        {{ translate('orderManagement.confirm') }}
      </el-button>
      <el-button @click="$emit('cancel')">
        {{ translate('orderManagement.cancel') }}
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script>
import {translate} from "@/utils/i18n";

export default {
  props: {
    testSubject: {
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
        name: [{ required: true, message: translate('testSubjectManagement.validation.nameRequired'), trigger: "blur" }],
      },
    };
  },
  methods: {
    translate,
    validateAndSubmit() {
      this.$refs.testSubjectFormRef.validate((valid) => {
        if (valid) {
          const payload = {...this.testSubject};
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

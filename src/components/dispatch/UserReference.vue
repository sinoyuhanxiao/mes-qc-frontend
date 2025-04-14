<template>
    <el-tag type="primary" size="small" effect="light">
      <el-popover effect="light" trigger="hover" placement="top" width="auto">
        <template #default>
          <div><strong>{{ translate('userManagement.table.id') }}:</strong> {{ userDetail.id }}</div>
          <div><strong>{{ translate('userManagement.table.name') }}:</strong> {{ userDetail.name || translate('orderManagement.orderFormDialog.missing') }}</div>
          <div><strong>{{ translate('userManagement.table.username') }}:</strong> {{ userDetail.username || translate('orderManagement.orderFormDialog.missing') }}</div>
          <div><strong>{{ translate('userManagement.table.role') }}:</strong> {{ getRoleName(userDetail.role_id) }}</div>
          <div><strong>{{ translate('userManagement.table.wecomId') }}:</strong> {{ userDetail.wecom_id || translate('orderManagement.orderFormDialog.missing') }}</div>
          <div><strong>{{ translate('userManagement.table.email') }}:</strong> {{ userDetail.email || translate('orderManagement.orderFormDialog.missing') }}</div>
          <div><strong>{{ translate('userManagement.table.phoneNumber') }}:</strong> {{ userDetail.phone_number || translate('orderManagement.orderFormDialog.missing') }}</div>
        </template>
        <template #reference>
          {{ userDetail.name || translate('orderManagement.orderFormDialog.unknownUser') }}
        </template>
      </el-popover>
    </el-tag>
</template>

<script>
import { getUserById } from "@/services/userService";
import {translate} from "@/utils/i18n";

export default {
  props: {
    userId: {
      type: Number,
      required: false,
    },
  },
  data() {
    return {
      userDetail: {},
    };
  },
  methods: {
    translate,
    async fetchUserDetail() {
      if (!this.userId) return;
      try {
        const response = await getUserById(this.userId);
        this.userDetail = response?.data?.data || {};  // Ensure it always has an object

      } catch (error) {
        console.error(`Failed to fetch details for ID: ${this.userId}`, error);
        this.userDetail = {};  // Set to an empty object instead of null
      }
    },
    getRoleName(roleId) {
      const roleMap = {
        1: translate('userManagement.role.admin'),
        2: translate('userManagement.role.qcWorker'),
      };
      return roleMap[roleId] || translate('userManagement.role.unknown');
    },
  },
  watch: {
    userId: {
      immediate: true, // Run immediately when component mounts
      handler(newVal, oldVal) {
        if (newVal !== oldVal) {
          this.fetchUserDetail();
        }
      },
    },
  },
  mounted() {
    this.fetchUserDetail();
  },
};
</script>

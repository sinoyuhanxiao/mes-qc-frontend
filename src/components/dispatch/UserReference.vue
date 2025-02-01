<template>
  <el-form-item :label="`${type}`" v-if="userDetail">
    <el-tag type="primary" size="small" effect="light">
      <el-popover effect="light" trigger="hover" placement="top" width="auto">
        <template #default>
          <div><strong>用户 ID:</strong> {{ userDetail.id }}</div>
          <div><strong>姓名:</strong> {{ userDetail.name || "无" }}</div>
          <div><strong>用户名:</strong> {{ userDetail.username || "无" }}</div>
          <div><strong>角色:</strong> {{ getRoleName(userDetail.role_id) }}</div>
          <div><strong>企业微信:</strong> {{ userDetail.wecom_id || "无" }}</div>
          <div><strong>邮箱:</strong> {{ userDetail.email || "无" }}</div>
          <div><strong>电话:</strong> {{ userDetail.phone_number || "无" }}</div>
        </template>
        <template #reference>
          {{ userDetail.name || `未知${type}` }}
        </template>
      </el-popover>
    </el-tag>
  </el-form-item>
</template>

<script>
import { getUserById } from "@/services/userService";

export default {
  props: {
    type: {
      type: String,
      required: true, // "创建者" or "更新者"
    },
    userId: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      userDetail: null,
    };
  },
  methods: {
    async fetchUserDetail() {
      if (!this.userId) return;
      try {
        const response = await getUserById(this.userId);
        if (response?.data?.data) {
          this.userDetail = response.data.data;
        }
      } catch (error) {
        console.error(`Failed to fetch ${this.type} details for ID: ${this.userId}`, error);
      }
    },
    getRoleName(roleId) {
      const roleMap = {
        1: "管理员",
        2: "质检人员",
      };
      return roleMap[roleId] || "未知角色";
    },
  },
  mounted() {
    this.fetchUserDetail();
  },
};
</script>

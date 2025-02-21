<template>
  <el-form label-position="left" label-width="140px" class="order-details">

    <div class="details-header">
      <!-- Action Buttons -->
      <el-button-group>
        <el-button type="success" @click="$emit('edit')">编辑</el-button>
        <el-button type="danger" @click="$emit('delete')">删除</el-button>
      </el-button-group>
    </div>

    <el-divider>QC 订单详情</el-divider>

    <el-form-item label="订单名称">
      {{ order.name }}
    </el-form-item>

    <el-form-item label="订单 ID">
      {{ order.order_id }}
    </el-form-item>

    <el-form-item label="创建时间" v-if="order.created_at">
      {{ formatDate(order.created_at) }}
    </el-form-item>

    <el-form-item label="状态">
      <el-tag
          :type="getStateTagType(order.state).type"
          size="medium"
      >
        {{ getStateTagType(order.state).label }}
      </el-tag>
    </el-form-item>

    <el-form-item label="创建者" v-if="createdByDetail">
      <el-tag
          type="primary"
          size="small"
          effect="light"
      >
        <el-popover
            effect="light"
            trigger="hover"
            placement="top"
            width="auto">
          <template #default>
            <div>姓名: {{ createdByDetail.name || '无' }}</div>
            <div>用户名: {{ createdByDetail.username || '无' }}</div>
            <div>企业微信: {{ createdByDetail.wecom_id || '无' }}</div>
          </template>
          <template #reference>
            {{ createdByDetail.name || '未知创建者' }}
          </template>
        </el-popover>
      </el-tag>
    </el-form-item>

    <el-form-item label="更新时间" v-if="order.updated_at">
      {{ formatDate(order.updated_at) }}
    </el-form-item>

    <el-divider>派发列表</el-divider>
    <div v-if="order.dispatches.length > 0">
      <el-card
          v-for="(dispatch, index) in order.dispatches"
          :key="dispatch.id"
          class="dispatch-block"
      >
        <h4>派发 {{ index + 1 }}: {{ dispatch.name }}</h4>

        <el-form-item label="派发 ID">
          {{ dispatch.id }}
        </el-form-item>

        <el-form-item label="类型">
          {{ formatScheduleType(dispatch.type) }}
        </el-form-item>

        <el-form-item label="备注" v-if="dispatch.remark">
          {{ dispatch.remark }}
        </el-form-item>

        <el-form-item label="派发计划" v-if="dispatch.cron_expression">
          {{ humanizeCronInChinese(unnormalizeCronExpression(dispatch.cron_expression)) }}
        </el-form-item>

        <el-form-item label="开始运行时间" v-if="dispatch.start_time">
          {{ formatDate(dispatch.start_time) }}
        </el-form-item>

        <el-form-item label="停止运行时间" v-if="dispatch.end_time">
          {{ formatDate(dispatch.end_time) }}
        </el-form-item>

        <el-form-item label="运行状态">
          <el-tag
              :type="getStateTagType(dispatch.state).type"
              size="medium"
          >
            {{ getStateTagType(dispatch.state).label }}
          </el-tag>
        </el-form-item>

        <el-form-item label="已执行次数">
          {{ dispatch.executed_count }}
        </el-form-item>

        <el-form-item label="派发次数上限">
          {{ dispatch.dispatch_limit === -1 ? "无限制" : dispatch.dispatch_limit }}
        </el-form-item>

        <el-form-item label="任务时限 (分钟)">
          {{ dispatch.due_date_offset_minute }}
        </el-form-item>
      </el-card>
    </div>
    <div v-else>- 无派发 -</div>

  </el-form>
</template>

<script>
import {
  formatDate,
  formatScheduleType,
  unnormalizeCronExpression
} from "@/utils/dispatch-utils";
import { humanizeCronInChinese } from "cron-chinese";
import { getUserById } from "@/services/userService";

export default {
  props: {
    order: {
      type: Object,
      required: true,
    }
  },
  data() {
    return {
      createdByDetail: null,
    };
  },
  methods: {
    humanizeCronInChinese,
    formatDate,
    formatScheduleType,
    unnormalizeCronExpression,
    async fetchCreatedByDetail() {
      if (this.order.created_by) {
        try {
          const response = await getUserById(this.order.created_by);
          this.createdByDetail = response.data.data || null;
        } catch (error) {
          console.error("Failed to fetch creator details:", error);
        }
      }
    },
    getStateTagType(state) {
      const stateMap = {
        1: { label: "运行中", type: "success" },
        2: { label: "非活跃", type: "info" },
        3: { label: "已过期", type: "danger" },
        4: { label: "已达派发上限", type: "warning" },
        5: { label: "暂停", type: "primary" },
      };
      return stateMap[state] || { label: "未知", type: "default" };
    },
  },
  mounted() {
    this.fetchCreatedByDetail();
  }
};
</script>

<style scoped>
.order-details {
  padding: 10px;
}

.dispatch-block {
  margin-bottom: 20px;
}

.details-header {
  display: flex;
  justify-content: flex-end;
}
</style>

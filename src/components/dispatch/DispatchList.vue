<template>
  <!-- Dispatch Table -->
  <el-table
      ref="dispatchTable"
      :data="dispatchList"
      border
      style="width: 100%"
      @selection-change="onSelectionChange"
  >

    <!-- Row Selection -->
    <el-table-column type="selection" width="55">
    </el-table-column>

    <!-- Dispatch Name -->
    <el-table-column prop="name" label="派发名称" width="200" sortable>
      <template #default="scope">
        <span
            class="clickable-name"
            @click="clickedNameColumn(scope.row)"
        >
          {{ scope.row.name}}
        </span>
      </template>
    </el-table-column>

    <!-- ID -->
    <el-table-column prop="id" label="ID" width="65" sortable></el-table-column>

    <!-- Status -->
    <el-table-column prop="is_active" label="运行状态" width="120" sortable>
      <template #default="scope">
        <status-circle :status="convertBooleanToNumber(scope.row.is_active)" />
      </template>
    </el-table-column>

    <!-- Cron Expression -->
    <el-table-column prop="cron_expression" label="派发计划" width="200" sortable>
      <template #default="scope">
        {{ scope.row.cron_expression ? humanizeCronInChinese(unnormalizeCronExpression(scope.row.cron_expression)) : "-" }}
      </template>
    </el-table-column>

    <!-- Start Time -->
    <el-table-column prop="start_time" label="开始运行时间" width="180" sortable>
      <template #default="scope">
        <time-slot :value="scope.row.start_time" />
      </template>
    </el-table-column>

    <!-- End Time -->
    <el-table-column prop="end_time" label="停止运行时间" width="180" sortable>
      <template #default="scope">
        <time-slot :value="scope.row.end_time" />
      </template>
    </el-table-column>

    <!-- Personnel -->
    <el-table-column prop="dispatch_users" label="人員" width="200">
      <template #default="scope">
        <div class="user-tags">
          <el-tag
              v-for="(user, index) in scope.row.dispatch_users.slice(0, 3)"
              :key="user.id"
              type="primary"
              size="small"
              effect="light"
          >
            <el-popover
                effect="light"
                trigger="hover"
                placement="top"
                width="auto"
            >
              <template #default>
                <div>姓名: {{ user.name }}</div>
                <div>用户名: {{ user.username }}</div>
                <div>邮箱: {{ user.email }}</div>
                <div>电话: {{ user.phone_number }}</div>
                <div>企业微信: {{ user.wecom_id }}</div>
              </template>
              <template #reference>
                {{ user.name }}
              </template>
            </el-popover>
          </el-tag>
          <el-tag
              v-if="scope.row.dispatch_users.length > 3"
              type="warning"
              size="small"
          >
            +{{ scope.row.dispatch_users.length - 3 }}
          </el-tag>
        </div>
      </template>
    </el-table-column>

    <!-- Form -->
    <el-table-column prop="dispatch_forms" label="表單" width="150">
      <template #default="scope">
        <div v-if="scope.row.dispatch_forms && scope.row.dispatch_forms.length > 0" class="form-tags">
          <el-tag
              v-for="(formId, index) in scope.row.dispatch_forms.slice(0, 3)"
              :key="formId"
              type="success"
              size="small"
              effect="light"
          >
            <el-popover
                effect="light"
                trigger="hover"
                placement="top"
                width="auto"
            >
              <template #default>
                <div>ID: {{ formId }}</div>
                <div>表單名: {{ getFormById(formId) }}</div>
              </template>
              <template #reference>
                {{ getFormById(formId) }}
              </template>
            </el-popover>
          </el-tag>
          <el-tag
              v-if="scope.row.dispatch_forms.length > 3"
              type="warning"
              size="small"
          >
            +{{ scope.row.dispatch_forms.length - 3 }}
          </el-tag>
        </div>
        <div v-else>-</div> <!-- Display dash when none are available -->
      </template>
    </el-table-column>

    <!-- Executed Count -->
    <el-table-column prop="executed_count" label="已执行次数" width="120" sortable>
      <template #default="scope">
        {{ scope.row.executed_count || "0" }}
      </template>
    </el-table-column>

    <!-- Dispatch Limit -->
    <el-table-column prop="dispatch_limit" label="派发次数上限" width="140" sortable>
      <template #default="scope">
        {{ scope.row.dispatch_limit === -1 ? "无限制" : scope.row.dispatch_limit }}
      </template>
    </el-table-column>

    <!-- Due Date Offset (Minutes) -->
    <el-table-column prop="due_date_offset_minute" label="任务时限(分钟)" width="150" sortable>
      <template #default="scope">
        {{ scope.row.due_date_offset_minute || "-" }}
      </template>
    </el-table-column>

    <!-- Created At -->
    <el-table-column prop="created_at" label="创建时间" width="180" sortable>
      <template #default="scope">
        <time-slot :value="scope.row.created_at" />
      </template>
    </el-table-column>

    <!-- Updated At -->
    <el-table-column prop="updated_at" label="更新时间" width="180" sortable>
      <template #default="scope">
        <time-slot :value="scope.row.updated_at" />
      </template>
    </el-table-column>

    <!-- Type -->
    <el-table-column prop="type" label="类型" width="100" sortable>
      <template #default="scope">
        {{ formatScheduleType(scope.row.type) || "-"}}
      </template>
    </el-table-column>
  </el-table>
</template>


<script>
import {formatScheduleType, parseCronExpressionToChinese, unnormalizeCronExpression} from "@/utils/dispatch-utils";
import StatusCircle from "@/components/dispatch/StatusCircle.vue";
import TimeSlot from "@/components/dispatch/TimeSlot.vue";
import { Search } from "@element-plus/icons-vue";
import {humanizeCronInChinese} from "cron-chinese";


export default {
  computed: {
    Search() {
      return Search
    },
  },
  components: {
    StatusCircle,
    TimeSlot,
  },
  props: {
    dispatchList: {
      type: Array,
      required: true,
    },
    formMap: {
      type: Object,
      required: true, // Pass dynamically generated formMap
    },
  },
  data() {
    return {
      filterInput: "", // Bind to the search input
      selectedRows: [], // Tracks selected rows
    }
  },
  methods: {
    unnormalizeCronExpression,
    humanizeCronInChinese,
    parseCronExpressionToChinese,
    formatScheduleType,
    clickedNameColumn (row){
      console.log('emit clickedNameColumn', row)
      this.$emit("column-click", row);
    },
    onSelectionChange(selected) {
      console.log("Selection changed:", selected);
      this.$emit("selection-change", selected); // Emit selected rows to parent
    },
    getFormById(id) {
      return this.formMap[id] || "未知表单"; // Fallback for undefined IDs
    },
    convertBooleanToNumber(isActive) {
      if (isActive) {
        return 1;
      } else {
        return 0;
      }
    }
  },
};
</script>

<style scoped>
.clickable-name {
  color: #409eff; /* Primary blue */
  cursor: pointer;
  text-decoration: underline;
}

.clickable-name:hover {
  text-decoration: none;
}

.el-table .el-button {
  margin-left: 5px; /* Optional for spacing */
}

.user-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.form-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>

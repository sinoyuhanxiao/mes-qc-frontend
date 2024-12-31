<template>

  <!-- Search Input -->
  <el-input
      v-model="filterInput"
      style="width: 240px; margin-bottom: 10px;"
      placeholder="输入名称搜索"
      :prefix-icon="Search"
      clearable
  />

  <!-- Dispatch Table -->
  <el-table
      ref="dispatchTable"
      :data="filteredDispatchList"
      border
      style="width: 100%"
      :default-sort="{ prop: 'updated_at', order: 'descending' }"
      @selection-change="onSelectionChange"
  >

    <!-- Row Selection -->
    <el-table-column type="selection" width="55">
    </el-table-column>

    <!-- Dispatch Name -->
    <el-table-column prop="name" label="任务派发名称" width="200" sortable>
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

    <!-- Schedule Type -->
    <el-table-column prop="schedule_type" label="类型" width="100" sortable>
      <template #default="scope">
        {{ formatScheduleType(scope.row.schedule_type) || "-"}}
      </template>
    </el-table-column>

    <!-- Personnel -->
    <el-table-column prop="dispatch_personnel" label="人員" width="150" >
      <template #default="scope">
        <div class="personnel-tags">
          <el-tag
              v-for="(person, index) in scope.row.dispatch_personnel.slice(0, 3)"
              :key="person.id"
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
                <div>姓名: {{ person.name }}</div>
                <div>用户名: {{ person.username }}</div>
                <div>企业微信: {{ person.wecom_id }}</div>
              </template>
              <template #reference>
                {{ person.name }}
              </template>
            </el-popover>
          </el-tag>
          <el-tag
              v-if="scope.row.dispatch_personnel.length > 3"
              type="warning"
              size="small"
          >
            +{{ scope.row.dispatch_personnel.length - 3 }}
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

    <!-- Specified Day -->
    <el-table-column prop="dispatch_days" label="指定日期" width="180" sortable>
      <template #default="scope">
        <div v-if="scope.row.dispatch_days && scope.row.dispatch_days.length > 0" class="days-tags">
          <el-tag
              v-for="(day, index) in scope.row.dispatch_days.slice(0, 3)"
              :key="day"
              type="info"
              size="small"
              effect="light"
          >
            {{ formatDay(day) }}
          </el-tag>

          <el-popover
              effect="light"
              trigger="hover"
              placement="top"
              width="auto"
          >
            <template #default>
              <div>
                <!-- Format and display leftover days -->
                <div v-for="day in scope.row.dispatch_days.slice(3)" :key="day">
                  {{ formatDay(day) }}
                </div>
              </div>
            </template>
            <template #reference>
                <el-tag
                    v-if="scope.row.dispatch_days.length > 3"
                    type="warning"
                    size="small"
                >
                  +{{ scope.row.dispatch_days.length - 3 }}
                </el-tag>
            </template>
          </el-popover>


        </div>
        <div v-else>-</div> <!-- Display dash when none are available -->
      </template>
    </el-table-column>


    <!-- Time of Day -->
    <el-table-column prop="time_of_day" label="指定时间" width="110" sortable>
      <template #default="scope">
        {{ scope.row.time_of_day || "-" }}
      </template>
    </el-table-column>

    <!-- Start Time -->
    <el-table-column prop="start_time" label="激活时间" width="150" sortable>
      <template #default="scope">
        <time-slot :value="scope.row.start_time" />
      </template>
    </el-table-column>

    <!-- Interval Minutes -->
    <el-table-column prop="interval_minutes" label="时间间隔（分钟）" width="165" sortable>
      <template #default="scope">
        {{ scope.row.interval_minutes || "-" }}
      </template>
    </el-table-column>

    <!-- Repeat Count -->
    <el-table-column prop="repeat_count" label="重复次数" width="110" sortable>
      <template #default="scope">
        {{ scope.row.repeat_count || "-" }}
      </template>
    </el-table-column>

    <!-- Executed Count -->
    <el-table-column prop="executed_count" label="已执行次数" width="120" sortable>
      <template #default="scope">
        {{ scope.row.executed_count || "-" }}
      </template>
    </el-table-column>

    <!-- Active Status -->
    <el-table-column prop="active" label="状态" width="60">
      <template #default="scope">
        <status-circle :active="scope.row.active" />
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
  </el-table>
</template>


<script>
import { formatScheduleType } from "@/utils/dispatch-utils";
import StatusCircle from "@/components/dispatch/StatusCircle.vue";
import TimeSlot from "@/components/dispatch/TimeSlot.vue";
import {DeleteFilled, Search} from "@element-plus/icons-vue";


export default {
  computed: {
    Search() {
      return Search
    },
    filteredDispatchList() {
      if (!this.filterInput) {
        return this.dispatchList; // Return full list if no filter is applied
      }
      const lowerCaseFilter = this.filterInput.toLowerCase();
      return this.dispatchList.filter(dispatch =>
          dispatch.name?.toLowerCase().includes(lowerCaseFilter)
      );
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
    formatScheduleType,
    clickedNameColumn (row){
      console.log('emit clickedNameColumn', row)
      this.$emit("column-click", row);
    },
    onSelectionChange(selected) {
      console.log("Selection changed:", selected);
      this.$emit("selection-change", selected); // Emit selected rows to parent
    },
    formatDay(day) {
      const dayMap = {
        MONDAY: "星期一",
        TUESDAY: "星期二",
        WEDNESDAY: "星期三",
        THURSDAY: "星期四",
        FRIDAY: "星期五",
        SATURDAY: "星期六",
        SUNDAY: "星期日",
      };
      return dayMap[day] || day; // Fallback to the raw value if not found
    },
    getFormById(id) {
      return this.formMap[id] || "未知表单"; // Fallback for undefined IDs
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

.personnel-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.form-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.days-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>

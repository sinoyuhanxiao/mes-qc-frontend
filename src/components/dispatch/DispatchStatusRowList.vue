<template>
  <!-- Dispatch Status Table -->
  <el-table
      ref="dispatchStatusRowList"
      :data="dispatchStatuses"
      border
      style="width: 100%"
      >
    <el-table-column
        type="expand">
      <template #default="scope">
        <div>
          <el-table
              :data="scope.row.tasks">
            <el-table-column label="Type" prop="taskType"/>
            <el-table-column label="Next Execution Time" prop="nextExecutionTime">
              <template #default="taskScope">
                {{formatDate(taskScope.row.nextExecutionTime)}}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>
    </el-table-column>
    <el-table-column label="Dispatch ID" prop="dispatchId">
    </el-table-column>

  </el-table>

</template>

<script>

import TimeSlot from "@/components/dispatch/TimeSlot.vue";

export default {
  name: "DispatchStatusRowList",
  components: {TimeSlot},
  props: {
    dispatchStatuses: {
      type: Array,
      required: true
    }
  },
  methods: {
    formatDate(date) {
      if (!date) return "无效日期"; // Handle missing dates

      try {
        // Trim excessive decimal places (retain at most 3)
        const cleanedDate = date.replace(/\.\d{3,}Z$/, "Z");

        // Parse date safely
        const parsedDate = new Date(cleanedDate);
        if (isNaN(parsedDate.getTime())) return "无效日期";

        return parsedDate.toLocaleString("zh-CN");
      } catch (error) {
        return "无效日期"; // Catch unexpected errors
      }
    }
  }
}
</script>

<style></style>
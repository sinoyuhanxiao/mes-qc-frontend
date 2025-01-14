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
            <el-table-column label="Next Execution Time" prop="nextExecutionTime"/>
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
  }
}
</script>

<style></style>
<template>
  <div class="dispatch-configurator">
    <el-tabs v-model="activeTab">
      <!-- Schedule-Based Dispatch -->
      <el-tab-pane label="基于计划" name="schedule">
        <schedule-based-dispatch
          :form-data="currentDispatch"/>
      </el-tab-pane>

      <!-- Manual Dispatch -->
      <el-tab-pane label="手动派发" name="manual">
        <manual-dispatch @on-submit="handleManualDispatch" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>


<script>
import ManualDispatch from "@/components/dispatch/ManualBasedDispatch.vue";
import ScheduleBasedDispatch from "@/components/dispatch/ScheduleBasedDispatch.vue";


export default {
  components: {
    ScheduleBasedDispatch,
    ManualDispatch,
  },
  data() {
    return {
      currentDispatch:null,
      activeTab: "schedule", // Default tab
    };
  },
  methods: {
    handleScheduleDispatch(data) {
      console.log("Schedule-Based Dispatch Data:", data);
      // Submit or process schedule-based dispatch data
    },
    handleTriggerDispatch(data) {
      console.log("Trigger-Based Dispatch Data:", data);
      // Submit or process trigger-based dispatch data
    },
    handleManualDispatch(data) {
      console.log("Manual Dispatch Data:", data);
      // Submit or process manual dispatch data
    },
  },
};
</script>

<template>
  <div class="dispatch-configurator">
    <el-tabs v-model="activeTab">
      <!-- Schedule-Based Dispatch -->
      <el-tab-pane label="基于计划" name="schedule">
        <schedule-based-dispatch
          :current-dispatch="currentDispatch"
          @on-submit="handleSubmit"
          @on-cancel="handleCancel"
        />
      </el-tab-pane>

      <!-- Manual Dispatch -->
      <el-tab-pane label="手动派发" name="manual">
        <manual-based-dispatch
            :current-dispatch="currentDispatch"
            @on-submit="handleManualSubmit"
            @on-cancel="handleCancel"
          />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>


<script>
import ManualBasedDispatch from "@/components/dispatch/ManualBasedDispatch.vue";
import ScheduleBasedDispatch from "@/components/dispatch/ScheduleBasedDispatch.vue";


export default {
  components: {
    ScheduleBasedDispatch,
    ManualBasedDispatch,
  },
  props: {
    currentDispatch: {
      type: Object,
      required: true, // Expect this prop to always be provided
    },
  },
  data() {
    return {
      activeTab: "schedule", // Default tab
    };
  },
  methods: {
    handleSubmit(data) {
      this.$emit("on-submit", data);
      console.log('payload in DispatchConfigurator component')
      console.log(data)
    },
    handleManualSubmit(data) {
      this.$emit("on-manual-submit", data);
      console.log(data)
    },
    handleCancel() {
      this.$emit("on-cancel");
    },
  },
};
</script>

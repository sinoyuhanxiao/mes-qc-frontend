<template>
  <div class="dispatch-configurator">
    <el-tabs
        v-model="activeTab"
        @tab-click="handleTabClick">
      <!-- Schedule-Based Dispatch -->
      <el-tab-pane
          label="计划派发"
          name="schedule"
          v-if="!currentDispatch || currentDispatch.type === 'SCHEDULED'">
        <schedule-based-dispatch
          :current-dispatch="currentDispatch"
          @on-submit="handleSubmit"
          @on-cancel="handleCancel"/>
      </el-tab-pane>

      <!-- Manual Dispatch -->
      <el-tab-pane
          label="快速派发"
          name="manual"
          v-if="!currentDispatch || currentDispatch.type === 'MANUAL'">
        <manual-based-dispatch
            :current-dispatch="currentDispatch"
            @on-submit="handleManualSubmit"
            @on-cancel="handleCancel"/>
      </el-tab-pane>

      <!-- Schedule-Based Dispatch 2.0 -->

      <el-tab-pane
          label="质检任务单"
          name="schedule2"
          v-if="!currentDispatch || currentDispatch.type === 'SCHEDULED'">
        <schedule-based-dispatch2
            :current-dispatch="currentDispatch"
            @on-submit="handleSubmit"
            @on-cancel="handleCancel"/>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>


<script>
import ManualBasedDispatch from "@/components/dispatch/ManualBasedDispatch.vue";
import ScheduleBasedDispatch from "@/components/dispatch/ScheduleBasedDispatch.vue";
import ScheduleBasedDispatch2 from "@/components/dispatch/ScheduleBasedDispatch2.vue";

export default {
  components: {
    ScheduleBasedDispatch,
    ScheduleBasedDispatch2,
    ManualBasedDispatch,
  },
  props: {
    currentDispatch: {
      type: Object,
      required: false, // Expect this prop to always be provided
    },
  },
  data() {
    return {
      activeTab: "manual", // Default tab
    };
  },
  watch: {
    currentDispatch: {
      immediate: true,
      handler() {
        this.activeTab = this.determineDefaultTab();
      },
    },
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
    handleTabClick(tab) {
      this.activeTab = tab.name; // Update activeTab when the user clicks a tab
    },
    determineDefaultTab() {
      if (!this.currentDispatch) return "schedule"; // Default to manual for new dispatches
      return this.currentDispatch.type === "SCHEDULED" ? "schedule" : "manual";
    },
  },
};
</script>

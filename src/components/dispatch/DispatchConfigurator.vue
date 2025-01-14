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
        <manual-dispatch
            :current-dispatch="currentDispatch"
            @on-submit="handleSubmit"
            @on-cancel="handleCancel"
        />
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
      console.log('payload in DispatchConfigurator component' + data)
    },
    handleCancel() {
      this.$emit("on-cancel");
    },
  },
};
</script>

<template>
  <div class="dispatch-configurator">
    <el-tabs
        v-model="activeTab"
        @tab-click="handleTabClick">
      <!-- QC Order Form -->
      <el-tab-pane
          label="定时质检工单"
          name="QcOrderForm">
        <qc-order-form
            :current-order="currentOrder"
            @on-submit="handleSubmit"
            @on-cancel="handleCancel"/>
      </el-tab-pane>

      <!-- Quick Dispatch -->
      <el-tab-pane
          label="一次性质检工单"
          name="QuickDispatch"
          v-if="!currentOrder">
        <manual-based-dispatch
            :current-dispatch="currentOrder"
            @on-submit="handleManualSubmit"
            @on-cancel="handleCancel"/>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>


<script>
import ManualBasedDispatch from "@/components/dispatch/ManualBasedDispatch.vue";
import QcOrderForm from "@/components/dispatch/QcOrderForm.vue";

export default {
  components: {
    QcOrderForm,
    ManualBasedDispatch,
  },
  props: {
    currentOrder: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      activeTab: "QcOrderForm", // Default tab
    };
  },
  methods: {
    handleSubmit(data) {
      this.$emit("on-submit", data);
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
  },
};
</script>

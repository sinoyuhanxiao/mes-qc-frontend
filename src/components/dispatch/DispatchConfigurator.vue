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
            :current-order="normalizedOrderData"
            :form-map="formMap"
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
    isEditMode: {
      type: Boolean,
      default: false,
    },
    formMap: {
      type: Array,
      required:true,
    }
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
  computed: {
    normalizedOrderData() {
      if (!this.isEditMode || !this.currentOrder) {
        // If creating a new QC order, return a blank form structure
        return {
          name: "",
          description: "",
          dispatches: [],
          applyUserToAll: false,
          globalUserIds: [], // global user selection
          applyFormToAll: false,
          globalFormIds: [],
        };
      }

      // Transform API response into the expected request format
      return {
        name: this.currentOrder.name,
        description: this.currentOrder.description,
        dispatches: this.currentOrder.dispatches.map(dispatch => ({
          id: dispatch.id,
          type: dispatch.type === "regular" ? "regular" : "custom",
          name: dispatch.name,
          description: dispatch.description,
          startTime: dispatch.start_time || null,
          endTime: dispatch.end_time || null,
          cronExpression: dispatch.cron_expression || null,
          dispatchLimit: dispatch.dispatch_limit,
          customTime: dispatch.custom_time || null,
          dueDateOffsetMinute: dispatch.due_date_offset_minute || null,
          dateRange:[dispatch.start_time, dispatch.end_time],
          // Convert user objects to just their IDs
          userIds: dispatch.dispatch_users ? dispatch.dispatch_users.map(user => user.id) : [],

          // Keep form IDs directly
          formIds: dispatch.dispatch_forms || [],

          // Convert arrays to match request format
          productIds: dispatch.product_ids || [],
          rawMaterialIds: dispatch.raw_material_ids || [],
          productionWorkOrderIds: dispatch.production_work_order_ids || [],
          equipmentIds: dispatch.equipment_ids || [],
          maintenanceWorkOrderIds: dispatch.maintenance_work_order_ids || [],
          samplingLocationIds: dispatch.sampling_location_ids || [],
          instrumentIds: dispatch.instrument_ids || [],
          testSubjectIds: dispatch.test_subject_ids || [],
        })),
      };
    }
  }
};
</script>

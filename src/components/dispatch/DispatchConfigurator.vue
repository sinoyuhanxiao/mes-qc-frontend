<template>
  <div>
    <el-tabs
        v-model="activeTab"
        @tab-click="handleTabClick">
      <!-- QC Order Form -->
      <el-tab-pane
          label="定时质检工单"
          name="QcOrderForm">
        <qc-order-form
            :key="resetKey"
            :current-order="qcOrderForm"
            :form-map="formMap"
            @on-submit="handleSubmit"
            @on-cancel="handleCancel"
            @reset-form="handleReset"/>
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
      required: false,
    },
    isEditMode: {
      type: Boolean,
      default: false,
    },
    formMap: {
      type: Object,
      required:true,
    }
  },
  data() {
    return {
      activeTab: "QcOrderForm", // Default tab
      resetKey: 0, // Force re-render of QcOrderForm
      qcOrderForm: {},
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
    handleReset() {
      console.log("Handling reset in DispatchConfigurator");
      this.qcOrderForm = this.getNormalizedOrderData(this.currentOrder);
      this.resetKey++; // Force re-render of QcOrderForm
    },
    getNormalizedOrderData(order) {
      if (!this.isEditMode || !order) {
        // If creating a new QC order, return a blank form structure
        return {
          id: null,
          name: "",
          description: "",
          state: 1,
          created_at: null,
          created_by: null,
          updated_at: null,
          updated_by: null,
          status: 1,
          applyUserToAll: false,
          globalUserIds: [], // global user selection
          applyFormToAll: false,
          globalFormIds: [], // global form selection
          dispatches: [],
        };
      }

      // Transform API response into the expected request format
      return {
        id: order.id || null,
        name: order.name || null,
        description: order.description || null,
        state: order.state || null,
        status: order.status || null,
        created_at: order.created_at || null,
        created_by: order.created_by || null,
        updated_at: order.updated_at || null,
        updated_by: order.updated_by || null,
        dispatches: order.dispatches.map(dispatch => ({
          id: dispatch.id || null,
          type: dispatch.type === "regular" ? "regular" : "custom",
          name: dispatch.name || null,
          description: dispatch.description || null,
          start_time: dispatch.start_time || null,
          end_time: dispatch.end_time || null,
          cron_expression: dispatch.cron_expression || null,
          dispatch_limit: dispatch.dispatch_limit || null,
          custom_time: dispatch.custom_time || null,
          due_date_offset_minute: dispatch.due_date_offset_minute || null,
          date_range: [dispatch.start_time, dispatch.end_time] || [],
          user_ids: dispatch.user_ids || [],
          form_ids: dispatch.form_ids || [],
          product_ids: dispatch.product_ids || [],
          raw_material_ids: dispatch.raw_material_ids || [],
          production_work_order_ids: dispatch.production_work_order_ids || [],
          equipment_ids: dispatch.equipment_ids || [],
          maintenance_work_order_ids: dispatch.maintenance_work_order_ids || [],
          sampling_location_ids: dispatch.sampling_location_ids || [],
          instrument_ids: dispatch.instrument_ids || [],
          test_subject_ids: dispatch.test_subject_ids || [],
          executed_count: dispatch.executed_count,
          state: dispatch.state || 1,
          status: dispatch.status || 1,
          created_at: dispatch.created_at || null,
          created_by: dispatch.created_by || null,
          updated_at: dispatch.updated_at || null,
          updated_by: dispatch.updated_by || null,
        })),
      };
    }

  },
  watch: {
    // Watch for changes in currentOrder and update qcOrderForm
    currentOrder: {
      immediate: true,
      handler(newOrder) {
        this.qcOrderForm = this.getNormalizedOrderData(newOrder);
      },
    }
  },
};
</script>

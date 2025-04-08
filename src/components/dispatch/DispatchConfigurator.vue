<template>
  <div>
    <el-tabs
        v-model="activeTab"
        @tab-click="handleTabClick">
      <!-- QC Order Form -->
      <el-tab-pane
          label="定时质检工单"
          name="QcOrderForm"
      >
        <qc-order-form
            :current-order="qcOrderForm"
            :form-map="formMap"
            :user-map="userMap"
            :shift-map="shiftMap"
            @on-submit="handleSubmit"
            @on-cancel="handleCancel"
            @reset-form="handleReset"/>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>


<script>
import QcOrderForm from "@/components/dispatch/QcOrderFormV2.vue";
import {unnormalizeCronExpression} from "@/utils/dispatch-utils";

export default {
  components: {
    QcOrderForm,
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
    },
    userMap: {
      type: Object,
      required: true,
    },
    shiftMap: {
      type: Object,
      required: true,
    }
  },
  data() {
    return {
      activeTab: "QcOrderForm", // Default tab
      qcOrderForm: {},
    };
  },
  methods: {
    handleSubmit(data) {
      this.$emit("on-submit", data);
    },
    handleCancel() {
      this.$emit("on-cancel");
    },
    handleTabClick(tab) {
      this.activeTab = tab.name; // Update activeTab when the user clicks a tab
    },
    handleReset() {
      this.qcOrderForm = this.getNormalizedOrderData(this.currentOrder);
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
          cron_expression: unnormalizeCronExpression(dispatch.cron_expression) || null,
          isUnlimited: dispatch.dispatch_limit === -1,
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
          dropdownUserIds: dispatch.user_ids || [],
          shiftTreeUserIds: [],
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

<template>
  <el-container style="display: flex; height: 100%; overflow-y: hidden;">
    <!-- Left Section - QcOrderForm -->
    <el-main style="flex: 7; padding: 20px; overflow-y: auto; max-height: 75vh">
      <el-form
          :model="qcOrderForm"
          :rules="validationRules"
          ref="formRef"
          label-position="left"
          label-width="200px"
      >
        <!-- QC Order Name -->
        <el-form-item label="工单名称" required prop="name">
          <el-input v-model="qcOrderForm.name" placeholder="请输入质检工单名称" />
        </el-form-item>

        <!-- Description -->
        <el-form-item label="工单备注">
          <el-input type="textarea" v-model="qcOrderForm.description" placeholder="请输入备注"></el-input>
        </el-form-item>

        <!-- Dispatch List -->
        <el-divider>派发计划列表</el-divider>
        <div
            v-for="(dispatch, index) in qcOrderForm.dispatches"
            :key="dispatch.id"
            style="margin-bottom: 20px;"
        >
          <el-card shadow="always">
            <!-- Custom Header Slot -->
            <template #header>
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 16px; font-weight: bold;">
                <span>派发计划 {{ index + 1 }}</span>
                <div style="display: flex; gap: 8px;">
                  <!-- Expand Button -->
                  <el-button
                      type="text"
                      @click="toggleCollapse(index)"
                      :icon="dispatch.collapsed ? 'el-icon-arrow-down' : 'el-icon-arrow-up'">
                    {{ dispatch.collapsed ? '展开' : '收起' }}
                  </el-button>
                  <!-- Remove Dispatch Button -->
                  <el-button
                      type="danger"
                      plain
                      @click="removeDispatch(index)">
                    删除派发计划
                  </el-button>
                </div>
              </div>
            </template>

            <!-- Dispatch Form-->
            <div v-show="!dispatch.collapsed">
              <!-- Name -->
              <el-form-item
                  label="名称">
                <el-input
                    type="text"
                    v-model="dispatch.name"
                    placeholder="请输入任务名称"
                    :prop="'dispatches.' + index + '.name'"
                />
              </el-form-item>

              <!-- Description -->
              <el-form-item
                  label="备注"
                  prop="description">
                <el-input
                    type="textarea"
                    v-model="dispatch.description"
                    placeholder="请输入备注"
                    :prop="'dispatches.' + index + '.description'"
                />
              </el-form-item>

              <el-divider>时间调度</el-divider>

              <!-- Schedule Type -->
              <el-form-item
                  label="类型"
                  required
                  :prop="'dispatches.' + index + '.type'"
              >
                <el-radio-group v-model="dispatch.type">
                  <el-radio label="regular">周期计划</el-radio>
                  <el-radio label="custom">单次计划</el-radio>
                </el-radio-group>
              </el-form-item>

              <!-- Cron Expression -->
              <el-form-item
                  v-if="dispatch.type === 'regular'"
                  label="执行计划"
                  required
                  :prop="'dispatches.' + index + '.cron_expression'"
              >
                <cron-element-plus
                    v-model="dispatch.cron_expression"
                    :button-props="{ type: 'primary' }"
                    locale="zh-cn"
                />
              </el-form-item>

              <!-- Start/End Time for CRON -->
              <el-form-item
                  v-if="dispatch.type === 'regular'"
                  label="执行周期"
                  required
                  :prop="'dispatches.' + index + '.date_range'"
              >
                <el-date-picker
                    v-model="dispatch.date_range"
                    type="datetimerange"
                    range-separator="To"
                    start-placeholder="开始时间"
                    end-placeholder="停止时间"
                    :format="dateFormat"
                    :value-format="valueFormat"
                    :disabled-date="disablePastDates"
                />
              </el-form-item>

              <!-- Single Execution Date -->
              <el-form-item
                  v-else
                  label="执行时间"
                  required
                  :prop="'dispatches.' + index + '.custom_time'"
              >
                <el-date-picker
                    v-model="dispatch.custom_time"
                    type="datetime"
                    placeholder="选择执行时间"
                    :format="dateFormat"
                    :value-format="valueFormat"
                    :disabled-date="disablePastDates"
                />
              </el-form-item>

              <!-- Dispatch Limit -->
              <el-form-item
                  v-if="dispatch.type === 'regular'"
                  label="派发次数上限"
                  required
                  :prop="'dispatches.' + index + '.dispatch_limit'">
                <el-radio-group
                    v-model="dispatch.isUnlimited"
                    @change="updateDispatchLimit(index)">
                  <el-radio :label="true">无限制</el-radio>
                  <el-radio :label="false">限制</el-radio>
                </el-radio-group>
                <el-input-number
                    v-if="!dispatch.isUnlimited"
                    v-model="dispatch.dispatch_limit"
                    :min="1"
                    style="margin-left: 10px;"
                    placeholder="请输入限制次数" />
              </el-form-item>

              <el-divider>质检任务配置</el-divider>
              <!-- Due Date Offset -->
              <el-form-item
                  label="派发任务时限(分钟)"
                  required
                  :prop="'dispatches.' + index + '.due_date_offset_minute'">
                <el-input-number
                    v-model="dispatch.due_date_offset_minute"
                    :min="0" />
              </el-form-item>

              <!-- Test Subject Selection -->
              <el-form-item
                  label="检测项目"
                  :prop="'dispatches.' + index + '.test_subject_ids'"
              >
                <el-select
                    v-model="dispatch.test_subject_ids"
                    placeholder="请选择检测项目"
                    multiple
                    filterable
                >
                  <el-option
                      v-for="subject in testSubjectOptions"
                      :key="subject.id"
                      :label="subject.name"
                      :value="subject.id"
                  />
                </el-select>
              </el-form-item>

              <!-- Sampling Location Selection -->
              <el-form-item
                  label="采样位置"
                  :prop="'dispatches.' + index + '.sampling_location_ids'"
              >
                <el-select
                    v-model="dispatch.sampling_location_ids"
                    placeholder="请选择采样位置"
                    multiple
                    filterable
                >
                  <el-option
                      v-for="location in samplingLocationOptions"
                      :key="location.id"
                      :label="location.name"
                      :value="location.id"
                  />
                </el-select>
              </el-form-item>

              <!-- Instrument Selection -->
              <el-form-item
                  label="仪器"
                  :prop="'dispatches.' + index + '.instrument_ids'">
                <el-select
                    v-model="dispatch.instrument_ids"
                    placeholder="请选择仪器"
                    multiple
                    filterable
                >
                  <el-option
                      v-for="instrument in instrumentOptions"
                      :key="instrument.id"
                      :label="instrument.name"
                      :value="instrument.id"
                  />
                </el-select>
              </el-form-item>

              <!-- User Selection -->
              <el-form-item
                  label="检测人员"
                  :prop="'dispatches.' + index + '.user_ids'"
                  required>
                <el-select
                    v-model="dispatch.dropdownUserIds"
                    multiple
                    filterable
                    placeholder="请选择人员"
                    @change="handleDropdownUserChange($event, index)"
                >
                  <el-option
                      v-for="user in userOptions"
                      :key="user.id"
                      :label="user.name"
                      :value="user.id"
                  />
                </el-select>
              </el-form-item>

              <!-- Shift User Tree Selection -->
              <el-form-item
                  :prop="'dispatches.' + index + '.user_ids'"
              >
                  <UserShiftTree
                      @update-selected-users="(users) => handleUserShiftTreeSelection(users, index)"
                  />
              </el-form-item>

              <!-- Form Tree -->
              <el-form-item
                  label="质检表单"
                  :prop="'dispatches.' + index + '.form_ids'"
                  required
              >
                <DispatchFormTreeSelect
                    :selected-form-ids="dispatch.form_ids"
                    :has-error="isSubmitted && dispatch.form_ids.length === 0"
                    @update-selected-forms="(forms) => handleSelectedForms(forms, index)"
                    @on-node-clicked="handleFormNodeClicked"
                />
              </el-form-item>

              <el-divider>生产模块关联</el-divider>

              <!-- Product Selection -->
              <el-form-item label="产品">
                <el-select v-model="dispatch.product_ids"
                           multiple
                           filterable
                           placeholder="请选择产品">
                  <el-option v-for="product in productOptions"
                             :key="product.id"
                             :label="product.name"
                             :value="product.id" />
                </el-select>
              </el-form-item>

              <!-- Production Work Order Selection -->
              <el-form-item label="生产工单">
                <el-select v-model="dispatch.production_work_order_ids"
                           multiple
                           filterable
                           placeholder="请选择生产工单">
                  <el-option v-for="workOrder in productionWorkOrderOptions"
                             :key="workOrder.id"
                             :label="workOrder.name"
                             :value="workOrder.id" />
                </el-select>
              </el-form-item>

              <!-- Raw Material Selection -->
              <el-form-item label="原料">
                <el-select v-model="dispatch.raw_material_ids"
                           multiple
                           filterable
                           placeholder="请选择原料">
                  <el-option v-for="material in rawMaterialOptions"
                             :key="material.id"
                             :label="material.name"
                             :value="material.id" />
                </el-select>
              </el-form-item>

              <el-divider>维护模块关联</el-divider>
              <!-- Maintenance Work Order Selection -->
              <el-form-item label="维护工单">
                <el-select v-model="dispatch.maintenance_work_order_ids"
                           multiple
                           filterable
                           placeholder="请选择维护工单">
                  <el-option v-for="workOrder in maintenanceWorkOrderOptions"
                             :key="workOrder.id"
                             :label="workOrder.name"
                             :value="workOrder.id" />
                </el-select>
              </el-form-item>

              <!-- Equipment Selection -->
              <el-form-item label="设备">
                <el-select v-model="dispatch.equipment_ids"
                           multiple
                           filterable
                           placeholder="请选择设备">
                  <el-option v-for="equipment in equipmentOptions"
                             :key="equipment.id"
                             :label="equipment.name"
                             :value="equipment.id" />
                </el-select>
              </el-form-item>
            </div>
          </el-card>
        </div>

        <!-- Add Dispatch -->
        <el-button type="primary" plain @click="addDispatch">新增派发计划</el-button>

        <!-- Submit -->
        <el-form-item>
          <el-button type="primary" :disabled="!isFormModified" @click="submitForm">提交</el-button>
          <el-button @click="resetForm" type="warning">重置</el-button>
          <el-button @click="$emit('on-cancel')">取消</el-button>
        </el-form-item>

  </el-form>
    </el-main>
    <!-- Right Section - Preview -->
    <el-aside style="flex: 3; padding: 20px; max-height: 75vh; background: #f9f9f9; overflow-y: auto;">
      <qc-order-preview
        :qc-order-form = "qcOrderForm"
        :form-map="formMap"
        :user-map="userOptions"
    />
    </el-aside>
  </el-container>
</template>

<script>
import DispatchFormTreeSelect from "@/components/form-manager/DispatchFormTreeSelect.vue";
import {CronElementPlus} from "@vue-js-cron/element-plus";
import {fetchUsers} from "@/services/userService";
import {normalizeCronExpression, openFormPreviewWindow} from "@/utils/dispatch-utils";
import {getAllProductionWorkOrders, getAllProducts, getAllRawMaterials} from "@/services/productionService";
import {getAllEquipments, getAllMaintenanceWorkOrders} from "@/services/maintenanceService";
import {getAllInstruments} from "@/services/instrumentService";
import {getAllTestSubjects} from "@/services/testSubjectService";
import {getAllSamplingLocations} from "@/services/samplingLocationService";
import QcOrderPreview from "@/components/dispatch/QcOrderPreview.vue"
import UserShiftTree from "@/components/dispatch/UserShiftTree.vue";

export default {
  components: { DispatchFormTreeSelect, UserShiftTree, CronElementPlus, QcOrderPreview },
  props: {
    currentOrder: {
      type: Object,
      required: true,
    },
    formMap: {
      type: Object,
      required: true,
    }
  },
  data() {
    return {
      isSubmitted: false,
      dateFormat: "YYYY-MM-DD HH:mm:ss",
      valueFormat: "YYYY-MM-DDTHH:mm:ssZ",
      qcOrderForm: null,
      originalQcOrderForm: null, // Store the original order for comparison
      validationRules: {
        name: [
            {required: true, message: "请输入质检工单名称", trigger: "blur"}
        ],
        "dispatches.*.date_range": [
          {required: true, message: "请选择派发运行时间", trigger: "change"},
        ],
        "dispatches.*.dispatch_limit": [
          {required: true, message: "请输入派发次数上限", trigger: "change"},
        ],
        "dispatches.*.due_date_offset_minute": [
          {required: true, message: "请输入派发任务时限", trigger: "change"},
        ],
        "dispatches.*.type": [
          {required: true, message: "请选择任务类型", trigger: "change"},
        ],
        "dispatches.*.cron_expression": [
          {required: true, message: "请输入有效的执行计划", trigger: "blur"},
        ],
        "dispatches.*.custom_time": [
          {required: true, message: "请选择执行时间", trigger: "change"},
        ],
        "dispatches.*.selectedUsers": [
          { required: true, message: "请至少选择一个人员或班次", trigger: "change" }
        ]
      },
      userOptions: [],  // Stores user data fetch from backend
      instrumentOptions: [],
      samplingLocationOptions: [],
      testSubjectOptions: [],
      productOptions: [],
      rawMaterialOptions: [],
      productionWorkOrderOptions: [],
      equipmentOptions: [],
      maintenanceWorkOrderOptions: [],
    };
  },
  watch: {
    currentOrder: {
      immediate: true,
      handler(newOrder) {
        if (newOrder) {
          // Deep clone to avoid reference issues
          this.qcOrderForm = JSON.parse(JSON.stringify(newOrder));
          this.originalQcOrderForm = JSON.parse(JSON.stringify(newOrder));
        }
      },
    },
  },
  computed: {
    isFormModified() {
      return JSON.stringify(this.qcOrderForm) !== JSON.stringify(this.originalQcOrderForm);
    },
  },
  methods: {
    disablePastDates(date) {
      return date.getTime() < Date.now() - 86400000; // Disable dates before today
    },
    addDispatch() {
      const newDispatch = {
        id: null,
        type: "regular",
        name: "",
        description: "",
        state:1,
        cron_expression: "* * * * * *",
        start_time: null,
        end_time: null,
        dispatch_limit: -1,
        due_date_offset_minute: 60,
        custom_time: null,
        executed_count: 0,
        date_range: [],
        user_ids: [],
        form_ids: [],
        sampling_location_ids: [],
        test_subject_ids: [],
        instrument_ids: [],
        maintenance_work_order_ids: [],
        equipment_ids: [],
        production_work_order_ids: [],
        raw_material_ids: [],
        product_ids: [],
        collapsed: false,
        isUnlimited: true,
        dropdownUserIds: [],
        shiftTreeUserIds: [],
      };
      this.qcOrderForm.dispatches.push(newDispatch);
    },
    updateDispatchLimit(index) {
      const dispatch = this.qcOrderForm.dispatches[index];
      if (dispatch.isUnlimited) {
        dispatch.dispatch_limit = -1;
      }
    },
    removeDispatch(index) {
      this.qcOrderForm.dispatches.splice(index, 1);
    },
    toggleCollapse(index) {
      this.qcOrderForm.dispatches[index].collapsed =
          !this.qcOrderForm.dispatches[index].collapsed;
    },
    // Update data from dispatch form tree select
    handleSelectedForms(forms, index) {
      this.qcOrderForm.dispatches[index].form_ids = forms.map((form) => form.id);
    },
    submitForm() {
      this.isSubmitted = true;  // Set before validation to trigger error states

      this.$refs.formRef.validate(async (valid) => {
        if (valid) {
          try {
            // Prepare the request payload
            const payload = {
              id: this.qcOrderForm.id || null,
              name: this.qcOrderForm.name,
              description: this.qcOrderForm.description,
              status: this.qcOrderForm.status,
              state: this.qcOrderForm.state,
              created_at: this.qcOrderForm.created_at || null,
              created_by: this.qcOrderForm.created_by || null,
              updated_at: this.qcOrderForm.updated_at || null,
              updated_by: this.qcOrderForm.updated_by || null,
              dispatches: this.qcOrderForm.dispatches.map((dispatch) =>
                  (this.transformDispatchData(dispatch))),
            };
            let message;

            if (payload.id == null) {
              payload.created_by = this.$store.getters.getUser.id;
              payload.created_at = new Date().toISOString();
              message = "确定提交工单吗?";
            } else {
              payload.updated_by = this.$store.getters.getUser.id;
              payload.updated_at = new Date().toISOString();
              message = "确定提交已编辑工单吗? 将取消工单目前所有未开始的已派发任务,并按照新设置重新开始派发.";
            }

            await this.$confirm(message, "提示", {
              confirmButtonText: "确定",
              cancelButtonText: "取消",
              type: "warning",
            });

            this.$emit("on-submit", payload); // Emit success event to parent
          } catch (error) {
            console.error("Error creating QC Order:", error);
          }
        } else {
          await this.$alert("请填写所有必填字段后再提交。", "提示", {
            confirmButtonText: "确定",
            type: "error",
          });
        }
      });
    },
    async resetForm() {
      await this.$confirm("确定重置工单吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      });
      this.$emit("reset-form");
      this.isSubmitted = false;  // Reset submission state

    },
    // Transform order data to match order backend api request
    transformDispatchData(data) {
      let payload = {
        id: data.id || null,
        executed_count: 0,
        status:1,
        state:1,
        created_at: data.created_at || null,
        created_by: data.created_by || null,
        updated_at: data.updated_at || null,
        updated_by: data.updated_by || null,
        type: data.type,
        name: data.name || null, // Fallback for  name
        description: data.description || null,
        start_time: data.date_range?.[0] || null,
        end_time: data.date_range?.[1] || null,
        cron_expression: data.cron_expression? normalizeCronExpression(data.cron_expression) : null,
        dispatch_limit: data.dispatch_limit,
        custom_time: data.custom_time || null,
        due_date_offset_minute: data.due_date_offset_minute,
        user_ids: data.user_ids,
        form_ids: data.form_ids,
        product_ids: data.product_ids || [],
        raw_material_ids: data.raw_material_ids || [],
        production_work_order_ids: data.production_work_order_ids || [],
        equipment_ids: data.equipment_ids || [],
        maintenance_work_order_ids: data.maintenance_work_order_ids || [],
        sampling_location_ids: data.sampling_location_ids || [],
        instrument_ids: data.instrument_ids || [],
        test_subject_ids: data.test_subject_ids || [],
      };

      if (payload.type === 'custom') {
        payload.cron_expression = null;
        payload.start_time = null;
        payload.end_time = null;
        payload.dispatch_limit = null;
      }

      if (payload.id == null) {
        payload.created_by = this.$store.getters.getUser.id;
        payload.created_at = new Date().toISOString();
      } else {
        payload.updated_by = this.$store.getters.getUser.id;
        payload.updated_at = new Date().toISOString();
      }

      return payload;
    },
    async loadUserOptions() {
      try {
        const response = await fetchUsers();
        const users = response.data?.data || [];
        this.userOptions = users
            .filter(user => user.status !== 0)
            .map((user) => ({
          id: user.id,
          name: user.name,
        }));
      } catch (error) {
        console.error("Failed to load user options:", error);
      }
    },
    async loadProductOptions() {
      try {
        const response = await getAllProducts();
        const products = response.data?.data || [];
        this.productOptions = products.map((product) => ({
          id : product.id,
          name: product.name,
        }));
      } catch (error) {
        console.error("Failed to load products:", error);
      }
    },
    async loadRawMaterialOptions() {
      try {
        const response = await getAllRawMaterials();
        const rawMaterials = response.data?.data || [];
        this.rawMaterialOptions = rawMaterials.map((material) => ({
          id: material.id,
          name: material.name,
        }));
      } catch (error) {
        console.error("Failed to load raw materials:", error);
      }
    },
    async loadProductionWorkOrderOptions() {
      try {
        const response = await getAllProductionWorkOrders();
        const workOrders = response.data?.data || [];
        this.productionWorkOrderOptions = workOrders.map((workOrder) => ({
          id: workOrder.id,
          name: `${workOrder.name} (${workOrder.code})`,
        }));
      } catch (error) {
        console.error("Failed to load production work orders:", error);
      }
    },
    async loadEquipmentOptions() {
      try {
        const response = await getAllEquipments();
        const equipments = response.data?.data || [];
        this.equipmentOptions = equipments.map((equipment) => ({
          id: equipment.id,
          name: `${equipment.name} (${equipment.code})`,
        }));
      } catch (error) {
        console.error("Failed to load equipments:", error);
      }
    },
    async loadMaintenanceWorkOrderOptions() {
      try {
        const response = await getAllMaintenanceWorkOrders();

        // Extract the data array from the response
        const workOrders = response.data?.data || [];

        // Map the work orders into options for the dropdown
        this.maintenanceWorkOrderOptions = workOrders.map((workOrder) => ({
          id: workOrder.id,        // Use `id` as the value
          name: `${workOrder.name} (${workOrder.code})`, // Combine `name` and `code` for clarity
        }));
      } catch (error) {
        console.error("Failed to load maintenance work orders:", error);
      }
    },
    async loadInstrumentOptions() {
      try {
        const response = await getAllInstruments();
        const instruments = response.data?.data || [];
        this.instrumentOptions = instruments.map((instrument) => ({
          id: instrument.id,
          name: `${instrument.name}`,
        }));
      } catch (error) {
        console.error("Failed to load instruments:", error);
      }
    },
    async loadTestSubjectOptions() {
      try {
        const response = await getAllTestSubjects();
        const testSubjects = response.data?.data || [];
        this.testSubjectOptions = testSubjects.map((testSubject) => ({
          id: testSubject.id,
          name: `${testSubject.name}`,
        }));
      } catch (error) {
        console.error("Failed to load test subject:", error);
      }
    },
    async loadSamplingLocationOptions() {
      try {
        const response = await getAllSamplingLocations();
        const samplingLocations = response.data?.data || [];
        this.samplingLocationOptions = samplingLocations.map((samplingLocation) => ({
          id: samplingLocation.id,
          name: `${samplingLocation.name}`,
        }));
      } catch (error) {
        console.error("Failed to load sampling location:", error);
      }
    },
    async loadAllOptions() {
      await Promise.all([
        this.loadProductOptions(),
        this.loadRawMaterialOptions(),
        this.loadProductionWorkOrderOptions(),
        this.loadEquipmentOptions(),
        this.loadMaintenanceWorkOrderOptions(),
        this.loadUserOptions(),
        this.loadInstrumentOptions(),
        this.loadSamplingLocationOptions(),
        this.loadTestSubjectOptions(),
      ]);
    },
    async handleFormNodeClicked(formTemplateId) {
      console.log("qc order form a node is clicked: " + formTemplateId);
      await openFormPreviewWindow(formTemplateId, this)
    },
    async handleUserShiftTreeSelection(userIdsFromTree, index) {
      // Retrieve the dispatch object at the given index
      const dispatch = this.qcOrderForm.dispatches[index];

      if (!dispatch) {
        console.error("Invalid dispatch index:", index);
        return;
      }

      dispatch.shiftTreeUserIds = userIdsFromTree;

      // Merge `dispatch.user_ids` (el-select) and `userIdsFromTree`
      dispatch.user_ids = [...new Set([...dispatch.dropdownUserIds, ...dispatch.shiftTreeUserIds])]; // OR: Array.from(mergedUserIds);
    },
    handleDropdownUserChange(newUserIds, index) {
      const dispatch = this.qcOrderForm.dispatches[index];

      if (!dispatch) {
        console.error("Invalid dispatch index:", index);
        return;
      }

      // Ensure shiftTreeUserIds exists
      if (!dispatch.shiftTreeUserIds) {
        dispatch.shiftTreeUserIds = [];
      }

      // Merge `dropdownUserIds` (new selection) and `shiftTreeUserIds`
      const mergedUserIds = new Set([...newUserIds, ...dispatch.shiftTreeUserIds]);

      // Convert Set to Array and update `user_ids`
      dispatch.user_ids = [...mergedUserIds];

      console.log(`Updated dispatch[${index}].user_ids:`, dispatch.user_ids);
    }
  },
  mounted() {
    this.loadAllOptions()
  }
}


</script>

<style scoped>

.tree-wrapper-error {
  border: 1px solid #f56c6c !important; /* Red border for validation */
  border-radius: 4px;
  padding: 5px;
}

</style>

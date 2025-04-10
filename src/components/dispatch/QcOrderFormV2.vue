<template>
  <el-container style="display: flex; height: 100%; overflow-y: hidden;">
    <!-- Left Section - QcOrderForm -->
    <el-main style="flex: 7; max-height: 75vh">
<!--    <el-main style="flex: 7; padding: 20px; display: flex; flex-direction: column; height: 100%;">-->
    <!-- Scrollable Form Area -->
<!--      <div style="flex: 1; overflow-y: auto; padding-right: 10px;">-->
      <el-form
          :model="qcOrderForm"
          :rules="validationRules"
          ref="formRef"
          label-position="left"
          label-width="200px"
      >
        <!-- QC Order Name -->
        <el-form-item
            :label="translate('orderManagement.orderDetailDialog.orderName')"
            required
            prop="name"
        >
          <el-input
              v-model="qcOrderForm.name"
              :placeholder="translate('orderManagement.orderFormDialog.orderNamePlaceholder')"
              maxlength="255"
          />
        </el-form-item>

        <!-- Description -->
        <el-form-item
            :label="translate('orderManagement.description')"
        >
          <el-input
              type="textarea"
              v-model="qcOrderForm.description"
              :placeholder="translate('orderManagement.orderFormDialog.descriptionPlaceholder')"
          >
          </el-input>
        </el-form-item>

        <!-- Dispatch List -->
        <el-divider>{{translate('orderManagement.orderDetailDialog.dispatchesDivider')}}</el-divider>
        <div
            v-for="(dispatch, index) in qcOrderForm.dispatches"
            :key="dispatch.id"
            style="margin-bottom: 20px;"
        >
          <el-card shadow="always">
            <!-- Custom Header Slot -->
            <template #header>
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 16px; font-weight: bold;">
                <span>
                  {{ translate('orderManagement.dispatchPlan') }} {{ index + 1 }}
                  <span v-if="dispatch.name"> - {{ dispatch.name }}</span>
                </span>
                <div style="display: flex; gap: 8px;">
                  <!-- Expand Button -->
                  <el-button
                      :link="true"
                      @click="toggleCollapse(index)"
                      :icon="dispatch.collapsed ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"
                  >
                    {{ dispatch.collapsed ? translate('orderManagement.orderFormDialog.expandButton') : translate('orderManagement.orderFormDialog.collapseButton') }}
                  </el-button>
                  <!-- Remove Dispatch Button -->
                  <el-button
                      type="danger"
                      plain
                      @click="removeDispatch(index)"
                  >
                    {{ translate('orderManagement.orderFormDialog.deleteDispatchButton') }}
                  </el-button>
                </div>
              </div>
            </template>

            <!-- Dispatch Form-->
            <div v-show="!dispatch.collapsed">
              <!-- Name -->
              <el-form-item
                  :label="translate('orderManagement.dispatchPlanName')">
                <el-input
                    type="text"
                    v-model="dispatch.name"
                    :placeholder="translate('orderManagement.orderFormDialog.dispatchPlanNamePlaceholder')"
                    :prop="'dispatches.' + index + '.name'"
                    maxlength="255"
                />
              </el-form-item>

              <!-- Description -->
              <el-form-item
                  :label="translate('orderManagement.description')"
                  prop="description">
                <el-input
                    type="textarea"
                    v-model="dispatch.description"
                    :placeholder="translate('orderManagement.orderFormDialog.descriptionPlaceholder')"
                />
              </el-form-item>

              <el-divider>{{translate('orderManagement.orderDetailDialog.dispatchConfigDivider')}}</el-divider>

              <!-- Schedule Type -->
              <el-form-item
                  :label="translate('orderManagement.type')"
                  required
                  :prop="'dispatches.' + index + '.type'"
              >
                <el-radio-group
                    v-model="dispatch.type"
                >
                  <el-radio value="regular"> {{ translate('orderManagement.orderFormDialog.periodicPlan')}} </el-radio>
                  <el-radio value="custom"> {{ translate('orderManagement.orderFormDialog.oneTimePlan')}} </el-radio>
                </el-radio-group>
              </el-form-item>

              <!-- Cron Expression -->
              <el-form-item
                  v-if="dispatch.type === 'regular'"
                  :label="translate('orderManagement.orderDetailDialog.executionLogic')"
                  required
                  :prop="'dispatches.' + index + '.cron_expression'"
              >
                <cron-element-plus
                    v-model="dispatch.cron_expression"
                    :button-props="{ type: 'primary' }"
                    :period="dispatch.source === 'shift' ? 'day' : 'hour'"
                    :disabled="dispatch.source === 'shift'"
                    :locale="cronLocale"
                />
              </el-form-item>

              <!-- Start/End Time for CRON -->
              <el-form-item
                  v-if="dispatch.type === 'regular'"
                  label="执行周期"
                  required
                  :prop="'dispatches.' + index + '.date_range'"
                  :rules="[{
                    required: true,
                    message: '请选择派发计划执行周期',
                    trigger: ['change'],
                    }]"
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
                  :rules="[{required: true, message: '请选择执行时间', trigger: 'change'},]"
              >
                <el-date-picker
                    v-model="dispatch.custom_time"
                    type="datetime"
                    placeholder="请选择执行时间"
                    :format="dateFormat"
                    :value-format="valueFormat"
                    :disabled-date="disablePastDates"
                />
              </el-form-item>

              <!-- Dispatch Limit -->
              <el-form-item
                  v-if="dispatch.type === 'regular' && dispatch.source !== 'shift'"
                  label="派发次数上限"
                  required
              >
                <el-col :span="12">
                  <el-form-item
                      :prop="'dispatches.' + index + '.isUnlimited'"
                      :rules="[{
                        required: true,
                        message: '请选择有无限制派发上限',
                        trigger: ['change'],
                        }]">
                    <el-radio-group
                        v-model="dispatch.isUnlimited"
                    >
                      <el-radio :value="true">无限制</el-radio>
                      <el-radio :value="false">限制</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item
                      v-if="!dispatch.isUnlimited"
                      :prop="'dispatches.' + index + '.dispatch_limit'"
                      :rules="[{
                        required: true,
                        message: '请输入派发次数上限',
                        trigger: ['change'],
                      }]"
                  >
                    <el-input-number
                        v-model="dispatch.dispatch_limit"
                        :min="1"
                        :max="9999"
                        :precision="0"
                        style="margin-left: 10px;"
                        placeholder="请输入派发上限"

                    />
                  </el-form-item>
                </el-col>
              </el-form-item>

              <el-divider>质检任务配置</el-divider>
              <!-- Due Date Offset -->
              <el-form-item
                  v-if="dispatch.source !== 'shift'"
                  label="派发任务时限(分钟)"
                  required
                  :prop="'dispatches.' + index + '.due_date_offset_minute'"
                  :rules="[{
                        required: true,
                        message: '请输入派发任务时限',
                        trigger: ['change'],
                        }]"
              >
                <el-input-number
                    v-model="dispatch.due_date_offset_minute"
                    :min="1"
                    :max="9999"
                    :precision="0"
                />
              </el-form-item>

              <!-- Commented out due to requirement change-->
<!--              &lt;!&ndash; Test Subject Selection &ndash;&gt;-->
<!--              <el-form-item-->
<!--                  label="检测项目"-->
<!--                  :prop="'dispatches.' + index + '.test_subject_ids'"-->
<!--              >-->
<!--                <el-select-->
<!--                    v-model="dispatch.test_subject_ids"-->
<!--                    placeholder="请选择检测项目"-->
<!--                    multiple-->
<!--                    filterable-->
<!--                    :fit-input-width="true"-->
<!--                >-->
<!--                  <el-option-->
<!--                      v-for="subject in testSubjectOptions"-->
<!--                      :key="subject.id"-->
<!--                      :label="subject.name"-->
<!--                      :value="subject.id"-->
<!--                  />-->
<!--                </el-select>-->
<!--              </el-form-item>-->

<!--              &lt;!&ndash; Sampling Location Selection &ndash;&gt;-->
<!--              <el-form-item-->
<!--                  label="采样位置"-->
<!--                  :prop="'dispatches.' + index + '.sampling_location_ids'"-->
<!--              >-->
<!--                <el-select-->
<!--                    v-model="dispatch.sampling_location_ids"-->
<!--                    placeholder="请选择采样位置"-->
<!--                    multiple-->
<!--                    filterable-->
<!--                    :fit-input-width="true"-->
<!--                >-->
<!--                  <el-option-->
<!--                      v-for="location in samplingLocationOptions"-->
<!--                      :key="location.id"-->
<!--                      :label="location.name"-->
<!--                      :value="location.id"-->
<!--                  />-->
<!--                </el-select>-->
<!--              </el-form-item>-->

<!--              &lt;!&ndash; Instrument Selection &ndash;&gt;-->
<!--              <el-form-item-->
<!--                  label="仪器"-->
<!--                  :prop="'dispatches.' + index + '.instrument_ids'">-->
<!--                <el-select-->
<!--                    v-model="dispatch.instrument_ids"-->
<!--                    placeholder="请选择仪器"-->
<!--                    multiple-->
<!--                    filterable-->
<!--                    :fit-input-width="true"-->
<!--                >-->
<!--                  <el-option-->
<!--                      v-for="instrument in instrumentOptions"-->
<!--                      :key="instrument.id"-->
<!--                      :label="instrument.name"-->
<!--                      :value="instrument.id"-->
<!--                  />-->
<!--                </el-select>-->
<!--              </el-form-item>-->

              <!-- User Selection -->
              <el-form-item
                  v-if="dispatch.source !== 'shift'"
                  label="质检人员"
                  :prop="'dispatches.' + index + '.user_ids'"
                  required
                  :rules="[{
                      required: true,
                      message: '请选择至少一名人员或班次',
                      trigger: ['change'],
                      }]"
              >
                <el-select-v2
                    v-model="dispatch.dropdownUserIds"
                    multiple
                    filterable
                    placeholder="请选择人员"
                    :fit-input-width="true"
                    :options="userOptions"
                    @change="addUniqueUserIdsToDispatch($event, index)"
                    style="width: 100%"
                />
              </el-form-item>

              <!-- Shift User Tree Selection -->
              <el-form-item
                  :prop="'dispatches.' + index + '.user_ids'"
              >
                <UserShiftTree
                    :shiftIdArray="[dispatch.shift_id]"
                    @update-selected-users="(users) => handleUserShiftTreeSelection(users, index)"
                />
              </el-form-item>

              <DispatchFormTreeSelect
                  :selected-form-ids="dispatch.form_ids"
                  :prop-name="`dispatches.${index}.form_ids`"
                  :has-error="isSubmitted && dispatch.form_ids.length === 0"
                  @update-selected-forms="(forms) => handleFormsTreeChanges(forms, index)"
                  @on-node-clicked="handleFormNodeClicked"
              />

              <el-divider>生产模块关联</el-divider>

              <!-- Product Selection -->
              <el-form-item label="产品">
                <el-select v-model="dispatch.product_ids"
                           multiple
                           filterable
                           placeholder="请选择产品"
                           :fit-input-width="true"
                >
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
                           placeholder="请选择生产工单"
                           :fit-input-width="true"
                >
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
                           placeholder="请选择原料"
                           :fit-input-width="true"
                >
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
                           placeholder="请选择维护工单"
                           :fit-input-width="true"
                >
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
                           placeholder="请选择设备"
                           :fit-input-width="true"
                >
                  <el-option v-for="equipment in equipmentOptions"
                             :key="equipment.id"
                             :label="equipment.name"
                             :value="equipment.id" />
                </el-select>
              </el-form-item>
            </div>
          </el-card>
        </div>
      </el-form>

      <!-- Fixed Bottom (Action Buttons) -->
      <div style="flex-shrink: 0; border-top: 1px solid #ebeef5; display: flex;">
        <!-- Add Dispatch -->
        <el-button
            type="primary"
            plain
            @click="() => addDispatch()"
        >
          新增派发计划
        </el-button>
        <!-- Add Plan By Shift  -->
<!--        <el-popover-->
<!--            style="box-sizing: border-box;-->
<!--              max-height: 400px;-->
<!--              overflow-y: auto;-->
<!--              padding: 10px;"-->
<!--            placement="top-start"-->
<!--            width="300"-->
<!--            trigger="click"-->
<!--            v-model:visible="isPlanPopulateByShiftVisible"-->
<!--            :teleported="false"-->
<!--        >-->
<!--          &lt;!&ndash; Content shown when toggled &ndash;&gt;-->
<!--          <div style="display: flex; flex-direction: column; gap: 10px;">-->
<!--            <el-select-v2-->
<!--                v-model="selectedShiftId"-->
<!--                placeholder="选择班组"-->
<!--                placement="top-start"-->
<!--                multiple-->
<!--                filterable-->
<!--                :options="shiftOptions"-->
<!--                clearable-->
<!--                style="width: 100%;"-->
<!--            />-->

<!--            &lt;!&ndash; Description Display for Selected Shifts &ndash;&gt;-->
<!--            <div v-if="selectedShiftDetails.length" style="max-height: 200px; overflow-y: auto; padding: 5px; border-top: 1px solid #ebeef5;">-->
<!--              <div v-for="shift in selectedShiftDetails" :key="shift.id" style="margin-bottom: 8px; font-size: 13px; color: #606266;">-->
<!--                <strong>{{ shift.name }}</strong>-->
<!--                <ul style="padding-left: 18px; margin: 4px 0;">-->
<!--                  <li>执行频率：每天 00:00</li>-->
<!--                  <li>任务时限：24小时</li>-->
<!--                  <li>关联表单数：{{ shift.formCount }}</li>-->
<!--                  <li>关联人员数：{{ shift.userCount }}</li>-->
<!--                </ul>-->
<!--              </div>-->
<!--            </div>-->

<!--            <el-button-->
<!--                type="primary"-->
<!--                :icon="Check"-->
<!--                size="small"-->
<!--                :disabled="!selectedShiftId || selectedShiftId.length === 0"-->
<!--                @click="handlePopulateDispatchAndClose"-->
<!--            >-->
<!--            </el-button>-->
<!--          </div>-->
<!--          &lt;!&ndash; Trigger &ndash;&gt;-->
<!--          <template #reference>-->
<!--            <el-button-->
<!--                type="primary"-->
<!--                plain-->
<!--                style="margin-right: 12px"-->
<!--            >-->
<!--              班次生成计划-->
<!--            </el-button>-->
<!--          </template>-->
<!--        </el-popover>-->
        <!-- Trigger Button -->
        <el-button
            type="primary"
            plain
            style="margin-right: 12px"
            @click="isPlanPopulateByShiftVisible = true"
        >
          班次生成计划
        </el-button>

        <!-- Dialog Modal -->
        <el-dialog
            title="选择班组生成派发计划"
            v-model="isPlanPopulateByShiftVisible"
            width="400px"
            :close-on-click-modal="false"
        >
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <!-- Shift Selector -->
            <el-select-v2
                v-model="selectedShiftId"
                placeholder="选择班组"
                multiple
                filterable
                :options="shiftOptions"
                clearable
                style="width: 100%;"
            />

            <!-- Selected Shift Description -->
            <div
                v-if="selectedShiftDetails.length"
                style="max-height: 200px; overflow-y: auto; border-top: 1px solid #ebeef5; padding-top: 10px;"
            >
              <div
                  v-for="shift in selectedShiftDetails"
                  :key="shift.id"
                  style="margin-bottom: 10px; font-size: 13px; color: #606266;"
              >
                <strong>{{ shift.name }}</strong>
                <ul style="padding-left: 18px; margin: 4px 0;">
                  <li>执行频率：每天 00:00</li>
                  <li>任务时限：24小时</li>
                  <li>关联表单数：{{ shift.form_ids.length }}</li>
                  <li>关联人员数：{{ shift.user_ids.length }}</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <template #footer>
            <el-button @click="isPlanPopulateByShiftVisible = false">取消</el-button>
            <el-button
                type="primary"
                :disabled="!selectedShiftId || selectedShiftId.length === 0"
                @click="handlePopulateDispatchAndClose"
            >
              确认添加
            </el-button>
          </template>
        </el-dialog>

        <el-button
            type="primary"
            :disabled="!isFormModified"
            @click="submitForm"
        >
          提交
        </el-button>
        <el-button type="warning" @click="resetForm">重置</el-button>
        <el-button @click="$emit('on-cancel')">取消</el-button>
      </div>
    </el-main>
    <!-- Right Section - Preview -->
    <el-aside style="flex: 3; padding: 20px; max-height: 75vh; background: #f9f9f9; overflow-y: auto;">
      <qc-order-preview
          :qc-order-form="qcOrderForm"
          :form-map="formMap"
          :user-map="userMap"
          :shift-map="shiftMap"
      />
    </el-aside>
  </el-container>
</template>

<script>
import DispatchFormTreeSelect from "@/components/dispatch/DispatchFormTreeSelect.vue";
import {CronElementPlus} from "@vue-js-cron/element-plus";
import {normalizeCronExpression, openFormPreviewWindow} from "@/utils/dispatch-utils";
import {getAllProductionWorkOrders, getAllProducts, getAllRawMaterials} from "@/services/productionService";
import {getAllEquipments, getAllMaintenanceWorkOrders} from "@/services/maintenanceService";
import {getAllInstruments} from "@/services/instrumentService";
import {getAllTestSubjects} from "@/services/testSubjectService";
import {getAllSamplingLocations} from "@/services/samplingLocationService";
import QcOrderPreview from "@/components/dispatch/QcOrderPreviewV2.vue"
import UserShiftTree from "@/components/dispatch/UserShiftTree.vue";
import {Avatar, Check} from "@element-plus/icons-vue";
import {getAllShifts} from "@/services/shiftService";
import {getFormIdsForShift} from "@/services/shiftFormService";
import {getUsersForShift} from "@/services/shiftUserService";
import {translate} from "@/utils/i18n";


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
    selectedShiftId: {
      handler: 'fetchSelectedShiftDetails',
      immediate: true,
    },
  },
  computed: {
    Check() {
      return Check
    },
    Avatar() {
      return Avatar
    },
    isFormModified() {
      return JSON.stringify(this.qcOrderForm) !== JSON.stringify(this.originalQcOrderForm);
    },
    userOptions() {
      return Object.values(this.userMap).map(user => ({
        label: user.name,
        value: user.id
      }));
    },
    shiftOptions() {
      return this.shiftSelectOptions
          .filter(shift => shift.status === 1)
          .map(shift => (
          {
            value: shift.id,
            label:shift.name
          }))
    },
    selectedShiftDetails() {
      return this.selectedShiftId.map(id => {
        const shift = this.shiftMap[id] || {};
        return {
          ...shift,
          form_ids: shift.form_ids || [],
          user_ids: shift.user_ids || [],
        };
      });
    },
    cronLocale() {
      const currentLang = localStorage.getItem('app-language') || 'en'
      return currentLang.toLowerCase().startsWith('zh') ? 'zh-cn' : 'en-us'
    }
  },
  mounted() {
    this.loadAllOptions()
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
          {required: true, message: "请输入工单名称", trigger: "blur"},
          {max: 255, message: "工单名称不能超过255个字符", trigger: "blur"}
        ],
      },
      instrumentOptions: [],
      samplingLocationOptions: [],
      testSubjectOptions: [],
      productOptions: [],
      rawMaterialOptions: [],
      productionWorkOrderOptions: [],
      equipmentOptions: [],
      maintenanceWorkOrderOptions: [],
      isPlanPopulateByShiftVisible: false,
      emptyDispatchTemplate: {
        id: null,
        type: "regular",
        name: "",
        description: "",
        state: 1,
        cron_expression: "* * * * *",
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
        source: 'manual',
      },
      shiftSelectOptions: [],
      selectedShiftId: [],
      cronFields: [
        {
          id: 'day',
          items: Array.from({ length: 31 }, (_, i) => ({
            value: i + 1,
            text: `${i + 1}`,
            alt: `${i + 1}号`
          }))
        },
        {
          id: 'month',
          items: Array.from({ length: 12 }, (_, i) => ({
            value: i + 1,
            text: `${i + 1}`,
            alt: `${i + 1}月`
          }))
        },
        {
          id: 'dayOfWeek',
          items: [
            { value: 0, text: '周日' },
            { value: 1, text: '周一' },
            { value: 2, text: '周二' },
            { value: 3, text: '周三' },
            { value: 4, text: '周四' },
            { value: 5, text: '周五' },
            { value: 6, text: '周六' },
          ]
        }
      ],
    }
  },
  methods: {
    translate,
    disablePastDates(date) {
      return date.getTime() < Date.now() - 86400000; // Disable dates before today
    },
    addDispatch(dispatchObj = null) {
      const dispatch = dispatchObj || this.cloneEmptyDispatchTemplate();
      this.qcOrderForm.dispatches.push(dispatch)
    },
    removeDispatch(index) {
      this.qcOrderForm.dispatches.splice(index, 1);
    },
    toggleCollapse(index) {
      this.qcOrderForm.dispatches[index].collapsed =
          !this.qcOrderForm.dispatches[index].collapsed;
    },
    handleFormsTreeChanges(forms, index) {
      this.qcOrderForm.dispatches[index].form_ids = forms.map((form) => form.id);
    },
    submitForm() {
      this.isSubmitted = true;  // Set before validation to trigger error states

      this.$refs.formRef.validate(async (valid) => {
        if (valid) {
          try {
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
                  (this.cleanupForDispatchApiPayload(dispatch))),
            };
            let message;

            if (payload.id == null) {
              payload.created_by = this.$store.getters.getUser.id;
              payload.created_at = new Date().toISOString();
              message = "确定提交工单吗?";
            } else {
              payload.updated_by = this.$store.getters.getUser.id;
              payload.updated_at = new Date().toISOString();
              message = "确认提交工单吗? 所有未开始任务将被取消,并按照新设置重新派发.";
            }

            await this.$confirm(message, "提示", {
              confirmButtonText: "确定",
              cancelButtonText: "取消",
              type: "warning",
            });

            this.$emit("on-submit", payload); // Emit success event to parent
          } catch (error) {
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
      this.isSubmitted = false;
    },
    cleanupForDispatchApiPayload(dispatchData) {
      let payload = {
        id: dispatchData.id || null,
        executed_count: 0,
        status: 1,
        state: 1,
        created_at: dispatchData.created_at || null,
        created_by: dispatchData.created_by || null,
        updated_at: dispatchData.updated_at || null,
        updated_by: dispatchData.updated_by || null,
        type: dispatchData.type,
        name: dispatchData.name || null,
        description: dispatchData.description || null,
        start_time: dispatchData.date_range?.[0] || null,
        end_time: dispatchData.date_range?.[1] || null,
        cron_expression: dispatchData.cron_expression ? normalizeCronExpression(dispatchData.cron_expression) : null,
        dispatch_limit: dispatchData.isUnlimited === true ? -1 : dispatchData.dispatch_limit,
        custom_time: dispatchData.custom_time || null,
        due_date_offset_minute: dispatchData.due_date_offset_minute,
        user_ids: dispatchData.user_ids,
        form_ids: dispatchData.form_ids,
        product_ids: dispatchData.product_ids || [],
        raw_material_ids: dispatchData.raw_material_ids || [],
        production_work_order_ids: dispatchData.production_work_order_ids || [],
        equipment_ids: dispatchData.equipment_ids || [],
        maintenance_work_order_ids: dispatchData.maintenance_work_order_ids || [],
        sampling_location_ids: dispatchData.sampling_location_ids || [],
        instrument_ids: dispatchData.instrument_ids || [],
        test_subject_ids: dispatchData.test_subject_ids || [],
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
    togglePlanPopulateByShift(){
      this.isPlanPopulateByShiftVisible = !this.isPlanPopulateByShiftVisible;
    },
    async loadProductOptions() {
      try {
        const response = await getAllProducts();
        const products = response.data?.data || [];
        this.productOptions = products.map((product) => ({
          id: product.id,
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
        const workOrders = response.data?.data || [];
        this.maintenanceWorkOrderOptions = workOrders.map((workOrder) => ({
          id: workOrder.id,
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
    async loadShiftSelectOptions() {
      try {
        const response = await getAllShifts();
        if (response.data.status === "200") {
          this.shiftSelectOptions = response.data?.data || [];
        }
      } catch (error) {
        console.error("Failed to load shift select:", error);
      }
    },
    async loadAllOptions() {
      await Promise.all([
        this.loadProductOptions(),
        this.loadRawMaterialOptions(),
        this.loadProductionWorkOrderOptions(),
        this.loadEquipmentOptions(),
        this.loadMaintenanceWorkOrderOptions(),
        this.loadInstrumentOptions(),
        this.loadSamplingLocationOptions(),
        this.loadTestSubjectOptions(),
        this.loadShiftSelectOptions(),
      ]);
    },
    async handleFormNodeClicked(formTemplateId) {
      await openFormPreviewWindow(formTemplateId, this)
    },
    async handleUserShiftTreeSelection(userIdsFromTree, index) {
      const dispatch = this.qcOrderForm.dispatches[index];

      if (!dispatch) {
        console.error("Invalid dispatch index:", index);
        return;
      }

      dispatch.shiftTreeUserIds = userIdsFromTree;

      // Merge `dispatch.user_ids` (el-select) and `userIdsFromTree`
      dispatch.user_ids = [...new Set([...dispatch.dropdownUserIds, ...dispatch.shiftTreeUserIds])]; // OR: Array.from(mergedUserIds);
    },
    addUniqueUserIdsToDispatch(newUserIds, index) {
      console.log("AddUniqueUserIdsToDispatch", index);
      const dispatch = this.qcOrderForm.dispatches[index];

      if (!dispatch) {
        console.error("Invalid dispatch index:", index);
        return;
      }

      if (!dispatch.shiftTreeUserIds) {
        dispatch.shiftTreeUserIds = [];
      }

      // Merge `dropdownUserIds` (new selection) and `shiftTreeUserIds`
      const mergedUserIds = new Set([...newUserIds, ...dispatch.shiftTreeUserIds]);

      // Convert Set to Array and update `user_ids`
      dispatch.user_ids = [...mergedUserIds];
    },
    async handlePopulateDispatchAndClose() {
      await this.handlePopulateDispatch(); // existing function
      this.isPlanPopulateByShiftVisible = false; // close the popover
    },
    async handlePopulateDispatch() {
      for (const shiftId of this.selectedShiftId) {
        const shift = this.shiftSelectOptions.find((shift) => shift.id === shiftId);
        let d = this.cloneEmptyDispatchTemplate();

        let response = await getUsersForShift(shiftId);
        console.log('response');
        console.log(response);
        if (response.status === 200) {
          d.user_ids = response.data.data.map((user) => user.id);
          // TODO: Clean up
          console.log('set dispatch plan user id to users under shift')
        } else {
          d.user_ids = [];
          // TODO: Clean up
          console.log('set dispatch plan user id to empty')
        }

        response = await getFormIdsForShift(shiftId);
        if (response.status === 200) {
          d.form_ids = response.data?.data
        } else {
          d.form_ids = [];
        }

        d.source = 'shift';
        d.cron_expression = '0 0 * * *';
        d.name = (shift? shift.name : '') + '计划';
        d.collapsed = true;
        d.shift_id = shiftId;
        d.due_date_offset_minute = 1440;


        this.addDispatch(d);
      }

      // Reset after populating plans.
      this.selectedShiftId = [];
    },
    cloneEmptyDispatchTemplate() {
      return JSON.parse(JSON.stringify(this.emptyDispatchTemplate));
    },
  }
}


</script>

<style>


</style>

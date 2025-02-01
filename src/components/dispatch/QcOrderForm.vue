<template>
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

    <!-- Order-Level User/Form Option -->
    <el-divider>全局选项</el-divider>
    <el-form-item label="应用人员到所有派发" prop="applyUserToAll">
      <el-switch
          v-model="qcOrderForm.applyUserToAll"
          />
    </el-form-item>
    <el-form-item v-if="qcOrderForm.applyUserToAll" label="选择全局人员">
      <el-select
          v-model="qcOrderForm.globalUserIds"
          multiple
          filterable
          placeholder="请选择人员"
          :loading="isLoadingUser"
          @focus="loadUserOptions"
      >
        <el-option
            v-for="user in userOptions"
            :key="user.id"
            :label="user.name"
            :value="user.id"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="应用表单到所有派发" prop="applyFormToAll">
      <el-switch
          v-model="qcOrderForm.applyFormToAll"
          />
    </el-form-item>
    <el-form-item v-if="qcOrderForm.applyFormToAll" label="选择全局表单">
      <DispatchFormTreeSelect
          :selected-form-ids="qcOrderForm.globalFormIds"
          @update-selected-forms="(forms) => {
          qcOrderForm.globalFormIds = forms.map((form) => form.id);
        }"
      />
    </el-form-item>

    <!-- Dispatch List -->
    <el-divider>任务列表</el-divider>
    <div
        v-for="(dispatch, index) in qcOrderForm.dispatches"
        :key="dispatch.id"
        class="dispatch-block"
    >
      <el-card :header="'任务 ' + (index + 1)" shadow="always">
        <!-- Collapse Dispatch -->
        <div
            style="display: flex;
            justify-content: space-between;
             align-items: center;"
        >
          <!-- Expand Arrow -->
          <el-button
              type="text"
              @click="toggleCollapse(index)"
              :icon="dispatch.collapsed ? 'el-icon-arrow-down' : 'el-icon-arrow-up'">
            {{ dispatch.collapsed ? '展开' : '收起' }}
          </el-button>
          <!-- Remove Dispatch -->
          <el-button
              type="danger"
              plain
              @click="removeDispatch(index)">
            删除任务
          </el-button>
        </div>
        <div v-show="!dispatch.collapsed">
          <!-- Name -->
          <el-form-item
              label="任务名称">
            <el-input
                type="text"
                v-model="dispatch.name"
                placeholder="请输入任务名称"
                :prop="'dispatches.' + index + '.name'"
            />
          </el-form-item>

          <!-- Description -->
          <el-form-item
              label="任务备注"
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
              label="任务类型"
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
              :prop="'dispatches.' + index + '.cronExpression'"
          >
            <cron-element-plus
                v-model="dispatch.cronExpression"
                :button-props="{ type: 'primary' }"
                locale="zh-cn"
            />
          </el-form-item>

          <!-- Start/End Time for CRON -->
          <el-form-item
              v-if="dispatch.type === 'regular'"
              label="执行周期"
              required
              :prop="'dispatches.' + index + '.dateRange'"
          >
            <el-date-picker
                v-model="dispatch.dateRange"
                type="datetimerange"
                range-separator="To"
                start-placeholder="开始时间"
                end-placeholder="停止时间"
                :format="dateFormat"
                :value-format="valueFormat"
            />
          </el-form-item>

          <!-- Single Execution Date -->
          <el-form-item
              v-else
              label="执行时间"
              required
              :prop="'dispatches.' + index + '.customTime'"
          >
            <el-date-picker
                v-model="dispatch.customTime"
                type="datetime"
                placeholder="选择执行时间"
                :format="dateFormat"
                :value-format="valueFormat"
            />
          </el-form-item>

          <!-- Dispatch Limit -->
          <el-form-item
              v-if="dispatch.type === 'regular'"
              label="派发次数上限"
              required
              :prop="'dispatches.' + index + '.dispatchLimit'">
            <el-radio-group
                v-model="dispatch.isUnlimited"
                @change="updateDispatchLimit(index)">
              <el-radio :label="true">无限制</el-radio>
              <el-radio :label="false">限制</el-radio>
            </el-radio-group>
            <el-input-number
                v-if="!dispatch.isUnlimited"
                v-model="dispatch.dispatchLimit"
                :min="1"
                style="margin-left: 10px;"
                placeholder="请输入限制次数" />
          </el-form-item>

          <el-divider>质检任务配置</el-divider>
          <!-- Due Date Offset -->
          <el-form-item
              label="派发任务时限(分钟)"
              required
              :prop="'dispatches.' + index + '.dueDateOffsetMinute'">
            <el-input-number
                v-model="dispatch.dueDateOffsetMinute"
                :min="0" />
          </el-form-item>

          <!-- Test Subject Selection -->
          <el-form-item
              label="检测项目"
              :prop="'dispatches.' + index + '.testSubjectIds'"
          >
            <el-select
                v-model="dispatch.testSubjectIds"
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
              :prop="'dispatches.' + index + '.samplingLocationIds'"
          >
            <el-select
                v-model="dispatch.samplingLocationIds"
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
              :prop="'dispatches.' + index + '.instrumentIds'">
            <el-select
                v-model="dispatch.instrumentIds"
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
              v-if="!qcOrderForm.applyUserToAll"
              label="检测人员"
              :prop="'dispatches.' + index + '.userIds'"
              required>
            <el-select
                v-model="dispatch.userIds"
                multiple
                filterable
                placeholder="请选择人员">
              <el-option
                  v-for="user in userOptions"
                  :key="user.id"
                  :label="user.name"
                  :value="user.id"
              />
            </el-select>
          </el-form-item>

          <!-- Form Tree -->
          <el-form-item
              v-if="!qcOrderForm.applyFormToAll"
              label="质检表单"
              :prop="'dispatches.' + index + '.formIds'"
              required
          >
            <DispatchFormTreeSelect
                :selected-form-ids="dispatch.formIds"
                @update-selected-forms="(forms) =>
                handleSelectedForms(forms, index)"
            />
          </el-form-item>

          <el-divider>生产模块关联</el-divider>

          <!-- Product Selection -->
          <el-form-item label="产品">
            <el-select v-model="dispatch.productIds"
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
            <el-select v-model="dispatch.productionWorkOrderIds"
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
            <el-select v-model="dispatch.rawMaterialIds"
                       multiple filterable
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
            <el-select v-model="dispatch.maintenanceWorkOrderIds"
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
            <el-select v-model="dispatch.equipmentIds"
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
    <el-button type="primary" plain @click="addDispatch">新增计划任务</el-button>

    <!-- Schedule Summary -->
    <el-card class="mt-4" shadow="always">
      <h4>工单预览</h4>
      <p><strong>名称:</strong> {{ qcOrderForm.name }}</p>
      <p><strong>工单备注:</strong> {{ qcOrderForm.description || "无" }}</p>
      <p><strong>任务总数:</strong> {{ qcOrderForm.dispatches.length }}</p>
      <div v-for="(dispatch, index) in qcOrderForm.dispatches" :key="dispatch.id" class="dispatch-preview">
        <h5>任务 {{ index + 1 }}</h5>
        <ul class="dispatch-details">
          <li>任务类型: <strong>{{ dispatch.type === 'regular' ? '周期计划' : '单次计划' }}</strong></li>
          <li v-if="dispatch.type === 'regular'">
            执行计划: <strong>{{ formatCronExpression(dispatch.cronExpression) }}</strong>
          </li>
          <li v-if="dispatch.type === 'regular'">
            执行周期: <strong>{{ formatDateRange(dispatch.dateRange) }}</strong>
          </li>
          <li v-else>
            执行时间: <strong>{{ formatDate(dispatch.customTime) }}</strong>
          </li>
          <li>
            派发次数上限:
            <strong>{{ dispatch.dispatchLimit === -1 ? "无限制" : dispatch.dispatchLimit }}</strong>
          </li>
          <li>
            派发任务时限: <strong> { dispatch.dueDateOffsetMinute }} 分钟 </strong>
          </li>
          <li>
            人员: <strong>{{ formatUsers(dispatch.userIds) }}</strong>
          </li>
          <li>
            表单: <strong>{{ formatForms(dispatch.formIds) }}</strong>
          </li>
        </ul>
      </div>
    </el-card>

    <!-- Submit -->
    <el-form-item>
      <el-button type="primary" :disabled="!isFormModified" @click="submitForm">提交</el-button>
      <el-button @click="resetForm" type="warning">重置</el-button>
      <el-button @click="$emit('on-cancel')">取消</el-button>
    </el-form-item>
  </el-form>
</template>


<script>
import DispatchFormTreeSelect from "@/components/form-manager/DispatchFormTreeSelect.vue";
import { CronElementPlus } from "@vue-js-cron/element-plus";
import { fetchUsers } from "@/services/userService";
import { createQcOrder } from "@/services/qcOrderService";
import { humanizeCronInChinese } from "cron-chinese";
import {normalizeCronExpression} from "@/utils/dispatch-utils";
import {getAllProductionWorkOrders, getAllProducts, getAllRawMaterials} from "@/services/productionService";
import {getAllEquipments, getAllMaintenanceWorkOrders} from "@/services/maintenanceService";

export default {
  components: { DispatchFormTreeSelect, CronElementPlus },
  props: {
    currentOrder: {
      type: Object,
      required: true,
    }
  },
  data() {
    return {
      dateFormat: "YYYY-MM-DD HH:mm:ss",
      valueFormat: "YYYY-MM-DDTHH:mm:ssZ",
      qcOrderForm: {
        name: "",
        description: "",
        applyUserToAll: false,
        globalUserIds: [], // global user selection
        applyFormToAll: false,
        globalFormIds: [], // global form selection
        dispatches: [],
      },
      originalQcOrderForm: null, // Store the original order for comparison
      validationRules: {
        name: [{required: true, message: "请输入质检工单名称", trigger: "blur"}],
        "dispatches.*.dateRange": [
          {required: true, message: "请选择派发运行时间", trigger: "change"},
        ],
        dispatchLimit: [
          {required: true, message: "请输入派发次数上限", trigger: "change"},
        ],
        dueDateOffsetMinute: [
          {required: true, message: "请输入派发任务时限", trigger: "change"},
        ],
        "dispatches.*.type": [
          {required: true, message: "请选择任务类型", trigger: "change"},
        ],
        "dispatches.*.cronExpression": [
          {required: true, message: "请输入有效的执行计划", trigger: "blur"},
        ],
        "dispatches.*.customTime": [
          {required: true, message: "请选择执行时间", trigger: "change"},
        ],
      },
      userOptions: [],  // Stores user data fetch from backend
      instrumentOptions: [
        { id: "1", name: "仪器 1" },
        { id: "2", name: "仪器 2" },
        { id: "3", name: "仪器 3" },
      ],  // Dummy data, temporary placeholder
      samplingLocationOptions: [
        { id: "4", name: "位置 4" },
        { id: "5", name: "位置 5" },
        { id: "6", name: "位置 6" },
      ], // Dummy data, temporary placeholder
      testSubjectOptions: [
        { id: "7", name: "检测项目 7" },
        { id: "8", name: "检测项目 8" },
        { id: "9", name: "检测项目 9" },
      ], // Dummy data, temporary placeholder
      productOptions: [],
      rawMaterialOptions: [],
      productionWorkOrderOptions: [],
      equipmentOptions: [],
      maintenanceWorkOrderOptions: [],
    };
  },
  watch: {
    "qcOrderForm.globalUserIds"(newGlobalUserIds) {
      if (this.qcOrderForm.applyUserToAll) {
        this.qcOrderForm.dispatches.forEach((dispatch) => {
          dispatch.userIds = [...newGlobalUserIds];
        });
      }
    },
    "qcOrderForm.globalFormIds"(newGlobalFormIds) {
      if (this.qcOrderForm.applyFormToAll) {
        this.qcOrderForm.dispatches.forEach((dispatch) => {
          dispatch.formIds = [...newGlobalFormIds];
        });
      }
    },
    "qcOrderForm.applyUserToAll"(apply) {
      if (apply) {
        this.qcOrderForm.dispatches.forEach((dispatch) => {
          dispatch.userIds = [...this.qcOrderForm.globalUserIds];
        });
      }
    },
    "qcOrderForm.applyFormToAll"(apply) {
      if (apply) {
        this.qcOrderForm.dispatches.forEach((dispatch) => {
          dispatch.formIds = [...this.qcOrderForm.globalFormIds];
        });
      }
    },
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
    addDispatch() {
      const newDispatch = {
        name: "",
        description: "",
        type: "regular",
        cronExpression: "* * * * *",
        customTime: null,
        dateRange: [],
        userIds: this.qcOrderForm.applyUserToAll
            ? [...this.qcOrderForm.globalUserIds]
            : [],
        formIds: this.qcOrderForm.applyFormToAll
            ? [...this.qcOrderForm.globalFormIds]
            : [],
        samplingLocationIds: [],
        testSubjectIds: [],
        instrumentIds: [],
        maintenanceWorkOrderIds: [],
        equipmentIds: [],
        productionWorkOrderIds: [],
        rawMaterialIds: [],
        productIds: [],
        collapsed: false,
        isUnlimited: true,
        dispatchLimit: -1,
        dueDateOffsetMinute: 60,
      };
      this.qcOrderForm.dispatches.push(newDispatch);
    },
    updateDispatchLimit(index) {
      const dispatch = this.qcOrderForm.dispatches[index];
      if (dispatch.isUnlimited) {
        dispatch.dispatchLimit = -1;
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
      this.qcOrderForm.dispatches[index].formIds = forms.map((form) => form.id);
    },
    submitForm() {
      this.$refs.formRef.validate(async (valid) => {
        if (valid) {
          try {
            // Prepare the request payload
            const payload = {
              name: this.qcOrderForm.name,
              description: this.qcOrderForm.description,
              dispatchRequestList: this.qcOrderForm.dispatches.map((dispatch) =>
                  (this.transformOrderData(dispatch))),
            };

            console.log("Submitting Payload:");
            console.log(payload);
            const userId = this.$store.getters.getUser.id;
            const response = await createQcOrder(payload, userId);

            // Handle success
            this.$message.success("QC Order created successfully!");
            this.$emit("on-create"); // Emit success event to parent
          } catch (error) {
            console.error("Error creating QC Order:", error);
            this.$message.error("Failed to create QC Order. Please try again.");
          }
        }
      });
    },
    resetForm() {
      this.qcOrderForm = this.transformOrderData(this.currentOrder || {})
    },
    // Format a date in '2025/1/16 00:00:00' format (Order summary helper)
    formatDate(date) {
      if (!date) return "无";
      return new Date(date).toLocaleString("zh-CN", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    },
    // Format a date range (Order summary helper)
    formatDateRange(range) {
      if (!Array.isArray(range) || range.length !== 2) return "无";
      return `${this.formatDate(range[0])} 至 ${this.formatDate(range[1])}`;
    },
    // Format user list (Order summary helper)
    formatUsers(userIds) {
      if (!userIds.length) return "无";
      return userIds
          .map((id) => this.userOptions.find((user) => user.id === id)?.name || "未知用户")
          .join(", ");
    },
    // Format form list (Order summary helper)
    formatForms(formIds) {
      if (!formIds.length) return "无";
      return formIds.join(", ");
    },
    // Format cron expression to Chinese (Order summary helper)
    formatCronExpression(cron) {
      if (!cron) return "无效的 Cron 表达式";
      try {
        return humanizeCronInChinese(cron);
      } catch {
        return "无法解析 Cron 表达式";
      }
    },
    // Transform order data to match order backend api request
    transformOrderData(data) {
      return {
        type: data.type,
        name: data.name || null, // Fallback for name
        description: data.description || null,
        startTime: data.dateRange?.[0] || null,
        endTime: data.dateRange?.[1] || null,
        cronExpression: normalizeCronExpression(data.cronExpression) || null,
        dispatchLimit: data.dispatchLimit,
        customTime: data.customTime || null,
        dueDateOffsetMinute: data.dueDateOffsetMinute,
        userIds: data.userIds || [],
        formIds: data.formIds || [],
        productIds: data.productIds || [],
        rawMaterialIds: data.rawMaterialIds || [],
        productionWorkOrderIds: data.productionWorkOrderIds || [],
        equipmentIds: data.equipmentIds || [],
        maintenanceWorkOrderIds: data.maintenanceWorkOrderIds || [],
        samplingLocationIds: data.samplingLocationIds || [],
        instrumentIds: data.instrumentIds || [],
        testSubjectIds: data.testSubjectIds || [],
      };
    },
    async loadUserOptions() {
      try {
        const response = await fetchUsers();
        const users = response.data?.data || [];
        this.userOptions = users.map((user) => ({
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
    async loadAllOptions() {
      await Promise.all([
        this.loadProductOptions(),
        this.loadRawMaterialOptions(),
        this.loadProductionWorkOrderOptions(),
        this.loadEquipmentOptions(),
        this.loadMaintenanceWorkOrderOptions(),
        this.loadUserOptions(),
      ]);
    },
  },
  mounted() {
    this.loadAllOptions()
  }
}


</script>

<style scoped>
.dispatch-block {
  margin-bottom: 20px;
}
.dispatch-preview {
  margin-top: 16px;
}
.dispatch-details {
  padding-left: 20px; /* Add indentation */
  list-style-type: disc; /* Use bullet points for clarity */
}
.dispatch-details li {
  margin-bottom: 8px; /* Add spacing between items */
}
</style>

<template>
  <!-- Fullscreen Dialog -->
  <el-dialog v-model="visible" title="创建质检工单" fullscreen :close-on-click-modal="false" @close="handleClose">
    <el-container style="height: 100vh; display: flex;">

      <!-- Left Side: Form Section -->
      <el-main class="form-section">
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

          <el-divider>全局选项</el-divider>

          <!-- Apply User to All -->
          <el-form-item label="应用人员到所有派发">
            <el-switch v-model="qcOrderForm.applyUserToAll" />
          </el-form-item>

          <!-- Global Users -->
          <el-form-item v-if="qcOrderForm.applyUserToAll" label="选择全局人员">
            <el-select v-model="qcOrderForm.globalUserIds" multiple filterable placeholder="请选择人员">
              <el-option v-for="user in userOptions" :key="user.id" :label="user.name" :value="user.id" />
            </el-select>
          </el-form-item>

          <!-- Apply Form to All -->
          <el-form-item label="应用表单到所有派发">
            <el-switch v-model="qcOrderForm.applyFormToAll" />
          </el-form-item>

          <!-- Global Forms -->
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
          <div v-for="(dispatch, index) in qcOrderForm.dispatches" :key="dispatch.id" class="dispatch-block">
            <el-card :header="'任务 ' + (index + 1)" shadow="always">
              <div class="dispatch-header">
                <el-button type="text" @click="toggleCollapse(index)">
                  {{ dispatch.collapsed ? '展开' : '收起' }}
                </el-button>
                <el-button type="danger" plain @click="removeDispatch(index)">删除任务</el-button>
              </div>

              <div v-show="!dispatch.collapsed">
                <el-form-item label="任务名称">
                  <el-input v-model="dispatch.name" placeholder="请输入任务名称" />
                </el-form-item>

                <el-form-item label="任务备注">
                  <el-input type="textarea" v-model="dispatch.description" placeholder="请输入备注" />
                </el-form-item>

                <el-divider>时间调度</el-divider>

                <!-- Schedule Type -->
                <el-form-item label="任务类型" required>
                  <el-radio-group v-model="dispatch.type">
                    <el-radio label="regular">周期计划</el-radio>
                    <el-radio label="custom">单次计划</el-radio>
                  </el-radio-group>
                </el-form-item>

                <!-- Cron Expression -->
                <el-form-item v-if="dispatch.type === 'regular'" label="执行计划">
                  <cron-element-plus v-model="dispatch.cronExpression" :button-props="{ type: 'primary' }" locale="zh-cn" />
                </el-form-item>

                <!-- Start/End Time -->
                <el-form-item v-if="dispatch.type === 'regular'" label="执行周期">
                  <el-date-picker v-model="dispatch.dateRange" type="datetimerange" range-separator="To" start-placeholder="开始时间" end-placeholder="停止时间" />
                </el-form-item>

                <el-form-item v-else label="执行时间">
                  <el-date-picker v-model="dispatch.customTime" type="datetime" placeholder="选择执行时间" />
                </el-form-item>

                <el-divider>质检任务配置</el-divider>

                <!-- Due Date Offset -->
                <el-form-item label="派发任务时限(分钟)">
                  <el-input-number v-model="dispatch.dueDateOffsetMinute" :min="0" />
                </el-form-item>

                <!-- Test Subject Selection -->
                <el-form-item label="检测项目">
                  <el-select v-model="dispatch.testSubjectIds" placeholder="请选择检测项目" multiple filterable>
                    <el-option v-for="subject in testSubjectOptions" :key="subject.id" :label="subject.name" :value="subject.id" />
                  </el-select>
                </el-form-item>

                <!-- Sampling Location Selection -->
                <el-form-item label="采样位置">
                  <el-select v-model="dispatch.samplingLocationIds" placeholder="请选择采样位置" multiple filterable>
                    <el-option v-for="location in samplingLocationOptions" :key="location.id" :label="location.name" :value="location.id" />
                  </el-select>
                </el-form-item>
              </div>
            </el-card>
          </div>

          <!-- Add Dispatch -->
          <el-button type="primary" plain @click="addDispatch">新增计划任务</el-button>
        </el-form>
      </el-main>

      <!-- Right Side: Summary Section -->
      <el-aside width="400px" class="summary-section">
        <el-card shadow="always">
          <h4>工单预览</h4>
          <p><strong>名称:</strong> {{ qcOrderForm.name }}</p>
          <p><strong>备注:</strong> {{ qcOrderForm.description || "无" }}</p>
          <p><strong>任务总数:</strong> {{ qcOrderForm.dispatches.length }}</p>
          <div v-for="(dispatch, index) in qcOrderForm.dispatches" :key="dispatch.id" class="dispatch-preview">
            <h5>任务 {{ index + 1 }}</h5>
            <ul class="dispatch-details">
              <li>任务类型: <strong>{{ dispatch.type === 'regular' ? '周期计划' : '单次计划' }}</strong></li>
              <li v-if="dispatch.type === 'regular'">
                执行计划: <strong>{{ dispatch.cronExpression }}</strong>
              </li>
              <li v-if="dispatch.type === 'regular'">
                执行周期: <strong>{{ dispatch.dateRange }}</strong>
              </li>
              <li v-else>
                执行时间: <strong>{{ dispatch.customTime }}</strong>
              </li>
              <li>
                派发任务时限: <strong>{{ dispatch.dueDateOffsetMinute }} 分钟</strong>
              </li>
            </ul>
          </div>
        </el-card>

        <!-- Submit & Reset Buttons -->
        <div class="summary-actions">
          <el-button type="primary" @click="submitForm">提交</el-button>
          <el-button type="warning" @click="resetForm">重置</el-button>
          <el-button @click="handleClose">取消</el-button>
        </div>
      </el-aside>

    </el-container>
  </el-dialog>
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
            this.$emit("order-created"); // Emit success event to parent
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
      return ${this.formatDate(range[0])} 至 ${this.formatDate(range[1])};
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
          name: ${workOrder.name} (${workOrder.code}),
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
          name: ${equipment.name} (${equipment.code}),
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
          id: workOrder.id,        // Use id as the value
          name: ${workOrder.name} (${workOrder.code}), // Combine name and code for clarity
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
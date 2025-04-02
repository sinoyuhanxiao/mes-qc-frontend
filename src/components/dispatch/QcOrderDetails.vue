<template>
  <div style="overflow-y: hidden">
    <el-form label-position="left" label-width="140px" style="padding: 10px; max-height: 75vh; overflow-y: auto;">
    <div style="display: flex; justify-content: flex-end;">
      <!-- Action Buttons -->
      <el-button-group>
        <el-button type="success" @click="handleEditOrder">修改</el-button>
        <el-button type="danger" @click="handleDeleteOrder">删除</el-button>
      </el-button-group>
    </div>

    <el-divider>工单详情</el-divider>

    <el-form-item
        label="工单名称"
        class="wrap-text">
      {{ currentOrder.name }}
    </el-form-item>

    <el-form-item
        label="工单号码">
      {{ currentOrder.id }}
    </el-form-item>

    <el-form-item
        label="工单备注"
        class="wrap-text"
        v-if="currentOrder.description">
      {{ currentOrder.description }}
    </el-form-item>

    <el-form-item
        label="状态">
      <el-tag
          :type="getQcOrderStateTagData(currentOrder.state).type"
          size="small"
      >
        {{ getQcOrderStateTagData(currentOrder.state).label }}
      </el-tag>
    </el-form-item>

    <el-form-item
        label="创建时间"
        v-if="currentOrder.created_at">
      {{ formatDate(currentOrder.created_at) }}
    </el-form-item>

    <el-form-item
        label="创建者"
        v-if="currentOrder.created_by">
      <UserReference :userId="currentOrder.created_by" />
    </el-form-item>

    <el-form-item
        label="更新时间"
        v-if="currentOrder.updated_at">
      {{ formatDate(currentOrder.updated_at) }}
    </el-form-item>

    <el-form-item
        label="更新者"
        v-if="currentOrder.updated_by">
      <UserReference :userId="currentOrder.updated_by" />
    </el-form-item>

    <el-divider>派发计划列表</el-divider>
    <div v-if="dispatches.length > 0">
      <el-card
          v-for="(dispatch, index) in dispatches"
          :key="dispatch.id"
          style="margin-bottom: 20px;"
      >
        <div
            style="display: flex;
            justify-content: flex-end;"
        >
          <!-- Expand Arrow -->
          <el-button
              :link="true"
              @click="toggleCollapse(index)"
              :icon="dispatch.collapsed ? 'el-icon-arrow-down' : 'el-icon-arrow-up'">
            {{ dispatch.collapsed ? '展开' : '收起' }}
          </el-button>

          <el-button
              v-if="dispatch.type === 'regular' && dispatch.state === 1"
              type="info"
              @click="handlePauseOrderDispatch(dispatch.id)">
            暂停
          </el-button>
          <el-button
              v-if="dispatch.type === 'regular' && dispatch.state === 5"
              type="info"
              @click="handleResumeOrderDispatch(dispatch.id)">
            重启
          </el-button>
        </div>
        <div v-show="!dispatch.collapsed">
          <el-form-item
              label="计划名称"
              class="wrap-text"
              v-if="dispatch.name">
            {{ dispatch.name }}
          </el-form-item>

          <el-form-item
              label="计划号码">
            {{ dispatch.id }}
          </el-form-item>

          <el-form-item
              label="计划备注"
              class="wrap-text"
              v-if="dispatch.description">
            {{ dispatch.description }}
          </el-form-item>

          <el-form-item
              label="状态">
            <el-tag
                :type="getDispatchStateTagData(dispatch.state).type"
                size="small"
            >
              {{ getDispatchStateTagData(dispatch.state).label }}
            </el-tag>
          </el-form-item>

          <el-divider>时间调度</el-divider>

          <el-form-item label="类型">
            {{ formatScheduleType(dispatch.type) }}
          </el-form-item>

          <el-form-item label="执行计划" v-if="dispatch.cron_expression">
            {{ humanizeCronInChinese(unnormalizeCronExpression(dispatch.cron_expression)) }}
          </el-form-item>

          <el-form-item label="周期开始时间" v-if="dispatch.start_time">
            {{ formatDate(dispatch.start_time) }}
          </el-form-item>

          <el-form-item label="周期停止时间" v-if="dispatch.end_time">
            {{ formatDate(dispatch.end_time) }}
          </el-form-item>

          <el-form-item label="派发次数上限" v-if="dispatch.type === 'regular'">
            {{ dispatch.dispatch_limit === -1 ? "无限制" : dispatch.dispatch_limit }}
          </el-form-item>

          <el-form-item label="执行时间" v-if="dispatch.custom_time">
            {{ formatDate(dispatch.custom_time) }}
          </el-form-item>

          <el-form-item label="下次派发时间" v-if="dispatch.nextExecutionTime && dispatch.type === 'regular'">
            <el-countdown :value="dispatch.nextExecutionTime" format="HH:mm:ss" @finish="handleCountdownFinish(dispatch)"/>
          </el-form-item>

          <el-form-item label="已执行次数">
            {{ dispatch.executed_count }}
          </el-form-item>

          <el-form-item label="创建者" v-if="dispatch.created_by">
            <UserReference :userId="dispatch.created_by" />
          </el-form-item>


          <el-form-item label="创建时间" v-if="dispatch.created_at">
            {{ formatDate(dispatch.created_at) }}
          </el-form-item>

          <el-form-item label="更新者" v-if="dispatch.updated_by">
            <UserReference :userId="dispatch.updated_by"/>
          </el-form-item>

          <el-form-item label="更新时间" v-if="dispatch.updated_at">
            {{ formatDate(dispatch.updated_at) }}
          </el-form-item>

          <el-divider>质检任务配置</el-divider>

          <el-form-item label="派发任务时限 (分钟)">
            {{ dispatch.due_date_offset_minute }}
          </el-form-item>

          <el-form-item label="检测项目" v-if="dispatch.testSubjectDetails.length > 0">
            <div class="tags">
              <el-tag v-for="testSubject in dispatch.testSubjectDetails"
                      :key="testSubject.id"
                      type="info"
                      size="small">
                <el-popover
                    effect="light"
                    trigger="hover"
                    placement="top"
                    width="auto">
                  <template #default>
                    <div>检测项目号码: {{ testSubject.id }}</div>
                    <div v-if="testSubject.description">备注: {{ testSubject.description }}</div>
                    <div v-if="testSubject.status">状态: {{ testSubject.status }}</div>
                    <div v-if="testSubject.created_by">创建者: {{ testSubject.created_by }}</div>
                    <div v-if="testSubject.created_at">创建时间: {{ formatDate(testSubject.created_at) }}</div>
                    <div v-if="testSubject.updated_by">更新者: {{ testSubject.updated_by }}</div>
                    <div v-if="testSubject.updated_at">更新时间: {{ formatDate(testSubject.updated_at) }}</div>

                  </template>
                  <template #reference>
                    {{ testSubject.name }}
                  </template>
                </el-popover>
              </el-tag>
            </div>
          </el-form-item>

          <el-form-item label="采样点" v-if="dispatch.samplingLocationDetails.length > 0">
            <div class="tags">
              <el-tag v-for="samplingLocation in dispatch.samplingLocationDetails"
                      :key="samplingLocation.id"
                      type="info"
                      size="small"
                      effect="light">
                <el-popover
                    effect="light"
                    trigger="hover"
                    placement="top"
                    width="auto">
                  <template #default>
                    <div>采样点号码: {{ samplingLocation.id }}</div>
                    <div v-if="samplingLocation.description">备注: {{ samplingLocation.description }}</div>
                    <div v-if="samplingLocation.status">状态: {{ samplingLocation.status }}</div>
                    <div v-if="samplingLocation.created_by">创建者: {{ samplingLocation.created_by }}</div>
                    <div v-if="samplingLocation.created_at">创建时间: {{ formatDate(samplingLocation.created_at) }}</div>
                    <div v-if="samplingLocation.updated_by">更新者: {{ samplingLocation.updated_by }}</div>
                    <div v-if="samplingLocation.updated_at">更新时间: {{ formatDate(samplingLocation.updated_at) }}</div>

                  </template>
                  <template #reference>
                    {{ samplingLocation.name }}
                  </template>
                </el-popover>
              </el-tag>
            </div>
          </el-form-item>

          <el-form-item label="仪器" v-if="dispatch.instrumentDetails.length > 0">
            <div class="tags">
              <el-tag
                  v-for="instrument in dispatch.instrumentDetails"
                  :key="instrument.id"
                  type="info"
                  size="small"
                  effect="light"
              >
                <el-popover
                    effect="light"
                    trigger="hover"
                    placement="top"
                    width="auto">
                  <template #default>
                    <div>仪器号码 : {{ instrument.id }}</div>
                    <div v-if="instrument.description">备注: {{ instrument.description}}</div>
                    <div v-if="instrument.model_number">型号: {{ instrument.model_number }}</div>
                    <div v-if="instrument.manufacturer">制造商: {{ instrument.manufacturer }}</div>
                    <div v-if="instrument.type">仪器类型: {{ instrument.type }}</div>
                    <div v-if="instrument.status">状态: {{ instrument.status }}</div>
                    <div v-if="instrument.created_by">创建者: {{ instrument.created_by }}</div>
                    <div v-if="instrument.created_at">创建时间: {{ formatDate(instrument.created_at) }}</div>
                    <div v-if="instrument.updated_by">更新者: {{ instrument.updated_by }}</div>
                    <div v-if="instrument.updated_at">更新时间: {{ formatDate(instrument.updated_at) }}</div>

                  </template>
                  <template #reference>
                    {{ instrument.name }}
                  </template>
                </el-popover>
              </el-tag>
            </div>
          </el-form-item>

          <el-form-item label="检测人员" v-if="dispatch.userDetails.length > 0">
            <div
                v-for="user in dispatch.userDetails"
                class="tags"
            >
              <UserReference :userId="user.id"/>
            </div>
          </el-form-item>

          <el-form-item label="质检表单" v-if="dispatch.form_ids.length > 0">
            <div class="tags">
              <el-tag
                  v-for="(formId) in dispatch.form_ids"
                  :key="formId"
                  type="success"
                  size="small"
                  effect="light"
              >
                <el-popover effect="light" trigger="hover" placement="top" width="auto">
                  <template #default>
                    <div>号码: {{ formId }}</div>
                    <div>表单名: {{ getFormById(formId) }}</div>
                  </template>
                  <template #reference>
                    {{ getFormById(formId) }}
                  </template>
                </el-popover>
              </el-tag>
            </div>
          </el-form-item>

          <!-- System Associations -->
          <el-divider>系统关联</el-divider>

          <el-form-item label="产品" v-if="dispatch.productDetails.length > 0">
            <div class="tags">
              <el-tag
                  v-for="(product) in dispatch.productDetails"
                  :key="product.id"
                  type="success"
                  size="small"
                  effect="light"
              >
                <el-popover
                    effect="light"
                    trigger="hover"
                    placement="top"
                    width="300px">
                  <template #default>
                    <!-- Product Details -->
                    <div><strong>号码:</strong> {{ product.id }}</div>
                    <div><strong>代码:</strong> {{ product.product_code }}</div>
                    <div><strong>描述:</strong> {{ product.description || '无' }}</div>
                    <div><strong>单位销售价:</strong> {{ product.unit_sales_price || '无'  }}</div>
                    <div><strong>单位资源成本:</strong> {{ product.unit_resource_cost || '无' }}</div>
                    <div><strong>生产数量:</strong> {{ product.produced_quantity || '无' }}</div>
                    <div><strong>更新时间:</strong> {{ formatDate(product.updated_at) || '无' }}</div>

                    <!-- Image Display -->
                    <div v-if="product.image_paths">
                      <el-image
                          :src="product.image_paths"
                          fit="fill"
                          style="width: 50%; max-height: 50%;"
                          :preview-src-list="[product.image_paths]"
                          preview/>
                    </div>
                  </template>
                  <template #reference>
                    {{ product.name }}
                  </template>
                </el-popover>
              </el-tag>
            </div>
          </el-form-item>

          <el-form-item label="原料" v-if="dispatch.rawMaterialDetails.length > 0">
            <div class="tags">
              <el-tag
                  v-for="material in dispatch.rawMaterialDetails"
                  :key="material.id"
                  type="warning"
                  size="small"
                  effect="light"
              >
                <el-popover
                    effect="light"
                    trigger="hover"
                    placement="top"
                    width="300px">
                  <template #default>
                    <!-- Raw Material Details -->
                    <div><strong>号码:</strong> {{ material.id }}</div>
                    <div><strong>代码:</strong> {{ material.code }}</div>
                    <div><strong>描述:</strong> {{ material.description || '无' }}</div>
                    <div><strong>单位价格:</strong> {{ material.unit_price }}</div>
                    <div><strong>最小库存:</strong> {{ material.minimum_inventory }}</div>
                    <div><strong>当前库存:</strong> {{ material.current_stock }}</div>
                    <div><strong>可用库存:</strong> {{ material.available_stock }}</div>
                    <div><strong>已分配库存:</strong> {{ material.held_stock }}</div>
                    <div><strong>供应商 ID:</strong> {{ material.vendor_id }}</div>
                    <div><strong>更新时间:</strong> {{ formatDate(material.updated_at) }}</div>

                    <!-- Image Display -->
                    <div v-if="material.image_path" style="margin-top: 10px;">
                      <el-image
                          :src="material.image_path"
                          fit="fill"
                          style="width: 50%; max-height: 50%;"
                          :preview-src-list="[material.image_path]"
                          preview/>
                    </div>
                  </template>
                  <template #reference>
                    {{ material.name }}
                  </template>
                </el-popover>
              </el-tag>
            </div>
          </el-form-item>

          <el-form-item label="生产工单" v-if="dispatch.productionWorkOrderDetails.length > 0">
            <div class="tags">
              <el-tag
                  v-for="workOrder in dispatch.productionWorkOrderDetails"
                  :key="workOrder.id"
                  type="primary"
                  size="small"
                  effect="light"
              >
                <el-popover
                    effect="light"
                    trigger="hover"
                    placement="top"
                    width="300px">
                  <template #default>
                    <!-- Production Work Order Details -->
                    <div><strong>工单号码:</strong> {{ workOrder.id }}</div>
                    <div><strong>代码:</strong> {{ workOrder.code }}</div>
                    <div><strong>描述:</strong> {{ workOrder.description || '无' }}</div>
                    <div><strong>计划数量:</strong> {{ workOrder.wo_quantity }}</div>
                    <div><strong>未排数量:</strong> {{ workOrder.unscheduled_quantity }}</div>
                    <div><strong>工单截止日期:</strong> {{ formatDate(workOrder.wo_deadline) }}</div>
                    <div><strong>产品号码:</strong> {{ workOrder.product_id }}</div>
                    <div><strong>批准时间:</strong> {{ formatDate(workOrder.approved_at) }}</div>
                    <div><strong>起始时间:</strong> {{ formatDate(workOrder.start_date) }}</div>
                    <div><strong>结束时间:</strong> {{ formatDate(workOrder.end_date) }}</div>
                    <div><strong>预计生产时间:</strong> {{ workOrder.estimated_production_time }} 小时</div>
                    <div><strong>生产线:</strong> {{ workOrder.production_line }}</div>
                    <div><strong>更新日期:</strong> {{ formatDate(workOrder.updated_at) }}</div>
                    <div><strong>工单识别码:</strong> {{ workOrder.recurrence_uuid }}</div>

                    <!-- Image Display -->
                    <div v-if="workOrder.image_path" style="margin-top: 10px;">
                      <el-image
                          :src="workOrder.image_path"
                          fit="fill"
                          style="width: 50%; max-height: 50%;"
                          :preview-src-list="[workOrder.image_path]"
                          preview/>
                    </div>
                  </template>
                  <template #reference>
                    {{ workOrder.name }}
                  </template>
                </el-popover>
              </el-tag>
            </div>
          </el-form-item>

          <el-form-item label="设备" v-if="dispatch.equipmentDetails.length > 0">
            <div class="tags">
              <el-tag
                  v-for="equipment in dispatch.equipmentDetails"
                  :key="equipment.id"
                  type="info"
                  size="small"
                  effect="light"
              >
                <el-popover
                    effect="light"
                    trigger="hover"
                    placement="top"
                    width="300px">
                  <template #default>

                    <!-- Equipment Details -->
                    <div><strong>设备号码:</strong> {{ equipment.id }}</div>
                    <div><strong>代码:</strong> {{ equipment.code }}</div>
                    <div><strong>PLC:</strong> {{ equipment.plc }}</div>
                    <div><strong>序列号:</strong> {{ equipment.serial_number }}</div>
                    <div><strong>供应商号码:</strong> {{ equipment.vendor_id }}</div>
                    <div><strong>位置号码:</strong> {{ equipment.location_id }}</div>

                    <!-- Image Display -->
                    <div v-if="equipment.image_path" style="margin-top: 10px;">
                      <el-image
                          :src="equipment.image_path"
                          fit="fill"
                          style="width: 50%; max-height: 50%;"
                          :preview-src-list="[equipment.image_path]"
                          preview/>
                    </div>
                  </template>
                  <template #reference>
                    {{ equipment.name }}
                  </template>
                </el-popover>
              </el-tag>
            </div>
          </el-form-item>

          <el-form-item label="维护工单" v-if="dispatch.maintenanceWorkOrderDetails.length > 0">
            <div class="tags">
              <el-tag
                  v-for="workOrder in dispatch.maintenanceWorkOrderDetails"
                  :key="workOrder.id"
                  type="danger"
                  size="small"
                  effect="light"
              >
                <el-popover
                    effect="light"
                    trigger="hover"
                    placement="top"
                    width="300px">
                  <template #default>
                    <!-- Maintenance Work Order Details -->
                    <div><strong>维护工单号码:</strong> {{ workOrder.id }}</div>
                    <div><strong>代码:</strong> {{ workOrder.code }}</div>
                    <div><strong>描述:</strong> {{ workOrder.description || '无' }}</div>
                    <div><strong>开始日期:</strong> {{ formatDate(workOrder.start_date) }}</div>
                    <div><strong>结束日期:</strong> {{ formatDate(workOrder.end_date) }}</div>
                    <div><strong>工单识别码:</strong> {{ workOrder.recurrence_uuid }}</div>
                    <div><strong>到期时间:</strong> {{ formatDate(workOrder.due_date) }}</div>
                    <div><strong>预计分钟数:</strong> {{ workOrder.estimated_minutes }}</div>
                    <div><strong>生产线号码:</strong> {{ workOrder.production_line_id }}</div>

                    <!-- Image Display -->
                    <div v-if="workOrder.image_path" style="margin-top: 10px;">
                      <el-image
                          :src="workOrder.image_path"
                          fit="fill"
                          style="width: 50%; max-height: 50%;"
                          :preview-src-list="[workOrder.image_path]"
                          preview/>
                    </div>
                  </template>
                  <template #reference>
                    {{ workOrder.name }}
                  </template>
                </el-popover>
              </el-tag>
            </div>
          </el-form-item>

          <el-divider>已派发任务</el-divider>
          <!-- Dispatched Tasks Table -->
          <DispatchedTasksList
              :dispatch-id="dispatch.id"
              :form-map="formMap"
              :user-map="userMap"
              :show-search-box="true"
              :key="refreshKey"
          />
        </div>
      </el-card>
    </div>
    <div v-else>- 无派发任务 -</div>

  </el-form>
  </div>
</template>

<script>
import {
  formatDate,
  formatScheduleType,
  unnormalizeCronExpression,
  getQcOrderStateTagData,
  getDispatchStateTagData

} from "@/utils/dispatch-utils";
import { humanizeCronInChinese } from "cron-chinese";
import { getUserById } from "@/services/userService";
import {getProductById, getProductionWorkOrderById, getRawMaterialById} from "@/services/productionService";
import {getEquipmentById, getMaintenanceWorkOrderById} from "@/services/maintenanceService";
import UserReference from "@/components/dispatch/UserReference.vue";
import DispatchedTasksList from "@/components/dispatch/DispatchedTaskList.vue";

import {getDispatchNextExecutionTime, pauseDispatch, resumeDispatch} from "@/services/dispatchService";
import {getTestSubjectById} from "@/services/testSubjectService";
import {getSamplingLocationById} from "@/services/samplingLocationService";
import {getInstrumentById} from "@/services/instrumentService";

export default {
  components: {UserReference, DispatchedTasksList},
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
  },
  data() {
    return {
      refreshKey: 0,
      dispatches: [],
      createdByDetail: null,
      updatedByDetail: null,
    };
  },
  methods: {
    getDispatchStateTagData,
    getQcOrderStateTagData,
    humanizeCronInChinese,
    formatDate,
    formatScheduleType,
    unnormalizeCronExpression,
    async fetchUserHelper(userId) {
      if (userId) {
        try {
          const response = await getUserById(userId);
          return response.data.data || null;
        } catch (error) {
          console.error("Failed to get user details:", error);
        }
      }
    },
    async fetchCreatedByDetail() {
      if (this.currentOrder.created_by) {
        try {
          this.createdByDetail = this.fetchUserHelper(this.currentOrder.created_by);
        } catch (error) {
          console.error("Failed to fetch created by details:", error);
        }
      }
    },
    async fetchUpdatedByDetail() {
      if (this.currentOrder.updated_by) {
        try {
          this.updatedByDetail = this.fetchUserHelper(this.currentOrder.updated_by);
        } catch (error) {
          console.error("Failed to fetch updated by details:", error);
        }
      }
    },
    async fetchDetails(ids, fetchFunction) {
      const details = [];
      for (const id of ids || []) {
        try {
          const response = await fetchFunction(id);
          if (response?.data?.data) details.push(response.data.data);
        } catch (e) {
          console.error(`Failed to fetch detail for ID: ${id}`, e);
        }
      }
      return details;
    },
    async loadDispatchDetails() {
      this.dispatches = this.currentOrder.dispatches.map(dispatch => ({
        ...dispatch,
        createdByDetail:null,
        updatedByDetail:null,
        userDetails:[],
        testSubjectDetails:[],
        samplingLocationDetails:[],
        instrumentDetails:[],
        productDetails: [],
        rawMaterialDetails: [],
        maintenanceWorkOrderDetails: [],
        equipmentDetails: [],
        productionWorkOrderDetails: [],
        nextExecutionTime: null,
        collapsed: false,
      }));

      for (let dispatch of this.dispatches) {
        try {
          dispatch.createdByDetail = await this.fetchUserHelper(dispatch.created_by);
          dispatch.updatedByDetail = await this.fetchUserHelper(dispatch.updated_by);
          dispatch.productDetails = await this.fetchDetails(dispatch.product_ids, getProductById);
          dispatch.rawMaterialDetails = await this.fetchDetails(dispatch.raw_material_ids, getRawMaterialById);
          dispatch.productionWorkOrderDetails = await this.fetchDetails(dispatch.production_work_order_ids, getProductionWorkOrderById);
          dispatch.equipmentDetails = await this.fetchDetails(dispatch.equipment_ids, getEquipmentById);
          dispatch.maintenanceWorkOrderDetails = await this.fetchDetails(dispatch.maintenance_work_order_ids, getMaintenanceWorkOrderById);
          dispatch.userDetails = await this.fetchDetails(dispatch.user_ids, getUserById);
          dispatch.testSubjectDetails = await this.fetchDetails(dispatch.test_subject_ids, getTestSubjectById);
          dispatch.samplingLocationDetails = await this.fetchDetails(dispatch.sampling_location_ids, getSamplingLocationById);
          dispatch.instrumentDetails = await this.fetchDetails(dispatch.instrument_ids, getInstrumentById);
          await this.fetchNextExecutionTime(dispatch);
        } catch (e) {
          console.error(`Error fetching details for dispatch ID: ${dispatch.id}`, e);
        }
      }
    },
    getFormById(id) {
      return this.formMap[id] || "未知表单";
    },
    async fetchNextExecutionTime(dispatch) {
      if (!dispatch || !dispatch.id) return;
      try {
        const response = await getDispatchNextExecutionTime(dispatch.id);
        if (response.data.data) {
          dispatch.nextExecutionTime = new Date(response.data.data).getTime(); // Convert to timestamp
        }
      } catch (error) {
        console.error(`Failed to fetch next execution time for Dispatch ID ${dispatch.id}:`, error);
        dispatch.nextExecutionTime = null;
      }
    },
    handleCountdownFinish(dispatch) {
      setTimeout(() => {
        this.fetchNextExecutionTime(dispatch);
        this.refreshKey++; // refresh dispatched list
        this.$emit("refresh-order"); // trigger refreshing current order on order management
      }, 2000); // Refresh next execution time after 2 second
    },
    toggleCollapse(index) {
      this.dispatches[index].collapsed =
          !this.dispatches[index].collapsed;
    },
    async handlePauseOrderDispatch(dispatchId) {
      try {
        await this.$confirm("确定暂停任务吗？", "提示", { type: "warning" });

        const userId = this.$store.getters.getUser.id;
        const response = await pauseDispatch(dispatchId, userId);

        if (response && response.status === 200) {
          this.$message.success("任务已暂停");
          this.$emit("refresh-order"); //
        } else {
          this.$message.error("暂停任务失败，请重试！");
        }
      } catch (e) {
        console.log("Pause action canceled or failed.");
      }
    },
    async handleResumeOrderDispatch(dispatchId) {
      try {
        await this.$confirm("确定重启任务吗？", "提示", { type: "warning" });

        const userId = this.$store.getters.getUser.id;
        const response = await resumeDispatch(dispatchId, userId);

        if (response && response.status === 200) {
          this.$message.success("任务已重启");
          this.$emit("refresh-order"); //
        } else {
          this.$message.error("重启任务失败，请重试！");
        }
      } catch (e) {
        console.log("Resume action canceled or failed.");
      }
    },
    async handleEditOrder(){
      await this.$confirm("确定修改工單吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      });
      this.$emit('on-edit');
    },
    async handleDeleteOrder(){
      await this.$confirm("确定删除工單吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      });
      this.$emit('on-delete');
    }
  },
  mounted() {
    // fetch order createdBy/updatedBy
    this.fetchCreatedByDetail();
    this.fetchUpdatedByDetail();

    // fetch each dispatch's data under order
    this.loadDispatchDetails();
  },
  watch: {
    currentOrder: {
      immediate: true,
      handler() {
        this.fetchCreatedByDetail();
        this.fetchUpdatedByDetail();
        this.loadDispatchDetails();
      }
    }
  }
};
</script>

<style scoped>

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-right: 10px;
}

.wrap-text {
  display: block;
  word-break: break-word; /* Ensures text breaks and wraps */
  white-space: normal; /* Allows text to wrap normally */
  overflow-wrap: break-word; /* Ensures long words break correctly */
}
</style>

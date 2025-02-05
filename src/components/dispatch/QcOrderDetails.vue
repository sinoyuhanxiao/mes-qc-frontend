<template>
  <el-form label-position="left" label-width="140px" class="order-details">

    <div class="details-header">
      <!-- Action Buttons -->
      <el-button-group>
        <el-button type="success" @click="$emit('edit')">编辑</el-button>
        <el-button type="danger" @click="$emit('delete')">删除</el-button>
      </el-button-group>
    </div>

    <el-divider>QC 工单详情</el-divider>

    <el-form-item label="工单名称">
      {{ order.name }}
    </el-form-item>

    <el-form-item label="工单ID">
      {{ order.order_id }}
    </el-form-item>

    <el-form-item label="任务备注" v-if="order.description">
      {{ order.description }}
    </el-form-item>

    <el-form-item label="状态">
      <el-tag
          :type="getStateTagType(order.state).type"
          size="small"
      >
        {{ getStateTagType(order.state).label }}
      </el-tag>
    </el-form-item>

    <el-form-item label="创建时间" v-if="order.created_at">
      {{ formatDate(order.created_at) }}
    </el-form-item>

    <UserReference type="创建者" :userId="order.created_by" />

    <el-form-item label="更新时间" v-if="order.updated_at">
      {{ formatDate(order.updated_at) }}
    </el-form-item>

    <UserReference type="更新者" :userId="order.updated_by" />

    <el-divider>任务列表</el-divider>
    <div v-if="dispatches.length > 0">
      <el-card
          v-for="(dispatch, index) in dispatches"
          :key="dispatch.id"
          class="dispatch-block"
      >
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

          <el-button
              v-if="dispatch.state === 1"
              type="info"
              @click="$emit('pause', dispatch.id)">
            暂停
          </el-button>
          <el-button
              v-if="dispatch.state === 5"
              type="info"
              @click="$emit('resume', dispatch.id)">
            重启
          </el-button>
        </div>
        <div v-show="!dispatch.collapsed">
          <h4>任务: {{ dispatch.name }}</h4>

          <el-form-item label="任务ID">
            {{ dispatch.id }}
          </el-form-item>

          <el-form-item label="任务备注" v-if="dispatch.description">
            {{ dispatch.description }}
          </el-form-item>

          <el-form-item label="任务状态">
            <el-tag
                :type="getStateTagType(dispatch.state).type"
                size="small"
            >
              {{ getStateTagType(dispatch.state).label }}
            </el-tag>
          </el-form-item>

          <el-divider>时间调度</el-divider>

          <el-form-item label="任务计划类型">
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

          <el-form-item label="下次派发时间" v-if="dispatch.nextExecutionTime">
            <el-countdown :value="dispatch.nextExecutionTime" format="HH:mm:ss" @finish="handleCountdownFinish(dispatch)"/>
          </el-form-item>

          <el-form-item label="已执行次数">
            {{ dispatch.executed_count }}
          </el-form-item>

          <el-divider>质检任务配置</el-divider>

          <el-form-item label="派发任务时限 (分钟)">
            {{ dispatch.due_date_offset_minute }}
          </el-form-item>

          <el-form-item label="检测项目" v-if="dispatch.test_subject_ids.length > 0">
            <div class="tags">
              <el-tag v-for="id in dispatch.test_subject_ids" :key="id" type="info" size="small">
                {{ findTestSubjectName(id) }}
              </el-tag>
            </div>
          </el-form-item>

          <el-form-item label="采样位置" v-if="dispatch.sampling_location_ids.length > 0">
            <div class="tags">
              <el-tag v-for="id in dispatch.sampling_location_ids" :key="id" type="info" size="small">
                {{ findSamplingLocationName(id) }}
              </el-tag>
            </div>
          </el-form-item>

          <el-form-item label="仪器" v-if="dispatch.instrument_ids.length > 0">
            <div class="tags">
              <el-tag v-for="id in dispatch.instrument_ids" :key="id" type="info" size="small">
                {{ findInstrumentName(id) }}
              </el-tag>
            </div>
          </el-form-item>

          <el-form-item label="检测人员" v-if="dispatch.dispatch_users.length > 0">
            <div class="tags">
              <el-tag
                  v-for="user in dispatch.dispatch_users"
                  :key="user.id"
                  type="primary"
                  size="small"
                  effect="light"
              >
                <el-popover
                    effect="light"
                    trigger="hover"
                    placement="top"
                    width="auto">
                  <template #default>
                    <div>姓名: {{ user.name }}</div>
                    <div>用户名: {{ user.username }}</div>
                    <div>企业微信: {{ user.wecom_id }}</div>
                  </template>
                  <template #reference>
                    {{ user.name }}
                  </template>
                </el-popover>
              </el-tag>
            </div>
          </el-form-item>

          <el-form-item label="质检表单" v-if="dispatch.dispatch_forms.length > 0">
            <div class="tags">
              <el-tag
                  v-for="(formId) in dispatch.dispatch_forms"
                  :key="formId"
                  type="success"
                  size="small"
                  effect="light"
              >
                <el-popover effect="light" trigger="hover" placement="top" width="auto">
                  <template #default>
                    <div>ID: {{ formId }}</div>
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
                    <div><strong>ID:</strong> {{ product.id }}</div>
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
                    <div><strong>ID:</strong> {{ material.id }}</div>
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
                    <div><strong>ID:</strong> {{ workOrder.id }}</div>
                    <div><strong>代码:</strong> {{ workOrder.code }}</div>
                    <div><strong>描述:</strong> {{ workOrder.description || '无' }}</div>
                    <div><strong>计划数量:</strong> {{ workOrder.wo_quantity }}</div>
                    <div><strong>未排数量:</strong> {{ workOrder.unscheduled_quantity }}</div>
                    <div><strong>工单截止日期:</strong> {{ formatDate(workOrder.wo_deadline) }}</div>
                    <div><strong>产品 ID:</strong> {{ workOrder.product_id }}</div>
                    <div><strong>批准时间:</strong> {{ formatDate(workOrder.approved_at) }}</div>
                    <div><strong>起始时间:</strong> {{ formatDate(workOrder.start_date) }}</div>
                    <div><strong>结束时间:</strong> {{ formatDate(workOrder.end_date) }}</div>
                    <div><strong>预计生产时间:</strong> {{ workOrder.estimated_production_time }} 小时</div>
                    <div><strong>生产线:</strong> {{ workOrder.production_line }}</div>
                    <div><strong>更新日期:</strong> {{ formatDate(workOrder.updated_at) }}</div>
                    <div><strong>UUID:</strong> {{ workOrder.recurrence_uuid }}</div>

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

                    <div><strong>ID:</strong> {{ equipment.id }}</div>
                    <div><strong>代码:</strong> {{ equipment.code }}</div>
                    <div><strong>PLC:</strong> {{ equipment.plc }}</div>
                    <div><strong>序列号:</strong> {{ equipment.serial_number }}</div>
                    <div><strong>供应商 ID:</strong> {{ equipment.vendor_id }}</div>
                    <div><strong>位置 ID:</strong> {{ equipment.location_id }}</div>

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
                    <div><strong>ID:</strong> {{ workOrder.id }}</div>
                    <div><strong>代码:</strong> {{ workOrder.code }}</div>
                    <div><strong>描述:</strong> {{ workOrder.description || '无' }}</div>
                    <div><strong>开始日期:</strong> {{ formatDate(workOrder.start_date) }}</div>
                    <div><strong>结束日期:</strong> {{ formatDate(workOrder.end_date) }}</div>
                    <div><strong>重复 UUID:</strong> {{ workOrder.recurrence_uuid }}</div>
                    <div><strong>到期时间:</strong> {{ formatDate(workOrder.due_date) }}</div>
                    <div><strong>预计分钟数:</strong> {{ workOrder.estimated_minutes }}</div>
                    <div><strong>生产线 ID:</strong> {{ workOrder.production_line_id }}</div>

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

          <UserReference type="创建者" :userId="dispatch.created_by" />

          <el-form-item label="创建时间" v-if="dispatch.created_at">
            {{ formatDate(dispatch.created_at) }}
          </el-form-item>

          <UserReference type="更新者" :userId="dispatch.updated_by" />

          <el-form-item label="更新时间" v-if="dispatch.updated_at">
            {{ formatDate(dispatch.updated_at) }}
          </el-form-item>

          <el-divider>已派发任务</el-divider>
          <!-- Dispatched Tasks Table -->
          <DispatchedTasksList
              :dispatched-tasks="dispatchedTasksMap[dispatch.id] || []"
              :form-map="formMap"
              :user-map="userMap"
              :show-search-box="false"
          />
        </div>
      </el-card>
    </div>
    <div v-else>- 无任务 -</div>

  </el-form>
</template>

<script>
import {
  formatDate,
  formatScheduleType,
  unnormalizeCronExpression
} from "@/utils/dispatch-utils";
import { humanizeCronInChinese } from "cron-chinese";
import { getUserById } from "@/services/userService";
import {getProductById, getProductionWorkOrderById, getRawMaterialById} from "@/services/productionService";
import {getEquipmentById, getMaintenanceWorkOrderById} from "@/services/maintenanceService";
import UserReference from "@/components/dispatch/UserReference.vue";
import DispatchedTasksList from "@/components/dispatch/DispatchedTaskList.vue";

import {getDispatchNextExecutionTime} from "@/services/dispatchService";

export default {
  components: {UserReference, DispatchedTasksList},
  props: {
    order: {
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
    dispatchedTasksMap: {
      type: Object,
      required: true,
    }
  },
  data() {
    return {
      dispatches: [],
      createdByDetail: null,
      updatedByDetail: null,
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
    };
  },
  methods: {
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
      if (this.order.created_by) {
        try {
          this.createdByDetail = this.fetchUserHelper(this.order.created_by);
        } catch (error) {
          console.error("Failed to fetch created by details:", error);
        }
      }
    },
    async fetchUpdatedByDetail() {
      if (this.order.updated_by) {
        try {
          this.updatedByDetail = this.fetchUserHelper(this.order.updated_by);
        } catch (error) {
          console.error("Failed to fetch updated by details:", error);
        }
      }
    },
    getStateTagType(state) {
      const stateMap = {
        1: { label: "运行中", type: "success" },
        2: { label: "停止", type: "info" },
        3: { label: "已过期", type: "danger" },
        4: { label: "已达派发上限", type: "warning" },
        5: { label: "暂停", type: "primary" },
      };
      return stateMap[state] || { label: "未知", type: "default" };
    },
    findInstrumentName(id) {
      const instrument = this.instrumentOptions.find(inst => inst.id === id);
      return instrument ? instrument.name : `未知仪器 (${id})`;
    },
    findTestSubjectName(id) {
      const testSubject = this.testSubjectOptions.find(inst => inst.id === id);
      return testSubject ? testSubject.name : `未知检测项目 (${id})`;
    },
    findSamplingLocationName(id) {
      const samplingLocation = this.samplingLocationOptions.find(inst => inst.id === id);
      return samplingLocation ? samplingLocation.name : `未知采样位置 (${id})`;
    },
    async fetchDetails(ids, fetchFunction) {
      const details = [];
      for (const id of ids || []) {
        const response = await fetchFunction(id);
        if (response?.data?.data) details.push(response.data.data);
      }
      return details;
    },
    async loadDispatchDetails() {
      this.dispatches = this.order.dispatches.map(dispatch => ({
        ...dispatch,
        productDetails: [],
        rawMaterialDetails: [],
        maintenanceWorkOrderDetails: [],
        equipmentDetails: [],
        productionWorkOrderDetails: [],
        nextExecutionTime: null,
        collapsed: false,
      }));

      for (let dispatch of this.dispatches) {
        dispatch.productDetails = await this.fetchDetails(dispatch.product_ids, getProductById);
        dispatch.rawMaterialDetails = await this.fetchDetails(dispatch.raw_material_ids, getRawMaterialById);
        dispatch.productionWorkOrderDetails = await this.fetchDetails(dispatch.production_work_order_ids, getProductionWorkOrderById);
        dispatch.equipmentDetails = await this.fetchDetails(dispatch.equipment_ids, getEquipmentById);
        dispatch.maintenanceWorkOrderDetails = await this.fetchDetails(dispatch.maintenance_work_order_ids, getMaintenanceWorkOrderById);
        await this.fetchNextExecutionTime(dispatch);
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
      }, 1000); // Refresh next execution time after 1 second
    },
    toggleCollapse(index) {
      this.dispatches[index].collapsed =
          !this.dispatches[index].collapsed;
    },
  },
  mounted() {
    // fetch order createdBy/updatedBy
    this.fetchCreatedByDetail();
    this.fetchUpdatedByDetail();

    // fetch each dispatch's data under order
    this.loadDispatchDetails();


  }
};
</script>

<style scoped>
.order-details {
  padding: 10px;
}

.dispatch-block {
  margin-bottom: 20px;
}

.details-header {
  display: flex;
  justify-content: flex-end;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>

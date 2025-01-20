<template>
  <el-form label-position="left" label-width="140px" class="dispatch-details">

    <div class="details-header">
      <!-- Action Buttons -->
      <el-button-group>
        <el-button type="success" @click="$emit('edit')">编辑</el-button>
        <el-button type="danger" @click="$emit('delete')">删除</el-button>
      </el-button-group>
    </div>

    <el-divider>派发详情</el-divider>
    <el-form-item label="派发名称">
      {{ dispatch.name }}
    </el-form-item>

    <el-form-item label="ID">
      {{ dispatch.id }}
    </el-form-item>

    <el-form-item label="类型">
      {{ formatScheduleType(dispatch.type) }}
    </el-form-item>

    <el-form-item label="备注" v-if="dispatch.remark">
      {{ dispatch.remark }}
    </el-form-item>

    <el-form-item label="派发计划" v-if="dispatch.cron_expression">
      {{ humanizeCronInChinese(unnormalizeCronExpression(dispatch.cron_expression)) }}
    </el-form-item>

    <el-form-item label="开始运行时间" v-if="dispatch.start_time">
      {{ formatDate(dispatch.start_time) }}
    </el-form-item>

    <el-form-item label="停止运行时间" v-if="dispatch.end_time">
      {{ formatDate(dispatch.end_time) }}
    </el-form-item>
    <!-- Is Schedule -->
    <el-form-item label="运行状态">
      <status-circle :status="convertBooleanToNumber(dispatch.is_active)" />
    </el-form-item>

    <!-- Next Execution Time -->
<!--    <el-form-item label="下次派发时间">-->
<!--      <el-tag style="font-weight: bold" type="info">-->
<!--        {{ calculateRemainingTime(nextExecutionTime) }}-->
<!--      </el-tag>-->
<!--    </el-form-item>-->

    <!-- Next Execution Time -->
    <el-form-item label="下次派发时间" v-if="nextExecutionTime">
      <el-countdown
          :value="nextExecutionTime"
          format="HH:mm:ss"
          @finish="handleCountdownFinish"/>
    </el-form-item>

    <el-form-item label="派发次数上限" v-if="dispatch.dispatch_limit">
      {{ dispatch.dispatch_limit === -1 ? "无限制" : dispatch.dispatch_limit }}
    </el-form-item>

    <el-form-item label="已执行次数">
      {{ dispatch.executed_count }}
    </el-form-item>

    <el-form-item label="任务时限 (分钟)" v-if="dispatch.due_date_offset_minute">
      {{ dispatch.due_date_offset_minute }}
    </el-form-item>

    <el-form-item label="创建时间" v-if="dispatch.created_at">
      {{ formatDate(dispatch.created_at) }}
    </el-form-item>

    <el-form-item label="更新时间" v-if="dispatch.updated_at">
      {{ formatDate(dispatch.updated_at) }}
    </el-form-item>

    <el-divider>表单</el-divider>
      <el-form-item label="表单">
      <div v-if="dispatch.dispatch_forms.length > 0" class="form-tags">
        <el-tag
            v-for="(formId, index) in dispatch.dispatch_forms"
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
      <div v-else>-</div>
    </el-form-item>

    <el-divider>人员</el-divider>
      <el-form-item label="人员">
      <div v-if="dispatch.dispatch_users.length > 0" class="user-tags">
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
      <div v-else>-</div>
    </el-form-item>

    <!-- Association with other modules -->
    <template v-if="showSystemAssociation">
    <el-divider>系统关联</el-divider>
      <el-form-item label="产品" v-if="productDetails.length > 0">
        <div class="tag-container">
          <el-tag
            v-for="(product, index) in productDetails"
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

      <el-form-item label="原料" v-if="rawMaterialDetails.length > 0">
        <div class="tag-container">
          <el-tag
              v-for="material in rawMaterialDetails"
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

      <el-form-item label="生产工单" v-if="productionWorkOrderDetails.length > 0">
        <div class="tag-container">
          <el-tag
              v-for="workOrder in productionWorkOrderDetails"
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

      <el-form-item label="设备" v-if="equipmentDetails.length > 0">
        <div class="tag-container">
          <el-tag
              v-for="equipment in equipmentDetails"
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

      <el-form-item label="维护工单" v-if="maintenanceWorkOrderDetails.length > 0">
        <div class="tag-container">
          <el-tag
              v-for="workOrder in maintenanceWorkOrderDetails"
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
    </template>
    <el-divider>已派发任务列表</el-divider>
    <DispatchedTasksList
          :dispatched-tasks="dispatchedTasks"
          :form-map="formMap"
          :user-map="userMap"
          :show-search-box="false"
          v-if="dispatchedTasks.length > 0"/>

    <!-- GIF Overlay -->
    <div id="app">
      <div v-if="isGifVisible" class="gif-overlay">
        <img src="@/assets/qc_task_dispatched.gif" alt="Task Dispatched" class="gif-image" />
      </div>
    </div>
  </el-form>
</template>

<script>
import {
  formatDate,
  formatScheduleType,
  unnormalizeCronExpression
} from "@/utils/dispatch-utils";

import {getDispatchNextExecutionTime, getIsScheduled} from "@/services/dispatchService";
import StatusCircle from "@/components/dispatch/StatusCircle.vue";
import {humanizeCronInChinese} from "cron-chinese";
import DispatchedTasksTable from "@/components/dispatch/DispatchedTaskList.vue";
import DispatchedTasksList from "@/components/dispatch/DispatchedTaskList.vue";
import {
  getProductById,
  getProductionWorkOrderById,
  getRawMaterialById
} from "@/services/productionService";

import {
  getEquipmentById,
  getMaintenanceWorkOrderById
} from "@/services/maintenanceService";

export default {
  components: {DispatchedTasksList, DispatchedTasksTable, StatusCircle},
  props: {
    dispatch: {
      type: Object,
      required: true,
    },
    formMap: {
      type: Object,
      required: true,
    },
    dispatchedTasks: {
      type: Array,
      required: true,
    },
    userMap: {
      type: Object,
      required: true,
    }
  },
  data() {
    return {
      nextExecutionTime: null,
      isSchedule: 0,
      productDetails: [],
      rawMaterialDetails: [],
      productionWorkOrderDetails: [],
      equipmentDetails: [],
      maintenanceWorkOrderDetails: [],
      isGifVisible: false,
    };
  },
  computed: {
    showSystemAssociation() {
      return (
          this.productDetails.length > 0 ||
          this.rawMaterialDetails.length > 0 ||
          this.productionWorkOrderDetails.length > 0 ||
          this.equipmentDetails.length > 0 ||
          this.maintenanceWorkOrderDetails.length > 0
      );
    },
  },
  methods: {
    unnormalizeCronExpression,
    humanizeCronInChinese,
    formatDate,
    formatScheduleType,
    formatDay(day) {
      const dayMap = {
        MONDAY: "星期一",
        TUESDAY: "星期二",
        WEDNESDAY: "星期三",
        THURSDAY: "星期四",
        FRIDAY: "星期五",
        SATURDAY: "星期六",
        SUNDAY: "星期日",
      };
      return dayMap[day] || day;
    },
    getFormById(id) {
      return this.formMap[id] || "未知表单";
    },
    async fetchNextExecutionTime() {
      if (!this.dispatch || !this.dispatch.id) return;
      try {
        const response = await getDispatchNextExecutionTime(this.dispatch.id);
        const nextExecution = response.data.data;
        this.nextExecutionTime = new Date(nextExecution).getTime(); // Convert to timestamp
      } catch (error) {
        console.error("Failed to fetch next execution time:", error);
        this.nextExecutionTime = null; // Fallback in case of error
      }
    },
    handleCountdownFinish() {
      setTimeout(() => {
        this.fetchNextExecutionTime(); // Refresh next execution time
      }, 1000); // 1-second delay
      this.isGifVisible = true;
      setTimeout(() => {
        this.isGifVisible = false;
      }, 3000); // Hide the GIF after 3 seconds
    },
    convertBooleanToNumber(isActive) {
      if (isActive) {
        return 1;
      } else {
        return 0;
      }
    },
    async fetchDetails(ids, fetchFunction) {
      const details = []
      for (const id of ids || []) {
        try {
          const response = await fetchFunction(id);
          if (response?.data?.data) {
            details.push(response.data.data);
          }
        } catch (error) {
          console.error(`Failed to fetch details for ID: ${id}`, error);
        }
      }
      return details
    },
    async fetchAllDetails() {
      this.productDetails = await this.fetchDetails(this.dispatch.product_ids, getProductById)
      this.rawMaterialDetails = await this.fetchDetails(this.dispatch.raw_material_ids, getRawMaterialById);
      this.productionWorkOrderDetails = await this.fetchDetails(this.dispatch.production_work_order_ids, getProductionWorkOrderById);
      this.equipmentDetails = await this.fetchDetails(this.dispatch.equipment_ids, getEquipmentById);
      this.maintenanceWorkOrderDetails = await this.fetchDetails(this.dispatch.maintenance_work_order_ids, getMaintenanceWorkOrderById);

    }
  },
  mounted() {
    this.fetchNextExecutionTime(); // Fetch next execution time on mount
  },
  watch: {
    dispatch: {
      immediate: true, // Trigger on initial load
      handler(newDispatch) {
        if (newDispatch) {
          this.fetchNextExecutionTime();
          this.fetchAllDetails();
        }
      }
    }
  }
};
</script>

<style scoped>
.dispatch-details {
  padding: 10px;
}

.days-tags,
.user-tags,
.form-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.details-header {
  display: flex;
  justify-content: flex-end;
}

#app {
  text-align: center;
  margin-top: 50px;
}

.gif-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.2); /* Semi-transparent background */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* Ensure it overlays all other content */
}

.gif-image {
  max-width: 80%;
  max-height: 80%;
  border-radius: 10px;
}

</style>


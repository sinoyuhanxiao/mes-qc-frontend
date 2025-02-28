<template>
  <el-form label-position="left" label-width="120px" class="task-details">
    <div class="details-header">
      <!-- Action Buttons -->
      <el-button-group>
        <el-button
            type="primary"
            :disabled="false"
            @click="showDevelopmentPopup"
        >
          查看提交记录
        </el-button>
<!--        <el-button-->
<!--            type="info"-->
<!--            :disabled="true"-->
<!--            class="forbidden-button"-->
<!--            @click="$emit('edit')"-->
<!--        >-->
<!--          编辑-->
<!--        </el-button>-->
<!--        <el-button-->
<!--            type="info"-->
<!--            :disabled="true"-->
<!--            class="forbidden-button"-->
<!--            @click="$emit('delete')"-->
<!--        >-->
<!--          删除-->
<!--        </el-button>-->
      </el-button-group>

    </div>

    <el-form-item label="任务名称">
      {{ task.name || "未命名任务" }}
    </el-form-item>

    <el-form-item label="描述">
      {{ task.description || "无描述" }}
    </el-form-item>

    <el-form-item label="派发计划ID">
      {{ task.dispatch_id || "无" }}
    </el-form-item>

    <el-form-item label="任务表单">
      {{ getFormNameById(task.qc_form_tree_node_id) }}
    </el-form-item>

    <el-form-item label="节点编号">
      {{ task.qc_form_tree_node_id }}
    </el-form-item>

    <el-form-item label="派发对象">
      {{ getUserById(task.user_id)?.name || "未知人员" }}
    </el-form-item>

    <el-form-item label="派发时间">
      {{ formatDate(task.dispatch_time) }}
    </el-form-item>

    <el-form-item label="任务状态">
      <el-tag :type="stateTagType(task.dispatched_task_state_id)">
        {{ stateName(task.dispatched_task_state_id) }}
      </el-tag>
    </el-form-item>

    <el-form-item label="备注">
      {{ task.notes || "-" }}
    </el-form-item>

    <el-form-item label="创建时间">
      {{ formatDate(task.created_at) }}
    </el-form-item>

    <el-form-item label="创建者">
      {{ task.created_by || "无" }}
    </el-form-item>

    <el-form-item label="更新时间">
      {{ formatDate(task.updated_at) }}
    </el-form-item>

    <el-form-item label="更新者">
      {{ task.updated_by || "无" }}
    </el-form-item>

    <el-form-item label="截止时间">
      {{ formatDate(task.due_date) }}
    </el-form-item>

<!--    <el-form-item label="是否逾期">-->
<!--      <el-tag :type="task.is_overdue ? 'danger' : 'success'">-->
<!--        {{ task.is_overdue ? "是" : "否" }}-->
<!--      </el-tag>-->
<!--    </el-form-item>-->

    <el-form-item label="完成时间">
      {{ formatDate(task.finished_at) || "未完成" }}
    </el-form-item>

    <!-- Additional dispatch details: Test Subjects -->
    <el-form-item label="检测项目" v-if="dispatch && dispatch.testSubjectDetails && dispatch.testSubjectDetails.length">
      <div class="tags">
        <el-tag v-for="testSubject in dispatch.testSubjectDetails"
                :key="testSubject.id"
                type="info"
                size="small">
          <el-popover effect="light" trigger="hover" placement="top" width="auto">
            <template #default>
              <div>ID: {{ testSubject.id }}</div>
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

    <!-- Additional dispatch details: Sampling Locations -->
    <el-form-item label="采样位置" v-if="dispatch && dispatch.samplingLocationDetails && dispatch.samplingLocationDetails.length">
      <div class="tags">
        <el-tag v-for="samplingLocation in dispatch.samplingLocationDetails"
                :key="samplingLocation.id"
                type="info"
                size="small"
                effect="light">
          <el-popover effect="light" trigger="hover" placement="top" width="auto">
            <template #default>
              <div>ID: {{ samplingLocation.id }}</div>
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

    <!-- Additional dispatch details: Instruments -->
    <el-form-item label="仪器" v-if="dispatch && dispatch.instrumentDetails && dispatch.instrumentDetails.length">
      <div class="tags">
        <el-tag v-for="instrument in dispatch.instrumentDetails"
                :key="instrument.id"
                type="info"
                size="small"
                effect="light">
          <el-popover effect="light" trigger="hover" placement="top" width="auto">
            <template #default>
              <div>ID: {{ instrument.id }}</div>
              <div v-if="instrument.description">备注: {{ instrument.description }}</div>
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
  </el-form>
</template>

<script>
import {getDispatchByDispatchedTaskId} from "@/services/dispatchService";
import {getTestSubjectById} from "@/services/testSubjectService";
import {getSamplingLocationById} from "@/services/samplingLocationService";
import {getInstrumentById} from "@/services/instrumentService";

export default {
  props: {
    task: {
      type: Object,
      required: true,
    },
    formMap: {
      type: Object,
      required: true,
    },
    personnelMap: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      dispatch: null, // This will hold the dispatch data along with its additional details.
    };
  },
  methods: {
    getFormNameById(formId) {
      return this.formMap[formId] || "未知表单";
    },
    getUserById(personnelId) {
      return this.personnelMap[personnelId] || null;
    },
    formatDate(dateString) {
      return dateString ? new Date(dateString).toLocaleString() : "-";
    },
    showDevelopmentPopup() {
      const url = this.$router.resolve({
        name: 'TaskLog',
        params: {
          createdBy: this.$store.getters.getUser.id, // the record created by myself
          dispatchedTaskId: this.task.id, // Replace with actual `dispatchedTaskId`
          taskName: this.getFormNameById(this.task.qc_form_tree_node_id)
        },
      }).href;
      console.log("taskName is " + this.getFormNameById(this.task.qc_form_tree_node_id))
      // Open the URL in a new tab
      window.open(url, '_blank');
    },
    stateTagType(stateId) {
      const stateMap = {
        1: "warning", // Pending
        2: "primary", // In Progress
        3: "success", // Completed
        4: "info",    // Canceled
        5: "danger",  // Overdue
      };
      return stateMap[stateId] || "info";
    },
    stateName(stateId) {
      const stateMap = {
        1: "待处理",
        2: "进行中",
        3: "已完成",
        4: "已取消",
        5: "已逾期",
      };
      return stateMap[stateId] || "Unknown";
    },
    // Helper function to fetch details for given IDs
    async fetchDetails(ids, fetchFunction) {
      const details = [];
      for (const id of ids || []) {
        try {
          const response = await fetchFunction(id);
          if (response?.data?.data) {
            details.push(response.data.data);
          }
        } catch (e) {
          console.error(`Failed to fetch detail for ID: ${id}`, e);
        }
      }
      return details;
    },
    // Fetch the dispatch information and its associated detail arrays
    async fetchDispatchDetails() {
      try {
        const response = await getDispatchByDispatchedTaskId(this.task.id);
        if (response?.data?.data) {
          const dispatchData = response.data.data;
          // Populate additional details using the helper function:
          dispatchData.testSubjectDetails = await this.fetchDetails(dispatchData.test_subject_ids, getTestSubjectById);
          dispatchData.samplingLocationDetails = await this.fetchDetails(dispatchData.sampling_location_ids, getSamplingLocationById);
          dispatchData.instrumentDetails = await this.fetchDetails(dispatchData.instrument_ids, getInstrumentById);
          this.dispatch = dispatchData;
        }
      } catch (error) {
        console.error("Failed to fetch dispatch details", error);
      }
    },
  },
  mounted() {
    if (this.task.dispatch_id) {
      this.fetchDispatchDetails();
    }
  },
};
</script>

<style scoped>
.task-details {
  padding: 10px;
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

.forbidden-button {
  cursor: not-allowed !important; /* Show forbidden cursor */
  pointer-events: none; /* Prevent any interaction */
}
</style>

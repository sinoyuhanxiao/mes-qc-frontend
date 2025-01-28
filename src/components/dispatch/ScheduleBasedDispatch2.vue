<template>
  <el-form
      :model="qcOrderForm"
      :rules="validationRules"
      ref="formRef"
      label-position="left"
      label-width="200px"
  >
    <!-- QC Order Name -->
    <el-form-item label="质检订单名称" required prop="name">
      <el-input v-model="qcOrderForm.name" placeholder="请输入质检订单名称" />
    </el-form-item>

    <!-- Remark -->
    <el-form-item label="备注" prop="remark">
      <el-input
          type="textarea"
          v-model="qcOrderForm.remark"
          placeholder="请输入备注"
      />
    </el-form-item>

    <!-- Dispatch Limit -->
    <el-form-item label="派发次数上限 (-1 为无限制)" required prop="dispatchLimit">
      <el-input-number v-model="qcOrderForm.dispatchLimit" :min="-1" />
    </el-form-item>

    <!-- Due Date Offset -->
    <el-form-item label="任务时限(分钟)" required prop="dueDateOffsetMinute">
      <el-input-number v-model="qcOrderForm.dueDateOffsetMinute" :min="0" />
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
    <el-divider>派发列表</el-divider>
    <div
        v-for="(dispatch, index) in qcOrderForm.dispatches"
        :key="dispatch.id"
        class="dispatch-block"
    >
      <el-card :header="'派发 ' + (index + 1)" shadow="always">
        <div
            style="display: flex; justify-content: space-between; align-items: center;"
        >
          <el-button
              type="text"
              @click="toggleCollapse(index)"
              :icon="dispatch.collapsed ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"
          >
            {{ dispatch.collapsed ? '展开' : '收起' }}
          </el-button>
          <!-- Remove Dispatch -->
          <el-button type="danger" plain @click="removeDispatch(index)"
          >删除派发</el-button
          >
        </div>
        <div v-show="!dispatch.collapsed">
          <!-- Schedule Type -->
          <el-form-item
              label="派发计划类型"
              required
              :prop="'dispatches.' + index + '.scheduleType'"
          >
            <el-radio-group v-model="dispatch.scheduleType">
              <el-radio label="CRON">周期计划</el-radio>
              <el-radio label="ONCE">单次计划</el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- Cron Expression -->
          <el-form-item
              v-if="dispatch.scheduleType === 'CRON'"
              label="执行周期"
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
              v-if="dispatch.scheduleType === 'CRON'"
              label="运行时间"
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
              :prop="'dispatches.' + index + '.executionDate'"
          >
            <el-date-picker
                v-model="dispatch.executionDate"
                type="datetime"
                placeholder="选择执行时间"
                :format="dateFormat"
                :value-format="valueFormat"
            />
          </el-form-item>

          <!-- User Selection -->
          <el-form-item
              v-if="!qcOrderForm.applyUserToAll"
              label="选择人员"
              :prop="'dispatches.' + index + '.userIds'"
          >
            <el-select
                v-model="dispatch.userIds"
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

          <!-- Form Tree -->
          <el-form-item
              v-if="!qcOrderForm.applyFormToAll"
              label="选择表单"
              :prop="'dispatches.' + index + '.formIds'"
          >
            <DispatchFormTreeSelect
                :selected-form-ids="dispatch.formIds"
                @update-selected-forms="(forms) =>
                handleSelectedForms(forms, index)"
            />
          </el-form-item>

          <!-- Test Subject Selection -->
          <el-form-item
              label="选择检测项目"
              :prop="'dispatches.' + index + '.testingSubject'"
          >
            <el-select
                v-model="dispatch.testingSubject"
                placeholder="请选择检测项目"
                multiple
                filterable
            >
              <el-option
                  v-for="subject in testingSubjectOptions"
                  :key="subject.id"
                  :label="subject.name"
                  :value="subject.id"
              />
            </el-select>
          </el-form-item>

          <!-- Sampling Location Selection -->
          <el-form-item
              label="选择采样位置"
              :prop="'dispatches.' + index + '.samplingLocation'"
          >
            <el-select
                v-model="dispatch.samplingLocation"
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
          <el-form-item label="选择仪器" :prop="'dispatches.' + index + '.instrument'">
            <el-select
                v-model="dispatch.instrument"
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
        </div>
      </el-card>
    </div>

    <!-- Add Dispatch -->
    <el-button type="primary" plain @click="addDispatch">新增派发</el-button>

    <!-- Schedule Summary -->
    <el-card class="mt-4" shadow="always">
      <h4>订单预览</h4>
      <p><strong>订单名称:</strong> {{ qcOrderForm.name }}</p>
      <p><strong>备注:</strong> {{ qcOrderForm.remark || "无" }}</p>
      <p>
        <strong>派发次数上限:</strong>
        {{ qcOrderForm.dispatchLimit === -1 ? "无限制" : qcOrderForm.dispatchLimit }}
      </p>
      <p><strong>任务时限:</strong> {{ qcOrderForm.dueDateOffsetMinute }} 分钟</p>
      <p><strong>派发总数:</strong> {{ qcOrderForm.dispatches.length }}</p>
      <div v-for="(dispatch, index) in qcOrderForm.dispatches" :key="dispatch.id" class="dispatch-preview">
        <h5>派发 {{ index + 1 }}</h5>
        <ul class="dispatch-details">
          <li>派发计划类型: <strong>{{ dispatch.scheduleType === 'CRON' ? '周期计划' : '单次计划' }}</strong></li>
          <li v-if="dispatch.scheduleType === 'CRON'">
            执行周期: <strong>{{ formatCronExpression(dispatch.cronExpression) }}</strong>
          </li>
          <li v-if="dispatch.scheduleType === 'CRON'">
            运行时间: <strong>{{ formatDateRange(dispatch.dateRange) }}</strong>
          </li>
          <li v-else>
            执行时间: <strong>{{ formatDate(dispatch.executionDate) }}</strong>
          </li>
          <li>人员: <strong>{{ formatUsers(dispatch.userIds) }}</strong></li>
          <li>表单: <strong>{{ formatForms(dispatch.formIds) }}</strong></li>
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
import {humanizeCronInChinese} from "cron-chinese";

export default {
  components: { DispatchFormTreeSelect, CronElementPlus },
  data() {
    return {
      dateFormat: "YYYY-MM-DD HH:mm:ss",
      valueFormat: "YYYY-MM-DDTHH:mm:ssZ",
      qcOrderForm: {
        name: "",
        remark: "",
        dateRange: [],
        dispatchLimit: -1,
        dueDateOffsetMinute: 60,
        applyUserToAll: false,
        globalUserIds: [], // New field for global user selection
        applyFormToAll: false,
        globalFormIds: [], // New field for global form selection
        dispatches: [],
      },
      validationRules: {
        name: [{required: true, message: "请输入质检订单名称", trigger: "blur"}],
        remark: [{required: false, message: "请输入备注", trigger: "blur"}],
        dateRange: [
          {required: true, message: "请选择派发运行时间", trigger: "change"},
        ],
        dispatchLimit: [
          {required: true, message: "请输入派发次数上限", trigger: "change"},
        ],
        dueDateOffsetMinute: [
          {required: true, message: "请输入任务时限", trigger: "change"},
        ],
        "dispatches.*.scheduleType": [
          {required: true, message: "请选择派发计划类型", trigger: "change"},
        ],
        "dispatches.*.cronExpression": [
          {required: true, message: "请输入有效的 CRON 表达式", trigger: "blur"},
        ],
        "dispatches.*.executionDate": [
          {required: true, message: "请选择执行时间", trigger: "change"},
        ],
      },
      userOptions: [],
      isLoadingUser: false,
      instrumentOptions: [
        { id: "inst1", name: "仪器 1" },
        { id: "inst2", name: "仪器 2" },
        { id: "inst3", name: "仪器 3" },
      ],
      samplingLocationOptions: [
        { id: "loc1", name: "位置 1" },
        { id: "loc2", name: "位置 2" },
        { id: "loc3", name: "位置 3" },
      ],
      testingSubjectOptions: [
        { id: "ts1", name: "检测项目 1" },
        { id: "ts2", name: "检测项目 2" },
        { id: "ts3", name: "检测项目 3" },
      ],
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
  },
  methods: {
    addDispatch() {
      const newDispatch = {
        id: Date.now(),
        scheduleType: "CRON",
        cronExpression: "* * * * *",
        executionDate: null,
        dateRange: [],
        userIds: this.qcOrderForm.applyUserToAll
            ? [...this.qcOrderForm.globalUserIds]
            : [],
        formIds: this.qcOrderForm.applyFormToAll
            ? [...this.qcOrderForm.globalFormIds]
            : [],
        instrument: null, // New instrument field
        samplingLocation: null,
        testingSubject: [],
        collapsed: false,
      };
      this.qcOrderForm.dispatches.push(newDispatch);
    },
    removeDispatch(index) {
      this.qcOrderForm.dispatches.splice(index, 1);
    },
    toggleCollapse(index) {
      this.qcOrderForm.dispatches[index].collapsed =
          !this.qcOrderForm.dispatches[index].collapsed;
    },
    async loadUserOptions() {
      if (this.isLoadingUser || this.userOptions.length > 0) return;
      this.isLoadingUser = true;
      try {
        const response = await fetchUsers();
        this.userOptions = response.data.data.map((user) => ({
          id: user.id,
          name: user.name,
        }));
      } catch (error) {
        console.error("Error loading user options:", error);
      } finally {
        this.isLoadingUser = false;
      }
    },
    handleSelectedForms(forms, index) {
      this.qcOrderForm.dispatches[index].formIds = forms.map((form) => form.id);
    },
    submitForm() {
      this.$refs.formRef.validate((valid) => {
        if (valid) {
          console.log("Submitted Form Data:", this.qcOrderForm);
          // Submit logic here
        }
      });
    },
    resetForm() {
      this.qcOrderForm = {
        name: "",
        remark: "",
        dateRange: [],
        dispatchLimit: -1,
        dueDateOffsetMinute: 60,
        applyUserToAll: false,
        globalUserIds: [],
        applyFormToAll: false,
        globalFormIds: [],
        dispatches: [],
      };
    },
    // Format a date in '2025/1/16 00:00:00' format
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
    // Format a date range
    formatDateRange(range) {
      if (!Array.isArray(range) || range.length !== 2) return "无";
      return `${this.formatDate(range[0])} 至 ${this.formatDate(range[1])}`;
    },
    // Format user list
    formatUsers(userIds) {
      if (!userIds.length) return "无";
      return userIds
          .map((id) => this.userOptions.find((user) => user.id === id)?.name || "未知用户")
          .join(", ");
    },
    // Format form list
    formatForms(formIds) {
      if (!formIds.length) return "无";
      return formIds.join(", ");
    },
    // Format cron expression to Chinese
    formatCronExpression(cron) {
      if (!cron) return "无效的 Cron 表达式";
      try {
        return humanizeCronInChinese(cron);
      } catch {
        return "无法解析 Cron 表达式";
      }
    },
  },
};
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

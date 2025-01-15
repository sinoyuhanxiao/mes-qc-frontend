<script>
export default {
  name: "QuickDispatch",
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
  },
  emits: ["close", "dispatch"],
  data() {
    return {
      taskName: "",
      selectedPersonnel: [],
      selectedTimes: [],
      personnelOptions: [
        { value: "person1", label: "人员1" },
        { value: "person2", label: "人员2" },
        { value: "person3", label: "人员3" },
      ],
      timeOptions: [
        { value: "morning", label: "上午" },
        { value: "afternoon", label: "下午" },
        { value: "evening", label: "晚上" },
      ],
    };
  },
  methods: {
    handleDispatch() {
      if (!this.taskName) {
        this.$message.error("任务派发名称不能为空！");
        return;
      }
      if (!this.selectedPersonnel.length) {
        this.$message.error("请选择人员！");
        return;
      }
      if (!this.selectedTimes.length) {
        this.$message.error("请选择时间！");
        return;
      }
      this.$emit("dispatch", {
        taskName: this.taskName,
        personnel: this.selectedPersonnel,
        times: this.selectedTimes,
      });
      this.handleClose();
    },
    handleClose() {
      this.$emit("close");
    },
  },
};
</script>

<template>
  <el-dialog :visible.sync="visible" title="快速任务派发" width="50%" @close="handleClose">
    <el-form label-width="120px">
      <el-form-item label="任务派发名称" required>
        <el-input v-model="taskName" placeholder="请输入任务派发名称"></el-input>
      </el-form-item>
      <el-form-item label="选择人员" required>
        <el-select
            v-model="selectedPersonnel"
            multiple
            placeholder="请选择人员"
            :options="personnelOptions"
        ></el-select>
      </el-form-item>
      <el-form-item label="选择时间" required>
        <el-select
            v-model="selectedTimes"
            multiple
            placeholder="请选择时间"
            :options="timeOptions"
        ></el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleDispatch">派发任务</el-button>
        <el-button @click="handleClose">取消</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<style scoped>
</style>

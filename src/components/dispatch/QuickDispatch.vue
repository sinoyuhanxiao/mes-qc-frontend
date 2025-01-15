<script>
import { fetchUsers } from "@/services/userService";
import { insertDispatchedTasks } from "@/services/taskCenterService";
import {Delete} from "@element-plus/icons-vue";

export default {
  name: "QuickDispatch",
  computed: {
    Delete() {
      return Delete
    }
  },
  props: {
    qcFormTreeNodeId: {
      type: String,
      required: true, // Ensure the parameter is passed from the parent
    }
  },
  emits: ["dispatch"],
  data() {
    return {
      taskName: "",
      taskDescription: "",
      selectedPersonnel: [], // Stores selected personnel IDs
      selectedTimes: [],
      personnelOptions: [
        { value: 1, label: "人员1" },
        { value: 2, label: "人员2" },
        { value: 3, label: "人员3" },
      ],
      dateTimeSelections: [ // index 0 is dispatch_time. index 1 is due_date
      ]
      };
  },
  methods: {
    async loadPersonnelOptions() {
      try {
        const response = await fetchUsers();
        this.personnelOptions = response.data.data.map((user) => ({
          value: user.id, // Store the user ID
          label: user.name, // Display the user name
        }));
      } catch (error) {
        console.error("Error fetching users:", error);
        this.$message.error("无法加载人员列表，请稍后重试。");
      }
    },
    addDateTime() {
      this.dateTimeSelections.push({ dispatch_time: "", due_date: ""});
    },
    removeDateTime(index) {
      this.dateTimeSelections.splice(index, 1);
    },
    async handleDispatch() {
      console.log("Dispatching task:", this.taskName, this.taskDescription, this.selectedPersonnel, this.dateTimeSelections)
      if (!this.taskName) {
        this.$message.error("任务派发名称不能为空！");
        return;
      }
      if (!this.taskDescription) {
        this.$message.error("任务描述不能为空！");
        return;
      }
      if (!this.selectedPersonnel.length) {
        this.$message.error("请选择人员！");
        return;
      }
      if (!this.dateTimeSelections.length) {
        this.$message.error("请设置派发日期和截止日期！");
        return;
      }

      const currentTimestamp = new Date().toISOString(); // Format as `yyyy-MM-ddTHH:mm:ss.sssZ`

      const tasks = this.dateTimeSelections.map(selection => ({
        created_at: currentTimestamp, // Current timestamp in ISO format
        created_by: this.$store.getters.getUser.id, // User ID from Vuex store
        status: 1, // Set status to 1
        qc_form_tree_node_id: this.qcFormTreeNodeId, // Passed-in prop
        name: this.taskName, // Name from form
        description: this.taskDescription, // Description from form
        dispatch_time: new Date(selection[0]).toISOString(),
        due_date: new Date(selection[1]).toISOString(),
        dispatched_task_state_id: 1, // Set state ID to 1
      }));

      console.log("Dispatching task:", tasks);
      console.log("Personnel Array: ", this.selectedPersonnel)

      try {
        // Call the API
        for (let task of tasks) {
          await insertDispatchedTasks(task, this.selectedPersonnel); // Call API for each task
        }
        this.$message.success("任务派发成功！");
        this.$emit("dispatch", tasks); // Emit success event
        this.$emit("close"); // Emit close event to close the dialog
      } catch (error) {
        console.error("Error dispatching task:", error);
        this.$message.error("任务派发失败，请稍后重试！");
      }

      this.$emit("dispatch", tasks);
    },
  },
  async mounted() {
    await this.loadPersonnelOptions(); // Fetch personnel on mount
  },
};
</script>

<template>
  <el-form label-width="120px">
    <!-- Task Name -->
    <el-form-item label="任务派发名称" required>
      <el-input v-model="taskName" placeholder="请输入任务派发名称"></el-input>
    </el-form-item>

    <!-- Select Personnel -->
    <el-form-item label="选择人员" required>
      <el-select v-model="selectedPersonnel" filterable multiple placeholder="请选择人员">
        <el-option
            v-for="option in personnelOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="派发时间段" required>
      <div v-for="(item, index) in dateTimeSelections" :key="index" style="display: flex; align-items: center; gap: 10px;">
<!--        &lt;!&ndash; Date Picker &ndash;&gt;-->
<!--        <el-date-picker-->
<!--            v-model="item.date"-->
<!--            type="date"-->
<!--            placeholder="选择日期"-->
<!--            style="flex: 1;"-->
<!--        ></el-date-picker>-->

<!--        &lt;!&ndash; Time Picker &ndash;&gt;-->
<!--        <el-time-picker-->
<!--            v-model="item.time"-->
<!--            placeholder="选择时间"-->
<!--            style="flex: 1;"-->
<!--        ></el-time-picker>-->

        <el-date-picker
            v-model="dateTimeSelections[index]"
            type="datetimerange"
            range-separator="To"
            start-placeholder="QC task start date"
            end-placeholder="QC task due date"
            style="flex: 1;"
        />
        <!-- Remove Button -->
        <el-button
            :icon="Delete"
            type="danger"
            plain
            circle
            @click="removeDateTime(index)"
        ></el-button>
      </div>

      <!-- Add New Date-Time Row -->
      <el-button type="primary" plain icon="el-icon-plus" circle @click="addDateTime" style="margin-left: 5px">
      </el-button>
    </el-form-item>

    <el-form-item label="任务描述" required>
      <el-input
          v-model="taskDescription"
          type="textarea"
          placeholder="请输入任务描述"
          rows="4"
      ></el-input>
    </el-form-item>

    <!-- Actions -->
    <el-form-item>
      <el-button type="primary" @click="handleDispatch">派发任务</el-button>
    </el-form-item>

  </el-form>

</template>

<style scoped>
</style>

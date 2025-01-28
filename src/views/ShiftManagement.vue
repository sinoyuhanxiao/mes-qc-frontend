<template>
  <div>
    <!-- Toolbar with Search Bar and Add Button -->
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2>班组管理</h2>
        <el-input
            v-model="searchQuery"
            placeholder="Search Shifts"
            clearable
            @input="filterTable"
            style="width: 300px; margin-left: 20px"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <div style="display: flex; gap: 10px;">
        <!-- Refresh Button -->
        <el-tooltip content="Refresh Shift table" placement="top">
          <el-button
              class="refresh-button"
              type="primary"
              circle
              @click="fetchShiftData"
          >
            <el-icon style="color: #004085;"><RefreshRight /></el-icon>
          </el-button>
        </el-tooltip>

        <!-- Add Button -->
        <el-button type="primary" @click="showAddDialog">+ New</el-button>
      </div>
    </div>

    <!-- Table -->
    <div style="overflow-x: auto; max-width: 100%; max-height: 500px;">
      <el-table :data="paginatedShifts" style="width: 100%" @sort-change="handleSortChange">
        <el-table-column label="ID" width="100" prop="id" sortable>
          <template #default="scope">
            <span>{{ scope.row.id }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Name" prop="name" width="180" sortable>
          <template #default="scope">
            <span>{{ scope.row.name }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Type" prop="type" width="180" sortable>
          <template #default="scope">
            <span>{{ scope.row.type }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Shift Leader" prop="leader_id" width="180" sortable>
          <template #default="scope">
            <span>{{ scope.row.leader?.name || " - " }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Start Time" prop="start_time" width="180" sortable>
          <template #default="scope">
            <span>{{ formatTime(scope.row.start_time) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="End Time" prop="end_time" width="180" sortable>
          <template #default="scope">
            <span>{{ formatTime(scope.row.end_time) }}</span>
          </template>
        </el-table-column>

        <el-table-column
            label="Status" prop="status" width="180" sortable
        >
          <template #header>
            <span>
              Status
              <el-tooltip content="Active/Inactive status of the shift" placement="top">
                <el-icon><QuestionFilled /></el-icon>
              </el-tooltip>
            </span>
          </template>
          <template #default="scope">
            <el-switch
                v-model="scope.row.status"
                :active-value="1"
                :inactive-value="0"
                @change="handleStatusChange(scope.row.id, scope.row.status)"
            />
          </template>
        </el-table-column>

        <el-table-column label="Description" prop="description" width="360" sortable>
          <template #default="scope">
            <span>{{ scope.row.description }}</span>
          </template>
        </el-table-column>

<!--        <el-table-column label="Created By" prop="created_by" width="180" sortable>-->
<!--          <template #default="scope">-->
<!--            <span>{{ scope.row.created_by }}</span>-->
<!--          </template>-->
<!--        </el-table-column>-->

        <el-table-column label="Created At" prop="created_at" width="180" sortable>
          <template #default="scope">
            <span>{{ formatDate(scope.row.created_at) }}</span>
          </template>
        </el-table-column>

<!--        <el-table-column label="Updated By" prop="updated_by" width="180" sortable>-->
<!--          <template #default="scope">-->
<!--            <span>{{ scope.row.updated_by }}</span>-->
<!--          </template>-->
<!--        </el-table-column>-->

<!--        <el-table-column label="Updated At" prop="updated_at" width="180" sortable>-->
<!--          <template #default="scope">-->
<!--            <span>{{ formatDate(scope.row.updated_at) }}</span>-->
<!--          </template>-->
<!--        </el-table-column>-->

        <el-table-column label="Operations" align="right" header-align="right" width="230" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary">View</el-button>
            <el-button size="small" @click="handleEdit(scope.$index, scope.row)">Edit</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.$index, scope.row)">Delete</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-pagination
        v-if="filteredData.length > 15"
        style="margin-top: 10px"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="[15, 30, 45, 60]"
        layout="total, sizes, prev, pager, next"
        :total="filteredData.length"
        :hide-on-single-page="true"
    />

    <!-- Add Shift Dialog -->
    <el-dialog title="Add Shift" v-model="addDialogVisible" width="50%" @keyup.enter.native="validateAndAddShift">
      <div class="popup-container">
        <el-form ref="addShiftForm" :model="newShift" :rules="rules" label-width="140px">
          <el-form-item label="Name" prop="name">
            <el-input v-model="newShift.name" />
          </el-form-item>

          <el-form-item label="Type" prop="type">
            <el-input v-model="newShift.type" />
          </el-form-item>

          <el-form-item label="Leader" prop="leader_id">
            <el-select
                v-model="newShift.leader_id"
                filterable
                placeholder="Select Shift Leader"
                style="width: 480px"
            >
              <el-option
                  v-for="user in userOptions"
                  :key="user.id"
                  :label="user.name"
                  :value="user.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="Start Time" prop="start_time">
            <el-time-picker
                v-model="newShift.start_time"
                placeholder="Select Start Time"
            />
          </el-form-item>

          <el-form-item label="End Time" prop="end_time">
            <el-time-picker
                v-model="newShift.end_time"
                placeholder="Select End Time"
            />
          </el-form-item>

          <el-form-item label="Description" prop="description">
            <el-input type="textarea" v-model="newShift.description" />
          </el-form-item>

          <el-form-item label="Status" prop="status">
            <el-select v-model="newShift.status" placeholder="Select Status">
              <el-option label="Active" :value="1" />
              <el-option label="Inactive" :value="0" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="popup-container">
          <el-button @click="addDialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="validateAndAddShift">Confirm</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Edit Shift Dialog -->
    <el-dialog title="Edit Shift" v-model="editDialogVisible" width="50%" @close="closeEditDialog" @keyup.enter.native="handleEditConfirm">
      <div class="popup-container">
        <el-form ref="editShiftForm" :model="editShift" :rules="rules" label-width="140px">
          <el-form-item label="Name" prop="name">
            <el-input v-model="editShift.name" />
          </el-form-item>

          <el-form-item label="Type" prop="type">
            <el-input v-model="editShift.type" />
          </el-form-item>

          <el-form-item label="Leader" prop="leader_id">
            <el-select v-model="editShift.leader_id" filterable placeholder="Select Leader" style="width: 480px">
              <el-option
                  v-for="user in userOptions"
                  :key="user.id"
                  :label="user.name"
                  :value="user.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="Start Time" prop="start_time">
            <el-time-picker
                v-model="editShift.start_time"
                placeholder="Select Start Time"
            />
          </el-form-item>

          <el-form-item label="End Time" prop="end_time">
            <el-time-picker
                v-model="editShift.end_time"
                placeholder="Select End Time"
            />
          </el-form-item>

          <el-form-item label="Description" prop="description">
            <el-input type="textarea" v-model="editShift.description" />
          </el-form-item>

          <el-form-item label="Status" prop="status">
            <el-select v-model="editShift.status" placeholder="Select Status">
              <el-option label="Active" :value="1" />
              <el-option label="Inactive" :value="0" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="popup-container">
          <el-button @click="editDialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="handleEditConfirm">Confirm</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { Search, Plus, QuestionFilled, RefreshRight } from "@element-plus/icons-vue";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {
  getAllShifts,
  createShift,
  updateShift,
  activateShift,
  deactivateShift,
  deleteShift
} from "@/services/shiftService.js";
import {formatDate} from "@/utils/task-center/dateFormatUtils";
import {fetchUsers} from "@/services/userService";

dayjs.extend(utc);
dayjs.extend(timezone);

export default {
  name: "ShiftManagement",
  components: {
    Search,
    Plus,
    QuestionFilled,
    RefreshRight,
  },
  data() {
    return {
      tableData: [], // Original data
      filteredData: [], // Filtered data for display
      userOptions: [], // Dropdown options for users
      currentPage: 1, // Current page number
      pageSize: 15, // Number of items per page
      searchQuery: "", // Search input value
      addDialogVisible: false, // Add dialog visibility
      editDialogVisible: false, // Edit dialog visibility
      sortSettings: { prop: "", order: "" },
      newShift: {
        name: "",
        type: "",
        leader_id: null,
        start_time: "", // Formatted value for the backend
        end_time: "",
        description: "",
        status: 1, // Default null
      },
      editShift: {
        id: null,
        name: "",
        type: "",
        leader_id: null,
        start_time: "",
        end_time: "",
        description: "",
        status: 1,
      },
      rules: {
        name: [{ required: true, message: "Name is required", trigger: "blur" }],
        type: [{ required: true, message: "Type is required", trigger: "blur" }],
        leader_id: [{ required: true, message: "Leader ID is required", trigger: "blur" }],
        start_time: [{ required: true, message: "Start Time is required", trigger: "blur" }],
        end_time: [{ required: true, message: "End Time is required", trigger: "blur" }],
      },
    };
  },
  created() {
    this.fetchShiftData();
  },
  computed: {
    paginatedShifts() {
      const sortedData = [...this.filteredData].sort((a, b) => {
        const { prop, order } = this.sortSettings;
        if (!prop || !order) return 0;

        const valueA = a[prop];
        const valueB = b[prop];

        if (order === "ascending") return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        if (order === "descending") return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        return 0;
      });

      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return sortedData.slice(start, end);
    },
  },
  methods: {
    formatDate,
    toOffsetTime(rawTime) {
      if (!rawTime) return null;

      try {
        const validOffsetTimePattern = /^\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/;
        const validRawTimePattern = /^[A-Za-z]{3} [A-Za-z]{3} \d{2} \d{2}:\d{2}:\d{2} GMT[+-]\d{4} \([\w\s]+\)$/;

        // If already in the desired format, return it directly
        if (validOffsetTimePattern.test(rawTime)) {
          return rawTime;
        }

        // If in raw valid format, parse and retain timezone
        if (validRawTimePattern.test(rawTime)) {
          const date = dayjs(rawTime).tz(dayjs.tz.guess()); // Parse with user's local timezone
          return date.format("HH:mm:ssZ");
        }

        // If ISO 8601 format, convert to desired offset time
        if (dayjs(rawTime, dayjs.ISO_8601, true).isValid()) {
          const date = dayjs(rawTime);
          return date.format("HH:mm:ssZ");
        }

        console.error(`Unsupported time format: ${rawTime}`);
        return null;
      } catch (error) {
        console.error(`Error formatting time: ${rawTime}`, error);
        return null;
      }
    },
    formatTime(time) {
      if (!time) return '-'; // Handle null or undefined values
      const date = new Date(`1970-01-01T${time}`);
      return date.toLocaleTimeString('en-US', {hour12: false}); // Format to HH:mm:ss
    },
    closeEditDialog() {
      // Reset the editShift object to prevent data conflicts
      this.editShift = {
        id: null,
        name: "",
        type: "",
        leader_id: null,
        start_time: null,
        end_time: null,
        description: "",
        status: null,
      };
      this.editDialogVisible = false; // Close the dialog
    },
    async fetchUserOptions() {
      try {
        const response = await fetchUsers(); // Fetch users from the backend
        if (response.data && response.data.status === "200") {
          this.userOptions = response.data.data.map((user) => ({
            id: user.id, // Use user ID for value
            name: user.name, // Use user name for display
          }));
        } else {
          this.userOptions = []; // Fallback if no data is returned
        }
      } catch (error) {
        console.error("Error fetching user options:", error);
        this.userOptions = [];
      }
    },
    async fetchShiftData() {
      try {
        const response = await getAllShifts(); // API call
        if (response.data.status === '200') {
          this.tableData = response.data.data || []; // Assign data
          this.filteredData = [...this.tableData]; // Initialize filtered data
        } else {
          this.tableData = [];
          this.filteredData = [];
        }
      } catch (error) {
        console.error('Error fetching shift data:', error);
        this.tableData = [];
        this.filteredData = [];
      }
    },
    filterTable() {
      const searchText = this.searchQuery.toLowerCase();
      this.filteredData = this.tableData.filter((item) => {
        return Object.values(item).some((value) =>
            String(value).toLowerCase().includes(searchText)
        );
      });
    },
    handleSortChange({prop, order}) {
      this.sortSettings = {prop, order};
    },
    handleSizeChange(size) {
      this.pageSize = size;
    },
    handleCurrentChange(page) {
      this.currentPage = page;
    },
    async validateAndAddShift() {
      this.$refs.addShiftForm.validate(async (valid) => {
        if (valid) {
          try {
            const createdBy = this.$store.getters.getUser.id;
            // Avoid modifying reactive properties repeatedly
            const startTime = this.toOffsetTime(this.newShift.start_time);
            const endTime = this.toOffsetTime(this.newShift.end_time);

            const payload = { ...this.newShift, start_time: startTime, end_time: endTime };

            await createShift(payload, createdBy);

            await this.$nextTick(() => this.resetNewShiftForm());
            // Force reset after successful addition
            this.addDialogVisible = false;
            await this.fetchShiftData();
            this.$message.success("Shift added successfully");
          } catch (error) {
            console.error("Error adding shift:", error);
          }
        }
      });
    },
    async handleEditConfirm() {
      try {
        const payload = {...this.editShift}; // 浅拷贝原始对象
        delete payload.leader; // 去掉 `leader` 键值对

        // Format start_time and end_time
        payload.start_time = this.toOffsetTime(payload.start_time);
        payload.end_time = this.toOffsetTime(payload.end_time);

        console.log("Updating shift:", payload)
        await updateShift(payload.id, payload, this.$store.getters.getUser.id);
        this.editDialogVisible = false;
        await this.fetchShiftData();
        this.$message.success("Shift updated successfully");
      } catch (error) {
        console.error("Error updating shift:", error);
      }
    },
    async handleStatusChange(id, status) {
      try {
        if (status === 1) {
          await activateShift(id, this.$store.getters.getUser.id);
        } else {
          await deactivateShift(id, this.$store.getters.getUser.id);
        }
        await this.fetchShiftData();
        this.$message.success("Status updated successfully");
      } catch (error) {
        console.error("Error updating status:", error);
      }
    },
    async handleDelete(index, row) {
      try {
        await deleteShift(row.id);
        this.fetchShiftData();
        this.$message.success("Shift deleted successfully");
      } catch (error) {
        console.error("Error deleting shift:", error);
      }
    },
    handleEdit(index, row) {
      // Close the dialog first
      this.editDialogVisible = false;

      console.log("handleEdit's row: ")
      console.log(row)
      // Wait for the next DOM update to reopen the dialog
      this.$nextTick(() => {
        // Map all relevant fields from the selected row to editShift
        this.editShift = {
          id: row.id || null,
          name: row.name || "",
          type: row.type || "",
          leader_id: row.leader?.id || null, // Map leader_id from row.leader
          start_time: row.start_time
              ? new Date(`1970-01-01T${row.start_time}`)
              : null, // Ensure start_time is handled
          end_time: row.end_time
              ? new Date(`1970-01-01T${row.end_time}`)
              : null, // Ensure end_time is handled
          description: row.description || "",
          status: row.status
        };

        // Fetch user options for the dropdown
        this.fetchUserOptions();

        // Reopen the dialog
        this.editDialogVisible = true;
      });
    },
    showAddDialog() {
      console.log("showAddDialog's newShift: ")
      console.log(this.newShift)
      this.fetchUserOptions(); // Fetch the user list
      this.addDialogVisible = true; // Open the dialog
      // this.$nextTick(() => {
      //   this.resetNewShiftForm(); // Reset the form after rendering : has bug but I do not know why
      // });
    },
    resetNewShiftForm() {
      this.newShift = {
        name: "",
        type: "",
        leader_id: null,
        start_time: null,
        end_time: null, // Ensure end_time is reset to null
        description: "", // Ensure description is reset to empty string
        status: 1,
      };
    },
    },
  watch: {
    addDialogVisible(newVal) {
      if (!newVal) {
        // this.$nextTick(() => {
        //   this.resetNewShiftForm(); // Reset form after dialog closes
        // });
      }
    },
  }
};
</script>

<style scoped>
.popup-container {
  padding-right: 40px;
}

.refresh-button {
  background-color: #80cfff;
  border-color: #80cfff;
}

.refresh-button:hover {
  background-color: #66b5ff;
  border-color: #66b5ff;
  transform: rotate(360deg);
  transition: transform 0.3s ease-in-out, background-color 0.2s ease;
}
</style>

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
        <el-button type="primary" :icon="Plus" @click="showAddDialog">+ New</el-button>
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

        <el-table-column label="Shift Leader" prop="leaderId" width="180" sortable>
          <template #default="scope">
            <span>{{ scope.row.leader.name }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Start Time" prop="startTime" width="180" sortable>
          <template #default="scope">
            <span>{{ formatTime(scope.row.start_time) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="End Time" prop="endTime" width="180" sortable>
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
            <el-button size="small" type="primary" @click="handleEdit(scope.$index, scope.row)">View</el-button>
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

          <el-form-item label="Leader" prop="leaderId">
            <el-select
                v-model="newShift.leaderId"
                filterable
                placeholder="Select"
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

          <el-form-item label="Start Time" prop="startTime">
            <el-time-picker v-model="newShift.startTime" placeholder="Select Start Time" />
          </el-form-item>

          <el-form-item label="End Time" prop="endTime">
            <el-time-picker v-model="newShift.endTime" placeholder="Select End Time" />
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
    <el-dialog title="Edit Shift" v-model="editDialogVisible" width="50%" @keyup.enter.native="handleEditConfirm">
      <div class="popup-container">
        <el-form ref="editShiftForm" :model="editShift" :rules="rules" label-width="140px">
          <el-form-item label="Name" prop="name">
            <el-input v-model="editShift.name" />
          </el-form-item>

          <el-form-item label="Type" prop="type">
            <el-input v-model="editShift.type" />
          </el-form-item>

          <el-form-item label="Leader" prop="leaderId">
            <el-select
                v-model="editShift.leaderId"
                filterable
                placeholder="Select"
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

          <el-form-item label="Start Time" prop="startTime">
            <el-time-picker v-model="editShift.startTime" placeholder="Select Start Time" />
          </el-form-item>

          <el-form-item label="End Time" prop="endTime">
            <el-time-picker v-model="editShift.endTime" placeholder="Select End Time" />
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
        leaderId: null,
        startTime: "",
        endTime: "",
        description: "",
        status: 1, // Default active
      },
      editShift: {
        id: null,
        name: "",
        type: "",
        leaderId: null,
        startTime: "",
        endTime: "",
        description: "",
        status: null,
      },
      rules: {
        name: [{ required: true, message: "Name is required", trigger: "blur" }],
        type: [{ required: true, message: "Type is required", trigger: "blur" }],
        leaderId: [{ required: true, message: "Leader ID is required", trigger: "blur" }],
        startTime: [{ required: true, message: "Start Time is required", trigger: "blur" }],
        endTime: [{ required: true, message: "End Time is required", trigger: "blur" }],
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
    formatTime(time) {
      if (!time) return '-'; // Handle null or undefined values
      const date = new Date(`1970-01-01T${time}`);
      return date.toLocaleTimeString('en-US', { hour12: false }); // Format to HH:mm:ss
    },
    async fetchUserOptions() {
      try {
        const response = await fetchUsers(); // Fetch users using userService.js
        if (response.data && response.data.status === '200') {
          // Map the user data to the options structure
          this.userOptions = response.data.data.map(user => ({
            id: user.id, // Use user ID as key
            name: user.name, // Display name in the dropdown
          }));
        } else {
          this.userOptions = [];
        }
      } catch (error) {
        console.error('Error fetching user options:', error);
        this.userOptions = [];
      }
    },
    async fetchShiftData() {
      try {
        const response = await getAllShifts(); // API call
        console.log("All shifts data: ");
        console.log(response);
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
    handleSortChange({ prop, order }) {
      this.sortSettings = { prop, order };
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
            // Include the createdBy ID dynamically
            const createdBy = this.$store.getters.getUser.id;

            // Call the API with the createdBy query parameter
            await createShift(this.newShift, createdBy);

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
        await updateShift(this.editShift.id, this.editShift);
        this.editDialogVisible = false;
        this.fetchShiftData();
        this.$message.success("Shift updated successfully");
      } catch (error) {
        console.error("Error updating shift:", error);
      }
    },
    async handleStatusChange(id, status) {
      try {
        if (status === 1) {
          await activateShift(id);
        } else {
          await deactivateShift(id);
        }
        this.fetchShiftData();
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
      this.editShift = { ...row };
      this.editDialogVisible = true;
      this.fetchUserOptions(); // Fetch the user list for the dropdown
    },
    showAddDialog() {
      this.resetNewShiftForm(); // Reset the form
      this.fetchUserOptions(); // Fetch the user list
      this.addDialogVisible = true; // Open the dialog
    },
    resetNewShiftForm() {
      this.newShift = {
        name: "",
        type: "",
        leaderId: null,
        startTime: "",
        endTime: "",
        description: "",
        status: 1,
      };
    },
  },
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

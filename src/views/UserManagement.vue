<template>
  <div>
    <!-- Toolbar with Search Bar and Add Button -->
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2>用户管理</h2>
        <el-input
            v-model="searchQuery"
            placeholder="搜索关键字"
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
        <el-tooltip content="Refresh User table" placement="top">
          <el-button
              class="refresh-button"
              type="primary"
              circle
              @click="fetchUserData"
          >
            <el-icon style="color: #004085;"><RefreshRight /></el-icon>
          </el-button>
        </el-tooltip>

        <!-- Add Button -->
        <el-button type="primary" :icon="Plus" @click="showAddDialog">+ New</el-button>
      </div>
    </div>

    <!-- Table -->
    <div class="tableContainer" style="overflow-x: auto; max-width: 100%;">
      <el-table v-loading="loading" :data="paginatedUsers" style="width: 100%" @sort-change="handleSortChange">
        <el-table-column label="ID" width="100" prop="id" sortable>
          <template #default="scope">
            <span>{{ scope.row.id }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Name" prop="name" width="180" sortable>
          <template #default="scope">
            <el-popover trigger="hover" placement="top">
              <template #default>
                <p>Name: {{ scope.row.name }}</p>
                <p>WeCom ID: {{ scope.row.wecom_id }}</p>
                <p>Role: {{ getRoleName(scope.row.role_id) }}</p>
              </template>
              <template #reference>
                <el-tag size="medium">{{ scope.row.name }}</el-tag>
              </template>
            </el-popover>
          </template>
        </el-table-column>

        <el-table-column label="Username" prop="username" width="180" sortable>
          <template #default="scope">
            <span>{{ scope.row.username ?? '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Assigned Shifts" prop="shifts" width="280">
          <template #default="scope">
            <div>
              <el-tag
                  v-for="(shift, index) in scope.row.shifts"
                  :key="index"
                  size="small"
                  style="margin-right: 5px;"
                  round
              >
                <el-popover trigger="hover" placement="top">
                  <template #default>
                    <p>ID: {{ shift.id }}</p>
                    <p>Shift Name: {{ shift.shift_name }}</p>
                    <p>Leader: {{ shift.leader_name }}</p>
                  </template>
                  <template #reference>
                    {{ shift.shift_name }}
                  </template>
                </el-popover>
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="WeCom ID" prop="wecom_id" width="180" sortable>
          <template #default="scope">
            <span>{{ scope.row.wecom_id }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Role" prop="role_id" width="130" sortable>
          <template #default="scope">
            <el-tag
                :type="scope.row.role_id === 1 ? 'warning' : 'success'"
                size="medium"
                style="font-weight:bold"
            >
              {{ getRoleName(scope.row.role_id) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
            label="Status" prop="status" width="140" sortable
        >
          <template #header>
            <span>
              Status
              <el-tooltip content="If inactive, the user won't be able to use this account" placement="top">
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

        <el-table-column label="Email" prop="email" width="220px" sortable>
          <template #default="scope">
            <span>{{ scope.row.email ?? '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Phone Number" prop="phone_number" width="180px" sortable >
          <template #default="scope">
            <span>{{ scope.row.phone_number ?? '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column
            label="Operations"
            align="right"
            header-align="right"
            width="150"
            fixed="right"
        >
          <template #default="scope">
<!--            <el-button size="small" class="custom-assign-button" @click="">-->
<!--              Assign-->
<!--            </el-button>-->
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

    <!-- Add User Dialog -->
    <el-dialog title="Add User" v-model="addDialogVisible" width="50%" @keyup.enter.native="validateAndAddUser">
      <div class="popup-container">
        <el-form ref="addUserForm" :model="newUser" :rules="rules" label-width="140px">
          <el-form-item label="Name" prop="name">
            <el-input v-model="newUser.name" />
          </el-form-item>

          <el-form-item label="Role" prop="role">
            <el-select v-model="newUser.role" placeholder="Select Role">
              <el-option label="管理员" value="管理员" />
              <el-option label="质检人员" value="质检人员" />
            </el-select>
          </el-form-item>

          <el-form-item label="WeChat ID" prop="wecomId">
            <el-input v-model="newUser.wecomId" />
          </el-form-item>

          <el-form-item label="Email" prop="email">
            <el-input v-model="newUser.email" />
          </el-form-item>

          <el-form-item label="Phone Number">
            <el-input v-model="newUser.phone_number" />
          </el-form-item>

          <el-form-item label="Assigned Shifts" prop="assignedShifts">
            <el-select
                v-model="newUser.assignedShifts"
                multiple
                filterable
                placeholder="Select Assigned Shifts"
                style="width: 100%;"
            >
              <el-option
                  v-for="shift in shiftsOptions"
                  :key="shift.id"
                  :label="shift.label"
                  :value="shift.id"
              >
                <span style="float: left">{{ shift.label }}</span>
                <span
                    style="
                        float: right;
                        color: var(--el-text-color-secondary);
                        font-size: 13px;
                     "
                >
                    {{ "班长: " + shift.value }}
                </span>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="Status" prop="status">
            <el-select v-model="newUser.status" placeholder="Select Status">
              <el-option label="Active" :value="1" />
              <el-option label="Inactive" :value="0" />
            </el-select>
          </el-form-item>

          <el-form-item label="Username" prop="username">
            <el-input v-model="newUser.username" />
          </el-form-item>

          <el-form-item label="Password" prop="password">
            <el-input v-model="newUser.password" type="password" show-password />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="popup-container">
          <el-button @click="addDialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="validateAndAddUser">Confirm</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Edit User Dialog -->
    <el-dialog title="Edit User" v-model="editDialogVisible" width="50%" @keyup.enter.native="handleEditConfirm">
      <div class="popup-container">
        <el-form ref="editUserForm" :model="editUser" :rules="rules" label-width="140px">
          <el-form-item label="Name" prop="name">
            <el-input v-model="editUser.name" />
          </el-form-item>

          <el-form-item label="Role" prop="role">
            <el-select v-model="editUser.role" placeholder="Select Role">
              <el-option label="管理员" value="管理员" />
              <el-option label="质检人员" value="质检人员" />
            </el-select>
          </el-form-item>

          <el-form-item label="WeCom ID" prop="wecomId">
            <el-input v-model="editUser.wecomId" />
          </el-form-item>

          <el-form-item label="Username" prop="username">
            <el-input v-model="editUser.username" />
          </el-form-item>

          <el-form-item label="Email">
            <el-input v-model="editUser.email" />
          </el-form-item>

          <el-form-item label="Phone Number">
            <el-input v-model="editUser.phone_number" />
          </el-form-item>

          <el-form-item label="Assigned Shifts" prop="assignedShifts">
            <el-select
                v-model="editUser.assignedShifts"
                multiple
                filterable
                placeholder="Select Assigned Shifts"
                style="width: 100%;"
            >
              <el-option
                  v-for="shift in shiftsOptions"
                  :key="shift.value"
                  :label="shift.label"
                  :value="shift.id"
              >
                <span style="float: left">{{ shift.label }}</span>
                <span
                    style="
                      float: right;
                      color: var(--el-text-color-secondary);
                      font-size: 13px;
                    "
                >
                  {{ "班长: " + shift.value }}
                </span>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="Status" prop="status">
            <el-select v-model="editUser.status" placeholder="Select Status">
              <el-option label="Active" :value="1" />
              <el-option label="Inactive" :value="0" />
            </el-select>
          </el-form-item>

          <!-- Change Password Checkbox -->
          <el-form-item>
            <el-checkbox v-model="changePassword">Change Password</el-checkbox>
          </el-form-item>

          <!-- Password Fields -->
          <el-form-item v-if="changePassword" label="New Password" prop="newPassword">
            <el-input v-model="newPassword" type="password" show-password />
          </el-form-item>

          <el-form-item v-if="changePassword" label="Confirm Password" prop="confirmPassword">
            <el-input v-model="confirmPassword" type="password" show-password />
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
import { Search, Plus, QuestionFilled, RefreshRight } from '@element-plus/icons-vue';
import {
  fetchUsers,
  addUser,
  updateUser,
  deleteUser,
} from '@/services/userService.js';
import {getAllShifts} from "@/services/shiftService";
import {assignUserToShifts, removeUserFromAllShifts} from "@/services/shiftUserService";

export default {
  name: 'UserManagement',
  components: {
    QuestionFilled,
    Search,
    Plus,
    RefreshRight
  },
  data() {
    return {
      shiftsOptions: [],
      tableData: [], // Original data
      loading: false, // Loading state for the table
      filteredData: [], // Filtered data for display
      currentPage: 1, // Current page number
      pageSize: 15, // Number of items per page
      searchQuery: '', // Search input value
      addDialogVisible: false, // Controls the visibility of the add user dialog
      editDialogVisible: false, // Controls the visibility of the edit user dialog
      sortSettings: { prop: '', order: '' }, // store sorting column and order
      newUser: {
        name: '',
        role: '',
        wecomId: '',
        username: '',
        email: '',
        phone_number: '',
        status: 1, // Default to Active
        password: '',
        assignedShifts: []
      },
      editUser: {
        id: null,
        name: '',
        role: '',
        wecomId: '',
        username: '',
        email: '',
        phone_number: '',
        status: null,
        assignedShifts: [], // Array to hold selected shifts
      },
      changePassword: false, // Checkbox state for edit dialog
      newPassword: '', // New password input
      confirmPassword: '', // Confirm password input
      rules: {
        name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
        role: [{ required: true, message: 'Role is required', trigger: 'change' }],
        wecomId: [{ required: true, message: 'WeChat ID is required', trigger: 'blur' }],
        status: [{ required: true, message: 'Status is required', trigger: 'change' }],
        username: [
          { required: true, message: 'Username is required', trigger: 'blur' },
          { min: 4, message: 'Username must be at least 4 characters', trigger: 'blur' },
        ],
        password: [
          { required: true, message: 'Password is required', trigger: 'blur' },
          { min: 4, message: 'Password must be at least 4 characters', trigger: 'blur' },
        ],
        // newPassword: [
        //   {
        //     validator: (rule, value, callback) => {
        //       console.log('Validating newPassword:', value);
        //       if (this.changePassword && (!value || value.length < 4)) {
        //         callback(new Error('Password must be at least 4 characters'));
        //       } else {
        //         callback();
        //       }
        //     },
        //     trigger: 'blur',
        //   },
        // ],
        // confirmPassword: [
        //   {
        //     validator: (rule, value, callback) => {
        //       console.log('Validating confirmPassword:', value, 'Against:', this.newPassword);
        //       if (this.changePassword && value !== this.newPassword) {
        //         callback(new Error('Passwords must match'));
        //       } else {
        //         callback();
        //       }
        //     },
        //     trigger: 'blur',
        //   },
        // ],
      }
    };
  },
  watch: {
    // Watch for changes in assignedShifts and log its content
    "editUser.assignedShifts": {
      handler(newValue, oldValue) {
        console.log("Assigned Shifts changed:", {
          newValue,
          oldValue,
        });
      },
      deep: true, // Ensures nested changes are tracked
    },
  },
  created() {
    this.fetchUserData();
    this.fetchShiftOptions();
  },
  computed: {
    paginatedUsers() {
      // Apply sorting first
      const sortedData = [...this.filteredData].sort((a, b) => {
        const { prop, order } = this.sortSettings;
        if (!prop || !order) return 0; // No sorting applied

        const valueA = a[prop];
        const valueB = b[prop];

        if (order === 'ascending') return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        if (order === 'descending') return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        return 0;
      });

      // Then apply pagination
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return sortedData.slice(start, end);
    },
  },
  methods: {
    handleSortChange({ prop, order }) {
      // Update the sorting settings
      this.sortSettings = { prop, order };
    },
    async fetchUserData() {
      this.loading = true;
      try {
        const response = await fetchUsers();
        if (response.data.status === '200') {
          console.log("all user data")
          console.log(response.data.data)
          const sortedData = response.data.data.sort((a, b) => a.id - b.id); // Sort by ID
          this.tableData = sortedData;

          // Apply the filter if a search query is present
          if (this.searchQuery.trim()) {
            this.filterTable(); // Filter data based on searchQuery
          } else {
            this.filteredData = sortedData; // Show all data if no filter is applied
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        this.loading = false;
      }
    },
    async fetchShiftOptions() {
      try {
        const response = await getAllShifts();
        if (response.data.status === "200") {
          this.shiftsOptions = response.data.data.map(shift => ({
            value: shift.leader?.name || "-", // Shift Name
            label: shift.name, // Shift Leader Name
            id: shift.id
          }));
        } else {
          this.shiftsOptions = [];
        }
      } catch (error) {
        console.error("Error fetching shifts:", error);
        this.shiftsOptions = [];
      }
    },
    async handleStatusChange(userId, newStatus) {
      const currentUserId = this.$store.getters.getUser.id;

      // Check if deactivating self
      if (userId === currentUserId && newStatus === 0) {
        try {
          await this.$confirm(
              `You are deactivating your own account. Are you sure you want to proceed?`,
              "Self Deactivation Confirmation",
              {
                confirmButtonText: "Yes",
                cancelButtonText: "No",
                type: "warning",
              }
          )
              .then(async () => {
                // Proceed with deactivation
                const payload = { status: newStatus };
                await updateUser(userId, payload);
                this.$message.success("Your account has been deactivated successfully");
                // Handle logout or session cleanup here
              })
              .catch(() => {
                this.$message.info("Self-deactivation canceled");
                this.fetchUserData(); // Refresh the table data
              });
        } catch (error) {
          console.error("Error deactivating user:", error);
          this.$message.error("Failed to deactivate your account");
        }
        return;
      }

      // Regular status change logic for other users
      try {
        const payload = { status: newStatus };
        await updateUser(userId, payload);
        this.$message.success("Status updated successfully");
        this.fetchUserData(); // Refresh the table data
      } catch (error) {
        console.error("Error updating status:", error);
        this.$message.error("Failed to update status");
      }
    },
    getRoleName(roleId) {
      if (roleId === 1) {
        return '管理员';
      }
      if (roleId === 2) {
        return '质检人员';
      }
      return '未知角色';
    },
    validateAndAddUser() {
      this.$refs.addUserForm.validate(async (valid) => {
        if (valid) {
          await this.performAddUser(); // Call the actual method to add the user
        } else {
          this.$message.error('Please fix validation errors before proceeding');
        }
      });
    },
    async performAddUser() {
      try {
        const roleId = this.newUser.role === '管理员' ? 1 : 2;
        const encryptedPassword = btoa(this.newUser.password);
        const payload = {
          name: this.newUser.name,
          role_id: roleId,
          wecom_id: this.newUser.wecomId,
          username: this.newUser.username,
          email: this.newUser.email ?? '',
          phone_number: this.newUser.phone_number ?? '',
          status: this.newUser.status ?? 1, // Default to Active
          password: encryptedPassword,
        };

        const addUserResponse = await addUser(payload);
        // Assign the created user to the selected shifts
        const createdUserId = addUserResponse.data.data.id;
        if (this.newUser.assignedShifts && this.newUser.assignedShifts.length > 0) {
          await assignUserToShifts(createdUserId, this.newUser.assignedShifts);
        }

        this.addDialogVisible = false;
        await this.fetchUserData();
        this.$message.success('User added successfully');
      } catch (error) {
        console.error('Error adding user:', error);
        this.$message.error('Failed to add user');
      }
    },
    async handleEditConfirm() {
      this.$refs.editUserForm.validate(async (valid) => {
        if (valid) {
          try {
            const roleId = this.editUser.role === '管理员' ? 1 : 2;
            const payload = {
              name: this.editUser.name,
              role_id: roleId,
              wecom_id: this.editUser.wecomId,
              username: this.editUser.username,
              email: this.editUser.email,
              phone_number: this.editUser.phone_number,
              status: this.editUser.status,
            };

            // Include password if changePassword is checked, in the future integrate to the same validation check
            if (this.changePassword) {
              if (!this.newPassword || this.newPassword !== this.confirmPassword) {
                this.$message.error('Passwords do not match or are empty!');
                return;
              }
              payload.password = btoa(this.newPassword);
            }

            await updateUser(this.editUser.id, payload);
            // Update the shifts for the user
            try {
              // Remove the user from all current shifts
              await removeUserFromAllShifts(this.editUser.id);

              // Assign the user to the selected shifts
              console.log("assignedShifts: ")
              console.log(this.editUser.assignedShifts)
              if (this.editUser.assignedShifts && this.editUser.assignedShifts.length > 0) {
                await assignUserToShifts(this.editUser.id, this.editUser.assignedShifts);
              }

              this.$message.success("Shifts updated successfully");
            } catch (shiftError) {
              console.error("Error updating shifts:", shiftError);
              this.$message.error("Failed to update shifts");
            }
            this.editDialogVisible = false;
            await this.fetchUserData();
            this.$message.success("User updated successfully");
          } catch (error) {
            console.error("Error editing user:", error);
            this.$message.error("Failed to update user");
          }
        } else {
          this.$message.error("Please fix validation errors before proceeding");
        }
      });
    },
    handleEdit(index, row) {
      console.log(row.shifts)
      this.editUser = {
        id: row.id,
        name: row.name,
        role: row.role_id === 1 ? '管理员' : '质检人员',
        wecomId: row.wecom_id,
        username: row.username,
        email: row.email,
        phone_number: row.phone_number,
        status: row.status,
        assignedShifts: row.shifts
            ? row.shifts.map(shift => shift.id) // Only map shift.id
            : [],
      };
      this.changePassword = false; // Reset checkbox
      this.newPassword = ''; // Reset password fields
      this.confirmPassword = '';
      this.editDialogVisible = true;
    },
    async handleDelete(index, row) {
      const currentUserId = this.$store.getters.getUser.id; // Get logged-in user ID

      // Check if the user is deleting/deactivating themselves
      if (row.id === currentUserId) {
        try {
          // Show self-deletion confirmation dialog
          await this.$confirm(
              `You are deleting your own account and your associated shifts. Are you sure you want to proceed?`,
              "Self Deletion Confirmation",
              {
                confirmButtonText: "Yes",
                cancelButtonText: "No",
                type: "warning",
              }
          )
              .then(async () => {
                // If confirmed, call delete API
                await deleteUser(row.id);
                this.$message.success("Your account has been deleted successfully");
                await this.fetchUserData(); // Refresh the table data
                // handle logout or session cleanup: optional for now, give the user chance to wrap up
              })
              .catch(() => {
                this.$message.info("Self-deletion canceled");
                this.fetchUserData(); // Refresh the table data
              });
        } catch (error) {
          console.error("Error deleting user:", error);
          this.$message.error("Failed to delete your account");
        }
        return;
      }

      // Regular deletion for other users
      try {
        this.$confirm(
            `Are you sure you want to delete the user "${row.name}" as well as the associated shifts?`,
            "Delete Confirmation",
            {
              confirmButtonText: "Yes",
              cancelButtonText: "No",
              type: "warning",
            }
        )
            .then(async () => {
              // If confirmed, call delete API
              await deleteUser(row.id);
              await removeUserFromAllShifts(row.id);
              this.$message.success("User deleted successfully");
              await this.fetchUserData(); // Refresh the table data
            })
            .catch(() => {
              this.$message.info("Deletion canceled");
            });
      } catch (error) {
        console.error("Error deleting user:", error);
        this.$message.error("Failed to delete user");
      }
    },
    showAddDialog() {
      this.addDialogVisible = true;
      this.resetNewUserForm();
    },
    resetNewUserForm() {
      this.newUser = {
        name: '',
        role: '',
        wecomId: '',
        username: '',
        password: '',
      };
    },
    filterTable() {
      const searchText = this.searchQuery.toLowerCase();
      this.filteredData = this.tableData.filter((item) => {
        return Object.keys(item).some((key) => {
          // Apply transformations or computed values for specific columns
          let value;
          switch (key) {
            case 'role_id': // Use role name instead of raw role_id
              value = this.getRoleName(item[key]);
              break;
            case 'status': // Map status to "Active" or "Inactive"
              value = item[key] === 1 ? '已激活' : '未激活';
              break;
            default: // Use raw value for other fields
              value = item[key];
          }
          return value && String(value).toLowerCase().includes(searchText);
        });
      });
    },
    handleSizeChange(size) {
      this.pageSize = size;
    },
    handleCurrentChange(page) {
      this.currentPage = page;
    },
  },
};
</script>

<style scoped>
  .popup-container {
    padding-right: 40px;
  }

  .refresh-button {
    background-color: #80cfff; /* Slightly lighter shade of primary color */
    border-color: #80cfff; /* Match lighter background */
  }

  .refresh-button:hover {
    background-color: #66b5ff; /* Slightly darker hover effect */
    border-color: #66b5ff;
    transform: rotate(360deg); /* Rotate on hover */
    transition: transform 0.3s ease-in-out, background-color 0.2s ease; /* Smooth animation */
  }

  .refresh-button el-icon {
    color: #004085; /* Darker primary-like color for the refresh icon */
  }

  .tableContainer {
    display: flex;
    flex-direction: column;
    overflow-x: auto; /* Enable horizontal scrolling */
    max-width: 100%; /* Prevent table from overflowing */
    white-space: nowrap; /* Prevent column content from wrapping */
  }

  .custom-assign-button {
    background-color: rgba(0, 133, 164, 0.66);
    color: white;
    border-color: rgba(0, 133, 164, 0.88);
  }

  .custom-assign-button:hover {
    background-color: rgba(0, 111, 134, 0.33); /* Slightly darker shade for hover */
    border-color: rgba(0, 111, 134, 0.33);
  }
</style>

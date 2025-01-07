<template>
  <div>
    <!-- Toolbar with Search Bar and Add Button -->
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <el-input
          v-model="searchQuery"
          placeholder="Search by name"
          clearable
          @input="filterTable"
          style="width: 300px;"
      >
        <template #append>
          <el-button>
            <el-icon>
              <Search />
            </el-icon>
          </el-button>
        </template>
      </el-input>

      <el-button type="primary" :icon="Plus" @click="showAddDialog">+ New</el-button>
    </div>

    <!-- Table -->
    <el-table :data="filteredData" style="width: 100%">
      <el-table-column label="ID" width="100" prop="id" sortable>
        <template #default="scope">
          <span>{{ scope.row.id }}</span>
        </template>
      </el-table-column>

      <el-table-column label="Name" width="180">
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

      <el-table-column label="Username">
        <template #default="scope">
          <span>{{ scope.row.username ?? '-' }}</span>
        </template>
      </el-table-column>

      <el-table-column label="Email">
        <template #default="scope">
          <span>{{ scope.row.email ?? '-' }}</span>
        </template>
      </el-table-column>

      <el-table-column label="Phone Number">
        <template #default="scope">
          <span>{{ scope.row.phone_number ?? '-' }}</span>
        </template>
      </el-table-column>

      <el-table-column label="WeCom ID">
        <template #default="scope">
          <span>{{ scope.row.wecom_id }}</span>
        </template>
      </el-table-column>

      <el-table-column label="Role" prop="role_id" sortable>
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
          label="Status" prop="status" sortable
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


      <el-table-column label="Operations" align="right" header-align="right">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.$index, scope.row)">Edit</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.$index, scope.row)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Add User Dialog -->
    <el-dialog title="Add User" v-model="addDialogVisible" width="50%">
      <div class="popup-container">
        <el-form :model="newUser" label-width="140px">
          <el-form-item label="Name">
            <el-input v-model="newUser.name" />
          </el-form-item>

          <el-form-item label="Role">
            <el-select v-model="newUser.role" placeholder="Select Role">
              <el-option label="管理员" value="管理员" />
              <el-option label="质检人员" value="质检人员" />
            </el-select>
          </el-form-item>

          <el-form-item label="WeChat ID">
            <el-input v-model="newUser.wecomId" />
          </el-form-item>

          <el-form-item label="Email">
            <el-input v-model="newUser.email" />
          </el-form-item>

          <el-form-item label="Phone Number">
            <el-input v-model="newUser.phone_number" />
          </el-form-item>

          <el-form-item label="Status">
            <el-select v-model="newUser.status" placeholder="Select Status">
              <el-option label="Active" :value="1" />
              <el-option label="Inactive" :value="0" />
            </el-select>
          </el-form-item>

          <el-form-item label="Username">
            <el-input v-model="newUser.username" />
          </el-form-item>

          <el-form-item label="Password">
            <el-input v-model="newUser.password" type="password" show-password />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="popup-container">
          <el-button @click="addDialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="handleAdd">Confirm</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Edit User Dialog -->
    <el-dialog title="Edit User" v-model="editDialogVisible" width="50%">
      <div class="popup-container">
        <el-form :model="editUser" label-width="140px">
          <el-form-item label="Name">
            <el-input v-model="editUser.name" />
          </el-form-item>

          <el-form-item label="Role">
            <el-select v-model="editUser.role" placeholder="Select Role">
              <el-option label="管理员" value="管理员" />
              <el-option label="质检人员" value="质检人员" />
            </el-select>
          </el-form-item>

          <el-form-item label="WeChat ID">
            <el-input v-model="editUser.wecomId" />
          </el-form-item>

          <el-form-item label="Username">
            <el-input v-model="editUser.username" />
          </el-form-item>

          <el-form-item label="Email">
            <el-input v-model="editUser.email" />
          </el-form-item>

          <el-form-item label="Phone Number">
            <el-input v-model="editUser.phone_number" />
          </el-form-item>

          <el-form-item label="Status">
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
          <el-form-item v-if="changePassword" label="New Password">
            <el-input v-model="newPassword" type="password" show-password />
          </el-form-item>

          <el-form-item v-if="changePassword" label="Confirm Password">
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
import { Search, Plus, QuestionFilled } from '@element-plus/icons-vue';
import {
  fetchUsers,
  addUser,
  updateUser,
  deleteUser,
} from '@/services/userService.js';

export default {
  name: 'UserManagement',
  components: {
    QuestionFilled,
    Search,
    Plus,
  },
  data() {
    return {
      tableData: [], // Original data
      filteredData: [], // Filtered data for display
      searchQuery: '', // Search input value
      addDialogVisible: false, // Controls the visibility of the add user dialog
      editDialogVisible: false, // Controls the visibility of the edit user dialog
      newUser: {
        name: '',
        role: '',
        wecomId: '',
        username: '',
        email: '',
        phone_number: '',
        status: 1, // Default to Active
        password: '',
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
      },
      changePassword: false, // Checkbox state for edit dialog
      newPassword: '', // New password input
      confirmPassword: '', // Confirm password input
    };
  },
  created() {
    this.fetchUserData();
  },
  methods: {
    async fetchUserData() {
      try {
        const response = await fetchUsers();
        if (response.data.status === '200') {
          const sortedData = response.data.data.sort((a, b) => a.id - b.id); // will change logic later
          this.tableData = sortedData;
          this.filteredData = sortedData;
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    },
    async handleStatusChange(userId, newStatus) {
      try {
        const payload = { status: newStatus };
        await updateUser(userId, payload);
        this.$message.success('Status updated successfully');
      } catch (error) {
        this.$message.error('Failed to update status');
        console.error('Error updating status:', error);
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
    async handleAdd() {
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

        await addUser(payload);
        this.addDialogVisible = false;
        this.fetchUserData();
      } catch (error) {
        console.error('Error adding user:', error);
        this.$message.error('Failed to add user');
      }
    },
    async handleEditConfirm() {
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

        // Include password if changePassword is checked
        if (this.changePassword) {
          if (!this.newPassword || this.newPassword !== this.confirmPassword) {
            this.$message.error('Passwords do not match or are empty!');
            return;
          }
          payload.password = btoa(this.newPassword);
        }

        await updateUser(this.editUser.id, payload);
        this.editDialogVisible = false;
        this.fetchUserData();
      } catch (error) {
        console.error('Error editing user:', error);
      }
    },
    handleEdit(index, row) {
      this.editUser = {
        id: row.id,
        name: row.name,
        role: row.role_id === 1 ? '管理员' : '质检人员',
        wecomId: row.wecom_id,
        username: row.username,
        email: row.email,
        phone_number: row.phone_number,
        status: row.status,
      };
      this.changePassword = false; // Reset checkbox
      this.newPassword = ''; // Reset password fields
      this.confirmPassword = '';
      this.editDialogVisible = true;
    },
    async handleDelete(index, row) {
      try {
        await deleteUser(row.id);
        this.fetchUserData(); // Refresh the data after deletion
      } catch (error) {
        console.error('Error deleting user:', error);
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
      this.filteredData = this.tableData.filter((item) =>
          item.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    },
  },
};
</script>

<style scoped>
  .popup-container {
    padding-right: 40px;
  }
</style>

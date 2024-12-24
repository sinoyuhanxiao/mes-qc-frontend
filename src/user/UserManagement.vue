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

      <el-button type="primary" :icon="Plus" @click="showAddDialog">Add</el-button>
    </div>

    <!-- Table -->
    <el-table :data="filteredData" style="width: 100%">
      <el-table-column label="ID" width="100">
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

      <el-table-column label="WeCom ID">
        <template #default="scope">
          <span>{{ scope.row.wecom_id }}</span>
        </template>
      </el-table-column>

      <el-table-column label="Role">
        <template #default="scope">
          <span>{{ getRoleName(scope.row.role_id) }}</span>
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

        <el-form-item label="Username">
          <el-input v-model="newUser.username" />
        </el-form-item>

        <el-form-item label="Password">
          <el-input v-model="newUser.password" type="password" show-password />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="addDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="handleAdd">Confirm</el-button>
      </template>
    </el-dialog>

    <!-- Edit User Dialog -->
    <el-dialog title="Edit User" v-model="editDialogVisible" width="50%">
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

      <template #footer>
        <el-button @click="editDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="handleEditConfirm">Confirm</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script>
import { Search, Plus } from '@element-plus/icons-vue';
import api from "@/services/api"; // Import Element Plus icons

export default {
  name: 'UserManagement',
  components: {
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
        // Add user form data
        name: '',
        role: '',
        wecomId: '',
        username: '',
        password: '',
      },
      editUser: {
        // Edit user form data
        id: null,
        name: '',
        role: '',
        wecomId: '',
        username: '',
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
        const response = await api.get('/user', {
          auth: {
            username: 'fps-control',
            password: 'fpscontrols123',
          },
        });

        if (response.data.status === '200') {
          this.tableData = response.data.data;
          this.filteredData = response.data.data;
        }

        console.log(this.tableData);

      } catch (error) {
        console.error('Error fetching user data:', error);
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
          password: encryptedPassword,
        };

        await api.post('/user', payload);
        this.addDialogVisible = false;
        this.fetchUserData();
      } catch (error) {
        console.error('Error adding user:', error);
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
        };

        // Include password if changePassword is checked
        if (this.changePassword) {
          if (!this.newPassword || this.newPassword !== this.confirmPassword) {
            this.$message.error('Passwords do not match or are empty!');
            return;
          }
          payload.password = btoa(this.newPassword);
        }

        await api.put(`/user/${this.editUser.id}`, payload);
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
      };
      this.changePassword = false; // Reset checkbox
      this.newPassword = ''; // Reset password fields
      this.confirmPassword = '';
      this.editDialogVisible = true;
    },
    async handleDelete(index, row) {
      try {
        await api.delete(`/user/${row.id}`);
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

<style>

</style>

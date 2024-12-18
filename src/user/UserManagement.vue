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
        <el-button slot="append" icon="el-icon-search" />
      </el-input>

      <el-button type="primary" icon="el-icon-plus" @click="showAddDialog">Add</el-button>
    </div>

    <!-- Table -->
    <el-table :data="filteredData" style="width: 100%">
      <el-table-column label="ID" width="100">
        <template slot-scope="scope">
          <span>{{ scope.row.id }}</span>
        </template>
      </el-table-column>

      <el-table-column label="Name" width="180">
        <template slot-scope="scope">
          <el-popover trigger="hover" placement="top">
            <p>Name: {{ scope.row.name }}</p>
            <p>WeCom ID: {{ scope.row.wecom_id }}</p>
            <p>Role: {{ getRoleName(scope.row.role_id) }}</p>
            <div slot="reference" class="name-wrapper">
              <el-tag size="medium">{{ scope.row.name }}</el-tag>
            </div>
          </el-popover>
        </template>
      </el-table-column>

      <el-table-column label="Operations">
        <template slot-scope="scope">
          <el-button size="mini" @click="handleEdit(scope.$index, scope.row)">Edit</el-button>
          <el-button size="mini" type="danger" @click="handleDelete(scope.$index, scope.row)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Add User Dialog -->
    <el-dialog title="Add User" :visible.sync="dialogVisible" width="50%">
      <el-form :model="newUser" label-width="120px">
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

      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="handleAdd">Confirm</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      tableData: [], // Original data
      filteredData: [], // Filtered data for display
      searchQuery: '', // Search input value
      dialogVisible: false, // Controls the visibility of the add user dialog
      newUser: { // New user form data
        name: '',
        role: '',
        wecomId: '',
        username: '',
        password: ''
      }
    }
  },
  created() {
    this.fetchUserData()
  },
  methods: {
    async fetchUserData() {
      try {
        const response = await axios.get('http://10.10.12.68:8086/user', {
          auth: {
            username: 'fps-control',
            password: 'fpscontrols123'
          }
        })

        if (response.data.status === '200') {
          this.tableData = response.data.data
          this.filteredData = response.data.data
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    },
    getRoleName(roleId) {
      if (roleId === 1) {
        return '管理员'
      }
      if (roleId === 2) {
        return '质检人员'
      }
      return '未知角色'
    },
    handleEdit(index, row) {
      this.newUser = {
        id: row.id,
        name: row.name,
        role: row.role_id === 1 ? '管理员' : '质检人员',
        wecomId: row.wecom_id,
        username: row.username || '',
        password: ''
      }
      this.dialogVisible = true
    },
    async handleDelete(index, row) {
      try {
        await axios.delete(`http://10.10.12.68:8086/user/${row.id}`)
        this.fetchUserData() // Refresh the data after deletion
      } catch (error) {
        console.error('Error deleting user:', error)
      }
    },
    showAddDialog() {
      this.dialogVisible = true
      this.resetNewUserForm()
    },
    async handleAdd() {
      try {
        // Convert role name to role ID
        const roleId = this.newUser.role === '管理员' ? 1 : 2

        // Log the newUser data to the console
        console.log('Form Data:', {
          name: this.newUser.name,
          role: roleId,
          wecomId: this.newUser.wecomId,
          username: this.newUser.username,
          password: this.newUser.password
        })

        if (this.newUser.id) {
          // Update existing user
          await axios.put(`http://10.10.12.68:8086/user/${this.newUser.id}`, {
            name: this.newUser.name,
            role_id: roleId,
            wecom_id: this.newUser.wecomId
          })
        } else {
          // Add new user
          await axios.post('http://10.10.12.68:8086/user', {
            name: this.newUser.name,
            role_id: roleId,
            wecom_id: this.newUser.wecomId,
            username: this.newUser.username,
            password: btoa(this.newUser.password) // Simple Base64 encryption for demonstration
          })
        }

        this.dialogVisible = false
        this.fetchUserData() // Refresh the data after adding/updating
      } catch (error) {
        console.error('Error saving user:', error)
      }
    },
    resetNewUserForm() {
      this.newUser = {
        id: null,
        name: '',
        role: '',
        wecomId: '',
        username: '',
        password: ''
      }
    },
    filterTable() {
      this.filteredData = this.tableData.filter(item => item.name.toLowerCase().includes(this.searchQuery.toLowerCase()))
    }
  }
}
</script>

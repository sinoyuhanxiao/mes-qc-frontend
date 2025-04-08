<template>
  <div v-loading="loadingUsers" >
    <!-- Toolbar with Search Bar and Add Button -->
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2>{{ translate("shiftManagement.title") }}</h2>
        <el-input
            v-model="searchQuery"
            :placeholder="translate('shiftManagement.searchPlaceholder')"
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
        <el-tooltip :content="translate('shiftManagement.refreshTooltip')" placement="top">
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
        <el-button type="primary" @click="showAddDialog">{{ translate("shiftManagement.addButton") }}</el-button>
      </div>
    </div>

    <!-- Table -->
    <div class="tableContainer" style="overflow-x: auto; max-width: 100%;">
      <el-table :data="paginatedShifts" style="width: 100%" @sort-change="handleSortChange" :height="tableHeight">
        <el-table-column label="ID" width="100" prop="id" sortable>
          <template #default="scope">
            <span>{{ scope.row.id }}</span>
          </template>
        </el-table-column>

        <el-table-column :label="translate('shiftManagement.table.name')" prop="name" width="180" sortable>
          <template #default="scope">
            <span>{{ scope.row.name }}</span>
          </template>
        </el-table-column>

        <el-table-column :label="translate('shiftManagement.table.type')" prop="type" width="180" sortable>
          <template #default="scope">
            <span>{{ scope.row.type }}</span>
          </template>
        </el-table-column>

        <el-table-column :label="translate('shiftManagement.table.leader')" prop="leader_id" width="180" sortable>
          <template #default="scope">
            <span>{{ scope.row.leader?.name || " - " }}</span>
          </template>
        </el-table-column>

        <el-table-column :label="translate('shiftManagement.table.startTime')" prop="start_time" width="180" sortable>
          <template #default="scope">
            <span>{{ formatTime(scope.row.start_time) }}</span>
          </template>
        </el-table-column>

        <el-table-column :label="translate('shiftManagement.table.endTime')" prop="end_time" width="180" sortable>
          <template #default="scope">
            <span>{{ formatTime(scope.row.end_time) }}</span>
          </template>
        </el-table-column>

        <el-table-column
            :label="translate('shiftManagement.table.status')" prop="status" width="180" sortable
        >
          <template #header>
            <span>
              {{ translate('shiftManagement.table.status') }}
              <el-tooltip :content="translate('shiftManagement.table.statusTooltip')" placement="top">
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

        <el-table-column :label="translate('shiftManagement.table.description')" prop="description" width="360" sortable>
          <template #default="scope">
            <span>{{ scope.row.description }}</span>
          </template>
        </el-table-column>

<!--        <el-table-column label="Created By" prop="created_by" width="180" sortable>-->
<!--          <template #default="scope">-->
<!--            <span>{{ scope.row.created_by }}</span>-->
<!--          </template>-->
<!--        </el-table-column>-->

        <el-table-column :label="translate('shiftManagement.table.createdAt')" prop="created_at" width="180" sortable>
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

        <el-table-column :title="translate('shiftManagement.table.actions')" align="right" header-align="right" width="230" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="openShiftInfoDialog(scope.row)">{{ translate('shiftManagement.table.viewShift') }}</el-button>
            <el-button size="small" @click="handleEdit(scope.$index, scope.row)">{{ translate('shiftManagement.edit') }}</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.$index, scope.row)">{{ translate('shiftManagement.delete') }}</el-button>
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

    <!-- Shift Info Dialog -->
    <el-dialog v-model="dialogTableVisible" :title="`${selectedShiftName} - 资讯`" width="800">
      <el-tabs>
        <el-tab-pane :label="translate('shiftManagement.membersTab')">
          <!-- Filter Bar -->
          <el-input
              v-model="searchUserQuery"
              placeholder="搜索成员"
              clearable
              @input="filterShiftUsers"
              style="margin-bottom: 10px; width: 300px;"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

      <!-- Table with Sorting -->
      <el-table v-loading="loadingUsers" :data="paginatedShiftUsers" @sort-change="handleUserSortChange">
        <el-table-column prop="id" label="ID" width="100" sortable />
        <el-table-column prop="name" label="名称" width="180" sortable />
        <el-table-column prop="role" label="角色" width="150" sortable>
          <template #default="scope">
            <el-tag :type="scope.row.role?.el_tag_type || 'info'">
              {{ scope.row.role?.name || '未知角色' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="wecom_id" label="企业微信ID" width="180" sortable />
        <el-table-column prop="username" label="用户名" width="180" sortable />
        <el-table-column prop="email" label="邮箱" width="220" sortable />
        <el-table-column prop="phone_number" label="电话号码" width="180" sortable>
          <template #default="scope">
            <span>{{ scope.row.phone_number || '-' }}</span>
          </template>
        </el-table-column>
      </el-table>

          <!-- Pagination -->
          <el-pagination
              style="margin-top: 10px"
              @size-change="handleUserSizeChange"
              @current-change="handleUserPageChange"
              :current-page="userCurrentPage"
              :page-size="userPageSize"
              :page-sizes="[10, 20, 30, 50]"
              layout="total, sizes, prev, pager, next"
              :total="filteredShiftUsers.length"
              :hide-on-single-page="true"
          />
        </el-tab-pane>

        <el-tab-pane :label="translate('shiftManagement.formsTab')">
            <div class="popup-container">
              <el-form>
                <shift-form-tree
                    :selectedFormIds="shiftForms"
                    :showOnlySelectedNode="true"
                    @on-node-clicked="handleFormNodeClicked"
                >
                </shift-form-tree>
              </el-form>
            </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- Add Shift Dialog -->
    <el-dialog :title="translate('shiftManagement.addDialog.title')" v-model="addDialogVisible" width="50%" @keyup.enter.native="validateAndAddShift">
      <div v-loading="loadingShift" class="popup-container">
        <el-form ref="addShiftForm" :model="newShift" :rules="rules" label-width="140px">
          <el-form-item :label="translate('shiftManagement.addDialog.name')" prop="name">
            <el-input v-model="newShift.name" />
          </el-form-item>

          <el-form-item :label="translate('shiftManagement.addDialog.type')" prop="type">
            <el-input v-model="newShift.type" />
          </el-form-item>

          <el-form-item :label="translate('shiftManagement.addDialog.leader')" prop="leader_id">
            <el-select
                v-model="newShift.leader_id"
                filterable
                :placeholder="translate('shiftManagement.addDialog.selectLeaderPlaceholder')"
                style="width: 480px"
            >
              <el-option
                  v-for="user in shiftLeaderOptions"
                  :key="user.id"
                  :label="user.name"
                  :value="user.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="translate('shiftManagement.addDialog.startTime')" prop="start_time">
            <el-time-picker
                v-model="newShift.start_time"
                :placeholder="translate('shiftManagement.addDialog.startTime')"
            />
          </el-form-item>

          <el-form-item :label="translate('shiftManagement.addDialog.endTime')" prop="end_time">
            <el-time-picker
                v-model="newShift.end_time"
                :placeholder="translate('shiftManagement.addDialog.endTime')"
            />
          </el-form-item>

          <el-form-item :label="translate('shiftManagement.addDialog.members')" prop="selectedUsers">
            <el-select
                v-model="newUser.selectedUsers"
                multiple
                filterable
                :placeholder="translate('shiftManagement.addDialog.selectMembers')"
                style="width: 100%;"
            >
              <el-option
                  v-for="user in userOptions"
                  :key="user.id"
                  :label="user.name"
                  :value="user.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="translate('shiftManagement.addDialog.forms')" prop="selectedForms">
            <shift-form-tree
                :showOnlySelectedNode="false"
                @update-selected-forms="(formIds)=> newForm.selectedForms = formIds.map(f => f.id)"
                @on-node-clicked="handleFormNodeClicked"
            >
            </shift-form-tree>
          </el-form-item>

          <el-form-item :label="translate('shiftManagement.addDialog.description')" prop="description">
            <el-input type="textarea" v-model="newShift.description" />
          </el-form-item>

          <el-form-item :label="translate('shiftManagement.addDialog.status')" prop="status">
            <el-select v-model="newShift.status" :placeholder="translate('shiftManagement.addDialog.selectStatus')">
              <el-option :label="translate('shiftManagement.status.active')" :value="1" />
              <el-option :label="translate('shiftManagement.status.inactive')" :value="0" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="popup-container">
          <el-button @click="addDialogVisible = false">{{ translate('shiftManagement.addDialog.cancelButton') }}</el-button>
          <el-button type="primary" @click="validateAndAddShift">{{ translate('shiftManagement.addDialog.confirmButton') }}</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Edit Shift Dialog -->
    <el-dialog :title="translate('shiftManagement.editDialog.title')" v-model="editDialogVisible" width="50%" @close="closeEditDialog" @keyup.enter.native="handleEditConfirm">
      <div v-loading="loadingShift" class="popup-container">
        <el-form ref="editShiftForm" :model="editShift" :rules="rules" label-width="140px">
          <el-form-item :label="translate('shiftManagement.editDialog.name')" prop="name">
            <el-input v-model="editShift.name" />
          </el-form-item>

          <el-form-item :label="translate('shiftManagement.editDialog.type')" prop="type">
            <el-input v-model="editShift.type" />
          </el-form-item>

          <el-form-item :label="translate('shiftManagement.editDialog.leader')" prop="leader_id">
            <el-select v-model="editShift.leader_id" filterable :placeholder="translate('shiftManagement.editDialog.selectLeaderPlaceholder')" style="width: 480px">
              <el-option
                  v-for="user in shiftLeaderOptions"
                  :key="user.id"
                  :label="user.name"
                  :value="user.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="translate('shiftManagement.editDialog.startTime')" prop="start_time">
            <el-time-picker
                v-model="editShift.start_time"
                :placeholder="translate('shiftManagement.editDialog.startTime')"
            />
          </el-form-item>

          <el-form-item :label="translate('shiftManagement.editDialog.endTime')" prop="end_time">
            <el-time-picker
                v-model="editShift.end_time"
                :placeholder="translate('shiftManagement.editDialog.endTime')"
            />
          </el-form-item>

          <el-form-item :label="translate('shiftManagement.editDialog.members')" prop="assignedUsers">
            <el-select
                v-model="editUser.assignedUsers"
                multiple
                filterable
                :placeholder="translate('shiftManagement.editDialog.selectMembersPlaceholder')"
                style="width: 100%;"
            >
              <el-option
                  v-for="user in userOptions"
                  :key="user.id"
                  :label="user.name"
                  :value="user.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="translate('shiftManagement.editDialog.forms')">
            <shift-form-tree
                :selectedFormIds="editForm.assignedForms"
                :showOnlySelectedNode="false"
                @update-selected-forms="(formIds)=> editForm.assignedForms = formIds.map(f => f.id)"
                @on-node-clicked="handleFormNodeClicked"
            >
            </shift-form-tree>
          </el-form-item>

          <el-form-item :label="translate('shiftManagement.editDialog.description')" prop="description">
            <el-input type="textarea" v-model="editShift.description" />
          </el-form-item>

          <el-form-item :label="translate('shiftManagement.editDialog.status')" prop="status">
            <el-select v-model="editShift.status" :placeholder="translate('shiftManagement.editDialog.selectStatusPlaceholder')">
              <el-option :label="translate('shiftManagement.status.active')" :value="1" />
              <el-option :label="translate('shiftManagement.status.inactive')" :value="0" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="popup-container">
          <el-button @click="editDialogVisible = false">{{ translate('shiftManagement.editDialog.cancelButton') }}</el-button>
          <el-button type="primary" @click="handleEditConfirm">{{ translate('shiftManagement.editDialog.confirmButton') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { Search, Plus, QuestionFilled, RefreshRight } from "@element-plus/icons-vue";
import {assignUsersToShift, removeShiftFromAllUsers} from '@/services/shiftUserService';
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
import {getUsersForShift} from "@/services/shiftUserService";
import {translate} from "@/utils/i18n";
import {assignFormsToShift, getFormIdsForShift, removeAllFormsFromShift} from "@/services/shiftFormService";
import ShiftFormTree from "@/components/dispatch/ShiftFormTree.vue";
import {openFormPreviewWindow} from "@/utils/dispatch-utils";

dayjs.extend(utc);
dayjs.extend(timezone);

export default {
  name: "ShiftManagement",
  components: {
    ShiftFormTree,
    Search,
    Plus,
    QuestionFilled,
    RefreshRight,
  },
  data() {
    return {
      tableHeight: window.innerHeight - 50 - 100 - 20 - 20 - 10,
      loadingShift: false,
      searchUserQuery: "", // Search input value for users
      userCurrentPage: 1, // Current page for members
      userPageSize: 10, // Page size for members
      filteredShiftUsers: [], // Filtered users for pagination
      userSortSettings: { prop: "", order: "" }, // Sort settings
      tableData: [], // Original data
      filteredData: [], // Filtered data for display
      userOptions: [], // Dropdown options for all users
      shiftLeaderOptions: [], // Dropdown options for shift leaders
      currentPage: 1, // Current page number
      pageSize: 15, // Number of items per page
      searchQuery: "", // Search input value
      addDialogVisible: false, // Add dialog visibility
      editDialogVisible: false, // Edit dialog visibility
      shiftUsers: [], // Stores users assigned to the shift
      shiftForms: [], // Stores forms assigned to the shift
      dialogTableVisible: false, // Controls the visibility of the table dialog
      loadingUsers: false, // Loading state for the user list
      sortSettings: { prop: "", order: "" },
      selectedShiftName: "", // store the selected shift for showing users
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
      editUser: { // representing edit members
        assignedUsers: []
      },
      newUser: { // representing add new members
        selectedUsers: [],
      },
      editForm: {
        assignedForms: [],
      },
      newForm: {
        selectedForms: [],
      },
      rules: {
        name: [{ required: true, message: translate("shiftManagement.validation.nameRequired"), trigger: "blur" }],
        type: [{ required: true, message: translate("shiftManagement.validation.typeRequired"), trigger: "blur" }],
        leader_id: [{ required: true, message: translate("shiftManagement.validation.leaderRequired"), trigger: "blur" }],
        start_time: [{ required: true, message: translate("shiftManagement.validation.startTimeRequired"), trigger: "blur" }],
        end_time: [{ required: true, message: translate("shiftManagement.validation.endTimeRequired"), trigger: "blur" }],
      },
    };
  },
  created() {
    this.fetchShiftData();
    this.fetchUserOptions();
  },
  computed: {
    paginatedShiftUsers() {
      const sortedData = [...this.filteredShiftUsers].sort((a, b) => {
        const { prop, order } = this.userSortSettings;
        if (!prop || !order) return 0;
        const valueA = a[prop];
        const valueB = b[prop];
        return order === "ascending" ? (valueA > valueB ? 1 : -1) : (valueA < valueB ? 1 : -1);
      });

      const start = (this.userCurrentPage - 1) * this.userPageSize;
      return sortedData.slice(start, start + this.userPageSize);
    },
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
  mounted() {
    window.addEventListener("resize", this.updateTableHeight);
  },
  updateTableHeight() {
    this.tableHeight = window.innerHeight - 50 - 100 - 20 - 20 - 10;
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.updateTableHeight);
  },
  methods: {
    translate,
    filterShiftUsers() {
      const searchText = this.searchUserQuery.toLowerCase();
      this.filteredShiftUsers = this.shiftUsers.filter(user =>
          Object.values(user).some(value => String(value).toLowerCase().includes(searchText))
      );
    },
    handleUserSizeChange(size) {
      this.userPageSize = size;
    },
    handleUserPageChange(page) {
      this.userCurrentPage = page;
    },
    handleUserSortChange({ prop, order }) {
      this.userSortSettings = { prop, order };
    },
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
    async openShiftInfoDialog(shift) {
      this.dialogTableVisible = true;
      this.loadingUsers = true;
      this.selectedShiftName = shift.name;

      try {
        let response = await getUsersForShift(shift.id);
        if (response.data.status === "200") {
          this.shiftUsers = response.data.data;
          this.filteredShiftUsers = [...this.shiftUsers];
        } else {
          this.shiftUsers = [];
          this.filteredShiftUsers = [];
        }

        // Load forms of this shift
        response = await getFormIdsForShift(shift.id);
        if (response.data.status === "200") {
          this.shiftForms = [...response.data.data];
        } else {
          this.shiftForms = [];
        }
      } catch (error) {
        console.error("Error fetching shift association", error);
        this.shiftUsers = [];
        this.filteredShiftUsers = [];
        this.shiftForms = [];
      } finally {
        this.loadingUsers = false;
      }
    },
    async handleFormNodeClicked(formTemplateId) {
      await openFormPreviewWindow(formTemplateId, this)
    },
    getRoleName(roleId) {
      return roleId === 1 ? "管理员" : "质检人员";
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
          // ✅ Store all users for general use
          this.userOptions = response.data.data.map((user) => ({
            id: user.id,
            name: user.name,
          }));

          // ✅ Filter only 班长 (role.id === 3)
          this.shiftLeaderOptions = response.data.data
              .filter(user => user.role && user.role.id === 3)
              .map(user => ({
                id: user.id,
                name: user.name,
              }));
        } else {
          this.userOptions = [];
          this.shiftLeaderOptions = []; // Ensure empty state
        }
      } catch (error) {
        console.error("Error fetching user options:", error);
        this.userOptions = [];
        this.shiftLeaderOptions = [];
      }
    },
    async updateUsersForShift(shiftId) {
      this.loadingShift = true;
      try {
        await removeShiftFromAllUsers(shiftId); // Remove all users from shift
        if (this.editUser.assignedUsers.length > 0) {
          await assignUsersToShift(shiftId, this.editUser.assignedUsers);
        }
        this.loadingShift = false;
      } catch (error) {
        console.error('Error updating users for shift:', error);
        this.$message.error('人员更新失败');
        this.loadingShift = false;
      }
    },
    async updateFormsForShift(shiftId) {
      try {
        await removeAllFormsFromShift(shiftId);
        if (this.editForm.assignedForms.length > 0) {
          await assignFormsToShift(shiftId, this.editForm.assignedForms);
        }
      } catch (error) {
        console.error('Error updating forms for shift:', error);
        this.$message.error('表单更新失败');
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
      this.filteredData = this.tableData.filter((item) =>
          (item.id && String(item.id).toLowerCase().includes(searchText)) || // 过滤 ID
          (item.leader?.name && item.leader.name.toLowerCase().includes(searchText)) || // 过滤 负责人名字
          (item.name && item.name.toLowerCase().includes(searchText)) || // 过滤 班次名称
          (item.type && item.type.toLowerCase().includes(searchText)) || // 过滤 班次类型
          (item.start_time && this.formatTime(item.start_time).includes(searchText)) || // 过滤 开始时间
          (item.end_time && this.formatTime(item.end_time).includes(searchText)) || // 过滤 结束时间
          (item.description && item.description.toLowerCase().includes(searchText)) // 过滤 描述
      );
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
      this.loadingShift = true;
      this.$refs.addShiftForm.validate(async (valid) => {
        if (valid) {
          try {
            const createdBy = this.$store.getters.getUser.id;
            // Avoid modifying reactive properties repeatedly
            const startTime = this.toOffsetTime(this.newShift.start_time);
            const endTime = this.toOffsetTime(this.newShift.end_time);

            const payload = { ...this.newShift, start_time: startTime, end_time: endTime };
            console.log("Creating shift:", payload)
            const response = await createShift(payload, createdBy);
            const shiftId = response.data.data.id;
            console.log("Shift created:", response.data.data)
            if (this.newUser.selectedUsers.length > 0) {
              await assignUsersToShift(shiftId, this.newUser.selectedUsers);
            }

            if (this.newForm.selectedForms.length > 0) {
              await assignFormsToShift(shiftId, this.newForm.selectedForms);
            }

            await this.$nextTick(() => this.resetNewShiftForm());
            // Force reset after successful addition
            this.addDialogVisible = false;
            await this.fetchShiftData();
            this.$message.success("班组创建成功");
          } catch (error) {
            console.error("Error adding shift:", error);
            this.$message.error("班组创建失败");
          } finally {
            this.loadingShift = false;
          }
        } else {
          this.loadingShift = false;
        }
      });
    },
    async handleEditConfirm() {
      this.loadingShift = true;
      await this.$nextTick();
      try {
        const payload = {...this.editShift}; // 浅拷贝原始对象
        delete payload.leader; // 去掉 `leader` 键值对

        // Format start_time and end_time
        payload.start_time = this.toOffsetTime(payload.start_time);
        payload.end_time = this.toOffsetTime(payload.end_time);

        await updateShift(payload.id, payload, this.$store.getters.getUser.id);
        // deal with shift members update
        await this.updateUsersForShift(payload.id);
        await this.updateFormsForShift(payload.id);
        this.editDialogVisible = false;

        await this.fetchShiftData();
        this.$message.success("班组编辑成功");
      } catch (error) {
        console.error("Error updating shift:", error);
        this.$message.error("班组编辑失败");
      } finally {
        this.loadingShift = false;
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
        this.$message.success("激活状态更改成功");
      } catch (error) {
        console.error("Error updating status:", error);
      }
    },
    async handleDelete(index, row) {
      try {
        this.$confirm(
            `您确认要删除班次 "${row.name}" 并解除其与所有成员的关联吗？`,
            '删除确认',
            {
              confirmButtonText: '确认',
              cancelButtonText: '取消',
              type: 'warning',
            }
        ).then(async () => {
          await deleteShift(row.id);
          await removeShiftFromAllUsers(row.id);
          await this.fetchShiftData();
          this.$message.success('班组删除成功');
        }).catch(() => {
          this.$message.info('班组删除取消');
        });
      } catch (error) {
        console.error('Error deleting shift:', error);
        this.$message.error('删除班组失败');
      }
    },
    handleEdit(index, row) {
      // Close the dialog first
      this.editDialogVisible = false;
      this.loadingUsers = true;

      // Wait for the next DOM update to reopen the dialog
      this.$nextTick(async () => {
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
        this.editUser.assignedUsers = (await getUsersForShift(row.id)).data.data.map(user => user.id);
        this.editForm.assignedForms = [...(await getFormIdsForShift(row.id)).data.data];
        // Fetch user options for the dropdown
        await this.fetchUserOptions();

        // Reopen the dialog
        this.editDialogVisible = true;

        this.loadingUsers = false; // Ensure loading state is cleared
      });
    },
    showAddDialog() {
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

      // Reset users and forms
      this.newUser.selectedUsers = [];
      this.newForm.selectedForms = [];
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
    dialogTableVisible(newVal) {
      if (!newVal) {
        this.searchUserQuery = ""; // Clear the search query when closing the dialog
      }
    }
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

/* Make the outer container span the full height of the viewport */
:host {
  display: flex;
  flex-direction: column;
  height: 100vh; /* Full viewport height */
}

/* Set the table container to use the remaining height */
.tableContainer {
  flex-grow: 1; /* Fill available space */
  overflow-y: auto; /* Enable vertical scrolling */
  max-height: calc(100vh - 160px); /* Adjust for header/footer heights */
  display: flex;
  flex-direction: column;
}
</style>

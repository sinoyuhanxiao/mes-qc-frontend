<template>
  <div v-loading="loadingUsers" >
    <!-- Toolbar with Search Bar and Add Button -->
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2>{{ translate("teamManagement.title") }}</h2>
        <el-input
            v-model="searchQuery"
            :placeholder="translate('common.searchPlaceholder')"
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
        <el-tooltip :content="translate('teamManagement.refreshTooltip')" placement="top">
          <el-button
              class="refresh-button"
              type="primary"
              circle
              @click="fetchTeamData"
          >
            <el-icon style="color: #004085;"><RefreshRight /></el-icon>
          </el-button>
        </el-tooltip>

        <!-- Add Button -->
        <el-button type="primary" @click="showAddDialog">{{ translate("teamManagement.addButton") }}</el-button>
      </div>
    </div>

    <!-- Table -->
    <div class="tableContainer" style="overflow-x: auto; max-width: 100%;">
      <el-table
          :data="paginatedTeams"
          style="width: 100%"
          @sort-change="handleSortChange"
          :height="tableHeight"
          row-key="id"
          :tree-props="{children : 'children'}"
          :expand-row-keys="expandedKeys"
          v-loading="loadingTeam"
          :empty-text="translate('common.noDataAvailable')"
      >
        <el-table-column label="ID" width="100" prop="id" sortable>
          <template #default="scope">
            <span>{{ scope.row.id }}</span>
          </template>
        </el-table-column>

        <el-table-column :label="translate('teamManagement.table.name')" prop="name" width="180" sortable>
          <template #default="scope">
            <span>{{ scope.row.name }}</span>
          </template>
        </el-table-column>

        <el-table-column :label="translate('teamManagement.table.type')" prop="type" width="180" sortable>
          <template #default="scope">
            <span>{{ scope.row.type || " - " }}</span>
          </template>
        </el-table-column>

        <el-table-column :label="translate('teamManagement.table.leader')" prop="leader_id" width="180" sortable>
          <template #default="scope">
            <span>{{ scope.row.leader?.name || " - " }}</span>
          </template>
        </el-table-column>

<!--        <el-table-column :label="translate('teamManagement.table.startTime')" prop="start_time" width="180" sortable>-->
<!--          <template #default="scope">-->
<!--            <span>{{ formatTime(scope.row.start_time) }}</span>-->
<!--          </template>-->
<!--        </el-table-column>-->

<!--        <el-table-column :label="translate('teamManagement.table.endTime')" prop="end_time" width="180" sortable>-->
<!--          <template #default="scope">-->
<!--            <span>{{ formatTime(scope.row.end_time) }}</span>-->
<!--          </template>-->
<!--        </el-table-column>-->

        <el-table-column
            :label="translate('teamManagement.table.status')" prop="status" width="180" sortable
        >
          <template #header>
            <span>
              {{ translate('teamManagement.table.status') }}
              <el-tooltip :content="translate('teamManagement.table.statusTooltip')" placement="top">
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

        <el-table-column :label="translate('teamManagement.table.description')" prop="description" width="360" sortable>
          <template #default="scope">
            <span>{{ scope.row.description }}</span>
          </template>
        </el-table-column>

<!--        <el-table-column label="Created By" prop="created_by" width="180" sortable>-->
<!--          <template #default="scope">-->
<!--            <span>{{ scope.row.created_by }}</span>-->
<!--          </template>-->
<!--        </el-table-column>-->

        <el-table-column :label="translate('teamManagement.table.createdAt')" prop="created_at" width="180" sortable>
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

        <el-table-column :label="translate('teamManagement.table.actions')" align="right" header-align="right" width="230" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="openTeamInfoDialog(scope.row)">{{ translate('teamManagement.table.viewTeam') }}</el-button>
<!--            <el-button size="small" type="primary" @click="showAddDialog(scope.row)">{{ 'Add' }}</el-button>-->
            <el-button size="small" @click="handleEdit(scope.$index, scope.row)">{{ translate('teamManagement.edit') }}</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.$index, scope.row)">{{ translate('teamManagement.delete') }}</el-button>
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

    <!-- Team Info Dialog -->
    <el-dialog v-model="dialogTableVisible" :title="`${selectedTeamName}`" width="800">
      <el-tabs>
        <el-tab-pane :label="translate('teamManagement.membersTab')">
          <!-- Filter Bar -->
          <el-input
              v-model="searchUserQuery"
              :placeholder="translate('orderManagement.orderFormDialog.searchUserPlaceholder')"
              clearable
              @input="filterTeamUsers"
              style="margin-bottom: 10px; width: 300px;"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

      <!-- Table with Sorting -->
      <el-table v-loading="loadingUsers" :data="paginatedTeamUsers" @sort-change="handleUserSortChange" :empty-text="translate('common.noDataAvailable')">
        <el-table-column prop="id" :label="translate('userManagement.table.id')" width="100" sortable />
        <el-table-column prop="name" :label="translate('userManagement.table.name')" width="180" sortable />
        <el-table-column prop="role" :label="translate('userManagement.table.role')" width="150" sortable>
          <template #default="scope">
            <el-tag :type="scope.row.role?.el_tag_type || 'info'">
              {{ scope.row.role?.name || translate('userManagement.role.unknown') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="wecom_id" :label="translate('userManagement.table.wecomId')" width="180" sortable />
        <el-table-column prop="status" :label="translate('userManagement.table.status')">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
              disabled
            />
          </template>
        </el-table-column>
        <el-table-column prop="username" :label="translate('userManagement.table.username')" width="180" sortable />
        <el-table-column prop="email" :label="translate('userManagement.table.email')" width="220" sortable />
        <el-table-column prop="phone_number" :label="translate('userManagement.table.phoneNumber')" width="180" sortable>
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
              :total="filteredTeamUsers.length"
              :hide-on-single-page="true"
          />
        </el-tab-pane>

        <el-tab-pane :label="translate('teamManagement.formsTab')">
            <div class="popup-container">
              <el-form>
                <team-form-tree
                    :selectedFormIds="teamForms"
                    :showOnlySelectedNode="true"
                    :expand-all-nodes="false"
                    @on-node-clicked="handleFormNodeClicked"
                >
                </team-form-tree>
              </el-form>
            </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- Add Team Dialog -->
    <el-dialog :title="translate('teamManagement.addDialog.title')" v-model="addDialogVisible" width="50%" @keyup.enter.native="validateAndAddTeam">
      <div class="popup-container">
        <el-form ref="addTeamForm" :model="newTeam" :rules="rules" label-width="140px">
          <el-form-item :label="translate('teamManagement.addDialog.name')" prop="name">
            <el-input v-model="newTeam.name" />
          </el-form-item>

          <el-form-item :label="translate('teamManagement.addDialog.type')" prop="type">
            <el-input v-model="newTeam.type" />
          </el-form-item>

          <el-form-item :label="translate('teamManagement.parentTeam')">
            <el-tree-select
                v-model="newTeam.parent_id"
                :data="parentTeamOptions(newTeam.id)"
                check-strictly
                show-checkbox
                check-on-click-node
                :placeholder="translate('teamManagement.addDialog.selectParentTeamPlaceholder')"
            >
            </el-tree-select>
          </el-form-item>

          <el-form-item prop="leader_id">
            <template #label>
              <span>{{ translate('teamManagement.addDialog.leader')}}</span>

              <!-- Hint icon + tooltip -->
              <el-tooltip :content="leaderHint" placement="top" raw-content>
                <el-icon style="vertical-align: text-bottom">
                  <question-filled />
                </el-icon>

              </el-tooltip>
            </template>

            <el-select
                v-model="newTeam.leader_id"
                filterable
                clearable
                :placeholder="translate('teamManagement.addDialog.selectLeaderPlaceholder')"
            >
              <el-option
                  v-for="user in teamLeaderOptions"
                  :key="user.id"
                  :label="user.name"
                  :value="user.id"
              >
                <span style="float:left">{{ user.name }}</span>
                <span
                    style="
                        float: right;
                        color: var(--el-text-color-secondary);
                        font-size: 13px;
                     "
                >
                    {{ getRole(user.role_id).name }}
                   <span v-if="user.team_name"> - {{ user.team_name }}</span>
                </span>
              </el-option>
            </el-select>
          </el-form-item>

<!--          <el-form-item :label="translate('teamManagement.addDialog.startTime')" prop="start_time">-->
<!--            <el-time-picker-->
<!--                v-model="newTeam.start_time"-->
<!--                :placeholder="translate('teamManagement.addDialog.startTime')"-->
<!--            />-->
<!--          </el-form-item>-->

<!--          <el-form-item :label="translate('teamManagement.addDialog.endTime')" prop="end_time">-->
<!--            <el-time-picker-->
<!--                v-model="newTeam.end_time"-->
<!--                :placeholder="translate('teamManagement.addDialog.endTime')"-->
<!--            />-->
<!--          </el-form-item>-->

          <el-form-item :label="translate('teamManagement.addDialog.members')" prop="selectedUsers">
            <el-select
                v-model="newUser.selectedUsers"
                multiple
                filterable
                :placeholder="translate('teamManagement.addDialog.selectMembersPlaceholder')"
            >
              <el-option
                  v-for="user in teamMemberOptions"
                  :key="user.id"
                  :label="user.name"
                  :value="user.id"
              >
                <span style="float:left">{{ user.name }}</span>
                <span
                    style="
                        float: right;
                        color: var(--el-text-color-secondary);
                        font-size: 13px;
                     "
                >
                    {{ getRole(user.role_id).name }}
                </span>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item :label="translate('teamManagement.addDialog.forms')" prop="selectedForms">
            <team-form-tree
                :showOnlySelectedNode="false"
                :expand-all-nodes="false"
                :allowed-form-ids="parentFormIds"
                @update-selected-forms="(formIds)=> newForm.selectedForms = formIds.map(f => f.id)"
                @on-node-clicked="handleFormNodeClicked"
            >
            </team-form-tree>
          </el-form-item>

          <el-form-item :label="translate('teamManagement.addDialog.description')" prop="description">
            <el-input type="textarea" v-model="newTeam.description" />
          </el-form-item>

          <el-form-item :label="translate('teamManagement.addDialog.status')" prop="status">
            <el-select v-model="newTeam.status" :placeholder="translate('teamManagement.addDialog.selectStatus')">
              <el-option :label="translate('teamManagement.status.active')" :value="1" />
              <el-option :label="translate('teamManagement.status.inactive')" :value="0" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="popup-container">
          <el-button @click="addDialogVisible = false">{{ translate('teamManagement.addDialog.cancelButton') }}</el-button>
          <el-button type="primary" @click="validateAndAddTeam">{{ translate('teamManagement.addDialog.confirmButton') }}</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Edit Team Dialog -->
    <el-dialog :title="translate('teamManagement.editDialog.title')" v-model="editDialogVisible" width="50%" @close="closeEditDialog" @keyup.enter.native="handleEditConfirm">
      <div class="popup-container">
        <el-form ref="editTeamForm" :model="editTeam" :rules="rules" label-width="140px">
          <el-form-item :label="translate('teamManagement.editDialog.name')" prop="name">
            <el-input v-model="editTeam.name" />
          </el-form-item>

          <el-form-item :label="translate('teamManagement.editDialog.type')" prop="type">
            <el-input v-model="editTeam.type" />
          </el-form-item>

          <el-form-item :label="translate('teamManagement.parentTeam')">
            <el-tree-select
                v-model="editTeam.parent_id"
                :data="parentTeamOptions(editTeam.id)"
                check-strictly
                show-checkbox
                check-on-click-node
                :placeholder="translate('teamManagement.editDialog.selectParentTeamPlaceholder')"
            >
            </el-tree-select>
          </el-form-item>

          <el-form-item prop="leader_id">
            <template #label>
              <span>{{ translate('teamManagement.editDialog.leader')}}</span>

              <!-- Hint icon + tooltip -->
              <el-tooltip :content="leaderHint" placement="top" raw-content>
                <el-icon style="vertical-align: text-bottom">
                  <question-filled />
                </el-icon>

              </el-tooltip>
            </template>

            <el-select
                v-model="editTeam.leader_id"
                filterable
                clearable
                :placeholder="translate('teamManagement.editDialog.selectLeaderPlaceholder')"
            >
              <el-option
                  v-for="user in teamLeaderOptions"
                  :key="user.id"
                  :label="user.name"
                  :value="user.id"
              >
                <span style="float:left">{{ user.name }}</span>
                <span
                    style="
                        float: right;
                        color: var(--el-text-color-secondary);
                        font-size: 13px;
                     "
                >
                    {{ getRole(user.role_id).name }}

                  <!-- team name, if this user is currently a leader -->
                  <span v-if="user.team_name"> - {{ user.team_name }}</span>
                </span>
              </el-option>
            </el-select>
          </el-form-item>

<!--          <el-form-item :label="translate('teamManagement.editDialog.startTime')" prop="start_time">-->
<!--            <el-time-picker-->
<!--                v-model="editTeam.start_time"-->
<!--                :placeholder="translate('teamManagement.editDialog.startTime')"-->
<!--            />-->
<!--          </el-form-item>-->

<!--          <el-form-item :label="translate('teamManagement.editDialog.endTime')" prop="end_time">-->
<!--            <el-time-picker-->
<!--                v-model="editTeam.end_time"-->
<!--                :placeholder="translate('teamManagement.editDialog.endTime')"-->
<!--            />-->
<!--          </el-form-item>-->

          <el-form-item :label="translate('teamManagement.editDialog.members')" prop="assignedUsers">
            <el-select
                v-model="editUser.assignedUsers"
                multiple
                filterable
                :placeholder="translate('teamManagement.editDialog.selectMembersPlaceholder')"
            >
              <el-option
                  v-for="user in teamMemberOptions"
                  :key="user.id"
                  :label="user.name"
                  :value="user.id"
              >
                <span style="float:left">{{ user.name }}</span>
                <span
                    style="
                        float: right;
                        color: var(--el-text-color-secondary);
                        font-size: 13px;
                     "
                >
                    {{ getRole(user.role_id).name }}
                </span>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item :label="translate('teamManagement.editDialog.forms')">
            <team-form-tree
                :selectedFormIds="editForm.assignedForms"
                :showOnlySelectedNode="false"
                :expand-all-nodes="false"
                :allowed-form-ids="parentFormIds"
                @update-selected-forms="(formIds)=> editForm.assignedForms = formIds.map(f => f.id)"
                @on-node-clicked="handleFormNodeClicked"
            >
            </team-form-tree>
          </el-form-item>

          <el-form-item :label="translate('teamManagement.editDialog.description')" prop="description">
            <el-input type="textarea" v-model="editTeam.description" />
          </el-form-item>

          <el-form-item :label="translate('teamManagement.editDialog.status')" prop="status">
            <el-select v-model="editTeam.status" :placeholder="translate('teamManagement.editDialog.selectStatusPlaceholder')">
              <el-option :label="translate('teamManagement.status.active')" :value="1" />
              <el-option :label="translate('teamManagement.status.inactive')" :value="0" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="popup-container">
          <el-button @click="editDialogVisible = false">{{ translate('teamManagement.editDialog.cancelButton') }}</el-button>
          <el-button type="primary" @click="handleEditConfirm">{{ translate('teamManagement.editDialog.confirmButton') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>

</template>

<script>
import { Search, Plus, QuestionFilled, RefreshRight } from "@element-plus/icons-vue";
import { removeTeamFromAllUsers } from '@/services/teamUserService';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {
  getAllTeams,
  createTeam,
  updateTeam,
  activateTeam,
  deactivateTeam,
  deleteTeam,
  getTeamDepth
} from "@/services/teamService.js";
import { formatDate} from "@/utils/task-center/dateFormatUtils";
import { fetchUsers} from "@/services/userService";
import { getUsersForTeam} from "@/services/teamUserService";
import { translate, translateWithParams } from "@/utils/i18n";
import { getFormIdsForTeam } from "@/services/teamFormService";
import TeamFormTree from "@/components/dispatch/TeamFormTree.vue";
import { openFormPreviewWindow } from "@/utils/dispatch-utils";
import { getCurrentLeaders } from "@/services/teamService";
import { fetchRoles } from "@/services/roleService";


dayjs.extend(utc);
dayjs.extend(timezone);

export default {
  name: "TeamManagement",
  components: {
    TeamFormTree,
    Search,
    Plus,
    QuestionFilled,
    RefreshRight,
  },
  data() {
    return {
      tableHeight: window.innerHeight - 50 - 100 - 20 - 20 - 10,
      loadingTeam: false,
      searchUserQuery: "", // Search input value for users
      userCurrentPage: 1, // Current page for members
      userPageSize: 10, // Page size for members
      filteredTeamUsers: [], // Filtered users for pagination
      userSortSettings: { prop: "", order: "" }, // Sort settings
      tableData: [], // Original data
      teamOptions: [], // Dropdown options for all teams (used for selecting parent team)
      filteredData: [], // Filtered data for display
      userOptions: [], // Dropdown options for all users
      teamLeaderOptions: [], // Leader options for create/edit team
      teamMemberOptions: [],   // Member options for create/edit team
      parentFormIds:    [],    // Stores forms from parent team
      currentPage: 1, // Current page number
      pageSize: 15, // Number of items per page
      searchQuery: "", // Search input value
      addDialogVisible: false, // Add dialog visibility
      editDialogVisible: false, // Edit dialog visibility
      teamUsers: [], // Stores users assigned to the team
      teamForms: [], // Stores forms assigned to the team
      dialogTableVisible: false, // Controls the visibility of the table dialog
      loadingUsers: false, // Loading state for the user list
      sortSettings: { prop: "", order: "" },
      selectedTeamName: "", // store the selected team for showing users
      currentLeaders: {}, // Map that stores all current leader objects
      expandedKeys: [],
      newTeam: {
        name: "",
        type: "",
        leader_id: null,
        start_time: "", // Formatted value for the backend
        end_time: "",
        description: "",
        status: 1, // Default null
        parent_id: null,
      },
      editTeam: {
        id: null,
        name: "",
        type: "",
        leader_id: null,
        start_time: "",
        end_time: "",
        description: "",
        status: 1,
        parent_id: null,
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
      rolesMap: {}, // Stores all roles data
      rules: {
        name: [{ required: true, message: translate("teamManagement.validation.nameRequired"), trigger: "blur" }],
        type: [{ required: false, message: translate("teamManagement.validation.typeRequired"), trigger: "blur" }],
        leader_id: [{ required: false, message: translate("teamManagement.validation.leaderRequired"), trigger: "blur" }],
        start_time: [{ required: false, message: translate("teamManagement.validation.startTimeRequired"), trigger: "blur" }],
        end_time: [{ required: false, message: translate("teamManagement.validation.endTimeRequired"), trigger: "blur" }],
      },
    };
  },
  created() {
    this.fetchTeamData();
    this.fetchCurrentLeaders();
    this.fetchUserOptions();
    this.fetchRoles();
  },
  computed: {
    paginatedTeamUsers() {
      const sortedData = [...this.filteredTeamUsers].sort((a, b) => {
        const { prop, order } = this.userSortSettings;
        if (!prop || !order) return 0;
        const valueA = a[prop];
        const valueB = b[prop];
        return order === "ascending" ? (valueA > valueB ? 1 : -1) : (valueA < valueB ? 1 : -1);
      });

      const start = (this.userCurrentPage - 1) * this.userPageSize;
      return sortedData.slice(start, start + this.userPageSize);
    },
    paginatedTeams() {
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
    leaderHint() {
      return translate('teamManagement.leaderSelectionHint');
    }
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
    filterTeamUsers() {
      const searchText = this.searchUserQuery.toLowerCase();
      this.filteredTeamUsers = this.teamUsers.filter(user =>
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
    async openTeamInfoDialog(team) {
      this.dialogTableVisible = true;
      this.loadingUsers = true;
      this.selectedTeamName = team.name;

      try {
        let response = await getUsersForTeam(team.id);
        if (response.data.status === "200") {
          this.teamUsers = response.data.data;
          this.filteredTeamUsers = [...this.teamUsers];
        } else {
          this.teamUsers = [];
          this.filteredTeamUsers = [];
        }

        // Load forms of this team
        response = await getFormIdsForTeam(team.id);
        if (response.data.status === "200") {
          this.teamForms = [...response.data.data];
        } else {
          this.teamForms = [];
        }
      } catch (error) {
        console.error("Error fetching team association", error);
        this.teamUsers = [];
        this.filteredTeamUsers = [];
        this.teamForms = [];
      } finally {
        this.loadingUsers = false;
      }
    },
    async handleFormNodeClicked(formTemplateId) {
      await openFormPreviewWindow(formTemplateId, this)
    },
    closeEditDialog() {
      // Reset the editTeam object to prevent data conflicts
      this.editTeam = {
        id: null,
        name: "",
        type: "",
        leader_id: null,
        start_time: null,
        end_time: null,
        description: "",
        status: null,
        parent_id: null,
      };
      this.editDialogVisible = false; // Close the dialog
    },
    async fetchUserOptions() {
      try {
        const response = await fetchUsers(); // Fetch users from the backend
        if (response.data && response.data.status === "200") {
          // Store all users for general use
          this.userOptions = response.data.data
              .map(user => ({
                id: user.id,
                name: user.name,
                role_id: user.role?.id,
              }));

          await this.onParentChanged();
        } else {
          this.userOptions = [];
          this.teamLeaderOptions = []; // Ensure empty state
        }
      } catch (error) {
        console.error("Error fetching user options:", error);
        this.userOptions = [];
        this.teamLeaderOptions = [];
      }
    },
    async fetchCurrentLeaders() {
      try {
        const response = await getCurrentLeaders();
        const map = new Map();

        if (response.data.status === "200") {
          response.data.data.forEach(leaderObj => {
            map.set(leaderObj.user_id, leaderObj.team_name);
          });
          this.currentLeaders = map;
        } else {
          this.currentLeaders = {};
        }
      } catch (error) {
        console.error("Error fetching current leader IDs:", error);
        this.currentLeaders = {};
      }
    },
    async fetchTeamData() {
      try {
        this.loadingTeam = true;
        const response = await getAllTeams(); // API call
        if (response.data.status === '200') {
          this.tableData = response.data.data || []; // Assign data
          this.filteredData = [...this.tableData]; // Initialize filtered data
          this.teamOptions = this.toTeamOptions(this.tableData)
          this.expandedKeys = this.expandAllKeys(this.tableData);
        } else {
          this.tableData = [];
          this.filteredData = [];
          this.teamOptions = [];
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
        this.tableData = [];
        this.filteredData = [];
      } finally {
        this.loadingTeam = false;
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
    async validateAndAddTeam() {
      this.$refs.addTeamForm.validate(async (valid) => {
        if (valid) {
          try {
            // Avoid modifying reactive properties repeatedly
            const startTime = this.toOffsetTime(this.newTeam.start_time);
            const endTime = this.toOffsetTime(this.newTeam.end_time);

            const payload = { ...this.newTeam,
              start_time: startTime,
              end_time: endTime,
              created_by: this.$store.getters.getUser.id,
              member_ids: this.newUser.selectedUsers,
              form_ids: this.newForm.selectedForms,
            };

            const response = await createTeam(payload);

            await this.$nextTick(() => this.resetNewTeamForm());
            // Force reset after successful addition
            this.addDialogVisible = false;
            await this.fetchTeamData();
            await this.fetchCurrentLeaders();
            this.$message.success(translate('teamManagement.messages.teamAddedSuccess'));
          } catch (error) {
            console.error("Error adding team:", error);
            this.$message.error(translate('teamManagement.messages.teamDeletionFailed'));
          }
        }
      });
    },
    async handleEditConfirm() {
      await this.$nextTick();
      try {
        const payload = {...this.editTeam};
        payload.start_time = this.toOffsetTime(payload.start_time);
        payload.end_time = this.toOffsetTime(payload.end_time);
        payload.updated_by = this.$store.getters.getUser.id;
        payload.member_ids = this.editUser.assignedUsers;
        payload.form_ids = this.editForm.assignedForms;
        await updateTeam(payload.id, payload);

        this.editDialogVisible = false;

        await this.fetchTeamData();
        await this.fetchCurrentLeaders();
        this.$message.success(translate('teamManagement.messages.teamEditedSuccess'));
      } catch (error) {
        console.error("Error updating team:", error);
        this.$message.error(translate('teamManagement.messages.teamEditedFailed'));
      }
    },
    async handleStatusChange(id, status) {
      try {
        if (status === 1) {
          await activateTeam(id, this.$store.getters.getUser.id);
        } else {
          await deactivateTeam(id, this.$store.getters.getUser.id);
        }
        await this.fetchTeamData();
        this.$message.success(translate('teamManagement.messages.statusUpdatedSuccess'));
      } catch (error) {
        console.error("Error updating status:", error);
      }
    },
    async handleDelete(index, row) {
      try {
        this.$confirm(
            translateWithParams('teamManagement.messages.deletionConfirmation', {name: row.name}),
            translate('userManagement.messages.deletionTitle'),
            {
              confirmButtonText: translate('userManagement.confirm'),
              cancelButtonText: translate('userManagement.cancel'),
              type: 'warning',
            }
        ).then(async () => {
          await deleteTeam(row.id);
          await removeTeamFromAllUsers(row.id);
          await this.fetchTeamData();
          this.$message.success(translate('teamManagement.messages.teamDeletedSuccess'));
        }).catch(() => {
          this.$message.info(translate('teamManagement.messages.teamDeletionCancelled'));
        });
      } catch (error) {
        console.error('Error deleting team:', error);
        this.$message.error(translate('teamManagement.messages.teamDeletionFailed'));
      }
    },
    handleEdit(index, row) {
      // Close the dialog first
      this.editDialogVisible = false;
      this.loadingUsers = true;

      // Wait for the next DOM update to reopen the dialog
      this.$nextTick(async () => {
        // Map all relevant fields from the selected row to editTeam
        this.editTeam = {
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
          status: row.status,
          parent_id: row.parent_id,
        };
        this.editUser.assignedUsers = (await getUsersForTeam(row.id)).data.data.map(user => user.id);
        this.editForm.assignedForms = [...(await getFormIdsForTeam(row.id)).data.data];
        // Fetch user options for the dropdown
        await this.fetchUserOptions();

        // Reopen the dialog
        this.editDialogVisible = true;

        this.loadingUsers = false; // Ensure loading state is cleared
      });
    },
    showAddDialog(row = null) {
      this.fetchUserOptions(); // Fetch the user list

      if (row.id) {
        this.newTeam.parent_id = row.id;
      } else {
        this.newTeam.parent_id = null;
      }

      this.addDialogVisible = true; // Open the dialog
      // this.$nextTick(() => {
      //   this.resetNewTeamForm(); // Reset the form after rendering : has bug but I do not know why
      // });
    },
    resetNewTeamForm() {
      this.newTeam = {
        name: "",
        type: "",
        leader_id: null,
        start_time: null,
        end_time: null, // Ensure end_time is reset to null
        description: "", // Ensure description is reset to empty string
        status: 1,
        parent_id: null,
      };

      // Reset users and forms
      this.newUser.selectedUsers = [];
      this.newForm.selectedForms = [];
    },
    toTeamOptions(nodes) {
      return nodes.map(({ id, name, children }) => ({
        value: id,            // keep as string if your component expects it
        label: name,
        ...(children && children.length
            ? { children: this.toTeamOptions(children) }   // recurse
            : {})
      }));
    },
    // Prevent selecting itself or child team of itself as its parent team
    markSelfAndDescDisabled(nodes, selfId){
      return nodes.map((n) => {
        const isSelf = n.value === selfId;

        // Shallow clone + disabled flag
        const clone = { ...n, disabled: isSelf };

        // Recurse into children
        if (n.children && n.children.length) {
          clone.children = this.markSelfAndDescDisabled(n.children, selfId);

          // Also disable all descendants of self
          if (isSelf) {
            clone.children = clone.children.map((c) => ({
              ...c,
              disabled: true
            }));
          }
        }
        return clone;
      });
    },
    parentTeamOptions(id) {
      return this.markSelfAndDescDisabled(this.teamOptions, id);
    },
    // Reload leader/member/form options whenever parent_id changes. Works for both add & edit dialog.
    async onParentChanged(parentId) {
      this.parentFormIds = [];

      if (!parentId) {
        this.buildLeaderOptions(1);

        // Root team can select member from all users
        this.teamMemberOptions = this.userOptions;
        return;
      }

      // Get parent team depth to adjust leader options based on roles
      let depth = 2;            // Default to 2, root depth starts from 1

      try {
        const { data } = await getTeamDepth(parentId);
        if (data.status === '200') depth = data.data + 1;
      } catch (err) {
        console.error('getTeamDepth failed', err);
      }

      this.buildLeaderOptions(depth);

      // Setup member options which is subset of members of parent team
      try {
        const { data } = await getUsersForTeam(parentId);
        if (data.status === '200') {
          this.teamMemberOptions = data.data
              .filter(u => u.id !== this.findLeaderIdOfParent(parentId))
              .map(user => ({
                role_id: user.role?.id,
                ...user
              }));
        }
      } catch (err) {
        console.error('Failed to retrieve member ids for team.', err);
      }

      // Setup parent's form ids for available form options
      try {
        const { data } = await getFormIdsForTeam(parentId);
        if (data.status === '200') {
          this.parentFormIds = data.data;
        }
      } catch (err) {
        console.error('Failed to retrieve form ids for team.', err);
      }
    },
    // Helper that fills team leader options according to depth
    buildLeaderOptions(depth) {
      // Only show manager/supervisor role user for depth 1 team, supervisor role user for depth 2,
      // all role for depth 3 temporary
      const allowedRoleIdByDepth = { 1: [1, 4], 2: [3]};
      const allowed = allowedRoleIdByDepth[depth] ?? [1, 2, 3, 4];
      this.teamLeaderOptions = this.userOptions.filter(u => allowed.includes(u.role_id))
                                .map(u => ({
                                  id: u.id,
                                  name: u.name,
                                  role_id: u.role_id,
                                  team_name: this.currentLeaders.get(u.id) || null
                                }));
    },
    findLeaderIdOfParent(parentId) {
      const n = this.tableData.find(t => t.id === parentId);
      return n?.leader?.id ?? null;
    },
    async fetchRoles() {
      try {
        const { data } = await fetchRoles();
        if (data.status === '200') {
          this.rolesMap = Object.fromEntries(
              data.data.map(r => [r.id, r])
          );
        }
      } catch (e) {
        console.error('role list fetch failed', e);
        this.rolesMap = {};
      }
    },
    /* helper for template */
    getRole(roleId) { return this.rolesMap[roleId] || {}; },
    expandAllKeys(list) {
      return list.flatMap(n => [
        String(n.id),
        ...(Array.isArray(n.children) ? this.expandAllKeys(n.children) : [])
      ])
    },
  },
  watch: {
    addDialogVisible(newVal) {
      if (!newVal) {
        // this.$nextTick(() => {
        //   this.resetNewTeamForm(); // Reset form after dialog closes
        // });
      }
    },
    dialogTableVisible(newVal) {
      if (!newVal) {
        this.searchUserQuery = ""; // Clear the search query when closing the dialog
      }
    },
    'newTeam.parent_id': {
      immediate: true,
      async handler(id) {
        await this.onParentChanged(id);
      }
    },
    'editTeam.parent_id': {
      immediate: true,
      async handler(id) {
        await this.onParentChanged(id);
      }
    },
    // async userOptions() {
    //   await this.onParentChanged(this.editTeam.parent_id ?? this.newTeam.parent_id);
    // },
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

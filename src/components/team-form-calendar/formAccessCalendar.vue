<template>
  <el-container>
    <!-- Team List -->
    <el-aside class="aside-panel-left">
      <el-table
          :data="teams"
          @cell-click="handleTeamCellClick"
          class="clickable-table"
      >
        <el-table-column prop="name" label="Teams" sortable show-overflow-tooltip/>
        <el-table-column width="50px">
          <template #default="scope">
            <el-button
                :icon="visibleTeams.has(scope.row.id) ? Check : ''"
                circle
                size="small"
                :style="{
                  backgroundColor: visibleTeams.has(scope.row.id) ? scope.row.color : 'transparent',
                  border: `2px solid ${scope.row.color}`,
                  color: visibleTeams.has(scope.row.id) ? '#fff' : scope.row.color
                }"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-aside>
    <el-container>
      <el-header height="30px">
        <el-input
            v-model="searchQuery"
            :placeholder="translate('userManagement.searchPlaceholder')"
            clearable
            style="width: 300px;"
        >
          <template #prefix>
            <el-icon>
              <Search />
            </el-icon>
        </template>
        </el-input>
      </el-header>
      <el-main>
        <!-- Calendar -->
        <FullCalendar ref="calendar" :options="calendarOptions"/>
      </el-main>
    </el-container>
    <el-aside class="aside-panel-right">
      <!-- Aside Header -->
      <div
          style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;"
      >
        <!-- Left: Title -->
        <p v-if="isEditing || showAssignmentForm || selectedEvent?.id" style="margin: 0;">
          {{ subTabTitle() }}
        </p>

        <!-- Right: Edit/Delete Buttons -->
        <div
            v-if="selectedEvent?.id && !showAssignmentForm"
        >
          <el-button type="primary" @click="prefillFormWithAssignmentData">Edit</el-button>
          <el-button type="danger" @click="handleDeleteAssignment">Delete</el-button>
        </div>
      </div>

      <!-- Access Assignment Form -->
      <el-form
          ref="assignmentFormRef"
          v-if="showAssignmentForm"
          :model="assignmentForm"
          :rules="formRules"
      >
        <el-form-item prop="title" :label="'Name'" required>
          <el-input v-model="assignmentForm.title" />
        </el-form-item>

        <el-form-item prop="teamId" :label="'Team'" required>
          <el-select
              v-model="assignmentForm.teamId"
              filterable
              :placeholder="translate('userManagement.addDialog.assignedTeamPlaceHolder')"
          >
            <el-option
                v-for="team in teamsOptions"
                :key="team.id"
                :label="team.label"
                :value="team.id"
            >
              <span style="float: left">{{ team.label }}</span>
              <span
                  style="
                        float: right;
                        color: var(--el-text-color-secondary);
                        font-size: 13px;
                     "
              >
                    {{ translate('userManagement.table.leader') + ": " + team.value }}
                </span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item v-if="!assignmentForm.hasCustomRecurrence" prop="startDate" :label="'Start Date'" required>
          <el-date-picker
              v-model="assignmentForm.startDate"
              type="date"
              placeholder="Select start date"
          />
        </el-form-item>

        <el-form-item v-if="!assignmentForm.hasCustomRecurrence" prop="endDate" :label="'End Date'" required>
          <el-date-picker
              v-model="assignmentForm.endDate"
              type="date"
              placeholder="Select end date"
              :disabled="assignmentForm.hasCustomRecurrence"
          />
        </el-form-item>

        <el-form-item label="Recurring">
          <el-checkbox
              v-model="assignmentForm.hasCustomRecurrence"
              @change="handleRecurrenceCheckboxChange"
          />
        </el-form-item>

        <el-form-item
            v-if="assignmentForm.hasCustomRecurrence"
            label-position="top"
            prop="daysOfWeek"
        >
          <el-form-item prop="startRecur" :label="'Recurrence Start Date'" label-position="top">
            <el-date-picker
                v-model="assignmentForm.startRecur"
                type="date"
                placeholder="Select start date"
            />
          </el-form-item>

          <el-form-item prop="endRecur" :label="'Recurrence End Date'" label-position="top">
            <el-date-picker
                v-model="assignmentForm.endRecur"
                type="date"
                placeholder="Select end date"
            />
          </el-form-item>

          <el-form-item prop="daysCheckBoxes" :label="'Repeat On'" label-position="top">
            <el-checkbox-group
                v-model="assignmentForm.daysOfWeek"
            >
              <el-checkbox :label="'Monday'" :value="1"/>
              <el-checkbox :label="'Tuesday'" :value="2"/>
              <el-checkbox :label="'Wednesday'" :value="3"/>
              <el-checkbox :label="'Thursday'" :value="4"/>
              <el-checkbox :label="'Friday'" :value="5"/>
              <el-checkbox :label="'Saturday'" :value="6"/>
              <el-checkbox :label="'Sunday'" :value="0"/>
            </el-checkbox-group>
          </el-form-item>
        </el-form-item>

        <el-form-item prop="selectedFormIds" :label="'Accessible Form'" required label-position="top">
          <TeamFormTree
              :show-only-selected-node="false"
              :selected-form-ids="assignmentForm.selectedFormIds"
              :expand-all-nodes="false"
              @update-selected-forms="handleFormChanged"
          />
        </el-form-item>
      </el-form>

      <div v-if="showAssignmentForm">
        <el-button type="primary" @click="validateAndSave">Save</el-button>
        <el-button @click="handleCancel">Cancel</el-button>
      </div>

      <!-- Assignment Detail View -->
      <el-descriptions
          v-if="showAssignmentDetail"
          :column="1"
          direction="horizontal"
          style="margin-top: 20px"
          :width="250"
      >
        <el-descriptions-item label="ID">
          {{ selectedEvent?.id}}
        </el-descriptions-item>
        <el-descriptions-item label="Group ID">
          {{ selectedEvent?.groupId || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="Name">
          {{ selectedEvent.title }}
        </el-descriptions-item>
        <el-descriptions-item label="Team">
          {{ getTeamNameById(selectedEvent.teamId) }}
        </el-descriptions-item>
        <el-descriptions-item label="Start Date">
          {{ selectedEvent.startDate || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="End Date">
          {{ selectedEvent.endDate || '-' }}
        </el-descriptions-item>

        <el-descriptions-item>
          <template #label>
            <el-tooltip placement="top">
              <template #content>
                Indicates whether the event recurs weekly. <br />
                If yes, it's repeated on selected weekdays. <br />
                Leave recurrence start/end blank to repeat indefinitely.
              </template>
              <span>Recurring?</span>
            </el-tooltip>
          </template>
          {{ selectedEvent.hasCustomRecurrence ? 'Yes' : 'No' }}
        </el-descriptions-item>

        <el-descriptions-item label="Recurrence Days" v-if="selectedEvent.hasCustomRecurrence">
          {{
            selectedEvent.daysOfWeek?.length
            ? mapDaysOfWeek(selectedEvent.daysOfWeek)
            : '-'
          }}
        </el-descriptions-item>

        <el-descriptions-item label="Recurrence Start" v-if="selectedEvent.hasCustomRecurrence">
          {{ selectedEvent.startRecur ? formatDateToYMD(selectedEvent.startRecur) : 'Unlimited' }}
        </el-descriptions-item>

        <el-descriptions-item label="Recurrence End" v-if="selectedEvent.hasCustomRecurrence">
          {{ selectedEvent.endRecur ? formatDateToYMD(selectedEvent.endRecur) : 'Unlimited' }}
        </el-descriptions-item>
        <el-descriptions-item label="Accessible Forms" :span="2">
          <TeamFormTree
              :show-only-selected-node="true"
              :selected-form-ids="selectedEvent.selectedFormIds"
              :expand-all-nodes="true"
              @update-selected-forms="handleFormChanged"
          />
        </el-descriptions-item>
      </el-descriptions>
    </el-aside>
  </el-container>
</template>

<script>
import FullCalendar from '@fullcalendar/vue3'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import allLocales from '@fullcalendar/core/locales-all.js';
import TeamFormTree from "@/components/dispatch/TeamFormTree.vue";
import {translate} from "@/utils/i18n";
import {Check, QuestionFilled, Search} from "@element-plus/icons-vue";
import {getAllTeams} from "@/services/teamService";
import {getCurrentLanguage} from '@/utils/dispatch-utils';


export default {
  watch:{
    searchQuery() {
      this.refreshVisibleEvents();
    }
  },
  computed: {
    Check() {
      return Check
    },
    calendarApi() {
      return this.$refs.calendar?.getApi?.() ?? null;
    },
  },
  components: {
    QuestionFilled,
    TeamFormTree,
    FullCalendar,
    Search,
    Check,
  },
  data(){
    return {
      showDrawer: false,
      searchQuery: '',
      showAssignmentForm: false,
      showAssignmentDetail: false,
      isEditing: false,
      selectedEvent: null,
      assignmentForm: {
        id: null,
        groupId: null,
        title: '',
        startDate: '',
        endDate: '',
        selectedFormIds: [],
        selectedFormLabels: [],
        teamId: null,
        hasCustomRecurrence: false,
        daysOfWeek: null,
        startRecur: null,
        endRecur: null,
      },
      formRules: {
        title: [{ required: true, message: 'Please enter a name', trigger: 'blur' }],
        teamId: [{ required: true, message: 'Please select a team', trigger: 'change' }],
        startDate: [
          {
            validator: (rule, value, callback) => {
              if (!this.assignmentForm.hasCustomRecurrence && !value) {
                callback(new Error('Please select a start date'));
              } else {
                callback();
              }
            },
            trigger: 'change'
          }
        ],
        endDate: [
          {
            validator: (rule, value, callback) => {
              if (!this.assignmentForm.hasCustomRecurrence && !value) {
                callback(new Error('Please select an end date'));
              } else {
                callback();
              }
            },
            trigger: 'change'
          }
        ],
        selectedFormIds: [{ type: 'array', required: true, message: 'Please select at least one form', trigger: 'change' }],
        daysOfWeek: [
          {
            validator: this.validateDaysOfWeek,
            trigger: 'change'
          }
        ]
      },
      calendarOptions: {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
        initialView: 'dayGridMonth',
        headerToolbar: {
          left: 'prev,next,today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
        },
        views: {
          dayGridMonth: { buttonText: 'Month' },
          timeGridWeek: { buttonText: 'Week' },
          timeGridDay: { buttonText: 'Day' },
          listWeek: { buttonText: 'List' }
        },
        dateClick: this.handleDateClick,
        eventClick: this.handleEventClick,
        selectable: true,
        height: '87vh',
        eventDrop: this.handleEventDrop,
        eventResize: this.handleEventResize,
        events: [],
        eventBackgroundColor: '#409EFF',
        eventBorderColor: '#409EFF',
        eventTextColor: '#000000',
        nowIndicator: true,
        selectMirror: true,
        locales: allLocales,
        locale: this.getCalendarLocale(),
        editable: true,
      },
      teamsOptions: [],
      // Dummy data, will fetch data from backend when ready
      visibleTeams: new Set([1, 2]),
      teams: [
        {
          id: 1,
          name: '大川组',
          color: '#f94144',
          events:[
            {
              id: 1,
              title: 'Form set C',
              date: '2025-04-21',
              start: '2025-04-21',
              end: '2025-04-24',
              allDays: true,
              extendedProps: {
                selectedFormIds: ['f308781d-efe5-4224-8bc9-5b8b4314e798', '37452b87-c08e-47f3-a659-677efacdf328'],
                selectedFormLabels: ['感官检测表单', '来料检测表单'],
                teamId: 1,
              },
              startEditable: false,
              durationEditable: false,
            },
          ]
        },
        {
          id: 2,
          name: '中川组',
          color: '#90be6d',
          events:[
            {
              id: 3,
              title: 'Form set B',
              date: '2025-04-07',
              allDays: true,
              extendedProps: {
                selectedFormIds: ['f308781d-efe5-4224-8bc9-5b8b4314e798'],
                selectedFormLabels: ['感官检测表单'],
                teamId: 2,
              },
              daysOfWeek:[2,4],
              startEditable: false,
              durationEditable: false,
              groupId: 3,
            }
          ]
        },
        {
          id: 3,
          name: '小川组',
          color: '#f8961e',
          events:[
          ]
        },
      ],
    }
  },
  methods: {
    translate,
    subTabTitle() {
      if (this.isEditing) return 'Edit Assignment';
      if (this.selectedEvent?.id) return 'Details';
      return 'New Assignment';
    },
    handleDateClick: function(arg){
      const calendarApi = this.calendarApi;

      calendarApi.getEvents().forEach(e => {
        const updatedClasses = (e.classNames || []).filter(cls => cls !== 'selected-event');
        e.setProp('classNames', updatedClasses);
      });

      this.selectedEvent = null;

      this.assignmentForm.startDate = arg.dateStr;
      this.assignmentForm.endDate = arg.dateStr;

      this.showAssignmentDetail = false;
      this.showAssignmentForm = true;
    },
    handleEventClick(info) {
      // console.log(info.event);
      const calendarApi = this.calendarApi;

      // Clears all event's selection style class
      calendarApi.getEvents().forEach(e => {
        e.setProp('classNames', []);
      });
      info.event.setProp('classNames', ['selected-event']);

      const event = calendarApi.getEventById(info.event.id);
      // console.log(event);
      // TODO: fetch data of this event's id from backend instead of from calendar when service is ready
      // Transform event object to assignmentForm object
      this.selectedEvent = {
        id: info.event.id,
        groupId: info.event.groupId || null,
        title: info.event.title,
        startDate: info.event.startStr,
        endDate: info.event.endStr,
        selectedFormIds: info.event.extendedProps?.selectedFormIds || [],
        selectedFormLabels: info.event.extendedProps?.selectedFormLabels || [],
        teamId: info.event.extendedProps.teamId,
        hasCustomRecurrence: !!info.event._def.recurringDef?.typeData.daysOfWeek,
        daysOfWeek: info.event._def.recurringDef?.typeData.daysOfWeek || null,
        startRecur: info.event._def.recurringDef?.typeData.startRecur || null,
        endRecur: info.event._def.recurringDef?.typeData.endRecur || null,
      };

      // console.log(this.selectedEvent)

      this.showAssignmentDetail = true;
      this.showAssignmentForm = false;
    },
    prefillFormWithAssignmentData() {
      const calendarApi = this.calendarApi;
      const event = calendarApi.getEventById(this.selectedEvent.id);

      // Make the selected event draggable/resizable only
      if (event) {
        event.setProp('startEditable', true);
        event.setProp('durationEditable', true);

        // Cache original values in case of canceling edit
        this._originalEventData = {
          id: event.id,
          start: event.start,
          end: event.end
        };
      }

      this.assignmentForm = {
        ...this.selectedEvent
      };

      this.showAssignmentForm = true;
      this.showAssignmentDetail = false;
      this.isEditing = true;
    },
    handleCancel() {
      this.showAssignmentForm = false
      const calendarApi = this.calendarApi;
      if (this.assignmentForm.id){
        const existingEvent = calendarApi.getEventById(this.assignmentForm.id);
        const { id, start, end } = this._originalEventData;

        if (existingEvent) {
          existingEvent.setStart(start);
          existingEvent.setEnd(end);
          existingEvent.setProp('startEditable', false);
          existingEvent.setProp('durationEditable', false);
        }

        this._originalEventData = null;
      }

      // Clear existing event's selection class
      calendarApi.getEvents().forEach(e => {
        const cleaned = (e.classNames || []).filter(cls => cls !== 'selected-event');
        e.setProp('classNames', cleaned);
      });

      this.resetAssignmentFormWithEmptyData();
      this.isEditing = false;
    },
    handleEventDrop(info) {
      const event = info.event;

      if (this.isEditing && this.assignmentForm.id === event.id) {
        this.assignmentForm.startDate = event.startStr;
        this.assignmentForm.endDate = event.endStr;
      }
    },
    handleEventResize(info) {
      const event = info.event;

      if (this.isEditing && this.assignmentForm.id === event.id) {
        this.assignmentForm.endDate = event.endStr;
      }
    },
    submitAssignment() {
      // Get form's data
      const {
        id,
        groupId,
        title,
        startDate,
        endDate,
        teamId,
        selectedFormIds,
        selectedFormLabels,
        hasCustomRecurrence,
        daysOfWeek,
        startRecur,
        endRecur,
      } = this.assignmentForm;

      //
      const recurrenceData = hasCustomRecurrence
          ? {
            daysOfWeek: Array.isArray(daysOfWeek) ? daysOfWeek : [0,1,2,3,4,5,6], // default to every day recurring
            startRecur: startRecur || null, // default to no limit
            endRecur: endRecur || null, // default to no limit
          }
          : {};

      const newEvent = {
        id,
        title,
        start: startDate,
        end: endDate,
        allDay: true,
        groupId: groupId || undefined,
        ...recurrenceData,
        extendedProps: {
          selectedFormIds,
          selectedFormLabels,
          teamId
        },
      };

      // TODO: Replace dummy update with backend save when ready
      const targetTeam = this.teams.find(t => t.id === teamId);
      if (targetTeam) {
        // Edit
        if (this.isEditing && id) {
          const index = targetTeam.events.findIndex(e => e.id === id);
          if (index !== -1) {
            targetTeam.events[index] = { ...targetTeam.events[index], ...newEvent };
          }
        } else {
        // Create
          newEvent.id = String(Date.now());
          targetTeam.events.push(newEvent);
        }
      }

      // TODO: Update calendar once received success confirmation from backend
      // Need to transform assignmentForm into event object format later on
      const calendarApi = this.calendarApi;

      if (this.isEditing && id) {
        const existingEvent = calendarApi.getEventById(newEvent.id);
        if (existingEvent) {
          for (const [key, value] of Object.entries(newEvent)) {
            if (key === 'extendedProps') {
              for (const [k, v] of Object.entries(value)) {
                existingEvent.setExtendedProp(k, v);
              }
            } else if (value !== undefined) {
              existingEvent.setProp(key, value);
            }
          }
          existingEvent.setProp('startEditable', false);
          existingEvent.setProp('durationEditable', false);
        }
      } else {
        calendarApi.addEvent({
          ...newEvent,
          backgroundColor: this.teams.find(t => t.id === teamId)?.color || '#409EFF',
          borderColor: this.teams.find(t => t.id === teamId)?.color || '#409EFF'
        });
      }

      this.showAssignmentForm = false;
      this.isEditing = false;
      this.resetAssignmentFormWithEmptyData();
      this.refreshVisibleEvents();
    },
    handleDeleteAssignment() {
      const eventId = this.selectedEvent?.id;
      if (!eventId) return;

      // TODO: replace with backend delete when ready
      const team = this.teams.find(t => t.events.some(e => e.id === eventId));
      if (team) {
        team.events = team.events.filter(e => e.id !== eventId);
      }

      // Update dummy data
      const calendarApi = this.calendarApi;
      const event = calendarApi.getEventById(this.selectedEvent.id);
      event?.remove();

      this.selectedEvent = null;
      this.showAssignmentDetail = false;
      this.$message.success("Assignment deleted");
      this.refreshVisibleEvents();
    },
    handleFormChanged(formObjArray){
      this.assignmentForm.selectedFormIds = formObjArray.map(obj => obj.id);
      this.assignmentForm.selectedFormLabels = formObjArray.map(obj => obj.label);
    },
    getTeamNameById(teamId){
      const team = this.teamsOptions.find(team => team.id === teamId);
      return team ? team.label : 'unknown team'
    },
    async fetchTeamOptions() {
      try {
        const response = await getAllTeams();
        if (response.data.status === "200") {
          this.teamsOptions = response.data.data.map(team => ({
            value: team.leader?.name || "-", // Team Name
            label: team.name, // Team Leader Name
            id: team.id
          }));
        } else {
          this.teamsOptions = [];
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
        this.teamsOptions = [];
      }
    },
    refreshVisibleEvents() {
      const query = this.searchQuery.toLowerCase();

      this.calendarOptions.events = this.teams
          .filter(team => this.visibleTeams.has(team.id))
          .flatMap(team =>
              team.events
                  .filter(event => event.title.toLowerCase().includes(query))
                  .map(event => ({
                    ...event,
                    backgroundColor: team.color,
                    borderColor: team.color,
                  }))
          );
    },
    handleTeamCellClick(row, column) {
      if (this.visibleTeams.has(row.id)) {
        this.visibleTeams.delete(row.id);
      } else {
        this.visibleTeams.add(row.id);
      }

      // Refresh calendar events to reflect visibility
      this.calendarOptions.events = this.teams
          .filter(team => this.visibleTeams.has(team.id))
          .flatMap(team =>
              team.events.map(event => ({
                ...event,
                backgroundColor: team.color,
                borderColor: team.color,
              }))
          );
    },
    getCalendarLocale(){
      const lang = getCurrentLanguage();

      // FullCalendar expects 'en' and 'zh-cn'
      if (lang.toLowerCase() === 'zh-cn') return 'zh-cn';
      return 'en'; // default fallback
    },
    validateAndSave(){
      this.$refs.assignmentFormRef.validate(valid => {
        if (valid) {
          this.submitAssignment();
        } else {
          this.$message.error('Please fill required fields before proceeding again.');
        }
      })
    },
    validateDaysOfWeek(rule, value, callback) {
      if (this.assignmentForm.hasCustomRecurrence && (!value || value.length === 0)) {
        callback(new Error('Please select at least one day'));
      } else {
        callback();
      }
    },
    handleRecurrenceCheckboxChange(val) {
      if (val) {
        this.assignmentForm.daysOfWeek = [0, 1, 2, 3, 4, 5, 6];
        this.assignmentForm.startDate = null;
        this.assignmentForm.endDate = null;
      }
    },
    resetAssignmentFormWithEmptyData(){
      this.assignmentForm = {
        id: null,
        groupId: null,
        title: '',
        startDate: '',
        endDate: '',
        selectedFormIds: [],
        selectedFormLabels: [],
        teamId: null,
        hasCustomRecurrence: false,
        daysOfWeek: null,
        startRecur: null,
        endRecur: null,
      };
    },
    mapDaysOfWeek(dayNumbers) {
      const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return dayNumbers.map(num => dayMap[num]).join(', ');
    },
    formatDateToYMD(date) {
      if (!date) return '';
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
  },
  mounted() {
    this.calendarOptions.events = this.teams.flatMap(team =>
        team.events.map(event => ({
          id: event.id,
          title: event.title,
          start: event.start || event.date,
          end: event.end,
          groupId: event.groupId,
          allDay: event.allDays,
          daysOfWeek: event.daysOfWeek,
          startRecur: event.startRecur || null,
          endRecur: event.endRecur || null,
          startEditable: event.startEditable,
          durationEditable: event.durationEditable,
          backgroundColor: team.color,
          borderColor: team.color,
          extendedProps: {
            ...event.extendedProps
          }
        }))
    );

    this.fetchTeamOptions();
  }
}
</script>

<style>

.selected-event {
  background-color: #bce8f1 !important;
  border-color: #bce8f1 !important;
  text-color: black;
}

.aside-panel-left {
  border: 1px solid #dcdfe6;       /* light gray border */
  border-radius: 12px;             /* rounded corners */
  padding: 10px;                   /* internal spacing */
  background-color: #fff;          /* optional: clean background */
  width: 200px;
  max-height: 96vh;
}

.aside-panel-right {
  border: 1px solid #dcdfe6;       /* light gray border */
  border-radius: 12px;             /* rounded corners */
  padding: 10px;                   /* internal spacing */
  background-color: #fff;          /* optional: clean background */
  width: 300px;
  max-height: 96vh;
}

.clickable-table .el-table__body td {
  cursor: pointer;
}

</style>

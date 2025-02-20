import { createRouter, createWebHistory } from 'vue-router';
import store from '@/store';
import VFormDesigner from '@/components/form-designer/index.vue';
import UserManagement from '@/views/UserManagement.vue';
import LoginPage from '@/views/LoginPage.vue';
import QualityFormManagement from '@/views/QualityFormManagement.vue';
import FormDisplay from '@/components/form-manager/FormDisplay.vue';
import TaskAssignment from '@/views/TaskAssignment.vue'
import DispatcherPage from "@/views/DispatcherPage.vue";
import MyCurrentTask from "@/views/TaskCenter/MyCurrentTask.vue";
import MyFutureTask from "@/views/TaskCenter/MyFutureTask.vue";
import MyTodayTask from "@/views/TaskCenter/MyTodayTask.vue";
import MyHistoryTask from "@/views/TaskCenter/MyHistoryTask.vue";
import MyOverdueTask from "@/views/TaskCenter/MyOverdueTask.vue";
import TaskCenterDashboard from "@/views/TaskCenter/TaskCenterDashboard.vue";
import ErikTestView from "@/views/ErikTestView.vue";
import QcTaskSubmissionLogs from "@/components/task-center/QcTaskSubmissionLogs.vue";
import ShiftManagement from "@/views/ShiftManagement.vue";
import ReportManagement from "@/views/ReportManagement.vue";
import FormDataSummary from "@/views/FormDataSummary.vue";

const routes = [
    {
        path: '/',
        // redirect: '/user-management', // Default route
    },
    {
        path: '/form-designer',
        name: 'FormDesigner',
        component: VFormDesigner,
    },
    {
        path: '/user-management',
        name: 'UserManagement',
        component: UserManagement,
    },
    {
        path: '/shift-management',
        name: 'ShiftManagement',
        component: ShiftManagement,
    },
    {
        path: '/LoginPage',
        name: 'LoginPage',
        component: LoginPage,
    },
    {
        path: '/quality-form-management',
        name: 'QualityFormManagement',
        component: QualityFormManagement
    },
    {
        path: '/form-data-summary',
        name: 'FormDataSummary',
        component: FormDataSummary
    },
    {
        path: '/task-assignment',
        name: 'TaskAssignment',
        component: DispatcherPage
    },
    {
        path: '/current-tasks',
        name: 'MyCurrentTask',
        component: MyTodayTask
    },
    {
        path: '/future-tasks',
        name: 'MyFutureTask',
        component: MyFutureTask
    },
    {
        path: '/history-tasks',
        name: 'MyHistoryTask',
        component: MyHistoryTask
    },
    {
        path: '/overdue-tasks',
        name: 'MyOverdueTask',
        component: MyOverdueTask
    },
    {
        path: '/form-display/:qcFormTemplateId',
        name: 'FormDisplay',
        component: FormDisplay,
        props: route => ({
            qcFormTemplateId: route.params.qcFormTemplateId, // Path parameter
            usable: route.query.usable === 'true', // Query parameter, parse to boolean
            dispatchedTaskId: route.query.dispatchedTaskId, // Query parameter, parse to number
            switchDisplayed: route.query.switchDisplayed === 'true' // Query parameter, parse to boolean
        }),
    },
    {
        path: '/task-center-dashboard',
        name: 'TaskCenterDashboard',
        component: TaskCenterDashboard
    },
    {
        path: '/erik-test',
        name: 'ErikTest',
        component: ErikTestView
    },
    {
        path: '/report',
        name: 'Report',
        component: ReportManagement
    },
    {
        path: '/task-log/:createdBy/:dispatchedTaskId',
        name: 'TaskLog',
        component: QcTaskSubmissionLogs,
        props: true, // Pass route params as props to the component
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// Global navigation guard to restrict routes based on user role
router.beforeEach((to, from, next) => {
    const userRole = store.state.user.role;

    // Allow access to the login page for everyone
    if (to.path === '/LoginPage') {
        next();
    } else if (userRole === 0) {
        // If role is 0, redirect to the login page
        next('/LoginPage');
    } else {
        // Allow access to other routes if the role is not 0
        next();
    }
});

export default router;

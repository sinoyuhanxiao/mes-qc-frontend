<template>
  <div v-if="formId">
    <div class="header-container">
      <div style="display: flex; align-items: center;">
        <h1 class="form-title" style="margin-right: 10px">{{ props.currentForm?.label || formTitle }}</h1>
        <el-switch
            v-model="enable_form"
            v-if="switchDisplayed"
            inline-prompt
            active-text="可用"
            inactive-text="不可用"
        />
      </div>
      <el-button type="primary" v-if="switchDisplayed" @click="handleQuickDispatch">
        快速分配此任务
      </el-button>
    </div>
    <el-scrollbar :height="scrollBarHeight" width="100%">
      <v-form-render :form-json="formJson" :form-data="formData" :option-data="optionData" ref="vFormRef" />
      <el-button type="primary" v-if="props.usable || enable_form" @click="submitForm">Submit</el-button>
      <p class="node-id">Node ID: {{ props.currentForm?.id || 'Unneeded info for you' }}</p>
      <p class="node-id">QC Template Form ID: {{ props.currentForm?.qcFormTemplateId || route.params.qcFormTemplateId || 'N/A' }}</p>
    </el-scrollbar>

  </div>

  <el-dialog
      v-model="showQuickDispatch"
      :title="`此表单任务快速派发`"
      width="50%"
      @close="showQuickDispatch = false"
  >
    <QuickDispatch
        :visible.sync="showQuickDispatch"
        :qcFormTreeNodeId="props.currentForm?.id"
        @close="showQuickDispatch = false"
        @dispatch="handleDispatch"
    />
  </el-dialog>

</template>

<script setup>
import {ref, reactive, watch, onMounted, onUnmounted, nextTick} from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import VFormRender from '@/components/form-render/index'
import { useRoute } from 'vue-router'
import testFormJsonData from '@/tests/form_json_data.json'; // Import the JSON data - original code
import api from '@/services/api'
import { fetchFormTemplate } from '@/services/qcFormTemplateService.js';
import { insertFormData } from '@/services/qcFormDataService.js';
import QuickDispatch from "@/components/dispatch/QuickDispatch.vue";
import {insertTaskSubmissionLog} from "@/services/qcTaskSubmissionLogsService";
import dispatchedTaskList from "@/components/dispatch/DispatchedTaskList.vue";

import soundEffect from '@/assets/sound_effect.mp3'; // Import your audio file

const route = useRoute()

const props = defineProps({
  currentForm: {
    type: Object,
    required: true,
  },
  usable: {
    type: Boolean,
    default: true,
  },
  qcFormTemplateId: {
    type: String,
    required: false // Make it optional
  },
  dispatchedTaskId: {
    type: String,
    required: false // Make it optional
  }
});

/* 注意：formJson是指表单设计器导出的json，此处演示的formJson只是一个空白表单json！！ */
// const formJson = reactive(testFormJsonData) // Use the imported JSON data - original code
const formData = reactive({})
const optionData = reactive({})
const formTitle = ref(''); // Store form title
const enable_form = ref(false)
let vFormRef = ref(null)
const showQuickDispatch = ref(false);

const switchDisplayed = ref(
    !route.params.qcFormTemplateId
);

const previewState = ref(true)
let formId = null

const store = useStore();
let userId = store.getters.getUser.id;

// dynamic size:
const scrollBarHeight = ref(`${window.innerHeight-140}px`);

const updateScrollBarHeight = () => {
  scrollBarHeight.value = `${window.innerHeight-140}px`;
};

onMounted(() => {
  window.addEventListener('resize', updateScrollBarHeight);
  updateScrollBarHeight();
});

onUnmounted(() => {
  window.removeEventListener('resize', updateScrollBarHeight);
});

const handleDispatch = (data) => {
  console.log("Dispatched data:", data);
  // Add your API call or logic to handle the dispatched data
};

const handleQuickDispatch = () => {
  console.log("Opening QuickDispatch dialog...");
  showQuickDispatch.value = true;
};

const submitForm = () => {
  formId = props.currentForm?.qcFormTemplateId || route.params.qcFormTemplateId;
  let now = new Date();
  let year = now.getFullYear();
  let month = String(now.getMonth() + 1).padStart(2, '0'); // Ensure month is always two digits
  let collectionName = `form_template_${formId}_${year}${month}`; // Dynamic collection name

  vFormRef.value.getFormData().then(async (formData) => {
    try {
      const response = await insertFormData(userId, collectionName, formData); // Use service function
      // step 1 get the object id of the insertFormData's returned object id
      console.log(response.data.object_id)
      const dispatchedTaskId = props.dispatchedTaskId || null;
      console.log(dispatchedTaskId)
      // Step 2: Insert the form into PostgreSQL log
      const logResponse = await insertTaskSubmissionLog({
        submission_id: response.data.object_id, // Map the MongoDB object_id to submissionId
        reviewed_at: null, // Set default value or use actual data
        reviewed_by: null, // Set default value or use actual data
        dispatched_task_id: dispatchedTaskId, // Retrieve taskId from formData if available
        qc_form_template_id: props.qcFormTemplateId, // Retrieve formId from formData if available
        created_by: userId, // User who submitted the form
        status: 1 // Set a default status, e.g., 1 for active
      });
      console.log("logResponse")
      console.log(logResponse)
      if (response.status === 200) {
        ElMessage.success(response.data);
      } else {
        ElMessage.error('Failed to insert form data!');
      }
    } catch (err) {
      console.error('Error inserting form data:', err);
      ElMessage.error('Error inserting form data!');
    }
  }).catch((error) => {
    ElMessage.error(error); // Form validation failed
  });
}


// Watch the qcFormTemplateId in the passed currentForm
watch(
    () => props.currentForm?.qcFormTemplateId || route.params.qcFormTemplateId, // Safely access qcFormTemplateId
    async (newQcFormTemplateId) => {
      formId = newQcFormTemplateId

      try {
        const response = await fetchFormTemplate(formId); // Use service function
        if (response.status === 200 && response.data) {
          const templateJson = JSON.parse(response.data.data.form_template_json);
          formTitle.value = response.data.data.name
          vFormRef.value.setFormJson(templateJson); // Update the form JSON dynamically
          await nextTick();
          if (!props.usable && vFormRef.value) {
            vFormRef.value.disableForm();
          }
          ElMessage.success('Form loaded successfully!');
        } else {
          ElMessage.error('Failed to load form template!');
        }
      } catch (error) {
        console.error('Error fetching form template:', error);
        ElMessage.error('Error fetching form template!');
      }
    },
    { immediate: true } // Trigger immediately for the initial load
);

watch(enable_form, (newVal) => {
  if (newVal && vFormRef.value) {
    vFormRef.value.enableForm(); // Enable the form when switched on
  } else if (vFormRef.value) {
    vFormRef.value.disableForm(); // Disable the form when switched off
  }
});

const audio = new Audio(soundEffect);
// audio.play();

//
// watch(
//     () => route.params.switchDisplayed,
//     (newVal) => {
//       console.log("switchDisplayed");
//       console.log(switchDisplayed.value);
//       switchDisplayed.value = newVal ?? true;
//       console.log("route params");
//       console.log(route.params); // Print all parameters in the route
//       console.log("new val: " + newVal);
//       console.log("switchDisplayed after newVal");
//       console.log(switchDisplayed.value);
//     },
//     { immediate: true }
// );

// onMounted(() => {
//   if (props.qcFormTemplateId) {
//     console.log("qcFormTemplateId:", props.qcFormTemplateId);
//     fetchFormTemplate(props.qcFormTemplateId)
//         .then(async (response) => {
//           const formTemplateJson = JSON.parse(response.data.data.form_template_json);
//           console.log("formTemplateJson:", formTemplateJson);
//
//           // Wait for formTemplateJson to be available
//           await waitForCondition(() => formTemplateJson != null);
//
//           // Once available, set it to vFormRef
//           await nextTick();
//           vFormRef.value.setFormJson(formTemplateJson);
//         })
//         .catch((error) => {
//           console.error("Error fetching form template:", error);
//           ElMessage.error("加载表单模板时出错。");
//         });
//   }
// });
//
// // Utility function to wait for a condition
// async function waitForCondition(conditionFn, interval = 100, timeout = 5000) {
//   const start = Date.now();
//   while (!conditionFn()) {
//     if (Date.now() - start > timeout) {
//       throw new Error("Timeout while waiting for condition to be met.");
//     }
//     await new Promise((resolve) => setTimeout(resolve, interval));
//   }
// }

</script>

<style scoped>
  .form-title {
    text-align: center;
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 20px;
  }

  .node-id {
    text-align: right;
    color: grey;
    font-size: 12px;
    margin-top: 20px;
  }

  .header-container {
    display: flex;
    justify-content: space-between; /* Align content to the edges */
    align-items: center; /* Center items vertically */
    padding: 0 20px; /* Optional: Add padding for spacing */
  }

  ::v-deep(.el-scrollbar__wrap--hidden-default) {
    scrollbar-width: thin !important; /* Override to allow normal scroll behavior */
  }

  ::v-deep(.el-scrollbar__wrap) {
    overflow-x: hidden !important; /* Ensure horizontal scrolling is hidden */
    box-sizing: border-box; /* Handle padding correctly */
    padding-top: 10px; /* Add space above the content */
    padding-left: 10px;
  }
</style>


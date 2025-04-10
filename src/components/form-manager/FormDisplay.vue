<template>
  <div v-if="formId">
    <div class="header-container">
      <div style="display: flex; align-items: center;">
        <h1 class="form-title" style="margin-right: 10px">{{ props.currentForm?.label || formTitle }}</h1>
        <el-switch
            v-model="enable_form"
            v-if="switchDisplayed"
            inline-prompt
            :active-text="translate('FormDisplay.available')"
            :inactive-text="translate('FormDisplay.unavailable')"
        />
      </div>
      <el-button type="primary" v-if="switchDisplayed" @click="handleQuickDispatch">
        {{ translate('FormDisplay.quickDispatch') }}
      </el-button>

      <el-countdown
          v-if="remainingTime > 0"
          :value="countdownEndTime"
          format="HH:mm:ss"
      >
        <template #title>
          <span style="font-weight: bold; font-size: 15px">{{ translate('FormDisplay.countdownTitle') }}</span>
        </template>
      </el-countdown>

    </div>
    <el-scrollbar :height="scrollBarHeight" width="100%">
      <v-form-render :form-json="formJson" :form-data="formData" :option-data="optionData" ref="vFormRef" />

      <div>
        <!-- 签名 Buttons and Display -->
        <div style="margin-bottom: 20px; text-align: left;">
          <el-button type="primary" @click="showSignaturePad = true" :disabled="!(enable_form || enable_common_fields)">
            {{ translate('FormDisplay.eSignature') }}
          </el-button>

          <el-button v-if="signatureData !== null" type="info" @click="handleSignatureClear" :disabled="!(enable_form || enable_common_fields)">
            {{ translate('FormDisplay.clearSignature') }}
          </el-button>
          <div v-if="signatureData" class="signature-preview">
            <img :src="signatureData" alt="签名图片" class="signature-image"/>
          </div>
        </div>

        <!-- 提交 和 重置 表单 Buttons (Right-Aligned) -->
        <div style="display: flex; justify-content: center; gap: 10px; margin-top: 20px;">
          <el-button type="primary" v-if="props.usable || enable_form" @click="submitForm">
            {{ translate('FormDisplay.submit') }}
          </el-button>

          <el-button type="warning" v-if="props.usable || enable_form" @click="showClearConfirmation = true">
            {{ translate('FormDisplay.reset') }}
          </el-button>
        </div>

        <SignaturePadComponent
            v-if="showSignaturePad"
            :visible="showSignaturePad"
            @close="showSignaturePad = false"
            @save="handleSignatureSave"
            @clear="handleSignatureClear"
        />
      </div>

      <p class="node-id">Node ID: {{ props.currentForm?.id || 'Unneeded info for you' }}</p>
      <p class="node-id">QC Template Form ID: {{ props.currentForm?.qcFormTemplateId || route.params.qcFormTemplateId || 'N/A' }}</p>
    </el-scrollbar>

  </div>

  <el-dialog
      v-model="showQuickDispatch"
      :title="translate('FormDisplay.quickDispatchDialogTitle')"
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

  <el-dialog
      v-model="showConfirmation"
      :title="translate('FormDisplay.confirmSubmissionTitle')"
      width="30%"
      :before-close="cancelSubmission"
  >
    <span>{{ translate('FormDisplay.confirmSubmissionMessage') }}</span>
    <template #footer>
      <el-button @click="cancelSubmission">{{ translate('FormDisplay.cancel') }}</el-button>
      <el-button type="primary" @click="confirmSubmission">{{ translate('FormDisplay.confirm') }}</el-button>
    </template>
  </el-dialog>

  <el-dialog
      v-model="showResetConfirmation"
      :title="translate('FormDisplay.submissionSuccessTitle')"
      width="30%"
      :before-close="cancelReset"
  >
    <span>{{ translate('FormDisplay.submissionSuccessMessage') }}</span>
    <template #footer>
      <el-button @click="cancelReset">{{ translate('FormDisplay.no') }}</el-button>
      <el-button type="primary" @click="confirmReset">{{ translate('FormDisplay.yes') }}</el-button>
    </template>
  </el-dialog>

  <el-dialog
      v-model="showClearConfirmation"
      :title="translate('FormDisplay.resetConfirmTitle')"
      width="30%"
      :before-close="cancelClear"
  >
    <span>{{ translate('FormDisplay.resetConfirmMessage') }}</span>
    <template #footer>
      <el-button @click="cancelClear">{{ translate('FormDisplay.cancel') }}</el-button>
      <el-button type="warning" @click="confirmClear">{{ translate('FormDisplay.confirm') }}</el-button>
    </template>
  </el-dialog>

  <el-dialog
      v-model="showCountdownEnded"
      :title="translate('FormDisplay.countdownEndedTitle')"
      width="30%"
      :before-close="closeCountdownEnded"
  >
    <span>{{ translate('FormDisplay.countdownEndedMessage') }}</span>
    <template #footer>
      <el-button type="warning" @click="closeCountdownEnded">{{ translate('FormDisplay.confirm') }}</el-button>
    </template>
  </el-dialog>

</template>

<script setup>
import {ref, reactive, watch, onMounted, onUnmounted, nextTick, computed} from 'vue'
import {translate, translateWithParams} from "@/utils/i18n";
import { useStore } from 'vuex'
import {ElMessage} from 'element-plus'
import VFormRender from '@/components/form-render/index'
import { useRoute } from 'vue-router'
import testFormJsonData from '@/tests/form_json_data.json'; // Import the JSON data - original code
import api from '@/services/api'
import { fetchFormTemplate } from '@/services/qcFormTemplateService.js';
import { insertFormData } from '@/services/qcFormDataService.js';
import QuickDispatch from "@/components/dispatch/QuickDispatch.vue";
import {insertTaskSubmissionLog} from "@/services/qcTaskSubmissionLogsService";
import dayjs from 'dayjs';
import dispatchedTaskList from "@/components/dispatch/DispatchedTaskList.vue";
import SignaturePadComponent from "@/components/form-manager/SignaturePad.vue";

import soundEffect from '@/assets/sound_effect.mp3'; // Import your audio file

const route = useRoute()
const rt = ref(parseInt(route.query.rt, 10) || 0);
const showCountdownEnded = ref(false);

const showSignaturePad = ref(false);
const signatureData = ref(null);

const handleSignatureSave = (data) => {
  signatureData.value = data; // Save the base64 image data here
  showSignaturePad.value = false; // Close the signature pad after saving
};

const handleSignatureClear = () => {
  signatureData.value = null; // Clear the preview when cleared from the pad
};

// Countdown time setup
const remainingTime = ref(rt.value);
const countdownEndTime = computed(() => Date.now() + remainingTime.value * 1000);
let countdownInterval = null; // Store the interval ID

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
  },
  formSwitched: { // Add formSwitched prop to detect switching
    type: Boolean,
    default: false,
  }
});

/* 注意：formJson是指表单设计器导出的json，此处演示的formJson只是一个空白表单json！！ */
// const formJson = reactive(testFormJsonData) // Use the imported JSON data - original code
const formData = reactive({})
const optionData = reactive({})
const formTitle = ref(''); // Store form title
const enable_form = ref(false)
const enable_common_fields = ref(false)
let vFormRef = ref(null)
const showQuickDispatch = ref(false);
const showConfirmation = ref(false);
const showResetConfirmation = ref(false);
const showClearConfirmation = ref(false);
const switchDisplayed = ref(
    !route.params.qcFormTemplateId
);

const cancelClear = () => {
  showClearConfirmation.value = false; // Cancel reset
};

const confirmClear = () => {
  showClearConfirmation.value = false; // Close the confirmation dialog
  if (vFormRef.value) {
    vFormRef.value.resetForm(); // Actually reset the form
    // clear the signature and
    signatureData.value = null;
    ElMessage.success(translate('FormDisplay.formClearedSuccess'))
  }
};

const closeCountdownEnded = () => {
  showCountdownEnded.value = false;
  setTimeout(() => {
    window.close();
  }, 300); // 给用户一点时间看到弹窗关闭
};

// ✅ Start or restart the countdown
const startCountdown = () => {
  // Clear any existing interval before starting a new one
  if (countdownInterval) clearInterval(countdownInterval);

  if (remainingTime.value > 0) {
    countdownInterval = setInterval(() => {
      remainingTime.value -= 1;
      if (remainingTime.value <= 0) {
        clearInterval(countdownInterval); // Stop countdown when it reaches zero
        showCountdownEnded.value = true;
      }
    }, 1000);
  }
};

// ✅ Watch `rt` in case it changes dynamically
watch(() => route.query.rt, (newRt) => {
  remainingTime.value = parseInt(newRt, 10) || 0;
  startCountdown(); // Restart the countdown if `rt` changes
}, { immediate: true });

watch(() => props.currentForm?.qcFormTemplateId, (newFormId, oldFormId) => {
  if (newFormId !== oldFormId) {
    // Clear signature data and disable the form when form is switched
    signatureData.value = null;
    enable_form.value = false;
    console.log("Form switched, signature data cleared and form disabled.");
  }
});

// ✅ Ensure the countdown starts when mounted
onMounted(() => {
  startCountdown();
});

// ✅ Clean up the interval when unmounted
onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval);
});

const clearForm = () => {
  if (vFormRef.value) {
    vFormRef.value.resetForm(); // 调用 VFormRender 内部的 resetForm 方法
    ElMessage.success(translate('FormDisplay.formClearedSuccess'))

  }
};

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
  startCountdown();
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

const submitForm = () => {
  showConfirmation.value = true; // Show confirmation popup before submitting
};

const cancelSubmission = () => {
  showConfirmation.value = false; // Close the popup without doing anything
};

const handleQuickDispatch = () => {
  console.log("Opening QuickDispatch dialog...");
  showQuickDispatch.value = true;
};

const confirmSubmission = async () => {
  showConfirmation.value = false; // Close the first popup before proceeding

  formId = props.currentForm?.qcFormTemplateId || route.params.qcFormTemplateId;
  let now = new Date();
  let year = now.getFullYear();
  let month = String(now.getMonth() + 1).padStart(2, '0');
  let collectionName = `form_template_${formId}_${year}${month}`;

  try {
    const formData = await vFormRef.value.getFormData();

    formData['e-signature'] = signatureData.value || null;

    // For debugging
    console.log("提交的数据 (key-value pairs):", formData);

    // Insert into MongoDB
    const response = await insertFormData(userId, collectionName, formData);
    console.log(response.data.object_id);

    const dispatchedTaskId = props.dispatchedTaskId || null;

    // Insert into PostgreSQL log
    const logResponse = await insertTaskSubmissionLog({
      submission_id: response.data.object_id,
      reviewed_at: null,
      reviewed_by: null,
      dispatched_task_id: dispatchedTaskId,
      qc_form_template_id: props.qcFormTemplateId,
      created_by: userId,
      status: 1
    });

    if (response.status === 200) {
      console.log(response.data);
      ElMessage.success(translate('FormDisplay.formSubmitSuccess'))
      showResetConfirmation.value = true; // Show second popup after success
    } else {
      ElMessage.error(translate('FormDisplay.formSubmitError'))
    }
  } catch (error) {
    ElMessage.error(translate('FormDisplay.formSubmitError'))
  }
};

const cancelReset = () => {
  showResetConfirmation.value = false; // Close the second popup without clearing form
};

const confirmReset = () => {
  showResetConfirmation.value = false; // Close the second popup
  vFormRef.value.resetForm(); // Reset the form
};

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
          enable_common_fields.value = true;
          // when usable is false it will disable the forms as well as the common fields
          if (!props.usable && vFormRef.value) {
            vFormRef.value.disableForm();
            enable_common_fields.value = false;
          }
          ElMessage.success(translate('FormDisplay.formLoadSuccess'))
        } else {
          ElMessage.error(translate('FormDisplay.formLoadFailed'))
        }
      } catch (error) {
        console.error('Error fetching form template:', error);
        ElMessage.error(translate('FormDisplay.formLoadError'))
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

watch(remainingTime, (newTime) => {
  nextTick(() => {
    const countdownElement = document.querySelector(".el-statistic__number");
    if (countdownElement) {
      if (newTime <= 10 * 60) {
        countdownElement.style.color = "red"; // Danger
      } else if (newTime <= 30 * 60) {
        countdownElement.style.color = "#e6a23c"; // Warning (Orange)
      } else if (newTime <= 60 * 60) {
        countdownElement.style.color = "#409eff"; // Primary (Blue)
      } else {
        countdownElement.style.color = ""; // Reset to default
      }
    }
  });
});

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

  .signature-preview {
    margin-top: 20px;
  }

  .signature-image {
    width: 300px;
    border: 1px solid #ddd;
    margin-top: 10px;
  }

  .signature-clear-btn {
    position: absolute;
    top: -10px;
    right: -10px;
    background: red;
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    width: 24px;
    height: 24px;
  }

</style>


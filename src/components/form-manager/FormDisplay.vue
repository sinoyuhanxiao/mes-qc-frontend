<template>
  <div>
    <!-- Title centered at the top -->
    <h1 class="form-title">{{ props.currentForm?.label || 'Form Title' }}</h1>

    <!-- Form render -->
    <v-form-render :form-json="formJson" :form-data="formData" :option-data="optionData" ref="vFormRef">
    </v-form-render>

    <!-- Submit button -->
    <el-button type="primary" @click="submitForm">Submit</el-button>

    <!-- Node ID at the bottom-right -->
    <p class="node-id">Node ID: {{ props.currentForm?.id || 'N/A' }}</p>
  </div>
</template>

<script setup>
import {ref, reactive, watch, onMounted} from 'vue'
import { ElMessage } from 'element-plus'
import VFormRender from '@/components/form-render/index' // the documentation was so silly I found this out
import testFormJsonData from '@/tests/form_json_data.json'; // Import the JSON data - original code
import api from '@/services/api'

const props = defineProps({
  currentForm: {
    type: Object,
    required: true,
  },
});

/* 注意：formJson是指表单设计器导出的json，此处演示的formJson只是一个空白表单json！！ */
// const formJson = reactive(testFormJsonData) // Use the imported JSON data - original code
const formData = reactive({})
const optionData = reactive({})
const vFormRef = ref(null)
let formId = null;

const collectionName = `form_template_${formId}_202412`; // Dynamic collection name

const submitForm = () => {
  vFormRef.value.getFormData().then(formData => {
    // Form Validation OK
    alert( JSON.stringify(formData, null, 2) )
    // Send form data to backend
    api.post(`/api/test/insert-form/${collectionName}`, formData)
        .then(res => {
          if (res.status === 200) {
            ElMessage.success(res.data);
          } else {
            ElMessage.error('Failed to insert form data!');
          }
        }).catch(err => {
          console.error('Error inserting form data:', err);
          ElMessage.error('Error inserting form data!');
        });
  }).catch(error => {
    // Form Validation failed
    ElMessage.error(error)
  })
}

// Watch the qcFormTemplateId in the passed currentForm
watch(
    () => props.currentForm?.qcFormTemplateId, // Safely access qcFormTemplateId
    async (newQcFormTemplateId) => {
      formId = newQcFormTemplateId

      try {
        const response = await api.get(`/qc-form-templates/${formId}`);
        if (response.status === 200 && response.data) {
          const templateJson = JSON.parse(response.data.data.form_template_json);
          vFormRef.value.setFormJson(templateJson); // Update the form JSON dynamically
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


</script>

<style>
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
</style>

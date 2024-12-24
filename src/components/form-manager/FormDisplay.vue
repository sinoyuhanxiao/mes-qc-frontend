<template>
  <div>
    <v-form-render :form-json="formJson" :form-data="formData" :option-data="optionData" ref="vFormRef">
    </v-form-render>
    <el-button type="primary" @click="submitForm">Submit</el-button>
  </div>
</template>

<script setup>
import {ref, reactive, onMounted} from 'vue'
import { ElMessage } from 'element-plus'
import VFormRender from '@/components/form-render/index' // the documentation was so silly I found this out
import testFormJsonData from '@/tests/form_json_data.json'; // Import the JSON data - original code
import api from '@/services/api'

/* 注意：formJson是指表单设计器导出的json，此处演示的formJson只是一个空白表单json！！ */
// const formJson = reactive(testFormJsonData) // Use the imported JSON data - original code
const formData = reactive({})
const optionData = reactive({})
const vFormRef = ref(null)

let formId = 6;
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

onMounted(() => {
  api.get(`/qc-form-templates/${formId}`)
      .then(res => {
        if (res.status === 200 && res.data) {
          console.log(res.data)
          const templateJson = JSON.parse(res.data.data.form_template_json); // Parse the JSON string

          // Set form template JSON
          vFormRef.value.setFormJson(templateJson);

          ElMessage.success('Form loaded successfully!');
        } else {
          ElMessage.error('Failed to load form template!');
        }
      })
      .catch(err => {
        console.error('Error fetching form template:', err);
        ElMessage.error('Error fetching form template!');
      });
});

</script>

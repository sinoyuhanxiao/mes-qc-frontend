<template>
  <div>
    <h2 style="font-size: 22px; font-weight: bold; margin-bottom: 10px">
      补充表单编辑 - {{ formTitle }}
    </h2>

    <el-scrollbar height="calc(100vh - 180px)">
      <v-form-render ref="vFormRef" :form-json="templateJson" :form-data="formData" :option-data="optionData" />
    </el-scrollbar>

    <div style="display: flex; justify-content: center; gap: 10px; margin-top: 30px">
      <el-button type="primary" @click="handleSubmit">
        提交修改
      </el-button>
      <el-button type="warning" @click="handleReset">
        重置
      </el-button>
    </div>
  </div>

  <el-dialog
      v-model="showDialog"
      title="确认修改以下字段？"
      width="30%"
      top="15vh"
  >
    <div v-html="tableHtml"></div>

    <template #footer>
      <el-button @click="showDialog = false">取消</el-button>
      <el-button type="primary" @click="submitConfirmed">确认提交</el-button>
    </template>
  </el-dialog>

  <SignaturePadComponent
      v-if="showSignaturePad"
      :visible="showSignaturePad"
      @close="showSignaturePad = false"
      @save="handleSignatureSave"
  />

</template>

<script setup>
import { ref, onMounted } from 'vue';
import VFormRender from '@/components/form-render/index';
import { useRoute } from 'vue-router';
import { getRawMongoDocument } from '@/services/qcTaskSubmissionLogsService';
import { fetchFormTemplate } from '@/services/qcFormTemplateService';
import { ElMessageBox } from 'element-plus';
import { getChangedFields, getLabelMapFromTemplate } from '@/utils/compareFormChanges'
import SignaturePadComponent from '@/components/form-manager/SignaturePad.vue'
import { editFormData } from '@/services/qcFormDataService';

const route = useRoute();

const templateId = route.query.templateId;
const submissionId = route.query.submissionId;
const createdAt = route.query.createdAt;

const showDialog = ref(false)
const showSignaturePad = ref(false)
const signatureData = ref(null)
const tableHtml = ref('')

const vFormRef = ref(null);
const optionData = ref({});

const formTitle = ref('');
const templateJson = ref({});
const formData = ref({});

const initialSnapshot = ref({});

onMounted(async () => {
  try {
    const res1 = await fetchFormTemplate(templateId);
    templateJson.value = JSON.parse(res1.data?.data?.form_template_json || '{}');
    formTitle.value = res1.data?.data?.name || '表单';

    const res2 = await getRawMongoDocument(submissionId, templateId, createdAt);
    initialSnapshot.value = JSON.parse(JSON.stringify(res2.data)); // hard copy for comparison
    console.log("Initial:", initialSnapshot.value)
    formData.value = res2.data;

    vFormRef.value?.setFormJson(templateJson.value);
    vFormRef.value?.setFormData(formData.value);
  } catch (err) {
    console.error("加载失败", err);
  }
});

const handleSubmit = async () => {
  try {
    const updatedData = await vFormRef.value.getFormData();
    console.log("Updated:", updatedData)
    const changedKeys = getChangedFields(initialSnapshot.value, updatedData)
        .map(item => item.key);

    if (changedKeys.length === 0) {
      await ElMessageBox.alert('表单未发生任何修改, 确认提交？', '提示', {type: 'info'});
      return;
    }

    const labelMap = getLabelMapFromTemplate(templateJson.value);

    const htmlTable = `
      <table style="width:100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="border: 1px solid #ccc; padding: 8px; width: 300px;">字段</th>
            <th style="border: 1px solid #ccc; padding: 8px; width: 300px;">原始值</th>
            <th style="border: 1px solid #ccc; padding: 8px; width: 300px;">当前值</th>
          </tr>
        </thead>
        <tbody>
          ${changedKeys.map(key => {
          const prev = initialSnapshot.value[key];
          const curr = updatedData[key];

          const prevStr = formatValue(prev);
          const currStr = formatValue(curr);

          return `
              <tr>
                <td style="border: 1px solid #ccc; padding: 15px;">${labelMap[key] || key}</td>
                <td style="border: 1px solid #ccc; padding: 15px;">${prevStr}</td>
                <td style="border: 1px solid #ccc; padding: 8px; color: var(--el-color-primary);">${currStr}</td>
              </tr>
            `;
        }).join('')}
        </tbody>
      </table>
    `;

    tableHtml.value = htmlTable;
    showDialog.value = true;

    console.log('🟢 用户确认提交，变更字段:', changedKeys);
    // TODO: send updatedData to backend

  } catch (err) {
    console.error('❌ 提交失败:', err);
  }
};

const handleReset = () => {
  ElMessageBox.confirm(
      '确定要恢复为原始提交数据吗？此操作无法撤销。',
      '重置确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
  ).then(() => {
    if (vFormRef.value) {
      const snapshotClone = JSON.parse(JSON.stringify(initialSnapshot.value));
      vFormRef.value.setFormData(snapshotClone);
    }
  }).catch(() => {
    // 用户取消，无需操作
  });
};

const submitConfirmed = async () => {
  showDialog.value = false
  showSignaturePad.value = true // ⬅️ 打开签名面板
}

const handleSignatureSave = async (data) => {
  signatureData.value = data;
  showSignaturePad.value = false;
  console.log('🟢 Ready to submit data with signature:', signatureData.value);

  try {
    const updatedData = await vFormRef.value.getFormData();

    // Add the signature data into the updated form (you can customize the key name)
    updatedData['e-signature'] = signatureData.value;

    const userId = 19 // TODO: 🔧 Replace with dynamic user ID if available
    const collectionName = getCollectionNameFromCreatedAt(createdAt); // store to its original collection
    await editFormData(userId, collectionName, submissionId, templateId, updatedData);

    await ElMessageBox.alert('修改已成功提交', '成功', {type: 'success'});
    window.close();
  } catch (error) {
    console.error('❌ 提交编辑版本失败:', error);
    await ElMessageBox.alert('提交失败，请稍后重试', '错误', {type: 'error'});
  }
};


function formatValue(val) {
  if (val === null || val === undefined || val === '') return '-';
  if (Array.isArray(val)) return val.join(', ');
  return val.toString();
}

function getCollectionNameFromCreatedAt(createdAtString) {
  const date = new Date(createdAtString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `form_template_${templateId}_${year}${month}`;
}

</script>

<style scoped>
</style>

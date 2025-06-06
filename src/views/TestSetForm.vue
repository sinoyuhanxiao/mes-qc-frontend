<template>
  <div>
    <el-form inline style="margin-bottom: 20px">
      <el-form-item label="表单模板 ID">
        <el-input v-model="formTemplateId" placeholder="输入模板 ID" style="width: 300px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadTemplate">加载模板</el-button>
      </el-form-item>
      <el-form-item label="MongoDB 表单 ID">
        <el-input v-model="submissionId" placeholder="输入提交记录 ID" style="width: 300px" />
      </el-form-item>
      <el-form-item label="创建人 ID">
        <el-input v-model="createdBy" placeholder="输入创建人 ID" style="width: 150px" />
      </el-form-item>
      <el-form-item>
        <el-button type="success" @click="loadSubmissionData">加载提交数据</el-button>
      </el-form-item>
      <el-form-item label="创建时间">
        <el-input v-model="createdAt" placeholder="格式: 2025-05-01 16:50:52.427519100" style="width: 400px" />
      </el-form-item>
    </el-form>

    <v-form-render
        v-if="formJson.widgetList.length > 0"
        ref="vFormRef"
        :form-json="formJson"
        :form-data="formData"
        :option-data="optionData"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import VFormRender from '@/components/form-render/index'
import { fetchFormTemplate } from '@/services/qcFormTemplateService'
import {getMyDocument, getRawMongoDocument} from '@/services/qcTaskSubmissionLogsService'

const vFormRef = ref(null)
const formTemplateId = ref('')
const submissionId = ref('')
const createdBy = ref('')
const createdAt = ref('') // 👈 New input
const formJson = ref({ widgetList: [], formConfig: {} })
const formData = ref({})
const optionData = ref({})

const loadTemplate = async () => {
  if (!formTemplateId.value) return
  try {
    const res = await fetchFormTemplate(formTemplateId.value)
    if (res.status === 200 && res.data?.data?.form_template_json) {
      const parsedJson = JSON.parse(res.data.data.form_template_json)
      formJson.value = parsedJson
    }
  } catch (err) {
    console.error('加载模板失败', err)
  }
}

const loadSubmissionData = async () => {
  if (!submissionId.value || !formTemplateId.value || !createdAt.value) return

  try {
    const res = await getRawMongoDocument(
        submissionId.value,
        formTemplateId.value,
        createdAt.value
    )

    if (res.status === 200 && res.data) {
      const filteredData = {}
      for (const key in res.data) {
        if (
            !key.startsWith('related_') &&
            key !== 'exceeded_info' &&
            key !== 'e-signature' &&
            key !== 'approval_info'
        ) {
          filteredData[key] = res.data[key]
        }
      }
      vFormRef.value?.setFormData(filteredData)
    }
  } catch (err) {
    console.error('加载提交数据失败', err)
  }
}</script>

<style scoped>
.el-form {
  margin-bottom: 20px;
}
</style>

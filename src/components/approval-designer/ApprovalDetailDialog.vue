<template>
  <el-dialog
      :model-value="visible"
      @update:modelValue="emit('update:visible', $event)"
      fullscreen
      :title="'审批详情：' + submissionId"
      @close="handleClose"
  >
    <div class="approval-detail-dialog">

      <!-- ▶ 审批进度 el-steps -->
      <section class="section-block">
        <h3>审批流程</h3>
        <el-steps :space="200" direction="horizontal">
          <el-step title="填报员" status="finish" />
          <el-step title="班长签名" status="finish" />
          <el-step title="主管签名" status="process" />
          <el-step title="归档" status="wait" />
        </el-steps>
      </section>

      <!-- ▶ 表单当前内容 (readonly) -->
      <section class="section-block">
        <h3>当前表单内容</h3>
        <div class="form-readonly">[FormEdit.vue readonly 内容]</div>
      </section>

      <!-- ▶ 历史表单记录 (version group) -->
      <section class="section-block">
        <h3>历史修改记录</h3>
        <div class="history-table">[QcRecordsTable + version_group_id]</div>
      </section>

      <!-- ▶ 审批备注 -->
      <section class="section-block">
        <h3>审批备注</h3>
        <el-input
            type="textarea"
            v-model="comment"
            placeholder="请输入您的审批意见..."
            :rows="4"
        />
      </section>

      <!-- ▶ 导出功能 -->
      <section class="section-block">
        <h3>导出</h3>
        <el-button type="primary" @click="exportToPdf">PDF</el-button>
        <el-button type="success" @click="exportToExcel">Excel</el-button>
      </section>

    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button type="primary" @click="handleApprove">批准</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import {ref, defineProps} from 'vue'

const props = defineProps({
  visible: Boolean,
  submissionId: String
})

const comment = ref('')

const handleClose = () => {
  // emit close event if needed
}

const handleApprove = () => {
  console.log('点击批准')
}

const exportToPdf = () => {
  console.log('Exporting PDF')
}

const exportToExcel = () => {
  console.log('Exporting Excel')
}
</script>

<style scoped>
.approval-detail-dialog {
  padding: 20px;
}

.section-block {
  margin-bottom: 30px;
}

.form-readonly,
.history-table {
  background-color: #f9f9f9;
  padding: 20px;
  border: 1px dashed #ccc;
}
</style>

<template>
  <el-dialog v-model="visibleDialog" title="编辑审批流程" width="35%" @close="handleClose">
    <ApprovalFlowSelector v-model:selectedFlow="selectedFlow" />

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleConfirm">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
  import { ref, watch } from 'vue'
  import ApprovalFlowSelector from './ApprovalFlowSelector.vue' // your existing selector

  const props = defineProps({
    visible: Boolean,
    templateId: [String, Number],
    initialApprovalType: String
  })
  const emit = defineEmits(['update:visible', 'update-success'])

  const visibleDialog = ref(props.visible)
  watch(() => props.visible, val => (visibleDialog.value = val))
  watch(visibleDialog, val => emit('update:visible', val))

  const selectedFlow = ref('')

  watch(() => props.initialApprovalType, (newVal) => {
    selectedFlow.value = newVal
  }, { immediate: true })

  watch(() => props.visible, (newVisible) => {
    if (newVisible) {
      selectedFlow.value = props.initialApprovalType
    }
  })

  import { updateApprovalType } from '@/services/qcFormTemplateService'

  const handleConfirm = async () => {
    try {
      await updateApprovalType(props.templateId, selectedFlow.value)
      emit('update-success', selectedFlow.value)
      visibleDialog.value = false
    } catch (err) {
      console.error('审批流程更新失败', err)
    }
  }

  const handleClose = () => {
    visibleDialog.value = false
  }
</script>

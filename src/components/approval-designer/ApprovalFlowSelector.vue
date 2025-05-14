<template>
  <div class="approval-flow-selector">
    <el-form label-position="left" inline>
      <el-form-item label="审批流程" style="margin-bottom: 12px; margin-right: 20px">
        <el-select v-model="selectedFlow" placeholder="请选择审批流程" @change="onFlowChange" style="width: 300px">
          <el-option label="1. 填报员填写并签字 -> 归档" value="flow_1" />
          <el-option label="2. 填报员 -> 班长签字 -> 归档" value="flow_2" />
          <el-option label="3. 填报员 -> 主管签字 -> 归档" value="flow_3" />
          <el-option label="4. 填报员 -> 班长 -> 主管签字 -> 归档" value="flow_4" />
        </el-select>
      </el-form-item>
    </el-form>

    <el-steps style="max-width: 600px; margin-top: 20px" align-center :active="100">
      <el-step
          v-for="(step, index) in displayedSteps"
          :key="index"
          :title="step.title"
          :description="step.description"
          :status="step.title === '归档' ? 'success' : ''"
      />
    </el-steps>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  selectedFlow: String
})
const selectedFlow = ref(props.selectedFlow || 'flow_4')
const emit = defineEmits(['update:selectedFlow'])

const flowMap = {
  flow_1: [
    { title: '填报员', description: '填写并签字' },
    { title: '归档', description: '自动归档' },
  ],
  flow_2: [
    { title: '填报员', description: '填写并签字' },
    { title: '班长', description: '审核并签字' },
    { title: '归档', description: '自动归档' },
  ],
  flow_3: [
    { title: '填报员', description: '填写并签字' },
    { title: '主管', description: '审核并签字' },
    { title: '归档', description: '自动归档' },
  ],
  flow_4: [
    { title: '填报员', description: '填写并签字' },
    { title: '班长', description: '审核并签字' },
    { title: '主管', description: '审核并签字' },
    { title: '归档', description: '自动归档' },
  ],
}

const displayedSteps = computed(() => {
  return flowMap[selectedFlow.value] || []
})

function onFlowChange(value) {
  emit('update:selectedFlow', value)
}
</script>

<style scoped>
.approval-flow-selector {
  padding: 20px;
}
</style>

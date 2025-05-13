<template>
  <div class="approval-designer">
    <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        :default-viewport="{ zoom: 1.5 }"
        class="flow-container"
        :fit-view="true"
        @node-click="editNode"
    >
      <Background />
      <Controls />
    </VueFlow>

    <el-button type="primary" @click="addNode">添加审批节点</el-button>
    <el-button type="success" @click="exportFlow">导出流程配置</el-button>

    <el-dialog v-model="editDialogVisible" title="编辑审批节点">
      <el-form :model="editingNode.data">
        <el-form-item label="步骤名称">
          <el-input v-model="editingNode.data.label" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="editingNode.data.role" placeholder="选择角色">
            <el-option label="填报员" value="reporter" />
            <el-option label="班长" value="leader" />
            <el-option label="主管" value="supervisor" />
            <el-option label="经理" value="manager" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否可修改">
          <el-switch v-model="editingNode.data.canEdit" />
        </el-form-item>
        <el-form-item label="是否要求签字">
          <el-switch v-model="editingNode.data.mustSign" />
        </el-form-item>
        <el-form-item label="是否归档">
          <el-switch v-model="editingNode.data.autoArchive" />
        </el-form-item>
        <el-form-item label="经理最终审阅">
          <el-switch v-model="editingNode.data.finalReview" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveNode">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

const { addEdges } = useVueFlow()

const nodes = ref([
  {
    id: '1',
    label: '填报员',
    position: { x: 50, y: 50 },
    data: {
      label: '填报员',
      role: 'reporter',
      canEdit: true,
      mustSign: true,
      autoArchive: false,
      finalReview: false
    },
    type: 'default'
  }
])

const edges = ref([])

let nodeId = 2
function addNode() {
  nodes.value.push({
    id: String(nodeId++),
    label: '新审批节点',
    position: { x: 100 + nodeId * 20, y: 100 + nodeId * 20 },
    data: {
      label: '新审批节点',
      role: '',
      canEdit: false,
      mustSign: false,
      autoArchive: false,
      finalReview: false
    },
    type: 'default'
  })
}

const editDialogVisible = ref(false)
const editingNode = ref({ data: {} })

function editNode({ node }) {
  editingNode.value = node
  editDialogVisible.value = true
}

function saveNode() {
  editDialogVisible.value = false
}

function exportFlow() {
  const exportData = nodes.value.map((node, index) => ({
    step_index: index,
    step_name: node.data.label,
    role: node.data.role,
    can_edit: node.data.canEdit,
    must_sign: node.data.mustSign,
    auto_archive: node.data.autoArchive,
    final_review: node.data.finalReview
  }))
  console.log('导出配置:', exportData)
  alert('流程配置已打印到控制台')
}
</script>

<style scoped>
.flow-container {
  width: 100%;
  height: 500px;
  border: 1px solid #ccc;
  margin-bottom: 20px;
}
</style>

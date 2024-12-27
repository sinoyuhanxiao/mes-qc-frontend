<template>
  <div class="custom-tree-container">
    <div class="toolbar">
      <el-input
          v-model="filterText"
          style="width: 240px; margin-right: 10px;"
          placeholder="Filter keyword"
      />
      <el-button :type="isEditMode ? 'success' : 'primary'" @click="toggleEditMode">
        {{ isEditMode ? 'View' : 'Edit' }}
      </el-button>
      <el-button v-if="isEditMode" type="primary" @click="showAppendPopup(null)" style="margin-left: 10px;">
        New
      </el-button>
    </div>

    <el-tree
        ref="treeRef"
        style="max-width: 600px"
        :data="data"
        node-key="_id"
        default-expand-all
        :props="defaultProps"
        :filter-node-method="filterNode"
        @node-click="handleNodeClick"
    >
      <template #default="{ node, data }">
        <div class="custom-tree-node" @click="logNodeData(node, data)">
          <div class="node-content">
            <el-icon>
              <Folder v-if="data.nodeType === 'folder'" />
              <Document v-else />
            </el-icon>
            <span class="node-label">{{ data.label }}</span>
          </div>
          <div class="node-actions" v-if="isEditMode">
            <a v-if="data.nodeType === 'folder'" @click="showAppendPopup(data)" style="color: #3f9dfd; cursor: pointer;">Append</a>
            <a @click="showDeleteConfirmation(node, data)" style="color: #3f9dfd; cursor: pointer; margin-left: 8px;">Delete</a>
          </div>
        </div>
      </template>

    </el-tree>

    <el-alert
        v-if="error"
        title="Error"
        type="error"
        :description="error"
        show-icon
    />

    <!-- Delete Confirmation Dialog -->
    <el-dialog v-model="deleteDialogVisible" title="Confirm Deletion" width="30%">
      <span>Are you sure you want to delete <strong>{{ nodeToDelete?.nodeData.label }}</strong>?</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">Cancel</el-button>
          <el-button type="danger" @click="confirmDelete">Delete</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Append Node Dialog -->
    <el-dialog v-model="appendDialogVisible" :title="`Add New Node Under ${parentDataToAppend?.label}`" width="30%">
      <el-input v-model="newNodeLabel" placeholder="Enter node name" style="margin-bottom: 10px;" />
      <el-select v-model="newNodeType" placeholder="Select Node Type">
        <el-option label="Folder" value="folder"></el-option>
        <el-option label="Document" value="document"></el-option>
      </el-select>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="appendDialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="confirmAppend">Add</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, defineEmits } from 'vue'
import { ElTree, ElAlert, ElButton, ElDialog, ElInput } from 'element-plus'
import { Folder, Document } from '@element-plus/icons-vue'
import api from '@/services/api.js'

interface Tree {
  _id: string
  label: string
  children?: Tree[]
}

const logNodeData = (node: any, data: any) => {
  console.log('Node:', node)
  console.log('Data:', data)
}

const filterText = ref('')
const treeRef = ref<InstanceType<typeof ElTree>>()
const data = ref<Tree[]>([])
const error = ref<string | null>(null)
const isEditMode = ref(false)

const deleteDialogVisible = ref(false)
const appendDialogVisible = ref(false)
const nodeToDelete = ref<{ node: any; nodeData: Tree } | null>(null)
const parentDataToAppend = ref<Tree | null>(null)
const newNodeLabel = ref('')
const newNodeType = ref('folder') // Default to folder
const emit = defineEmits(['select-form']);


const defaultProps = {
  children: 'children',
  label: 'label',
}

const handleNodeClick = (nodeData) => {
  emit('select-form', nodeData); // Emit the full node data to the parent
};

const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value
}

// Fetch data from the backend
const fetchFormTreeData = async () => {
  try {
    const response = await api.get('/form-nodes')
    data.value = response.data
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load form tree data'
  }
}

onMounted(fetchFormTreeData)

// Watch for changes in filterText and apply filtering to the tree
watch(filterText, (val) => {
  treeRef.value?.filter(val)
})

// Filter function for tree nodes
const filterNode = (value: string, data: Tree) => {
  if (!value) return true
  return data.label.includes(value)
}

// Show the delete confirmation dialog
const showDeleteConfirmation = (node: any, nodeData: Tree) => {
  nodeToDelete.value = { node, nodeData }
  deleteDialogVisible.value = true
}

// Confirm deletion of the node
const confirmDelete = async () => {
  if (!nodeToDelete.value) return
  const { node, nodeData } = nodeToDelete.value
  try {
    await api.delete(`/form-nodes/${nodeData.id}`)
    const parent = node.parent
    const children: Tree[] = parent.data.children || parent.data
    const index = children.findIndex((d) => d.id === nodeData.id)
    children.splice(index, 1)
    data.value = [...data.value]
    deleteDialogVisible.value = false
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to delete node'
    deleteDialogVisible.value = false
  }
}

// Show the append dialog
const showAppendPopup = (parentData: Tree | null) => {
  parentDataToAppend.value = parentData
  newNodeLabel.value = ''
  appendDialogVisible.value = true
}

// Confirm appending a new child node
const confirmAppend = async () => {
  try {
    const newNode = {
      label: newNodeLabel.value,
      nodeType: newNodeType.value, // Use the selected node type
      children: newNodeType.value === 'folder' ? [] : undefined, // Only add children for folders
      qcFromTemplateId: newNodeType.value === 'document' ? '' : undefined, // Add qc_form_template_id for documents
    };

    let response;

    // Check if appending to root or a child node
    if (!parentDataToAppend.value) {
      // Add root-level node
      response = await api.post('form-nodes/top-level', newNode);
    } else {
      // Add child node
      response = await api.post('/form-nodes/child', newNode, {
        params: { parentId: parentDataToAppend.value.id },
      });
    }

    const createdNode = response.data;

    if (!parentDataToAppend.value) {
      // Add as a root node
      data.value.push(createdNode);
    } else {
      // Add as a child node
      if (!parentDataToAppend.value.children) {
        parentDataToAppend.value.children = [];
      }
      parentDataToAppend.value.children.push(createdNode);
    }

    data.value = [...data.value];
    appendDialogVisible.value = false;
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to add node';
    appendDialogVisible.value = false;
  }
};

const addRootNode = async () => {
  try {
    const newNode = {
      label: 'New Root Node',
      nodeType: 'folder',
      children: [],
    }

    const response = await api.post('/form-nodes/top-level', newNode)
    const createdNode = response.data
    data.value.push(createdNode) // Add the new root node to the tree
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to add root node'
  }
}


</script>

<style>
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.custom-tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.node-content {
  display: flex;
  align-items: center;
}

.node-label {
  margin-left: 8px; /* Add space between the icon and label */
}

.node-actions a {
  margin-left: 8px;
}

.el-tree-node:focus > .el-tree-node__content {
  background-color: #a0a0a0 !important; /* Deeper grey color */
  color: #ffffff !important;           /* White text for contrast */
}

</style>

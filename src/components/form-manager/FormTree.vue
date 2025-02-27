<template>
  <div class="custom-tree-container">
    <div class="toolbar">
      <el-input
          v-model="filterText"
          style="width: 240px; margin-right: 10px;"
          placeholder="Filter keyword"
      />
      <el-button :type="isEditMode ? 'success' : 'primary'" @click="toggleEditMode" style="margin-top: 0">
        {{ isEditMode ? 'View' : 'Edit' }}
      </el-button>
      <el-button v-if="isEditMode" type="primary" @click="showAppendPopup(null)" style="margin-left: 10px; margin-top: 0">
        New
      </el-button>
    </div>

    <el-scrollbar :height="scrollbarHeight">
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
    </el-scrollbar>

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
import {
  fetchFormNodes,
  addTopLevelNode,
  addChildNode,
  deleteNode,
} from '@/services/formNodeService.js';

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
const emit = defineEmits(['select-form', 'is-deletion']);

const scrollbarHeight = ref(`${window.innerHeight - 70}px`); // Adjust height dynamically

const updateScrollbarHeight = () => {
  scrollbarHeight.value = `${window.innerHeight - 70}px`; // Adjust height dynamically with padding
};

onMounted(() => {
  window.addEventListener('resize', updateScrollbarHeight);
  updateScrollbarHeight(); // Initialize height
});

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
    const response = await fetchFormNodes();
    data.value = response.data;
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load form tree data';
  }
};


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
  if (!nodeToDelete.value) return;
  const { node, nodeData } = nodeToDelete.value;
  try {
    await deleteNode(nodeData.id);
    emit('is-deletion');
    const parent = node.parent;
    const children = parent.data.children || parent.data;
    const index = children.findIndex((d) => d.id === nodeData.id);
    children.splice(index, 1);
    data.value = [...data.value];
    deleteDialogVisible.value = false;
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to delete node';
    deleteDialogVisible.value = false;
  }
};

// Show the append dialog
const showAppendPopup = (parentData: Tree | null) => {
  parentDataToAppend.value = parentData
  newNodeLabel.value = ''
  appendDialogVisible.value = true
}

// Confirm appending a new child node
const confirmAppend = async () => {
  try {
    let newNode = {
      label: newNodeLabel.value,
      nodeType: newNodeType.value,
      children: newNodeType.value === 'folder' ? [] : undefined,
      qcFormTemplateId: newNodeType.value === 'document' ? '' : undefined,
    }

    let response;

    if (!parentDataToAppend.value) {
      response = await addTopLevelNode(newNode); // Add root-level node
    } else {
      response = await addChildNode(newNode, parentDataToAppend.value.id); // Add child node
    }

    const createdNode = response.data;

    if (!parentDataToAppend.value) {
      data.value.push(createdNode);
    } else {
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

</style>

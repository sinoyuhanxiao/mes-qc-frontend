<template>
  <div class="custom-tree-container">
    <div class="toolbar">
      <el-input
          v-model="filterText"
          style="width: 240px; margin-right: 10px;"
          placeholder="搜索名称"
      />
      <el-button :type="isEditMode ? 'success' : 'primary'" @click="toggleEditMode" style="margin-top: 0">
        {{ isEditMode ? '取消编辑' : '编辑' }}
      </el-button>
      <el-button v-if="isEditMode" type="primary" @click="showAppendPopup(null, $event)" style="margin-left: 10px; margin-top: 0">
        + 新建
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
              <el-icon style="margin-right: 5px;">
                <Folder v-if="data.nodeType === 'folder'" />
                <Document v-else />
              </el-icon>
              <el-text style="max-width: 150px;" truncated>
                {{ data.label }}
              </el-text>
            </div>
            <div class="node-actions" v-if="isEditMode">
              <a v-if="data.nodeType === 'folder'" @click="showAppendPopup(data, $event)" style="color: #3f9dfd; cursor: pointer;">添加</a>
              <a @click="showDeleteConfirmation(node, data, $event)" style="color: #fb8080; cursor: pointer; margin-left: 8px;">删除</a>
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
    <el-dialog v-model="deleteDialogVisible" title="删除确认" width="30%">
      <span>是否确认删除 <strong>{{ nodeToDelete?.nodeData.label }}</strong>?</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete">删除</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Append Node Dialog -->
    <el-dialog v-model="appendDialogVisible" :title="`添加节点到 ${parentDataToAppend?.label || '根目录'}`" width="30%">
      <el-input v-model="newNodeLabel" placeholder="输入节点名称" style="margin-bottom: 10px;" />
      <el-select v-model="newNodeType" placeholder="选择节点类型">
        <el-option label="文件夹" value="folder"></el-option>
        <el-option label="质检表单" value="document"></el-option>
      </el-select>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="appendDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmAppend">添加</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, defineEmits } from 'vue'
import {ElTree, ElAlert, ElButton, ElDialog, ElInput, ElMessage} from 'element-plus'
import { Folder, Document } from '@element-plus/icons-vue'
import {
  fetchFormNodes,
  addTopLevelNode,
  addChildNode,
  deleteNode,
} from '@/services/formNodeService.js';
import { ElMessageBox } from "element-plus";

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
    error.value = err.response?.data?.message || '加载数据失败';
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
const showDeleteConfirmation = (node: any, nodeData: Tree, event) => {
  event.stopPropagation()
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
    ElMessage.success("删除成功！")
  } catch (err) {
    error.value = err.response?.data?.message || '删除失败';
    deleteDialogVisible.value = false;
  }
};

// Show the append dialog
const showAppendPopup = (parentData: Tree | null, event) => {
  event.stopPropagation();
  parentDataToAppend.value = parentData
  newNodeLabel.value = ''
  appendDialogVisible.value = true
}

// Confirm appending a new child node
const confirmAppend = async () => {
  // no empty string allowed
  if (!newNodeLabel.value.trim()) {
    ElMessage.warning("名称不能为空！");
    return;
  }

  // check for duplicate names
  const isDuplicate = (parentDataToAppend.value ? parentDataToAppend.value.children : data.value)
      ?.some(node => node.label === newNodeLabel.value);

  // 深度搜索整个树结构，检查是否有重复 label
  const deepSearchDuplicate = (nodes, label) => {
    for (const node of nodes) {
      if (node.label === label) return true;
      if (node.children && deepSearchDuplicate(node.children, label)) return true;
    }
    return false;
  };

  // 使用深度搜索检查整个树
  const hasDuplicate = isDuplicate || deepSearchDuplicate(data.value, newNodeLabel.value);

  if (hasDuplicate) {
    ElMessageBox.confirm(
        "已有重复名称，是否继续创建？",
        "警告",
        { confirmButtonText: "继续", cancelButtonText: "取消", type: "warning" }
    ).then(() => {
      proceedWithNodeCreation();
    }).catch(() => {});
    return;
  }

  await proceedWithNodeCreation();
};

const proceedWithNodeCreation = async () => {
  try {
    let newNode = {
      label: newNodeLabel.value,
      nodeType: newNodeType.value,
      children: newNodeType.value === 'folder' ? [] : undefined,
      qcFormTemplateId: newNodeType.value === 'document' ? '' : undefined,
    };

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
    ElMessage.success("添加成功！");
  } catch (err) {
    error.value = err.response?.data?.message || '添加节点失败';
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

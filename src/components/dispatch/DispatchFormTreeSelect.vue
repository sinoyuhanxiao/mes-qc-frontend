<template>
  <div :class="[{ 'error-border': hasError }]">
    <el-form-item
        label="质检表单"
        required
        :prop="propName"
        :rules="[{ validator: validateSelectedForms, trigger: 'change' }]"
    >
      <el-input
          v-model="filterText"
          style="width: 240px; margin-bottom:10px;"
          placeholder="搜索表单"
          clearable
      />

      <el-tree
          ref="treeRef"
          style="
            max-height: 300px; /* Set vertical limit */
            overflow-y: auto;   /* Enable scrolling */
            border: 1px solid #dcdfe6;
            border-radius: 4px;"
          :data="data"
          node-key="id"
          :props="defaultProps"
          :filter-node-method="filterNode"
          @check-change="handleCheckChange"
          @node-click="handleNodeClicked"
          show-checkbox
          default-expand-all
      >
        <template #default="{ node, data }">
          <div class="custom-tree-node">
            <div class="node-content">
              <el-icon>
                <Folder v-if="data.nodeType === 'folder'" />
                <Document v-else />
              </el-icon>
              <span class="node-label">{{ data.label }}</span>
            </div>
          </div>
        </template>
      </el-tree>
      <div v-if="hasError" class="el-form-item__error">
        请选择至少一个表单
      </div>
    </el-form-item>

    <el-alert
        v-if="error"
        title="Error"
        type="error"
        :description="error"
        show-icon
    />
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
  _id: string;
  label: string;
  children?: Tree[];
  nodeType: string;
  qcFormTemplateId: string | null;
}

const props = defineProps({
  selectedFormIds: {
    type: Array,
    default: () => [],
  },
  hasError: {
    type: Boolean,
    default: false, // Controls whether to show red overlay
  },
  propName: {
    type: String,
  },
});
const emit = defineEmits(['update-selected-forms','on-node-clicked']);
const filterText = ref('')
const treeRef = ref<InstanceType<typeof ElTree>>()
const data = ref<Tree[]>([])
const error = ref<string | null>(null)

// Custom Validation Method
const validateSelectedForms = (rule, value, callback) => {
  if (!props.selectedFormIds || props.selectedFormIds.length === 0) {
    callback(new Error("请选择至少一个表单"));
  } else {
    callback();
  }
};

const defaultProps = {
  children: 'children',
  label: 'label',
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

// Watch for changes in `selectedFormIds` and update the tree
watch(
    () => props.selectedFormIds,
    (newVal) => {
      if (treeRef.value) {
        treeRef.value.setCheckedKeys(newVal);
      }
    },
    { immediate: true }
);


onMounted(async () => {
  await fetchFormTreeData();
  if (props.selectedFormIds.length && treeRef.value) {
    // Pre-check nodes based on `selectedFormIds`
    // console.log('selected ids: ',props.selectedFormIds)
    const nodesToCheck = data.value
        .flatMap(flattenTree) // Flatten the tree to find all nodes
        .filter(node => props.selectedFormIds.includes(node.id));
    // console.log('nodesToCheck: ', nodesToCheck)

    const nodeKeys = nodesToCheck.map(node => node.id);
    // console.log('nodeKeys: ', nodeKeys)
    // console.log("Tree instance:", treeRef.value);
    treeRef.value.setCheckedKeys(nodeKeys);
  }
});

// Utility to flatten tree recursively
function flattenTree(treeNode) {
  return [treeNode].concat(
      (treeNode.children || []).flatMap(flattenTree)
  );
}

// Watch for changes in filterText and apply filtering to the tree
watch(filterText, (val) => {
  treeRef.value?.filter(val)
})

// Filter function for tree nodes
const filterNode = (value: string, data: Tree) => {
  if (!value) return true
  return data.label.includes(value)
}

const handleCheckChange = () => {
  const checkedNodes = treeRef.value.getCheckedNodes(false, false);
  const selectedForms = checkedNodes
      .filter(node => node.nodeType === 'document') // Only include documents
      .map(node => ({
        id: node.id,
        label: node.label,
      })); // Extract IDs
  emit('update-selected-forms', selectedForms); // Emit IDs to parent
};

const handleNodeClicked = (nodeData) => {
  if(nodeData.nodeType == 'document' && nodeData.id) {
    emit("on-node-clicked", nodeData.id);
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

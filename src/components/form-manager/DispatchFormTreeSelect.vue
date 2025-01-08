<template>
  <div class="custom-tree-container">
    <div class="toolbar">
      <el-input
          v-model="filterText"
          style="width: 240px; margin-right: 10px;"
          placeholder="搜索表单"
      />

    </div>

    <el-tree
        ref="treeRef"
        style="max-width: 600px"
        :data="data"
        node-key="id"
        :props="defaultProps"
        :filter-node-method="filterNode"
        @check-change="handleCheckChange"
        default-expand-all
        show-checkbox
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
});
const emit = defineEmits(['update-selected-forms']);
const filterText = ref('')
const treeRef = ref<InstanceType<typeof ElTree>>()
const data = ref<Tree[]>([])
const error = ref<string | null>(null)


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
      .filter((node) => node.nodeType === 'document') // Only include documents
      .map((node) => ({ id: node.id, label: node.label })); // Include both ID and label

  emit('update-selected-forms', selectedForms); // Emit IDs to parent
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

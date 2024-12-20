<template>
  <div class="custom-tree-container">
    <el-input
        v-model="filterText"
        style="width: 240px"
        placeholder="Filter keyword"
    />

    <el-tree
        ref="treeRef"
        style="max-width: 600px"
        :data="data"
        node-key="_id"
        default-expand-all
        :props="defaultProps"
        :filter-node-method="filterNode"
    >
      <template #default="{ node, data }">
        <span class="custom-tree-node">
          <span>{{ node.label }}</span>
          <span>
            <a @click="append(data)">Append</a>
            <a style="margin-left: 8px" @click="remove(node, data)">Delete</a>
          </span>
        </span>
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
import { ref, onMounted, watch } from 'vue'
import { ElTree, ElAlert } from 'element-plus'
import axios from 'axios'

interface Tree {
  _id: string
  label: string
  children?: Tree[]
}

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
    const response = await axios.get('http://10.10.12.68:8086/form-nodes')
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

// Append a new child node
const append = async (parentData: Tree) => {
  try {
    const newNode = {
      label: 'New Node',
      children: []
    }

    console.log(parentData)

    // Call the backend to add the new child node
    const response = await axios.post('http://10.10.12.68:8086/form-nodes/child', newNode, {
      params: { parentId: parentData.id }
    })

    const createdNode = response.data

    console.log(createdNode)

    if (!parentData.children) {
      parentData.children = []
    }
    parentData.children.push(createdNode)
    data.value = [...data.value]
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to add node'
  }
}

// Delete a node
const remove = async (node: any, nodeData: Tree) => {
  try {
    await axios.delete(`http://10.10.12.68:8086/form-nodes/${nodeData.id}`)
    const parent = node.parent
    const children: Tree[] = parent.data.children || parent.data
    const index = children.findIndex((d) => d.id === nodeData.id)
    children.splice(index, 1)
    data.value = [...data.value]
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to delete node'
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
</style>

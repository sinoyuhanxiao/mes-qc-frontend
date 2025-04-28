<template>
  <div class="form-tree-multi-select">
    {{ translate('FormTree.selectFolder') }}
    <el-tree-select
        v-model="selectedValues"
        :data="treeData"
        :placeholder="translate('FormTree.pleaseSelectFolder')"
        multiple
        filterable
        :render-after-expand="false"
        show-checkbox
        check-strictly
        check-on-click-node
        style="width: 300px; margin-left: 6px"
    >
    </el-tree-select>
  </div>
</template>

<script setup>
  import { ref, onMounted, watch, defineEmits } from 'vue';
  import { fetchFormNodes } from '@/services/formNodeService.js';
  import { translate } from "@/utils/i18n";

  const emit = defineEmits(['update:selectedFolders']); // Define emit
  const selectedValues = ref([]); // Stores the selected node values
  const treeData = ref(); // Tree data for the dropdown

  // Fetch tree data from the backend
  const fetchTreeData = async () => {
    try {
      const response = await fetchFormNodes();

      // Recursive function to filter nodes with type "folder" and rename "id" to "value"
      const filterFolders = (nodes) => {
        return nodes
            .filter((node) => node.nodeType === 'folder') // Keep only "folder" nodes
            .map((node) => ({
              ...node,
              value: node.id, // Rename "id" to "value"
              children: node.children ? filterFolders(node.children) : [], // Recursively filter children
            }));
      };

      // Filter and assign the tree data
      treeData.value = filterFolders(response.data);

      // Log the processed tree data for debugging
      console.log('Processed Tree Data:', treeData.value);
    } catch (error) {
      console.error('Error fetching tree data:', error);
    }
  };

  const logSelectedNodes = (selectedIds) => {
    console.log('Selected Values:', selectedIds); // Simply log the selected IDs
  };

  onMounted(fetchTreeData);

  watch(selectedValues, (newValues) => {
    console.log('Selected Folders Updated:', newValues); // Log the change
    emit('update:selectedFolders', newValues); // Emit the updated values to parent
  });

</script>

<style scoped>
  .form-tree-multi-select {
    margin: 10px;
  }

  /* Set the default label color */
  .el-tree-node__label {
    color: #606266; /* Default text color */
  }

  /* Change the label color when selected */
  .el-tree-node.is-checked .el-tree-node__label,
  .el-tree-node.is-indeterminate .el-tree-node__label {
    color: #409EFF; /* Highlighted color when selected */
  }
</style>

<template>
  <el-container>
    <el-aside width="20%">
      <FormTree @select-form="selectForm" @add-form="addForm" />
    </el-aside>
    <el-main>
      <!-- Render FormDisplay only if selectedForm exists and nodeType is not 'folder' -->
      <FormDisplay v-if="selectedForm && selectedForm.nodeType !== 'folder'" :currentForm="selectedForm" />
    </el-main>
  </el-container>
</template>

<script>
import FormTree from '@/components/form-manager/FormTree.vue';
import FormDisplay from '@/components/form-manager/FormDisplay.vue';

export default {
  components: { FormTree, FormDisplay },
  data() {
    return {
      selectedForm: null, // Ensure it's initially null
    };
  },
  methods: {
    selectForm(form) {
      this.selectedForm = form;
    },
    addForm() {
      this.selectedForm = {widgetList: [], formConfig: {}, qcFormTemplateId: null};
    },
  },
};
</script>

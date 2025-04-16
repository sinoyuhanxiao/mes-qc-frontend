<template>
  <el-container>
    <el-aside width="25%">
      <FormTree
          :accessByTeam="1"
          @select-form="selectForm"
          @add-form="addForm"
          @is-deletion="handleDeletion"
      />
    </el-aside>
    <el-main>
      <FormDisplay
          v-if="selectedForm && selectedForm.nodeType !== 'folder'"
          :currentForm="selectedForm"
          :usable="true"
          :accessByTeam="1"
      />
    </el-main>
  </el-container>
</template>

<script>
import FormTree from '@/components/form-manager/FormTree.vue';
import FormDisplay from '@/components/form-manager/FormDisplay.vue';

export default {
  components: {
    FormTree,
    FormDisplay,
  },
  data() {
    return {
      selectedForm: null,
    };
  },
  methods: {
    selectForm(form) {
      this.selectedForm = form;
    },
    addForm() {
      this.selectedForm = {
        widgetList: [],
        formConfig: {},
        qcFormTemplateId: null,
      };
    },
    handleDeletion() {
      this.selectedForm = null;
    },
  },
};
</script>

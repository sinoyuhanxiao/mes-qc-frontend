<template>
  <el-container>
    <el-aside width="20%">
      <FormTree @select-form="selectForm" @add-form="addForm" />
    </el-aside>
    <el-main>
      <FormDisplay :currentForm="selectedForm" />
    </el-main>
  </el-container>
</template>

<script>
import FormTree from '@/components/form-manager/FormTree.vue'
import FormDisplay from '@/components/form-manager/FormDisplay.vue'

export default {

  components: { FormTree, FormDisplay: FormDisplay },
  data() {
    return {
      selectedForm: null
    }
  },
  methods: {
    selectForm(form) {
      this.selectedForm = form
    },
    addForm() {
      this.selectedForm = { widgetList: [], formConfig: {} }
    }
  }
}
</script>

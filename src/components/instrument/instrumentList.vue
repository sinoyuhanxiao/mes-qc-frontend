<template>
  <el-table
      :data="instruments"
      border
      style="width: 100%"
  >
    <el-table-column prop="id" label="ID" width="80" />
    <el-table-column prop="name" label="名称" width="180" />
    <el-table-column prop="type" label="类型" width="120" />
    <el-table-column prop="manufacturer" label="制造商" width="180" />
    <el-table-column prop="modelNumber" label="型号" width="150" />
    <el-table-column prop="description" label="描述" />

    <!-- Actions -->
    <el-table-column label="操作" width="250">
      <template #default="scope">
        <el-button type="primary" @click="$emit('edit-instrument', scope.row)">编辑</el-button>
        <el-button type="danger" @click="$emit('delete-instrument', scope.row.id)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
export default {
  props: {
    instruments: {
      type: Array,
      required: true,
    },

  },
};
</script>

<style scoped>
</style>

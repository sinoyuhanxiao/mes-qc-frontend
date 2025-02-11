<template>
  <el-table :data="locations" border style="width: 100%">
    <el-table-column prop="id" label="ID" width="80" />
    <el-table-column prop="name" label="名称" width="200" />
    <el-table-column prop="description" label="描述" />

    <!-- Actions -->
    <el-table-column label="操作" width="250">
      <template #default="scope">
        <el-button type="primary" @click="$emit('edit-location', scope.row)">
          编辑
        </el-button>
        <el-button type="danger" @click="$emit('delete-location', scope.row.id)">
          删除
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
export default {
  props: {
    locations: {
      type: Array,
      required: true,
    },
  },
};
</script>

<style scoped>
</style>

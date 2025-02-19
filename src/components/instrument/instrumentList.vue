<template>
  <el-table
      :data="instruments"
      style="width: 100%"
  >
    <el-table-column prop="id" label="ID" width="80" />
    <el-table-column prop="name" label="名称" width="180" />
    <el-table-column prop="type" label="类型" width="120" />
    <el-table-column prop="manufacturer" label="制造商" width="180" />
    <el-table-column prop="modelNumber" label="型号" width="150" />
    <el-table-column prop="description" label="描述" />

    <!-- Created At -->
    <el-table-column prop="created_at" label="创建时间" width="180" sortable>
      <template #default="scope">
        <time-slot :value="scope.row.created_at" />
      </template>
    </el-table-column>

    <!-- Created By -->
    <el-table-column prop="created_by" label="创建者" width="180" sortable>
      <template #default="scope">
        <UserReference :user-id="scope.row.created_by"/>
      </template>
    </el-table-column>

    <!-- Actions -->
    <el-table-column label="操作" width="250">
      <template #default="scope">
        <el-button size="small" @click="$emit('edit-instrument', scope.row)">编辑</el-button>
        <el-button type="danger" size="small" @click="$emit('delete-instrument', scope.row.id)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
import TimeSlot from "@/components/dispatch/TimeSlot.vue";
import UserReference from "@/components/dispatch/UserReference.vue";

export default {
  components: {UserReference, TimeSlot},
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

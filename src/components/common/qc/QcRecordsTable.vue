<template>
  <div>
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <el-input
          v-model="localSearch"
          :placeholder="translate('FormDataSummary.recordTable.searchPlaceholder')"
          clearable
          style="width: 300px; margin-right: 500px"
      />

      <el-button type="success" style="margin-right: 20px" @click="$emit('export-excel')">
        {{ translate('FormDataSummary.recordTable.exportExcel') }}
      </el-button>

      <el-date-picker
          v-model="localDateRange"
          type="datetimerange"
          :shortcuts="shortcuts"
          :range-separator="translate('FormDataSummary.dateRangeSeparator')"
          :start-placeholder="translate('FormDataSummary.startPlaceholder')"
          :end-placeholder="translate('FormDataSummary.endPlaceholder')"
          @change="handleDateRangeChange"
      />
    </div>

    <!-- 表格 -->
    <el-table
        :data="paginatedRecords"
        :height="tableHeight"
        border
        style="width: 100%; white-space: nowrap;"
        v-loading="loading"
    >
      <el-table-column :label="translate('FormDataSummary.recordTable.groupSystemInfo')" label-class-name="group-header" fixed>
        <el-table-column prop="提交人" :label="translate('FormDataSummary.recordTable.submitter')" fixed="left" width="150" sortable />
        <el-table-column prop="提交时间" :label="translate('FormDataSummary.recordTable.submittedAt')" fixed="left" width="180" sortable />
        <el-table-column prop="_id" :label="translate('FormDataSummary.recordTable.submissionId')" fixed="left" width="220" sortable />
      </el-table-column>

      <el-table-column :label="translate('FormDataSummary.recordTable.groupQcDetails')" label-class-name="group-header">
        <el-table-column
            v-for="(header, index) in headers"
            :key="index"
            :prop="header"
            :label="header"
            sortable
            :width="150"
        />
      </el-table-column>

      <el-table-column :label="translate('FormDataSummary.recordTable.actions')" fixed="right" width="120">
        <template #default="scope">
          <el-link type="primary" @click="$emit('view-details', scope.row)">
            {{ translate('FormDataSummary.recordTable.view') }}
          </el-link>
          <el-link type="danger" style="margin-left: 10px" @click="$emit('delete', scope.row)">
            {{ translate('FormDataSummary.recordTable.delete') }}
          </el-link>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
        v-if="filteredRecords.length > 0"
        v-model:currentPage="currentPage"
        :page-size="pageSize"
        layout="total, prev, pager, next"
        :total="filteredRecords.length"
        @current-change="handlePageChange"
    />
  </div>
</template>

<script setup>
  import { ref, computed, watch } from 'vue'
  import { translate } from '@/utils/i18n'

  const props = defineProps({
    records: Array,
    headers: Array,
    search: String,
    dateRange: Array,
    loading: Boolean,
    tableHeight: Number
  })

  const emit = defineEmits(['view-details', 'delete', 'export-excel', 'update:dateRange'])

  const localSearch = ref(props.search || '')
  const localDateRange = ref(props.dateRange || [])
  const currentPage = ref(1)
  const pageSize = 15

  const shortcuts = [
    {
      text: translate('FormDataSummary.shortcuts.thisWeek'),
      value: () => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - start.getDay() + 1)
        return [start, end]
      }
    },
    {
      text: translate('FormDataSummary.shortcuts.thisMonth'),
      value: () => {
        const now = new Date()
        return [new Date(now.getFullYear(), now.getMonth(), 1), new Date()]
      }
    },
    {
      text: translate('FormDataSummary.shortcuts.lastMonth'),
      value: () => {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const end = new Date(now.getFullYear(), now.getMonth(), 0)
        return [start, end]
      }
    },
    {
      text: translate('FormDataSummary.shortcuts.lastThreeMonths'),
      value: () => {
        const end = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - 3);
        return [start, end];
      },
    },
  ]

  const handleDateRangeChange = () => {
    emit('update:dateRange', localDateRange.value)
  }

  const filteredRecords = computed(() => {
    if (!localSearch.value) return props.records
    return props.records.filter(record =>
        Object.values(record).some(val =>
            String(val).toLowerCase().includes(localSearch.value.toLowerCase())
        )
    )
  })

  const paginatedRecords = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    const end = start + pageSize
    return filteredRecords.value.slice(start, end)
  })

  watch(() => props.search, (val) => localSearch.value = val)
  watch(() => props.dateRange, (val) => localDateRange.value = val)

  const handlePageChange = (page) => {
    currentPage.value = page
  }
</script>

<style scoped>
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
</style>

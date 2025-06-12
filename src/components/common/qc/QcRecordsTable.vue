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

      <el-button v-if="!props.fromApprovalPage" type="success" style="margin-right: 10px; margin-bottom: 10px" @click="$emit('export-excel')">
        {{ translate('FormDataSummary.recordTable.exportExcel') }}
      </el-button>

      <el-switch
          v-model="showAlerts"
          active-text="显示告警"
          inactive-text="隐藏告警"
          class="ml-2 mr-2"
          size="large"
          inline-prompt
          style="--el-switch-off-color: #989898; --el-switch-on-color: #409EFF; margin-right: 10px"
      />

      <el-date-picker
          v-if="!props.fromApprovalPage"
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
        :data="displayedRecords"
        :height="tableHeight"
        row-key="_id"
        lazy
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        border
        :load="load"
        :row-class-name="getRowClass"
        @expand-change="toggleRowHighlight"
        style="width: 100%; white-space: nowrap;"
        v-loading="loading"
    >
      <el-table-column :label="translate('FormDataSummary.recordTable.groupSystemInfo')" label-class-name="group-header" fixed class-name="section-border-right">
        <el-table-column
            v-if="props.fromApprovalPage"
            prop="版本类型"
            label="版本"
            width="110"
        >
          <template #default="scope">
            <span :style="{
              fontWeight: 'bold',
              color: scope.row._id === latestRecordId ? '#1677ff' : '#606266'
            }">
              {{ scope.row._id === latestRecordId ? '当前版本' : '历史版本' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="提交人" :label="translate('FormDataSummary.recordTable.submitter')" fixed="left" width="150" sortable />
        <el-table-column prop="提交时间" :label="translate('FormDataSummary.recordTable.submittedAt')" fixed="left" width="180" sortable />
      </el-table-column>

      <el-table-column :label="translate('FormDataSummary.recordTable.groupQcDetails')" label-class-name="group-header" class-name="section-border-right">
        <el-table-column
              v-for="(header, index) in headers"
              :key="index"
              :label="header"
              :prop="header"
              sortable
              :width="150"
          >
          <template #default="scope">
            <span :style="showAlerts && getAlertIcon(scope.row, header) ? { fontWeight: 'bold' } : {}">
              {{ Array.isArray(scope.row[header]) ? scope.row[header].join(', ') : scope.row[header] }}
              <el-tooltip
                  v-if="showAlerts && getAlertIcon(scope.row, header)"
                  :content="getAlertTooltip(scope.row, header)"
                  placement="top"
              >
                <el-icon :style="getAlertStyle(scope.row, header)" size="18px">
                  <component :is="getAlertIcon(scope.row, header)" />
                </el-icon>
              </el-tooltip>
            </span>
          </template>
        </el-table-column>
      </el-table-column>

      <!-- 表单基础信息字段组 -->
      <el-table-column :label="translate('FormDataSummary.recordTable.groupBasicInfo')" label-class-name="group-header" class-name="section-border-right">
        <el-table-column prop="related_products" label="涉及产品" width="150" sortable />
        <el-table-column prop="related_batches" label="涉及批次" width="150" sortable />
        <el-table-column prop="related_inspectors" label="质检人员" width="150" sortable />
        <el-table-column prop="related_shifts" label="所属班次" width="150" sortable />
        <el-table-column prop="related_teams" label="所属班组" width="150" sortable />
        <el-table-column prop="_id" :label="translate('FormDataSummary.recordTable.submissionId')" fixed="left" width="220" sortable />
      </el-table-column>

      <el-table-column :label="translate('FormDataSummary.recordTable.actions')" fixed="right" :width="props.fromApprovalPage ? 100 : 180">
        <template #default="scope">
          <el-link type="success" @click="$emit('view-details', scope.row)">
            {{ translate('FormDataSummary.recordTable.view') }}
          </el-link>
          <!-- 仅当为顶层版本才显示 编辑 和 删除 -->
          <template v-if="!props.fromApprovalPage && (!scope.row.version_group_id || scope.row.hasChildren)">
            <el-link type="primary" style="margin-left: 10px" @click="$emit('edit-record', scope.row)">
              {{ translate('common.table.editButton') }}
            </el-link>
            <el-link v-if="false" type="danger" style="margin-left: 10px" @click="() => {
                  $emit('delete', scope.row)
                  emit('update:dateRange', [...localDateRange.value]) // 刷新页面
                }">
              {{ translate('FormDataSummary.recordTable.delete') }}
            </el-link>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
        v-if="filteredRecords.length > 0"
        v-model:currentPage="currentPage"
        :page-size="pageSize"
        :page-sizes="[15]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredRecords.length"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
    />
  </div>
</template>

<script setup>
  import {ref, computed, watch, onMounted, onBeforeUnmount} from 'vue'
  import { translate } from '@/utils/i18n'
  import { useAlertHighlight } from '@/composables/useAlertHighlight'
  import { useQcRecordsDialog } from '@/composables/useQcRecordsDialog'

  const { loadVersionGroupRecords } = useQcRecordsDialog()

  const latestRecordId = computed(() => {
    if (!props.fromApprovalPage || !props.records?.length) return null
    return [...props.records]
        .sort((a, b) => new Date(b['提交时间']) - new Date(a['提交时间']))[0]?._id
  })

  const props = defineProps({
    records: Array,
    headers: Array,
    search: String,
    dateRange: Array,
    loading: Boolean,
    tableHeight: Number,
    qcFormTemplateId: Number,
    fromApprovalPage: Boolean
  })

  const emit = defineEmits(['view-details', 'delete', 'edit-record', 'export-excel', 'update:dateRange'])

  const localSearch = ref(props.search || '')
  const localDateRange = ref(props.dateRange || [])
  const currentPage = ref(1)
  let pageSize = ref(15)
  const handleSizeChange = (newSize) => {
    pageSize = newSize
    currentPage.value = 1
  }
  const showAlerts = ref(true)
  const expandedRows = ref(new Set())
  const { getAlertStyle, getAlertIcon, getAlertTooltip } = useAlertHighlight(showAlerts)

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
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredRecords.value.slice(start, end)
  })

// 找到这段 computed 逻辑：
const displayedRecords = computed(() => {
  const allChildIds = new Set(
      props.records.flatMap(record => record.children?.map(child => child._id) || [])
  )

  return paginatedRecords.value.map(record => {
    if (
        record.version_group_id &&
        !allChildIds.has(record._id)
    ) {
      return { ...record, hasChildren: true }
    }
    return record
  })
})

  watch(() => props.search, (val) => localSearch.value = val)
  watch(
      () => props.dateRange,
      (val) => {
        localDateRange.value = Array.isArray(val) ? [...val] : []
      },
      { immediate: true, deep: true }
  )
  watch(localDateRange, (newVal, oldVal) => {
    console.log("📆 Date range changed from", oldVal, "to", newVal)
  })
  const handlePageChange = (page) => {
    currentPage.value = page
  }

  const load = async (row, treeNode, resolve) => {
    if (!row.version_group_id) return resolve([])
    if (!props.qcFormTemplateId) return resolve([])

    const children = await loadVersionGroupRecords(props.qcFormTemplateId, row.version_group_id)
    const filtered = children.filter(c => c.version !== row.version)

    // ✅ 添加子项 ID 到 expandedRows（确保高亮）
    filtered.forEach(child => expandedRows.value.add(child._id))

    resolve(filtered)
  }

  // css

  const toggleRowHighlight = (row, expanded) => {
    if (expanded) {
      expandedRows.value.add(row._id)
      if (row.children) {
        row.children.forEach(child => expandedRows.value.add(child._id))
      }
    } else {
      expandedRows.value.delete(row._id)
      if (row.children) {
        row.children.forEach(child => expandedRows.value.delete(child._id))
      }
    }
  }

const getRowClass = ({ row, rowIndex }) => {
  let classes = []

  // 当前展开行高亮
  if (expandedRows.value.has(row._id)) {
    classes.push('expanded-highlight')
  }

  // 如果来自审批页面，首行添加主色背景
  if (props.fromApprovalPage && row._id === latestRecordId.value) {
    classes.push('primary-version-row')
  }

  return classes.join(' ')
}


  onMounted(() => {
    window.refreshQcRecordsTableAfterEditRecord = () => {
      console.log("🔄 refreshing from child edit window");
      emit('update:dateRange', [...localDateRange.value]) // ⬅️ 触发刷新
    }
  })

  onBeforeUnmount(() => {
    delete window.refreshQcRecordsTableAfterEditRecord
  })


</script>

<style scoped>
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  ::v-deep(.section-border-right .el-table__cell) {
    border-right: 2px solid #333 !important;
  }

  ::v-deep(.el-table__body-wrapper .expanded-highlight td),
  ::v-deep(.el-table__body-wrapper .expanded-highlight td),
  ::v-deep(.el-table__fixed .el-table__row.expanded-highlight td),
  ::v-deep(.el-table__fixed-left .el-table__row.expanded-highlight td),
  ::v-deep(.el-table__fixed-right .el-table__row.expanded-highlight td) {
    background-color: #e0f3ff !important;
    box-shadow:
      inset 0 -0.5px 0 rgba(128, 128, 128, 0.91),  /* bottom */
      inset -0.5px 0 0 rgba(128, 128, 128, 0.91);  /* left */
  }

  ::v-deep(.el-table__row.primary-version-row td) {
    background-color: #def0fb !important;
  }
</style>

<template>
  <el-row :gutter="16">
    <el-col :span="6">
      <div class="statistic-card">
        <el-statistic :value="myTodayTasksValue" @click="navigateTo('/current-tasks')">
          <template #title>
            <div style="display: inline-flex; align-items: center">
              我的今日任务
              <el-tooltip
                  effect="dark"
                  content="今日任务数量"
                  placement="top"
              >
                <el-icon style="margin-left: 4px" :size="12">
                  <Warning />
                </el-icon>
              </el-tooltip>
            </div>
          </template>
        </el-statistic>
        <div class="statistic-footer">
          <div class="footer-item">
            <span>相比昨天</span>
            <span :class="todayTaskChange >= 0 ? 'green' : 'red'">
              {{ todayTaskChange }}%
              <el-icon>
                <component :is="todayTaskChange >= 0 ? CaretTop : CaretBottom" />
              </el-icon>
            </span>
          </div>
          <div class="footer-item">
            <el-icon :size="14">
              <ArrowRight />
            </el-icon>
          </div>
        </div>
      </div>
    </el-col>
    <el-col :span="6">
      <div class="statistic-card">
        <el-statistic :value="myFutureTasksValue" @click="navigateTo('/future-tasks')">
          <template #title>
            <div style="display: inline-flex; align-items: center">
              我的未来任务
              <el-tooltip
                  effect="dark"
                  content="未来任务数量"
                  placement="top"
              >
                <el-icon style="margin-left: 4px" :size="12">
                  <Warning />
                </el-icon>
              </el-tooltip>
            </div>
          </template>
        </el-statistic>
        <div class="statistic-footer">
          <div class="footer-item">
            <span>相比昨天</span>
            <span :class="futureTaskChange >= 0 ? 'green' : 'red'">
              {{ futureTaskChange }}%
              <el-icon>
                <component :is="futureTaskChange >= 0 ? CaretTop : CaretBottom" />
              </el-icon>
            </span>
          </div>
          <div class="footer-item">
            <el-icon :size="14">
              <ArrowRight />
            </el-icon>
          </div>
        </div>
      </div>
    </el-col>
    <el-col :span="6">
      <div class="statistic-card">
        <el-statistic :value="myhistoricalTasksValue" title="New transactions today" @click="navigateTo('/history-tasks')">
          <template #title>
            <div style="display: inline-flex; align-items: center">
              我的历史任务
            </div>
          </template>
        </el-statistic>
        <div class="statistic-footer">
          <div class="footer-item">
            <span>相比昨天</span>
            <span :class="historicalTaskChange >= 0 ? 'green' : 'red'">
              {{ historicalTaskChange }}%
            <el-icon>
              <component :is="historicalTaskChange >= 0 ? CaretTop : CaretBottom" />
            </el-icon>
            </span>
          </div>
          <div class="footer-item">
            <el-icon :size="14">
              <ArrowRight />
            </el-icon>
          </div>
        </div>
      </div>
    </el-col>
    <el-col :span="6">
      <div class="statistic-card">
        <el-statistic :value="myOverdueTasksValue" title="New transactions today" @click="navigateTo('/overdue-tasks')">
          <template #title>
            <div style="display: inline-flex; align-items: center">
              我的逾期任务
            </div>
          </template>
        </el-statistic>
        <div class="statistic-footer">
          <div class="footer-item">
            <span>相比昨天</span>
            <span :class="overdueTaskChange >= 0 ? 'green' : 'red'">
              {{ overdueTaskChange }}%
              <el-icon>
                <component :is="overdueTaskChange >= 0 ? CaretTop : CaretBottom" />
              </el-icon>
            </span>
          </div>
          <div class="footer-item">
            <el-icon :size="14">
              <ArrowRight />
            </el-icon>
          </div>
        </div>
      </div>
    </el-col>
  </el-row>
</template>

<script lang="ts" setup>
  import {
    ArrowRight,
    CaretBottom,
    CaretTop,
    Warning,
  } from '@element-plus/icons-vue'
  import { useTransition } from '@vueuse/core'
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { fetchTaskStatistics } from '@/services/taskStats'
  import { useStore } from 'vuex'
  import { onMounted } from 'vue'

  // task numbers
  const todayTaskSource = ref(0)
  const futureTaskSource = ref(0)
  const historicalTaskSource = ref(0)
  const overdueTaskSource = ref(0)

  // task percentage changes
  const todayTaskChange = ref(0)
  const futureTaskChange = ref(0)
  const historicalTaskChange = ref(0)
  const overdueTaskChange = ref(0)

  const store = useStore()
  const isLoading = ref(true)

  onMounted(async () => {
    const userId = store.getters.getUser.id
    try {
      const response = await fetchTaskStatistics(userId)
      console.log('Task Statistics:', response.data)

      if (response.data) {
        todayTaskSource.value = response.data.data.todayTasks.count
        futureTaskSource.value = response.data.data.futureTasks.count
        historicalTaskSource.value = response.data.data.historicalTasks.count
        overdueTaskSource.value = response.data.data.overdueTasks.count

        todayTaskChange.value = response.data.data.todayTasks.percentageChange
        futureTaskChange.value = response.data.data.futureTasks.percentageChange
        historicalTaskChange.value = response.data.data.historicalTasks.percentageChange
        overdueTaskChange.value = response.data.data.overdueTasks.percentageChange
      }
    } catch (error) {
      console.error('Error fetching task statistics:', error)
    } finally {
      isLoading.value = false
    }
  })

  const myFutureTasksValue = useTransition(futureTaskSource, {
    duration: 1200,
  })

  const myTodayTasksValue = useTransition(todayTaskSource, {
    duration: 900,
  })

  const myhistoricalTasksValue = useTransition(historicalTaskSource, {
    duration: 1000,
  })

  const myOverdueTasksValue = useTransition(overdueTaskSource, {
    duration: 900,
  })

  const router = useRouter()
  const navigateTo = (path: string) => {
    router.push(path)
  }
</script>

<style scoped>
:global(h2#card-usage ~ .example .example-showcase) {
  background-color: var(--el-fill-color) !important;
}

.el-statistic {
  --el-statistic-content-font-size: 28px;
}

.statistic-card {
  border: 1px solid #e0e0e0; /* Apply the border inside the card */
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1); /* Subtle shadow */
  height: 100%;
  padding: 20px;
  border-radius: 5px;
  background-color: var(--el-bg-color-overlay);
  cursor: pointer;
}

/* Hover effect for cards */
.statistic-card:hover {
  transform: scale(1.001); /* Slightly enlarge on hover */
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.15); /* Stronger shadow on hover */
}

.statistic-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-top: 16px;
}

.statistic-footer .footer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.statistic-footer .footer-item span:last-child {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
}

.green {
  color: var(--el-color-success);
}
.red {
  color: var(--el-color-error);
}
</style>

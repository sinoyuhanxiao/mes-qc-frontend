<template>
  <el-row :gutter="16">
    <el-col :span="6">
      <div class="statistic-card">
        <el-statistic :value="myTodayTasksValue">
          <template #title>
            <div style="display: inline-flex; align-items: center">
              我的今日任务
              <el-tooltip
                  effect="dark"
                  content="The number of tasks already scheduled for you today."
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
            <span>than yesterday</span>
            <span class="green">
              24%
              <el-icon>
                <CaretTop />
              </el-icon>
            </span>
          </div>
        </div>
      </div>
    </el-col>
    <el-col :span="6">
      <div class="statistic-card">
        <el-statistic :value="myFutureTasksValue">
          <template #title>
            <div style="display: inline-flex; align-items: center">
              我的未来任务
              <el-tooltip
                  effect="dark"
                  content="The number of tasks already scheduled for you in the future."
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
            <span>than yesterday</span>
            <span class="red">
              12%
              <el-icon>
                <CaretBottom />
              </el-icon>
            </span>
          </div>
        </div>
      </div>
    </el-col>
    <el-col :span="6">
      <div class="statistic-card">
        <el-statistic :value="myCompletedTasksValue" title="New transactions today">
          <template #title>
            <div style="display: inline-flex; align-items: center">
              我已完成的任务
            </div>
          </template>
        </el-statistic>
        <div class="statistic-footer">
          <div class="footer-item">
            <span>than yesterday</span>
            <span class="green">
              16%
              <el-icon>
                <CaretTop />
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
        <el-statistic :value="myOverdueTasksValue" title="New transactions today">
          <template #title>
            <div style="display: inline-flex; align-items: center">
              我的过期任务
            </div>
          </template>
        </el-statistic>
        <div class="statistic-footer">
          <div class="footer-item">
            <span>than yesterday</span>
            <span class="green">
              16%
              <el-icon>
                <CaretTop />
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

const source = ref(0)
const myFutureTasksValue = useTransition(source, {
  duration: 1200,
})
source.value = 3120

const source1 = ref(0)
const myTodayTasksValue = useTransition(source1, {
  duration: 900,
})
source1.value = 125

const source2 = ref(0)
const myCompletedTasksValue = useTransition(source2, {
  duration: 1000,
})
source2.value = 2180

const source3 = ref(0)
const myOverdueTasksValue = useTransition(source3, {
  duration: 900,
})
source3.value = 72

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

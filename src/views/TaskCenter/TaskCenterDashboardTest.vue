<template>
  <div class="w-full mx-auto">
    <div class="w-full">
      <AnalysisCard />
    </div>

    <div class="mt-6">
      <div class="flex flex-wrap">
        <div class="lg:flex-8 lg:max-w-2/3 w-full lg:mb-0 lg:pr-3.5 mb-6">
          <GradientLineChart />
        </div>
        <div class="lg:flex-4 lg:max-w-1/3 w-full lg:pl-3.5">
          <TotalBarChart />
        </div>
      </div>
    </div>

    <div class="mt-6">
      <div class="flex flex-wrap">
        <div class="lg:flex-8 lg:max-w-2/3 w-full lg:mb-0 lg:pr-3.5">
          <PageVisitTable />
        </div>
        <div class="lg:flex-4 lg:max-w-1/3 w-full lg:pl-3.5">
          <SocialTrafficTable />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import AnalysisCard from '@/components/task-center/dashboard/AnalysisCard.vue'
// Chart
import GradientLineChart from '@/components/task-center/dashboard/GradientLineChart.vue'
import TotalBarChart from '@/components/task-center/dashboard/TotalBarChart.vue'
// Table
import SocialTrafficTable from '@/components/task-center/dashboard/SocialTrafficTable.vue'
import PageVisitTable from '@/components/task-center/dashboard/PageVisitTable.vue'

export default defineComponent({
  name: 'DashBoard',
  components: {
    AnalysisCard,
    GradientLineChart,
    TotalBarChart,
    PageVisitTable,
    SocialTrafficTable,
  },
  setup() {
    return {}
  },
})
</script>

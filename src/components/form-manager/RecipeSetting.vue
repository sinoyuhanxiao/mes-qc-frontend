<script setup>
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'

// 模拟数据（后续可由 props 传入）
const controlLimits = reactive({
  alert_test_0: { upper_control_limit: 98.3, lower_control_limit: 23.7 },
  alert_test_1: { upper_control_limit: 76.5, lower_control_limit: 15.2 },
  alert_test_2: { upper_control_limit: 64.0, lower_control_limit: 12.8 },
  alert_test_3: { upper_control_limit: 88.9, lower_control_limit: 30.5 },
  alert_test_4: { upper_control_limit: 70.4, lower_control_limit: 18.6 },
  alert_test_5: { upper_control_limit: 92.1, lower_control_limit: 35.0 },
  alert_test_6: { upper_control_limit: 84.7, lower_control_limit: 28.4 },
  alert_test_7: { upper_control_limit: 79.2, lower_control_limit: 22.3 }
})

const saveSettings = () => {
  console.log('Saving control limits:', controlLimits)
  ElMessage.success('配方警戒值已保存！')
}
</script>

<template>
  <div class="setting-container">
    <h2 class="title">设置配方警戒值</h2>

    <el-card
        v-for="(item, key) in controlLimits"
        :key="key"
        class="limit-card"
    >
      <div class="row">
        <div class="key-name">{{ key }}</div>

        <div class="input-group">
          <div class="input-label">上线</div>
          <el-input-number
              v-model="item.upper_control_limit"
              :min="item.lower_control_limit"
              :step="0.1"
              controls-position="right"
              class="input"
              :precision="2"
              placeholder="上限"
          />
        </div>

        <div class="input-group">
          <div class="input-label">下线</div>
          <el-input-number
              v-model="item.lower_control_limit"
              :max="item.upper_control_limit"
              :step="0.1"
              controls-position="right"
              class="input"
              :precision="2"
              placeholder="下限"
          />
        </div>
      </div>
    </el-card>

    <div style="margin-top: 20px; text-align: center;">
      <el-button type="primary" @click="saveSettings">保存设置</el-button>
    </div>
  </div>
</template>

<style scoped>
.setting-container {
  padding: 20px;
}

.title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 15px;
}

.limit-card {
  margin-bottom: 10px;
  padding: 10px;
}

.row {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.key-name {
  width: 120px;
  font-weight: 500;
  font-size: 14px;
  padding-top: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.input-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 5px;
  margin-left:45px;
}

.input {
  width: 120px;
}

.limit-card:hover {
  border-color: var(--el-color-primary) !important;
  box-shadow: 0 12px 36px rgba(64, 158, 255, 0.5);
  transition: all 0.25s ease;
}

</style>

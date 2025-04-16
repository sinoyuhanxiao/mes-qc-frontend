<template>
  <div class="setting-container">
    <h2 class="title">设置配方警戒值</h2>

    <el-card
        v-for="(item, key) in controlLimits"
        :key="key"
        class="limit-card"
        @mouseenter="highlightField(item.label); logCardRight(item.label)"
        @mouseleave="removeHighlightField(item.label)"
    >
      <span class="border-anim top"></span>
      <span class="border-anim right"></span>
      <span class="border-anim bottom"></span>
      <span class="border-anim left"></span>
      <div class="row">
        <div class="key-name">{{ item.label }}</div>

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

<script setup>
import { nextTick, reactive, ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { windowMaskVisible } from '@/globals/mask'
import { leftHoverDotPoint, rightHoverDotPoint } from '@/globals/line'
import { fetchControlLimitsByTemplateId } from '@/services/recipeService'

const props = defineProps({
  qcFormTemplateId: {
    type: [String, Number],
    required: true
  }
})

watch(
    () => props.qcFormTemplateId,
    async (newId) => {
      console.log('[RecipeSetting] qcFormTemplateId changed →', newId)
      await fetchData(newId)
    },
    { immediate: true }
)
const controlLimits = reactive({})

const fetchData = async (templateId) => {
  try {

    // Clear old keys before loading new ones
    for (const key in controlLimits) {
      delete controlLimits[key];
    }

    const response = await fetchControlLimitsByTemplateId(templateId)
    const data = response.data?.data.control_limits
    if (data) {
      Object.keys(data).forEach(key => {
        controlLimits[key] = {
          upper_control_limit: data[key].upper_control_limit,
          lower_control_limit: data[key].lower_control_limit,
          label: data[key].label || 'No Label'
        }
      })
    }
  } catch (error) {
    console.error('Error fetching control limits:', error)
    ElMessage.error('获取配方警戒值失败')
  }
}

onMounted(() => {
  fetchData()
})

const saveSettings = () => {
  console.log('Saving control limits:', controlLimits)
  ElMessage.success('配方警戒值已保存！')
}

const highlightField = (key) => {
  const allFields = document.querySelectorAll('.field-wrapper');

  allFields.forEach(field => {
    const label = field.querySelector('.el-form-item__label')?.innerText?.trim();
    if (label === key) {
      console.log(`[HIGHLIGHT] match: ${label}`);
      field.classList.add('highlighted-field');

      const el = field.querySelector('.el-form-item');
      if (el) {
        const rect = el.getBoundingClientRect();
        const x = rect.left;
        const y = rect.top + rect.height / 2;
        rightHoverDotPoint.value = { x, y };
        console.log(`[右字段] ${key} 坐标为`, { x, y });
      }
    }
  });
};

const removeHighlightField = (key) => {
  const allFields = document.querySelectorAll('.field-wrapper');

  allFields.forEach(field => {
    const label = field.querySelector('.el-form-item__label')?.innerText?.trim();
    if (label === key) {
      field.classList.remove('highlighted-field');
    }
  });

  leftHoverDotPoint.value = null
  rightHoverDotPoint.value = null
};

const logCardRight = (key) => {
  nextTick(() => {
    const allCards = document.querySelectorAll('.limit-card')
    allCards.forEach(card => {
      const title = card.querySelector('.key-name')?.innerText?.trim()
      if (title === key) {
        const rect = card.getBoundingClientRect()
        console.log(`[坐标] 卡片 ${key} → right: ${rect.right}, topCenter: ${rect.top + rect.height / 2}`)
        const x = rect.right
        const y = rect.top + rect.height / 2

        leftHoverDotPoint.value = { x, y }
      }
    })
  })
}
</script>


<style scoped>
.setting-container {
  padding: 20px;
}

.title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 15px;
}

/* add special effect */
/*
.border-anim {
  position: absolute;
  border-radius: 100vmax;
  pointer-events: none;
  z-index: 10;
}

.top {
  top: 0;
  left: 0;
  width: 0;
  height: 3px;
  background: linear-gradient(
      90deg,
      transparent 50%,
      rgba(255, 49, 49, 0.5),
      rgb(255, 49, 49)
  );
  animation: animateTop 2s ease-in-out infinite;
}

.bottom {
  right: 0;
  bottom: 0;
  height: 3px;
  background: linear-gradient(
      90deg,
      rgb(57, 255, 20),
      rgba(57, 255, 20, 0.5),
      transparent 50%
  );
  animation: animateBottom 2s ease-in-out infinite;
}

.right {
  top: 0;
  right: 0;
  width: 3px;
  height: 0;
  background: linear-gradient(
      180deg,
      transparent 30%,
      rgba(0, 255, 255, 0.5),
      rgb(0, 255, 255)
  );
  animation: animateRight 2s ease-in-out infinite;
}

.left {
  left: 0;
  bottom: 0;
  width: 3px;
  height: 0;
  background: linear-gradient(
      180deg,
      rgb(255, 255, 113),
      rgba(255, 255, 113, 0.5),
      transparent 70%
  );
  animation: animateLeft 2s ease-in-out infinite;
}

@keyframes animateTop {
  25% {
    width: 100%;
    opacity: 1;
  }
  30%, 100% {
    opacity: 0;
  }
}

@keyframes animateBottom {
  0%, 50% {
    opacity: 0;
    width: 0;
  }
  75% {
    opacity: 1;
    width: 100%;
  }
  76%, 100% {
    opacity: 0;
  }
}

@keyframes animateRight {
  0%, 25% {
    opacity: 0;
    height: 0;
  }
  50% {
    opacity: 1;
    height: 100%;
  }
  55%, 100% {
    height: 100%;
    opacity: 0;
  }
}

@keyframes animateLeft {
  0%, 75% {
    opacity: 0;
    bottom: 0;
    height: 0;
  }
  100% {
    opacity: 1;
    height: 100%;
  }
}

*/

/*
.limit-card {
  position: relative;
  overflow: hidden;
}
*/

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

:global(.highlighted-field .el-form-item) {
  border: 1px solid var(--el-color-primary);
  box-shadow: 0 6px 12px rgba(64, 158, 255, 0.4);
  z-index: 1000;
  border-radius: 6px;
  transition: all 0.2s ease;
}

:global(.highlighted-field .el-form-item__label) {
  background-color: white;
}
</style>

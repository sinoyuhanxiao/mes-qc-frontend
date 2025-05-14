<template>
  <el-dialog
      v-model="visible"
      title="请输入密码"
      width="30%"
      :before-close="handleClose"
  >
    <el-input
        v-model="passwordInput"
        placeholder="请输入密码"
        show-password
        type="password"
        @keyup.enter="verify"
    />
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="verify">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  modelValue: Boolean,
  correctPassword: {
    type: String,
    default: 'Sv@18388'
  }
});

const emit = defineEmits(['update:modelValue', 'verified']);
const passwordInput = ref('');
const visible = ref(props.modelValue);

watch(() => props.modelValue, val => {
  visible.value = val;
});
watch(visible, val => {
  emit('update:modelValue', val);
  if (!val) passwordInput.value = '';
});

const verify = () => {
  if (passwordInput.value === props.correctPassword) {
    emit('verified');
    visible.value = false;
  } else {
    ElMessage.error('密码错误，请重试');
  }
};

const handleClose = () => {
  visible.value = false;
};
</script>

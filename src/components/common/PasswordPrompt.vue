<template>
  <el-dialog
      v-model="visible"
      title="请输入本账号密码"
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
  import { validateUser } from '@/services/userService';

  const props = defineProps({
    modelValue: Boolean
  });

  const emit = defineEmits(['update:modelValue', 'verified']);
  const passwordInput = ref('');
  const visible = ref(props.modelValue);

  // Watch for v-model updates
  watch(() => props.modelValue, val => {
    visible.value = val;
  });
  watch(visible, val => {
    emit('update:modelValue', val);
    if (!val) passwordInput.value = '';
  });

  // Get username from localStorage
  const username = JSON.parse(localStorage.getItem('current_user'))?.username || '';

  // Verify with backend
  const verify = async () => {
    if (!username) {
      ElMessage.error('无法获取当前登录用户');
      return;
    }

    try {
      const encodedPassword = btoa(passwordInput.value);
      const res = await validateUser(username, encodedPassword);
      if (Number(res.data.status) === 200) {
        emit('verified');
        visible.value = false;
      } else {
        ElMessage.error('密码错误，请重试');
      }
    } catch (err) {
      console.error('验证失败', err);
      ElMessage.error('服务器错误，请稍后重试');
    }
  };

  const handleClose = () => {
    visible.value = false;
  };
</script>


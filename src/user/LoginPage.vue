<template>
  <div class="login-container">
    <div class="login-box">
      <h2 class="login-title">FPS质量管理系统</h2>
      <el-form :model="form" :rules="rules" ref="loginForm" class="login-form" @keydown.enter="handleLogin">
        <!-- Username Input -->
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名">
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- Password Input -->
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" show-password>
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- Remember Me Checkbox -->
        <el-form-item>
          <el-checkbox v-model="form.rememberMe">记住我</el-checkbox>
        </el-form-item>

        <!-- Login Button -->
        <el-form-item>
          <el-button type="primary" class="login-button" @click="handleLogin" :loading="loading">登录</el-button>
        </el-form-item>

        <!-- Error Message Display -->
        <el-alert v-if="errorMessage" type="error" :title="errorMessage" show-icon />
      </el-form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { User, Lock } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { mapActions } from 'vuex';

export default {
  name: 'LoginPage',
  components: {
    User,
    Lock,
  },
  data() {
    return {
      form: {
        username: '',
        password: '',
        rememberMe: false,
      },
      rules: {
        username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
      },
      errorMessage: '', // To store any error messages
      loading: false,   // To track loading state
    };
  },
  methods: {
    ...mapActions(['loginUser']), // Map the loginUser action from Vuex

    async handleLogin() {
      this.errorMessage = '';

      // Validate form before sending the request
      this.$refs.loginForm.validate(async (valid) => {
        if (!valid) {
          return;
        }

        this.loading = true;
        try {
          // Step 1: Validate the user credentials
          const validateResponse = await axios.post('http://10.10.12.68:8086/user/validate', null, {
            params: {
              username: this.form.username,
              password: btoa(this.form.password), // Encoding the password
            },
          });

          // Check if the response indicates success
          if (validateResponse.data.status === '200') {
            // Step 2: Fetch complete user information
            const userInfoResponse = await axios.get('http://10.10.12.68:8086/user/info', {
              params: {username: this.form.username},
            });

            if (userInfoResponse.data.status === '200') {
              // Store user data in Vuex
              this.loginUser({
                id: userInfoResponse.data.data.id,
                username: userInfoResponse.data.data.username,
                role: userInfoResponse.data.data.role_id,
              });

              ElMessage.success('登录成功！');
              // Redirect to the dashboard or home page
              if (userInfoResponse.data.data.role_id === 1) {
                this.$router.push('/user-management');
              } else if (userInfoResponse.data.data.role_id === 2) {
                this.$router.push('/my-tasks');
              }
            } else {
              this.errorMessage = '获取用户信息失败，请稍后重试';
            }
          } else {
            this.errorMessage = '用户名或密码错误';
          }
        } catch (error) {
          // Handle any errors during the request
          this.errorMessage = error.response?.data?.message || '登录时发生错误，请稍后重试';
        } finally {
          this.loading = false;
        }
      });
    },
  },
};
</script>

<style scoped>
.login-container {
  height: 100vh;
  background: url('@/assets/FPS_background.jpg') no-repeat center center fixed;
  background-size: cover;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-box {
  width: 350px;
  padding: 30px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.login-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
}

.login-button {
  width: 100%;
  font-size: 18px;
}
</style>

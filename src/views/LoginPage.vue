<template>
  <div class="page-container">
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

          <el-form-item prop="captcha" class="captcha-container">
            <el-input
                v-model="form.userInputIdentifyCodes"
                type="text"
                placeholder="验证码"
            >
              <template #prefix>
                <el-icon><Checked /></el-icon>
              </template>
            </el-input>
            <el-tooltip content="刷新验证码" placement="bottom">
              <SIdentify
                  style="margin-top: 4px; cursor: pointer;"
                  :identifyCode="identifyCode"
                  @click.native="refreshIdentifyCode"
              />
            </el-tooltip>
          </el-form-item>

          <!-- Hidden div for test automation -->
          <div id="captcha-value" style="display: none;">{{ identifyCode }}</div>

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
    <div class="copyright">
      © 2024-2025 FPS. Quality Control for MES. All rights reserved.
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import {User, Lock, Checked} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { mapActions } from 'vuex';
import { validateUser, fetchUserInfo } from '@/services/userService.js';
import api from '@/services/api.js';
import SIdentify from "@/components/user/SIdentify.vue";

export default {
  name: 'LoginPage',
  components: {
    SIdentify,
    Checked,
    User,
    Lock,
  },
  data() {
    return {
      form: {
        username: '',
        password: '',
        userInputIdentifyCodes: '',
        rememberMe: false,
      },
      rules: {
        username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
      },
      errorMessage: '', // To store any error messages
      loading: false,   // To track loading state
      identifyCode: "", //密码登录图形验证码
      identifyCodes: "1234567890abcdefghizklmnopqrstuvwxyz", //生成图形验证码的依据
      userInput: "" // For storing the user's input's identify code
    };
  },
  mounted() {
    // 初始化验证码
    this.identifyCode = "";
    this.makeIdentifyCode(4);
  },
  methods: {
    ...mapActions(['loginUser']), // Map the loginUser action from Vuex

    // 刷新验证码
    refreshIdentifyCode() {
      this.identifyCode = "";
      this.makeIdentifyCode(4);
    },
    // 生成4位数的随机验证码
    makeIdentifyCode(l) {
      for (let i = 0; i < l; i++) {
        this.identifyCode +=
            this.identifyCodes[this.randomNum(0, this.identifyCodes.length)];
      }
    },
    submitCode() {
      if (this.userInput === this.identifyCode) {
        this.message = "验证成功！"; // Success message
      } else {
        this.message = "验证码错误！"; // Error message
      }
    },
    // 生成单个验证码
    randomNum(min, max) {
      return Math.floor(Math.random() * (max - min) + min);
    },

    async handleLogin() {
      this.errorMessage = '';

      // Validate form before sending the request
      this.$refs.loginForm.validate(async (valid) => {
        if (!valid) {
          return;
        }

        // Check if the user input matches the captcha
        if (this.form.userInputIdentifyCodes !== this.identifyCode) {
          this.errorMessage = '验证码错误，请重新输入';
          return;
        }

        this.loading = true;
        try {
          // Step 1: Validate the user credentials
          const validateResponse = await validateUser(
              this.form.username,
              btoa(this.form.password)
          );

          // Check if the response indicates success
          if (validateResponse.data.status === '200') {
            // Step 2: Fetch complete user information
            const userInfoResponse = await fetchUserInfo(this.form.username);

            if (userInfoResponse.data.status === '200') {
              // Store user data in Vuex
              await this.loginUser({
                id: userInfoResponse.data.data.id,
                username: userInfoResponse.data.data.username,
                role: userInfoResponse.data.data.role_id,
                name: userInfoResponse.data.data.name
              });

              ElMessage.success('登录成功！');
              // Redirect to the dashboard or home page
              if (userInfoResponse.data.data.role_id === 1) {
                this.$router.push('/user-management');
              } else if (userInfoResponse.data.data.role_id === 2) {
                this.$router.push('/');
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

  .page-container {
    background: url('@/assets/FPS_background.jpg') no-repeat center center fixed;
    background-size: cover;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100vh;
  }

  .copyright {
    text-align: center;
    font-size: 14px;
    color: #fff;
    margin-bottom: 10px;
  }

  .captcha-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .captcha-container .el-input {
    flex: 1; /* Allow the input to take available space */
    margin-right: 10px; /* Add spacing between the input and SIdentify */
  }
</style>

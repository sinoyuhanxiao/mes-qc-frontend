<template>
  <div>
    <SIdentify :identifyCode="identifyCode" >
    </SIdentify>
  </div>
  <div>
    <SIdentify :identifyCode="identifyCode" />
    <button @click="refreshIdentifyCode">刷新</button>
    <input v-model="userInput" type="text" placeholder="输入验证码" />
    <button @click="submitCode">提交</button>
    <p>{{ message }}</p>
  </div>
</template>

<script>
  import SIdentify from "@/components/user/SIdentify";

  export default {
    name: "IdentifyPage",
    components: { SIdentify },
    data(){
      return {
        identifyCode: "", //密码登录图形验证码
        identifyCodes: "1234567890abcdefghizklmnopqrstuvwxyz", //生成图形验证码的依据
        userInput: "", // For storing the user's input
        message: "",   // For displaying success or error messages
      }
    },
    methods:{
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
    },
    mounted() {
      // 初始化验证码
      this.identifyCode = "";
      this.makeIdentifyCode(4);
    },
  }
</script>

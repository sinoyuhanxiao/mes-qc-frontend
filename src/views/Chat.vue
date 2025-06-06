<template>
  <div class="chat-container">
    <div class="chat-main">
      <div class="chat-header">
        欢迎进入迪坡俘虏聊天室，{{ username }}
      </div>

      <div class="chat-messages" ref="messageBox">
        <div
            v-for="(msg, index) in messages"
            :key="index"
            :class="[
          msg.startsWith('📢') ? 'system' : (msg.startsWith(`${username}:`) ? 'mine' : 'other'),
          'chat-bubble'
        ]"
        >
          {{ msg }}
        </div>
      </div>

      <div class="chat-input">
        <input
            v-model="inputMessage"
            @keyup.enter="sendMessage"
            placeholder="请输入消息..."
        />
        <button @click="sendMessage">发送</button>
      </div>
    </div>

    <div class="user-list">
      <h3>在线人员</h3>
      <ul>
        <li v-for="(user, index) in onlineUsers" :key="index">{{ user }}</li>
      </ul>
    </div>
  </div>

</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

const username = prompt("请输入你的名字")
const inputMessage = ref('')
const messages = ref([])
const messageBox = ref(null)
const onlineUsers = ref([])

if (Notification.permission !== 'granted') {
  Notification.requestPermission()
}

let socket

function scrollToBottom() {
  nextTick(() => {
    if (messageBox.value) {
      messageBox.value.scrollTop = messageBox.value.scrollHeight
    }
  })
}

onMounted(() => {
  socket = new WebSocket("ws://10.10.11.52:8000/ws/chat")

  socket.onopen = () => {
    socket.send(username)
  }

  socket.onmessage = (event) => {
    if (event.data.startsWith("__USER_LIST__::")) {
      const jsonString = event.data.split("::")[1]
      onlineUsers.value = JSON.parse(jsonString)
    } else {
      messages.value.push(event.data)
      scrollToBottom()
    }

    if (
        !event.data.startsWith(`${username}:`) &&
        !event.data.startsWith('__USER_LIST__::')
    ) {
      new Notification("💬 新消息提醒", {
        body: event.data,
        icon: "https://cdn-icons-png.flaticon.com/512/4086/4086679.png"
      })
    }
  }
})

function sendMessage() {
  if (inputMessage.value.trim()) {
    socket.send(`${username}: ${inputMessage.value}`)
    inputMessage.value = ''
  }
}
</script>

<style scoped>
.chat-container {
  max-width: 600px;
  margin: 50px auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  height: 600px;
  background: #f9f9f9;
  overflow: hidden;
}

.chat-header {
  background-color: #409EFF;
  color: white;
  padding: 10px 20px;
  font-weight: bold;
  font-size: 16px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background-color: #fff;
  min-height: 0; /* 👈 防止 flex 塌陷导致滚动不生效 */
}

.chat-bubble {
  max-width: 70%;
  margin: 5px 0;
  padding: 8px 12px;
  border-radius: 10px;
  word-wrap: break-word;
}

.chat-bubble.mine {
  background-color: #daf1ff;
  align-self: flex-end;
  margin-left: auto;
  border-top-right-radius: 0;
}

.chat-bubble.other {
  background-color: #e4e4e4;
  align-self: flex-start;
  margin-right: auto;
  border-top-left-radius: 0;
}

.chat-input {
  display: flex;
  flex-shrink: 0;
  border-top: 1px solid #ccc;
  padding: 10px;
  background-color: #fafafa;
}

.chat-input input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
}

.chat-input button {
  margin-left: 10px;
  padding: 8px 16px;
  background-color: #409EFF;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.chat-bubble.system {
  background-color: #fff3cd;
  color: #856404;
  align-self: flex-end;
  font-style: italic;
  font-size: 13px;
  border-left: 3px solid #ffeeba;
}

.chat-container {
  display: flex;
  max-width: 1000px;
  margin: 50px auto;
  height: 600px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
  overflow: hidden;
}

.chat-main {
  flex: 3;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-list {
  flex: 1;
  height: 200px;
  background-color: #f2f2f2;
  padding: 10px;
  border-left: 1px solid #ccc;
  overflow-y: auto;
}

.user-list h3 {
  margin-top: 0;
  font-size: 16px;
  color: #333;
}

.user-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.user-list li {
  padding: 4px 0;
  font-size: 14px;
}

</style>

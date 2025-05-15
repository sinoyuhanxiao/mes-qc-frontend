<template>
  <div style="padding: 20px">
    <h2>WebSocket Test Client</h2>

    <div style="margin-bottom: 20px;">
      <el-input v-model="userId" placeholder="Enter User ID" style="width: 300px; margin-right: 10px" />
      <el-button type="primary" @click="connectSocket">Connect</el-button>
      <el-button type="danger" @click="disconnectSocket" :disabled="!connected">Disconnect</el-button>
    </div>

    <div style="margin-bottom: 20px;">
      <el-input v-model="messageContent" placeholder="Test message" style="width: 300px; margin-right: 10px" />
      <el-button type="success" @click="sendTest">Send Test Message</el-button>
    </div>

    <div>
      <h4>Broadcast Messages:</h4>
      <ul>
        <li v-for="(msg, idx) in broadcastMessages" :key="idx">{{ msg }}</li>
      </ul>

      <h4>Private Messages:</h4>
      <ul>
        <li v-for="(msg, idx) in privateMessages" :key="'p' + idx">{{ msg }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SockJS from 'sockjs-client/dist/sockjs'
import { Client } from '@stomp/stompjs'

const userId = ref('')
const messageContent = ref('')
const broadcastMessages = ref([])
const privateMessages = ref([])
const connected = ref(false)

let stompClient = null

const connectSocket = () => {
  if (!userId.value) return alert("User ID is required")

  stompClient = new Client({
    webSocketFactory: () => new SockJS("http://10.10.12.129:8095/ws"),
    reconnectDelay: 5000,
    debug: () => {},

    onConnect: () => {
      connected.value = true
      console.log("✅ WebSocket connected")

      stompClient.subscribe("/topic/workorders", (message) => {
        const payload = JSON.parse(message.body)
        broadcastMessages.value.push(JSON.stringify(payload))
      })

      stompClient.subscribe("/queue/workorders", (message) => {
        const payload = JSON.parse(message.body)
        privateMessages.value.push(JSON.stringify(payload))
      })

      stompClient.subscribe("/123/queue/steps", (message) => {
        const payload = JSON.parse(message.body)
        privateMessages.value.push("Steps: " + JSON.stringify(payload))
      })
    },

    onDisconnect: () => {
      connected.value = false
      console.log("🛑 WebSocket disconnected")
    },

    onStompError: (frame) => {
      console.error('STOMP error:', frame)
    }
  })

  stompClient.activate()
}

const sendTest = () => {
  if (stompClient && stompClient.connected) {
    const dto = {
      userId: userId.value,
      content: messageContent.value,
      timestamp: new Date().toISOString()
    }
    stompClient.publish({
      destination: "/app/workorder/test",
      body: JSON.stringify(dto)
    })
  }
}

const disconnectSocket = () => {
  if (stompClient) {
    stompClient.deactivate()
    connected.value = false
  }
}
</script>

<style scoped>
ul {
  padding-left: 20px;
  list-style-type: disc;
}
</style>

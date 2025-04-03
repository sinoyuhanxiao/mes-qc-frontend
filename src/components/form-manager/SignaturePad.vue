<!-- SignaturePadComponent.vue -->
<template>
  <div v-if="visible" class="overlay">
    <div class="popup">
      <div class="popup-header">
        <h2>签名</h2>
        <button class="close-btn" @click="closePopup">×</button>
      </div>
      <div class="popup-content">
        <VueSignaturePad
            ref="signaturePad"
            :options="signaturePadOptions"
            class="signature-pad"
        />
        <div class="buttons">
          <el-button type="primary" @click="saveSignature">提交</el-button>
          <el-button type="warning" @click="clearSignature">重置</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { VueSignaturePad } from 'vue-signature-pad';

const signaturePad = ref(null);
const props = defineProps({
  visible: Boolean
});

const emit = defineEmits(['close', 'save']);

const signaturePadOptions = {
  penColor: 'black',
  backgroundColor: 'white',
  minWidth: 1,
  maxWidth: 3,
};

const clearSignature = () => {
  signaturePad.value.clearSignature();
};

const saveSignature = () => {
  const result = signaturePad.value.saveSignature();
  const { isEmpty, data } = result;

  if (isEmpty) {
    alert('无法提供空白签名，你得签！');
    return;
  }

  // console log the signature data
  console.log(data);
  emit('save', data);
  closePopup();
};

const closePopup = () => {
  emit('close');
};
</script>

<style scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.popup {
  background: white;
  border-radius: 10px;
  padding: 20px;
  width: 700px;
  max-width: 90%;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.popup-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
}

.signature-pad {
  border: 1px solid #ccc;
  width: 600px;
  height: 300px;
  margin-bottom: 10px;
}

.buttons {
  display: flex;
  gap: 10px;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 40px;
  cursor: pointer;
  color: black;
}
</style>

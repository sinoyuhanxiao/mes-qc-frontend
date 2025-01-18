<template>
  <div id="app">
    <button @click="showGif" class="show-gif-button">Show GIF</button>

    <!-- GIF Overlay -->
    <div v-if="isGifVisible" class="gif-overlay">
      <img src="@/assets/qc_task_dispatched.gif" alt="Task Dispatched" class="gif-image" />
    </div>
  </div>
</template>

<script>
import soundEffect from '@/assets/sound_effect.mp3'; // Import your audio file

export default {
  data() {
    return {
      isGifVisible: false, // Control GIF visibility
    };
  },
  methods: {
    showGif() {
      this.isGifVisible = true;

      // Play the audio
      const audio = new Audio(soundEffect);
      audio.play();

      // Hide GIF after 3 seconds
      setTimeout(() => {
        this.isGifVisible = false;
      }, 3000);
    },
  },
};
</script>

<style scoped>
#app {
  text-align: center;
  margin-top: 50px;
}

.show-gif-button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
}

.gif-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent background */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* Ensure it overlays all other content */
}

.gif-image {
  max-width: 80%;
  max-height: 80%;
  border-radius: 10px;
}
</style>

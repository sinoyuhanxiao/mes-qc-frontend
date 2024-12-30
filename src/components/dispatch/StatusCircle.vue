<template>
  <span :class="['status-circle', active ? 'status-active' : 'status-inactive']"></span>
</template>

<script>
export default {
  props: {
    active: {
      type: Boolean,
      required: true,
    },
  },
};
</script>

<style scoped>
.status-circle {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}

.status-active {
  background-color: #28a745;
}

.status-inactive {
  background-color: #dc3545;
}
</style>

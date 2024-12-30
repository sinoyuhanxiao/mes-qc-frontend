<template>
  <span>{{ formattedTime }}</span>
</template>

<script>
import { formatDate } from "@/utils/dispatch-utils.js";

export default {
  props: {
    value: {
      type: String,
      required: false,
    },
  },
  computed: {
    formattedTime() {
      return formatDate(this.value);
    },
  },
};
</script>

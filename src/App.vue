<template>
  <div class="container">
    <!-- Conditionally render the navigation menu -->
    <NavigationMenu v-if="showNavBar" class="nav-menu" />
    <div :class="['content', { 'full-width': !showNavBar }]">
      <router-view></router-view>
    </div>
    <div class="floating-language-switch">
      <LanguageSwitch />
    </div>
  </div>
</template>

<script>
import NavigationMenu from '@/components/common/NavigationMenu.vue';
import LanguageSwitch from "@/components/lang/LanguageSwitch.vue";

export default {
  name: 'App',
  components: {
    LanguageSwitch,
    NavigationMenu,
  },
  computed: {
    // Determine if the navigation bar should be shown
    showNavBar() {
      return this.$route.name !== 'LoginPage';
    },
  },
};
</script>

<style lang="scss">
.container {
  display: flex;
  height: 100vh; /* Make the container take full height */
}

.nav-menu {
  width: 240px;       /* Set a fixed width for the navigation bar */
  background-color: #545c64;
}

.content {
  flex: 1;            /* Allow the content to take the remaining width */
  padding: 20px;
  overflow-y: auto;   /* Add scroll if content overflows */
}

/* Make content full width when the navigation bar is hidden */
.full-width {
  width: 100%;
  padding: 0;
}

.floating-language-switch {
  position: fixed;
  bottom: 20px; /* 距离底部 */
  right: 20px; /* 距离右侧 */
  z-index: 1000; /* 确保层级在最上方 */
}
</style>

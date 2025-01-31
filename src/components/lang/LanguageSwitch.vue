<template>
  <el-dropdown class="language-dropdown" @command="handleLanguageChanged">
    <span class="el-dropdown-link">
      {{ currentLanguageName }}
      <el-icon><arrow-down /></el-icon>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="en-US">English</el-dropdown-item>
        <el-dropdown-item command="zh-CN">中文</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { changeLocale } from '@/utils/i18n';

// Initialize current language from localStorage or default to English
const currentLanguage = ref(localStorage.getItem('app-language') || 'en');
const currentLanguageName = ref(currentLanguage.value === 'en' ? 'English' : '中文');

// Function to handle language change
const handleLanguageChanged = (lang: string) => {
  // Update the current language
  currentLanguage.value = lang;
  currentLanguageName.value = lang === 'en-US' ? 'English' : '中文';

  // Persist language selection in localStorage
  // localStorage.setItem('app-language', lang);

  // Change the i18n locale reactively
  changeLocale(lang);

  // Ensure reactivity for components dependent on language
  document.dispatchEvent(new Event('language-changed'));

  console.log(`Language switched to: ${lang}`);
};

</script>

<style scoped>
.language-dropdown {
  cursor: pointer;
  font-weight: bold;
}

.language-dropdown .el-dropdown-link {
  display: flex;
  align-items: center;
  gap: 4px;
}

.language-dropdown .el-dropdown-link .el-icon {
  font-size: 12px;
}
</style>


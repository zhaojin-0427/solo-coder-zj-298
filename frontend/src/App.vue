<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon :size="28" color="#a855f7"><Present /></el-icon>
        <span>首饰管家</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="transparent"
        text-color="#6b4c8a"
        active-text-color="#a855f7"
        class="menu"
      >
        <el-menu-item index="/jewelry">
          <el-icon><Present /></el-icon>
          <span>首饰档案</span>
        </el-menu-item>
        <el-menu-item index="/outfits">
          <el-icon><Handbag /></el-icon>
          <span>穿搭关联</span>
        </el-menu-item>
        <el-menu-item index="/maintenance">
          <el-icon><MagicStick /></el-icon>
          <span>养护记录</span>
        </el-menu-item>
        <el-menu-item index="/repair">
          <el-icon><Tools /></el-icon>
          <span>维修追踪</span>
        </el-menu-item>
        <el-menu-item index="/lending">
          <el-icon><Van /></el-icon>
          <span>借还管理</span>
        </el-menu-item>
        <el-menu-item index="/schedule">
          <el-icon><Calendar /></el-icon>
          <span>智能排程</span>
        </el-menu-item>
        <el-menu-item index="/stats">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据统计</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <span class="header-title">{{ currentTitle }}</span>
      </el-header>
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  Present,
  Handbag,
  MagicStick,
  Tools,
  DataAnalysis,
  Van,
  Calendar,
} from '@element-plus/icons-vue';

const route = useRoute();
const activeMenu = computed(() => route.path);
const currentTitle = computed(() => (route.meta.title as string) || '首饰管家');
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background: linear-gradient(180deg, #f3e8ff 0%, #faf5ff 100%);
  border-right: 1px solid #e9d5ff;
  display: flex;
  flex-direction: column;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 24px 20px;
  font-size: 20px;
  font-weight: 700;
  color: #6b21a8;
  border-bottom: 1px solid #e9d5ff;
}

.menu {
  flex: 1;
  border-right: none;
  padding: 12px 0;
}

.menu :deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  border-radius: 8px;
  margin: 4px 12px;
}

.menu :deep(.el-menu-item:hover) {
  background-color: #e9d5ff;
}

.menu :deep(.el-menu-item.is-active) {
  background-color: #c084fc;
  color: #fff !important;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e9d5ff;
  display: flex;
  align-items: center;
  padding: 0 24px;
  height: 60px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #6b21a8;
}

.main-content {
  background: #faf5ff;
  padding: 0;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

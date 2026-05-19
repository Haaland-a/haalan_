<template>
  <div class="main-layout">
    <!-- Header -->
    <header class="layout-header">
      <div class="header-container">
        <div class="logo" @click="$router.push('/')">
          <h1>秒杀商城</h1>
        </div>
        
        <nav class="nav-menu">
          <router-link to="/" class="nav-item">首页</router-link>
          <router-link v-if="isLoggedIn" to="/orders" class="nav-item">我的订单</router-link>
          <router-link v-if="isLoggedIn" to="/seckill-orders" class="nav-item">秒杀订单</router-link>
          <router-link v-if="isLoggedIn" to="/user" class="nav-item">个人中心</router-link>
        </nav>
        
        <div class="user-actions">
          <template v-if="isLoggedIn">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-avatar :size="32" :src="userInfo?.avatar" />
                <span class="username">{{ userInfo?.username }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                  <el-dropdown-item command="orders">我的订单</el-dropdown-item>
                  <el-dropdown-item command="seckill-orders">秒杀订单</el-dropdown-item>
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button type="primary" @click="$router.push('/login')">登录</el-button>
            <el-button @click="$router.push('/register')">注册</el-button>
          </template>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="layout-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Footer -->
    <footer class="layout-footer">
      <div class="footer-container">
        <p>&copy; 2024 秒杀商城. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const isLoggedIn = computed(() => userStore.isLoggedIn)
const userInfo = computed(() => userStore.userInfo)

const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/user/profile')
      break
    case 'orders':
      router.push('/orders')
      break
    case 'seckill-orders':
      router.push('/seckill-orders')
      break
    case 'logout':
      handleLogout()
      break
  }
}

const handleLogout = async () => {
  try {
    await userStore.logout()
    ElMessage.success('退出成功')
    router.push('/login')
  } catch (error) {
    ElMessage.error('退出失败')
  }
}
</script>

<style lang="scss" scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
  
  .header-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .logo {
    cursor: pointer;
    
    h1 {
      font-size: 24px;
      color: $primary-color;
      margin: 0;
    }
  }
  
  .nav-menu {
    display: flex;
    gap: 30px;
    
    .nav-item {
      color: $text-primary;
      text-decoration: none;
      font-size: 16px;
      transition: color 0.3s;
      
      &:hover {
        color: $primary-color;
      }
      
      &.router-link-active {
        color: $primary-color;
      }
    }
  }
  
  .user-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      
      .username {
        font-size: 14px;
        color: $text-primary;
      }
    }
  }
}

.layout-main {
  flex: 1;
  background: $bg-secondary;
}

.layout-footer {
  background: #fff;
  padding: 20px 0;
  text-align: center;
  border-top: 1px solid $border-color;
  
  .footer-container {
    max-width: 1200px;
    margin: 0 auto;
    
    p {
      color: $text-secondary;
      font-size: 14px;
      margin: 0;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

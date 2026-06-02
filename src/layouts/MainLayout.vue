<template>
  <div class="main-layout">
    <!-- Header -->
    <header class="layout-header">
      <div class="header-container">
        <div class="logo" @click="$router.push('/')">
          <div class="logo-icon">闪</div>
          <h1>秒杀商城</h1>
        </div>

        <nav class="nav-menu">
          <router-link to="/" class="nav-item">首页</router-link>
          <router-link v-if="isLoggedIn" to="/orders" class="nav-item">我的订单</router-link>
          <router-link v-if="isLoggedIn" to="/seckill-orders" class="nav-item">秒杀订单</router-link>
          <router-link v-if="isLoggedIn" to="/user" class="nav-item">个人中心</router-link>
        </nav>

        <div class="header-right">
          <!-- 搜索框 -->
          <div class="search-box">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索商品..."
              prefix-icon="Search"
              clearable
              size="default"
              @keyup.enter="handleSearch"
            >
              <template #append>
                <el-button :icon="Search" @click="handleSearch">搜索</el-button>
              </template>
            </el-input>
          </div>

          <div class="user-area">
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
              <el-button type="primary" size="small" @click="$router.push('/login')">登录</el-button>
              <el-button size="small" @click="$router.push('/register')">注册</el-button>
            </template>
          </div>
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const isLoggedIn = computed(() => userStore.isLoggedIn)
const userInfo = computed(() => userStore.userInfo)
const searchKeyword = ref('')

const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  router.push({
    path: '/product/search',
    query: { keyword: searchKeyword.value.trim() }
  })
}

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
  border-bottom: 1px solid $border-color-lighter;
  position: sticky;
  top: 0;
  z-index: 100;

  .header-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    user-select: none;

    .logo-icon {
      width: 32px;
      height: 32px;
      background: $primary-gradient;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 16px;
      font-weight: bold;
    }

    h1 {
      font-size: 20px;
      color: $text-primary;
      margin: 0;
      font-weight: 700;
      letter-spacing: -0.3px;
    }
  }

  .nav-menu {
    display: flex;
    gap: 2px;
    height: 100%;
    align-items: center;

    .nav-item {
      color: $text-regular;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      padding: 0 20px;
      height: 100%;
      display: flex;
      align-items: center;
      position: relative;
      transition: color 0.2s;

      &:hover {
        color: $primary-color;
      }

      &.router-link-active {
        color: $primary-color;
        font-weight: 600;

        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 20px;
          right: 20px;
          height: 2px;
          background: $primary-color;
          border-radius: 1px 1px 0 0;
        }
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;

    .search-box {
      .el-input {
        width: 220px;
        transition: width 0.3s;
      }

      :deep(.el-input__wrapper) {
        border-radius: 8px;
        background: $bg-secondary;
        box-shadow: none !important;
        border: 1px solid transparent;
        transition: all 0.2s;

        &:hover {
          background: $bg-tertiary;
          border-color: $border-color;
        }
      }

      :deep(.el-input__wrapper.is-focus) {
        border-color: $primary-color;
        background: #fff;
      }

      :deep(.el-input-group__append) {
        .el-button {
          border-radius: 0 8px 8px 0;
        }
      }
    }

    .user-area {
      display: flex;
      align-items: center;
      gap: 8px;

      .user-info {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        padding: 4px 12px 4px 4px;
        border-radius: 8px;
        transition: background 0.2s;

        &:hover {
          background: $bg-secondary;
        }

        .username {
          font-size: 14px;
          font-weight: 500;
          color: $text-primary;
          max-width: 80px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
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
  border-top: 1px solid $border-color-lighter;

  .footer-container {
    max-width: 1200px;
    margin: 0 auto;

    p {
      color: $text-secondary;
      font-size: 13px;
      margin: 0;
    }
  }
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

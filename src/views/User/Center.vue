<template>
  <div class="user-center-page">
    <el-row :gutter="20">
      <el-col :span="6">
        <div class="sidebar">
          <el-menu :default-active="$route.path" router>
            <el-menu-item index="/user/profile">个人信息</el-menu-item>
            <el-menu-item index="/user/addresses">地址管理</el-menu-item>
            <el-menu-item index="/user/records">秒杀记录</el-menu-item>
          </el-menu>
        </div>
      </el-col>
      <el-col :span="18">
        <div class="content">
          <router-view />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
// 用户中心布局
</script>

<style lang="scss" scoped>
.user-center-page {
  padding: 24px 20px;
  max-width: 1200px;
  margin: 0 auto;

  .sidebar {
    background: #fff;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: $shadow-sm;
    border: 1px solid $border-color-lighter;

    :deep(.el-menu) {
      border-right: none;
    }

    :deep(.el-menu-item) {
      height: 50px;
      line-height: 50px;
      font-size: 15px;
      color: $text-regular;
      position: relative;
      transition: all 0.2s;

      &:hover {
        background: $primary-light;
        color: $primary-color;
      }

      &.is-active {
        color: $primary-color;
        font-weight: 600;
        background: $primary-light;

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 20px;
          background: $primary-gradient;
          border-radius: 0 3px 3px 0;
        }
      }
    }
  }

  .content {
    background: #fff;
    border-radius: 10px;
    padding: 28px;
    min-height: 540px;
    box-shadow: $shadow-sm;
    border: 1px solid $border-color-lighter;
  }
}
</style>

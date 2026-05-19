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
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  
  .sidebar {
    background: #fff;
    border-radius: $radius-md;
  }
  
  .content {
    background: #fff;
    border-radius: $radius-md;
    padding: 24px;
    min-height: 500px;
  }
}
</style>

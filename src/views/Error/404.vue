<template>
  <div class="not-found-page">
    <div class="content">
      <h1 class="error-code">404</h1>
      <p class="error-message">页面不存在</p>
      <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 404页面
</script>

<style lang="scss" scoped>
.not-found-page {
  min-height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-secondary;
  
  .content {
    text-align: center;
    
    .error-code {
      font-size: 120px;
      color: $primary-color;
      margin-bottom: 20px;
    }
    
    .error-message {
      font-size: 24px;
      color: $text-secondary;
      margin-bottom: 30px;
    }
  }
}
</style>

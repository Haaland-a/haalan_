# 项目启动指南

## 快速开始

### 1. 安装依赖

```bash
npm install
```

如果遇到依赖冲突，可以尝试:

```bash
npm install --legacy-peer-deps
```

### 2. 配置后端API地址

修改 `.env.development` 文件中的 `VITE_API_BASE_URL`:

```
VITE_API_BASE_URL=http://localhost:8080/api
```

或者在 `vite.config.js` 中修改代理配置:

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',  // 修改为你的后端地址
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '/api')
    }
  }
}
```

### 3. 启动开发服务器

```bash
npm run dev
```

浏览器会自动打开 http://localhost:3000

### 4. 登录系统

使用你的后端账号密码登录。如果没有账号，需要先注册。

## 常见问题

### Q1: 启动时报错 "Cannot find module"

**解决方案**: 删除 `node_modules` 和 `package-lock.json`，重新安装依赖

```bash
rm -rf node_modules package-lock.json
npm install
```

### Q2: TypeScript报错

**解决方案**: 确保已安装所有类型定义

```bash
npm install --save-dev typescript @types/node
```

### Q3: Element Plus样式不生效

**解决方案**: 检查 `main.ts` 中是否正确引入

```typescript
import 'element-plus/dist/index.css'
```

### Q4: 路由跳转404

**解决方案**: 检查后端是否配置了SPA fallback，或在开发环境中使用history模式

### Q5: API请求失败

**解决方案**: 
1. 检查后端服务是否启动
2. 检查API地址配置是否正确
3. 检查浏览器控制台的网络请求
4. 确认Token是否正确携带

## 开发建议

### 1. 代码规范

- 使用TypeScript严格模式
- 组件使用 `<script setup>` 语法
- 遵循Vue3 Composition API最佳实践
- 变量和函数使用camelCase命名
- 组件文件使用PascalCase命名

### 2. 状态管理

- 全局状态使用Pinia
- 局部状态使用ref/reactive
- 避免在组件间直接传递复杂对象

### 3. 性能优化

- 使用懒加载路由
- 大列表使用虚拟滚动
- 图片使用懒加载
- 合理使用computed缓存

### 4. 安全注意事项

- 不要在客户端存储敏感信息
- 密码等敏感数据必须加密传输
- 使用HTTPS协议
- 防范XSS和CSRF攻击

## 目录说明

```
src/
├── api/              # API接口层，统一管理所有后端接口
├── assets/           # 静态资源（图片、字体等）
├── components/       # 可复用的公共组件
├── layouts/          # 页面布局组件
├── router/           # 路由配置和守卫
├── stores/           # Pinia状态管理
├── styles/           # 全局样式和SCSS变量
├── types/            # TypeScript类型定义
├── utils/            # 工具函数（请求、加密等）
└── views/            # 页面级组件
```

## 技术要点

### 1. 请求拦截器

在 `src/utils/request.ts` 中实现了:
- Token自动携带
- 请求/响应错误统一处理
- 401自动跳转登录
- 敏感数据加密

### 2. 路由守卫

在 `src/router/index.ts` 中实现了:
- 登录状态检查
- 动态设置页面标题
- 进度条显示
- 重定向处理

### 3. 用户状态管理

在 `src/stores/user.ts` 中实现了:
- Token持久化
- 用户信息管理
- 登录/登出逻辑
- Token刷新机制

### 4. 数据加密

在 `src/utils/encrypt.ts` 中提供了:
- AES加密/解密
- MD5/SHA256哈希
- Base64编解码
- 设备ID生成

## 下一步

项目基础框架已完成，接下来可以:

1. ✅ 完善活动详情页
2. ✅ 实现商品秒杀流程
3. ✅ 完善订单管理
4. ✅ 实现支付功能
5. ✅ 添加用户地址管理
6. ✅ 优化移动端体验
7. ✅ 添加单元测试
8. ✅ 性能优化和监控

祝开发顺利！🚀

# 企业级秒杀商城前端项目

## 项目简介

基于 Vue3 + TypeScript + Vite + Element Plus 构建的企业级秒杀商城前端项目。

## 技术栈

- **框架**: Vue 3.5+
- **语言**: TypeScript 5.3+
- **构建工具**: Vite 5.4+
- **UI组件库**: Element Plus 2.5+
- **状态管理**: Pinia 2.1+
- **路由**: Vue Router 4.2+
- **HTTP客户端**: Axios 1.6+
- **样式**: SCSS
- **加密**: CryptoJS

## 项目结构

```
src/
├── api/              # API接口模块
│   ├── user.ts      # 用户相关接口
│   ├── product.ts   # 商品相关接口
│   ├── seckill.ts   # 秒杀相关接口
│   └── order.ts     # 订单相关接口
├── assets/          # 静态资源
├── components/      # 通用组件
├── layouts/         # 布局组件
│   └── MainLayout.vue
├── router/          # 路由配置
│   └── index.ts
├── stores/          # Pinia状态管理
│   └── user.ts
├── styles/          # 全局样式
│   ├── variables.scss
│   └── index.scss
├── types/           # TypeScript类型定义
│   └── index.ts
├── utils/           # 工具函数
│   ├── request.ts   # Axios封装
│   └── common.ts    # 通用工具
├── views/           # 页面组件
│   ├── Auth/        # 认证页面
│   │   ├── Login.vue
│   │   └── Register.vue
│   ├── Home/        # 首页
│   │   └── index.vue
│   ├── Seckill/     # 秒杀页面
│   │   └── Activity.vue
│   └── Error/       # 错误页面
│       └── 404.vue
├── App.vue          # 根组件
└── main.ts          # 入口文件
```

## 功能特性

### 已实现功能

1. ✅ 用户登录/注册（密码AES加密）
2. ✅ Token自动携带和刷新
3. ✅ 路由守卫和权限控制
4. ✅ 秒杀活动列表展示
5. ✅ 秒杀商品列表展示
6. ✅ Axios请求/响应拦截器
7. ✅ 统一错误处理
8. ✅ 响应式布局
9. ✅ 现代化UI设计

### 核心特性

- **密码加密**: 使用AES加密传输密码
- **Token管理**: 自动携带Token，401自动跳转登录
- **TypeScript**: 完整的类型定义
- **组件化**: 高度组件化开发
- **响应式**: 支持PC和移动端
- **性能优化**: 路由懒加载、代码分割

## 快速开始

### 环境要求

- Node.js >= 20.15.0
- npm >= 10.0.0

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 生产构建

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 配置说明

### 环境变量

`.env.development` - 开发环境配置
`.env.production` - 生产环境配置

主要配置项：
- `VITE_API_BASE_URL`: API基础路径
- `VITE_APP_TITLE`: 应用标题

### API代理

在 `vite.config.js` 中配置：

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true
    }
  }
}
```

## API接口

所有API接口已按照后端文档完整封装，位于 `src/api/` 目录：

- **用户接口**: 登录、注册、获取用户信息、地址管理等
- **商品接口**: 商品搜索、详情、库存查询
- **秒杀接口**: 活动列表、商品列表、秒杀执行、结果查询
- **订单接口**: 订单列表、详情、支付、取消等

## 注意事项

1. **密码加密**: 登录和注册时密码会自动使用AES加密
2. **Token管理**: Token存储在localStorage，自动携带到请求头
3. **路由守卫**: 需要登录的页面会自动重定向到登录页
4. **错误处理**: 统一的错误提示和401处理

## 浏览器支持

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88

## 开发规范

1. 使用 Composition API
2. 使用 TypeScript 类型定义
3. 组件命名使用 PascalCase
4. 文件命名使用 kebab-case
5. 所有import不要省略

## License

MIT

import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home/index.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'products',
        name: 'ProductList',
        component: () => import('@/views/Product/List.vue'),
        meta: { title: '全部商品' }
      },
      {
        path: 'product/:spuId',
        name: 'ProductDetail',
        component: () => import('@/views/Product/Detail.vue'),
        meta: { title: '商品详情' }
      },
      {
        path: 'product/search',
        name: 'ProductSearch',
        component: () => import('@/views/Product/List.vue'),
        meta: { title: '商品搜索' }
      },
      {
        path: 'cart',
        name: 'Cart',
        component: () => import('@/views/Cart/index.vue'),
        meta: { title: '购物车', requiresAuth: true }
      },
      {
        path: 'seckill/activity/:activityId',
        name: 'SeckillActivity',
        component: () => import('@/views/Seckill/Activity.vue'),
        meta: { title: '秒杀活动' }
      },
      {
        path: 'seckill/product/:seckillProductId',
        name: 'SeckillProductDetail',
        component: () => import('@/views/Seckill/ProductDetail.vue'),
        meta: { title: '秒杀商品详情' }
      },
      {
        path: 'seckill/execute',
        name: 'SeckillExecute',
        component: () => import('@/views/Seckill/Execute.vue'),
        meta: { title: '秒杀确认', requiresAuth: true }
      },
      {
        path: 'seckill/result/:requestId',
        name: 'SeckillResult',
        component: () => import('@/views/Seckill/Result.vue'),
        meta: { title: '秒杀结果', requiresAuth: true }
      },
      {
        path: 'orders',
        name: 'OrderList',
        component: () => import('@/views/Order/List.vue'),
        meta: { title: '订单列表', requiresAuth: true }
      },
      {
        path: 'seckill-orders',
        name: 'SeckillOrderList',
        component: () => import('@/views/Order/SeckillList.vue'),
        meta: { title: '秒杀订单', requiresAuth: true }
      },
      {
        path: 'order/detail/:orderNo',
        name: 'OrderDetail',
        component: () => import('@/views/Order/Detail.vue'),
        meta: { title: '订单详情', requiresAuth: true }
      },
      {
        path: 'order/create',
        name: 'OrderCreate',
        component: () => import('@/views/Order/Create.vue'),
        meta: { title: '确认订单', requiresAuth: true }
      },
      {
        path: 'seckill-order/detail/:orderNo',
        name: 'SeckillOrderDetail',
        component: () => import('@/views/Order/SeckillDetail.vue'),
        meta: { title: '秒杀订单详情', requiresAuth: true }
      },
      {
        path: 'payment',
        name: 'Payment',
        component: () => import('@/views/Payment/index.vue'),
        meta: { title: '支付', requiresAuth: true }
      },
      {
        path: 'user',
        name: 'UserCenter',
        component: () => import('@/views/User/Center.vue'),
        meta: { title: '用户中心', requiresAuth: true },
        children: [
          {
            path: '',
            redirect: '/user/profile'
          },
          {
            path: 'profile',
            name: 'UserProfile',
            component: () => import('@/views/User/Profile.vue'),
            meta: { title: '个人信息' }
          },
          {
            path: 'addresses',
            name: 'UserAddresses',
            component: () => import('@/views/User/Addresses.vue'),
            meta: { title: '地址管理' }
          },
          {
            path: 'records',
            name: 'UserRecords',
            component: () => import('@/views/User/Records.vue'),
            meta: { title: '秒杀记录' }
          }
        ]
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Auth/Login.vue'),
    meta: { title: '登录', requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Auth/Register.vue'),
    meta: { title: '注册', requiresGuest: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/Error/404.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title || '秒杀商城'} - 企业级秒杀商城`
  
  const userStore = useUserStore()
  
  // 需要登录的页面
  if (to.meta.requiresAuth) {
    if (!userStore.isLoggedIn) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
  }
  
  // 已登录用户不能访问登录和注册页面
  if (to.meta.requiresGuest && userStore.isLoggedIn) {
    next({ path: '/' })
    return
  }
  
  next()
})

export default router

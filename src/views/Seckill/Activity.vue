<template>
  <div class="activity-page">
    <div class="page-container">
      <!-- Activity Header -->
      <div class="activity-header" v-if="activityDetail">
        <h1 class="activity-title">{{ activityDetail.activityName }}</h1>
        <div class="activity-time">
          <span>开始时间: {{ activityDetail.startTime }}</span>
          <span>结束时间: {{ activityDetail.endTime }}</span>
        </div>
      </div>

      <!-- Products Grid -->
      <el-skeleton :rows="5" animated v-if="loading" />
      
      <div v-else-if="products.length > 0" class="products-grid">
        <div
          v-for="product in products"
          :key="product.productId"
          class="product-card"
          @click="goToProduct(product)"
        >
          <div class="product-image">
            <img :src="product.images[0]" :alt="product.name" />
          </div>
          <div class="product-info">
            <h3 class="product-name ellipsis-2">{{ product.name }}</h3>
            <div class="product-specs">
              <span v-for="(value, key) in product.specifications" :key="key">
                {{ value }}
              </span>
            </div>
            <div class="product-price">
              <span class="seckill-price">¥{{ formatPrice(product.seckillPrice) }}</span>
              <span class="original-price">¥{{ formatPrice(product.originalPrice) }}</span>
            </div>
            <div class="product-stock">
              <el-progress
                :percentage="getStockPercentage(product)"
                :color="customColors"
              />
              <span class="stock-text">已抢{{ product.soldCount }}件</span>
            </div>
            <el-button
              type="danger"
              class="buy-btn"
              :disabled="!product.userCanBuy || product.stock === '0'"
              @click.stop="handleBuy(product)"
            >
              {{ getButtonText(product) }}
            </el-button>
          </div>
        </div>
      </div>
      
      <el-empty v-else description="暂无商品" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getActivityProducts } from '@/api/seckill'
import type { SeckillActivityDetail, SeckillProduct } from '@/types'
import { formatPrice } from '@/utils/common'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const activityDetail = ref<SeckillActivityDetail | null>(null)
const products = ref<SeckillProduct[]>([])

const customColors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#6f7ad3', percentage: 100 }
]

const fetchProducts = async () => {
  const activityId = Number(route.params.activityId)
  if (!activityId) {
    ElMessage.error('活动ID无效')
    return
  }

  loading.value = true
  try {
    const res = await getActivityProducts(activityId)
    activityDetail.value = res.data
    products.value = res.data.products
  } catch (error: any) {
    ElMessage.error(error.message || '获取商品列表失败')
  } finally {
    loading.value = false
  }
}

const getStockPercentage = (product: SeckillProduct) => {
  const stock = Number(product.stock)
  const sold = Number(product.soldCount)
  const total = stock + sold
  return total > 0 ? Math.round((sold / total) * 100) : 0
}

const getButtonText = (product: SeckillProduct) => {
  if (!product.userCanBuy) return '已达限购'
  if (product.stock === '0') return '已抢光'
  return '立即抢购'
}

const goToProduct = (product: SeckillProduct) => {
  router.push({
    path: `/seckill/product/${product.productId}`,
    query: {
      activityId: activityDetail.value?.activityId
    }
  })
}

const handleBuy = (product: SeckillProduct) => {
  // 跳转到秒杀确认页面
  router.push({
    path: '/seckill/execute',
    query: {
      seckillProductId: product.productId,
      activityId: activityDetail.value?.activityId
    }
  })
}

onMounted(() => {
  fetchProducts()
})
</script>

<style lang="scss" scoped>
.activity-page {
  padding: 20px;
  min-height: calc(100vh - 60px);
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
}

.activity-header {
  background: #fff;
  border-radius: $radius-md;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: $shadow-sm;
  
  .activity-title {
    font-size: 28px;
    color: $text-primary;
    margin-bottom: 12px;
  }
  
  .activity-time {
    display: flex;
    gap: 30px;
    color: $text-secondary;
    font-size: 14px;
  }
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.product-card {
  background: #fff;
  border-radius: $radius-md;
  overflow: hidden;
  box-shadow: $shadow-sm;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: $shadow-md;
  }
  
  .product-image {
    width: 100%;
    height: 280px;
    overflow: hidden;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s;
    }
    
    &:hover img {
      transform: scale(1.05);
    }
  }
  
  .product-info {
    padding: 16px;
    
    .product-name {
      font-size: 16px;
      color: $text-primary;
      margin-bottom: 8px;
      height: 44px;
    }
    
    .product-specs {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      
      span {
        padding: 2px 8px;
        background: $bg-secondary;
        border-radius: $radius-sm;
        font-size: 12px;
        color: $text-secondary;
      }
    }
    
    .product-price {
      margin-bottom: 12px;
      
      .seckill-price {
        font-size: 24px;
        color: $primary-color;
        font-weight: bold;
        margin-right: 8px;
      }
      
      .original-price {
        font-size: 14px;
        color: $text-secondary;
        text-decoration: line-through;
      }
    }
    
    .product-stock {
      margin-bottom: 12px;
      
      .stock-text {
        display: block;
        text-align: right;
        font-size: 12px;
        color: $text-secondary;
        margin-top: 4px;
      }
    }
    
    .buy-btn {
      width: 100%;
    }
  }
}

@media (max-width: $breakpoint-md) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: $breakpoint-sm) {
  .products-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>

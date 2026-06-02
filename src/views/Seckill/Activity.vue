<template>
  <div class="activity-page">
    <div class="page-container">
      <!-- Activity Header -->
      <div class="activity-banner" v-if="activityDetail">
        <div class="banner-content">
          <h1 class="banner-title">{{ activityDetail.activityName }}</h1>
          <div class="banner-info">
            <div class="info-item">
              <span class="info-label">开始</span>
              <span class="info-value">{{ activityDetail.startTime }}</span>
            </div>
            <span class="info-divider">/</span>
            <div class="info-item">
              <span class="info-label">结束</span>
              <span class="info-value">{{ activityDetail.endTime }}</span>
            </div>
          </div>
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
          <div class="card-image">
            <span class="badge">秒杀</span>
            <img :src="product.images[0]" :alt="product.name" />
            <div class="card-overlay">
              <span>查看详情</span>
            </div>
          </div>
          <div class="card-body">
            <h3 class="card-name ellipsis-2">{{ product.name }}</h3>
            <div class="card-tags">
              <span v-for="(value, key) in product.specifications" :key="key">
                {{ value }}
              </span>
            </div>
            <div class="card-price">
              <div>
                <span class="price-current">¥{{ formatPrice(product.seckillPrice) }}</span>
                <span class="price-original">¥{{ formatPrice(product.originalPrice) }}</span>
              </div>
              <span class="price-off" v-if="product.originalPrice > 0">
                -{{ Math.round((1 - product.seckillPrice / product.originalPrice) * 100) }}%
              </span>
            </div>
            <div class="card-progress">
              <el-progress
                :percentage="getStockPercentage(product)"
                :stroke-width="6"
                :color="progressColors"
              />
              <span class="progress-text">已抢 {{ product.soldCount }} 件</span>
            </div>
            <button
              class="card-btn"
              :class="{ disabled: !product.userCanBuy || product.stock === '0' }"
              @click.stop="handleBuy(product)"
            >
              {{ getButtonText(product) }}
            </button>
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

const progressColors = [
  { color: '#4F46E5', percentage: 20 },
  { color: '#7C6DD6', percentage: 40 },
  { color: '#F59E0B', percentage: 60 },
  { color: '#EF4444', percentage: 100 }
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
    query: { activityId: activityDetail.value?.activityId }
  })
}

const handleBuy = (product: SeckillProduct) => {
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
  padding: 24px;
  min-height: calc(100vh - 64px);
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
}

// Banner
.activity-banner {
  background: $gradient-hero;
  border-radius: 14px;
  padding: 36px 32px;
  margin-bottom: 28px;
  color: #fff;

  .banner-title {
    font-size: 26px;
    font-weight: 700;
    margin-bottom: 14px;
  }

  .banner-info {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 14px;
    opacity: 0.9;

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .info-label {
        font-size: 12px;
        opacity: 0.7;
      }

      .info-value {
        font-weight: 500;
      }
    }

    .info-divider {
      opacity: 0.4;
      font-size: 20px;
      padding-bottom: 14px;
    }
  }
}

// Products grid
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.product-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid $border-color-lighter;
  box-shadow: $shadow-sm;

  &:hover {
    transform: translateY(-4px);
    box-shadow: $shadow-md;
    border-color: transparent;
  }

  .card-image {
    position: relative;
    height: 240px;
    overflow: hidden;

    .badge {
      position: absolute;
      top: 12px;
      left: 12px;
      background: linear-gradient(135deg, #4F46E5, #7C6DD6);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 4px;
      z-index: 2;
      letter-spacing: 1px;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s;
    }

    .card-overlay {
      position: absolute;
      inset: 0;
      background: rgba(30, 41, 59, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s;

      span {
        color: #fff;
        font-size: 13px;
        font-weight: 500;
        padding: 6px 20px;
        border: 2px solid rgba(255,255,255,0.8);
        border-radius: 20px;
        backdrop-filter: blur(4px);
      }
    }

    &:hover {
      img { transform: scale(1.06); }
      .card-overlay { opacity: 1; }
    }
  }

  .card-body {
    padding: 16px;

    .card-name {
      font-size: 15px;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 8px;
      line-height: 1.4;
      min-height: 42px;
    }

    .card-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 14px;

      span {
        padding: 2px 8px;
        background: $bg-tertiary;
        border-radius: 4px;
        font-size: 12px;
        color: $text-secondary;
      }
    }

    .card-price {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;

      .price-current {
        font-size: 22px;
        font-weight: 700;
        color: $primary-color;
        line-height: 1;
        margin-right: 8px;
      }

      .price-original {
        font-size: 13px;
        color: $text-placeholder;
        text-decoration: line-through;
      }

      .price-off {
        background: #FEF2F2;
        color: #EF4444;
        font-size: 11px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 4px;
      }
    }

    .card-progress {
      margin-bottom: 14px;

      .progress-text {
        display: block;
        text-align: right;
        font-size: 12px;
        color: $text-secondary;
        margin-top: 6px;
      }
    }

    .card-btn {
      width: 100%;
      height: 40px;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      color: #fff;
      background: $primary-gradient;
      cursor: pointer;
      transition: all 0.2s;
      letter-spacing: 0.5px;

      &:hover:not(.disabled) {
        box-shadow: $shadow-glow;
        transform: translateY(-1px);
      }

      &.disabled {
        background: $text-placeholder;
        cursor: not-allowed;
      }
    }
  }
}

@media (max-width: $breakpoint-md) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: $breakpoint-sm) {
  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>

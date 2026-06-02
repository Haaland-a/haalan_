<template>
  <div class="seckill-product-detail-page">
    <el-skeleton :rows="10" animated v-if="loading" />
    
    <div v-else-if="productDetail" class="detail-container">
      <!-- 面包屑导航 -->
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/seckill/activity/' + productDetail.activityId }">秒杀活动</el-breadcrumb-item>
        <el-breadcrumb-item>商品详情</el-breadcrumb-item>
      </el-breadcrumb>

      <div class="product-main">
        <!-- 商品图片 -->
        <div class="product-gallery">
          <el-image 
            :src="productDetail.productImages && productDetail.productImages.length > 0 ? productDetail.productImages[0] : ''" 
            fit="contain"
            class="main-image"
          >
            <template #error>
              <div class="image-slot">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
        </div>

        <!-- 商品信息 -->
        <div class="product-info">
          <h1 class="product-name">{{ productDetail.productName }}</h1>
          
          <!-- 价格信息 -->
          <div class="price-section">
            <div class="seckill-price">
              <span class="label">秒杀价</span>
              <span class="price">¥{{ productDetail.seckillPrice.toFixed(2) }}</span>
            </div>
            <div class="original-price">
              <span class="label">原价</span>
              <span class="price">¥{{ productDetail.originalPrice.toFixed(2) }}</span>
            </div>
            <div class="discount-tag" v-if="productDetail.originalPrice > 0">
              <el-tag type="danger" size="large">
                {{ calculateDiscount }}折
              </el-tag>
            </div>
          </div>

          <!-- 库存信息 -->
          <div class="stock-section">
            <div class="stock-info">
              <span class="label">剩余库存</span>
              <span class="value">{{ productDetail.stock }}</span>
            </div>
            <el-progress 
              :percentage="stockPercentage" 
              :color="stockColor"
              :stroke-width="8"
            />
          </div>

          <!-- 限购信息 -->
          <div class="limit-section" v-if="Number(productDetail.limitPerUser) > 0">
            <el-alert
              :title="`每人限购${productDetail.limitPerUser}件`"
              type="warning"
              :closable="false"
              show-icon
            />
          </div>

          <!-- 商品规格 -->
          <div class="specifications-section" v-if="productDetail.specifications && Object.keys(productDetail.specifications).length > 0">
            <h4 class="section-title">商品规格</h4>
            <div class="spec-list">
              <div v-for="(value, key) in productDetail.specifications" :key="key" class="spec-item">
                <span class="spec-label">{{ key }}:</span>
                <span class="spec-value">{{ value }}</span>
              </div>
            </div>
          </div>

          <!-- 活动时间 -->
          <div class="time-section">
            <div class="time-row">
              <span class="label">开始时间</span>
              <span class="value">{{ productDetail.startTime }}</span>
            </div>
            <div class="time-row">
              <span class="label">结束时间</span>
              <span class="value">{{ productDetail.endTime }}</span>
            </div>
            <div class="time-row">
              <span class="label">活动状态</span>
              <el-tag :type="getActivityStatusType(productDetail.status)">
                {{ statusName }}
              </el-tag>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <el-button 
              type="danger" 
              size="large"
              :disabled="!canSeckill"
              :loading="seckilling"
              @click="handleSeckill"
            >
              <span v-if="productDetail.status === 0">即将开始</span>
              <span v-else-if="productDetail.status === 1">立即抢购</span>
              <span v-else-if="productDetail.status === 2">已结束</span>
              <span v-else>不可抢购</span>
            </el-button>
          </div>

          <!-- 提示 -->
          <el-alert
            title="秒杀须知"
            type="info"
            :closable="false"
            class="mt-20"
          >
            <p>• 秒杀商品数量有限，售完即止</p>
            <p>• 请在活动时间内参与秒杀</p>
            <p>• 秒杀成功后需在30分钟内完成支付</p>
            <p>• 每人限购数量内可多次购买</p>
          </el-alert>
        </div>
      </div>

    </div>


    <el-empty v-else description="商品不存在" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { getSeckillProductDetail } from '@/api/seckill'
import type { SeckillProductDetail } from '@/types'

const router = useRouter()
const route = useRoute()

// 状态
const loading = ref(false)
const seckilling = ref(false)
const productDetail = ref<SeckillProductDetail | null>(null)

// 计算折扣
const calculateDiscount = computed(() => {
  if (!productDetail.value || productDetail.value.originalPrice === 0) return 0
  const discount = (productDetail.value.seckillPrice / productDetail.value.originalPrice) * 10
  return discount.toFixed(1)
})

// 计算库存百分比
const stockPercentage = computed(() => {
  if (!productDetail.value) return 0
  // 假设总库存为1000，实际应该从后端获取
  const totalStock = 1000
  return Math.min((productDetail.value.stock / totalStock) * 100, 100)
})

// 库存颜色
const stockColor = computed(() => {
  const percentage = stockPercentage.value
  if (percentage > 50) return '#67C23A'
  if (percentage > 20) return '#E6A23C'
  return '#F56C6C'
})

// 是否可以秒杀
const canSeckill = computed(() => {
  if (!productDetail.value) return false
  // 状态：0-未开始，1-进行中，2-已结束，3-已取消
  return productDetail.value.status === 1 && productDetail.value.stock > 0
})

// 获取活动状态类型
const getActivityStatusType = (status: number) => {
  const types: Record<number, any> = {
    0: 'info',
    1: 'success',
    2: '',
    3: 'danger'
  }
  return types[status] || ''
}

// 状态名称映射
const statusName = computed(() => {
  if (!productDetail.value) return ''
  const names: Record<number, string> = {
    0: '未开始',
    1: '进行中',
    2: '已结束',
    3: '已取消'
  }
  return names[productDetail.value.status] || ''
})

// 获取商品详情
const fetchDetail = async () => {
  const seckillProductId = Number(route.params.seckillProductId)
  const activityId = route.query.activityId ? Number(route.query.activityId) : undefined
  
  if (!seckillProductId) {
    ElMessage.error('商品ID无效')
    return
  }

  loading.value = true
  try {
    const res = await getSeckillProductDetail(seckillProductId, activityId)
    productDetail.value = res.data
  } catch (error: any) {
    ElMessage.error(error.message || '获取详情失败')
  } finally {
    loading.value = false
  }
}

// 执行秒杀
const handleSeckill = () => {
  if (!productDetail.value) return
  
  if (!canSeckill.value) {
    ElMessage.warning('当前无法参与秒杀')
    return
  }

  seckilling.value = true
  
  // 跳转到秒杀执行页面
  setTimeout(() => {
    router.push({
      path: '/seckill/execute',
      query: {
        seckillProductId: productDetail.value?.seckillProductId,
        activityId: productDetail.value?.activityId
      }
    })
    seckilling.value = false
  }, 500)
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped lang="scss">
.seckill-product-detail-page {
  padding: 20px;
  min-height: calc(100vh - 60px);
  
  .breadcrumb {
    max-width: 1200px;
    margin: 0 auto 20px;
  }

  .detail-container {
    max-width: 1200px;
    margin: 0 auto;
    background: #fff;
    border-radius: $radius-md;
    padding: 24px;
  }

  .product-main {
    display: grid;
    grid-template-columns: 500px 1fr;
    gap: 40px;
    margin-bottom: 40px;

    .product-gallery {
      .main-image {
        width: 100%;
        height: 500px;
        border-radius: 8px;

        .image-slot {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          background: $bg-color-light;
          color: $text-placeholder;
          font-size: 48px;
        }
      }
    }

    .product-info {
      .product-name {
        font-size: 24px;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: 24px;
      }

      .price-section {
        display: flex;
        align-items: center;
        gap: 24px;
        padding: 20px;
        background: linear-gradient(135deg, rgba($danger-color, 0.1) 0%, transparent 100%);
        border-radius: 8px;
        margin-bottom: 24px;

        .seckill-price {
          .label {
            display: block;
            font-size: 12px;
            color: $text-secondary;
            margin-bottom: 4px;
          }

          .price {
            font-size: 32px;
            font-weight: 700;
            color: $danger-color;
          }
        }

        .original-price {
          .label {
            display: block;
            font-size: 12px;
            color: $text-secondary;
            margin-bottom: 4px;
          }

          .price {
            font-size: 18px;
            color: $text-placeholder;
            text-decoration: line-through;
          }
        }
      }

      .stock-section {
        margin-bottom: 24px;

        .stock-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .label {
            font-size: 14px;
            color: $text-secondary;
          }

          .value {
            font-size: 18px;
            font-weight: 600;
            color: $danger-color;
          }
        }
      }

      .limit-section {
        margin-bottom: 24px;
      }

      .specifications-section {
        margin-bottom: 24px;

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: $text-primary;
          margin-bottom: 12px;
        }

        .spec-list {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;

          .spec-item {
            display: flex;
            align-items: center;
            padding: 8px 16px;
            background: $bg-color-light;
            border-radius: 4px;
            font-size: 14px;

            .spec-label {
              color: $text-secondary;
              margin-right: 8px;
            }

            .spec-value {
              color: $text-primary;
              font-weight: 500;
            }
          }
        }
      }

      .time-section {
        margin-bottom: 24px;

        .time-row {
          display: flex;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid $border-color-lighter;

          .label {
            width: 80px;
            font-size: 14px;
            color: $text-secondary;
          }

          .value {
            font-size: 14px;
            color: $text-primary;
          }
        }
      }

      .action-buttons {
        .el-button {
          width: 100%;
          height: 50px;
          font-size: 18px;
        }
      }

      .mt-20 {
        margin-top: 20px;
      }
    }
  }

  .product-description {
    padding-top: 24px;
    border-top: 1px solid $border-color-lighter;

    h4 {
      font-size: 18px;
      color: $text-primary;
      margin-bottom: 16px;
    }

    p {
      font-size: 14px;
      color: $text-regular;
      line-height: 1.8;
    }
  }
}

@media (max-width: 768px) {
  .seckill-product-detail-page {
    .product-main {
      grid-template-columns: 1fr;
    }
  }
}
</style>

<template>
  <div class="seckill-order-detail-page">
    <el-card v-loading="loading" shadow="never">
      <template #header>
        <div class="card-header">
          <span>秒杀订单详情</span>
          <el-button @click="goBack">返回</el-button>
        </div>
      </template>

      <div v-if="orderDetail" class="detail-content">
        <!-- 订单状态 -->
        <div class="status-section">
          <el-result
            :icon="getStatusIcon(orderDetail.status)"
            :title="orderDetail.statusName"
          >
            <template #sub-title>
              <p>订单号: {{ orderDetail.orderNo }}</p>
              <p v-if="orderDetail.payExpireTime">
                支付截止时间: {{ orderDetail.payExpireTime }}
              </p>
            </template>
          </el-result>
        </div>

        <!-- 商品信息 -->
        <div class="product-section" v-for="(item, index) in orderDetail.orderItems" :key="index">
          <h4>商品信息</h4>
          <div class="product-info">
            <el-image 
              :src="getProductImage(item.productImage)" 
              fit="cover"
              class="product-image"
            >
              <template #error>
                <div class="image-slot">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            <div class="info">
              <div class="product-name">{{ item.productName }}</div>
              <div class="product-meta">
                <span>数量: {{ item.quantity }}</span>
              </div>
              <!-- 商品规格 -->
              <div class="specifications" v-if="item.specifications && Object.keys(item.specifications).length > 0">
                <div v-for="(value, key) in item.specifications" :key="key" class="spec-item">
                  <span class="spec-label">{{ key }}:</span>
                  <span class="spec-value">{{ value }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 价格信息 -->
        <div class="price-section">
          <h4>价格信息</h4>
          <div class="price-row">
            <span>商品总额:</span>
            <span>¥{{ Number(orderDetail.totalAmount || 0).toFixed(2) }}</span>
          </div>
          <div class="price-row" v-if="orderDetail.discountAmount">
            <span>优惠金额:</span>
            <span class="discount">-¥{{ Number(orderDetail.discountAmount).toFixed(2) }}</span>
          </div>
          <div class="price-row total">
            <span>实付金额:</span>
            <span class="total-price">¥{{ Number(orderDetail.actualAmount || orderDetail.totalAmount || 0).toFixed(2) }}</span>
          </div>
        </div>

        <!-- 收货地址 -->
        <div class="address-section">
          <h4>收货地址</h4>
          <div class="address-info">
            <div class="address-row">
              <span class="label">收货人:</span>
              <span class="value">{{ orderDetail.addressInfo.receiverName }}</span>
            </div>
            <div class="address-row">
              <span class="label">联系电话:</span>
              <span class="value">{{ orderDetail.addressInfo.receiverPhone }}</span>
            </div>
            <div class="address-row">
              <span class="label">收货地址:</span>
              <span class="value">{{ orderDetail.addressInfo.fullAddress }} {{ orderDetail.addressInfo.detailAddress }}</span>
            </div>
          </div>
        </div>

        <!-- 订单信息 -->
        <div class="order-info-section">
          <h4>订单信息</h4>
          <div class="info-row">
            <span class="label">订单类型:</span>
            <span class="value">{{ orderDetail.orderTypeName }}</span>
          </div>
          <div class="info-row">
            <span class="label">下单时间:</span>
            <span class="value">{{ orderDetail.createTime }}</span>
          </div>
          <div class="info-row" v-if="orderDetail.payExpireTime">
            <span class="label">支付截止:</span>
            <span class="value">{{ orderDetail.payExpireTime }}</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons" v-if="orderDetail.status === 0">
          <el-button type="primary" size="large" @click="handlePay">
            立即支付
          </el-button>
          <el-button size="large" @click="handleCancel">
            取消订单
          </el-button>
        </div>
      </div>

      <el-empty v-else description="订单不存在" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { getSeckillOrderDetail, cancelSeckillOrder } from '@/api/seckill'
import type { SeckillOrderDetail } from '@/types'

const route = useRoute()
const router = useRouter()

// 状态
const loading = ref(false)
const orderDetail = ref<SeckillOrderDetail | null>(null)

// 获取订单状态图标
const getStatusIcon = (status: number) => {
  const icons: Record<number, string> = {
    0: 'warning',    // 待支付
    1: 'success',    // 已支付
    2: 'success',    // 已完成
    3: 'error',      // 已取消/已超时
    4: 'info'        // 已退款
  }
  return icons[status] || 'info'
}

// 解析商品图片（后端返回的是JSON字符串数组）
const getProductImage = (productImage: string) => {
  if (!productImage) return ''
  
  try {
    // 如果是JSON字符串数组，解析后取第一个
    if (productImage.startsWith('[')) {
      const images = JSON.parse(productImage)
      return Array.isArray(images) && images.length > 0 ? images[0] : ''
    }
    // 否则直接返回
    return productImage
  } catch (error) {
    console.error('解析图片失败:', error)
    return productImage
  }
}

// 获取订单详情
const fetchOrderDetail = async () => {
  const orderNo = route.params.orderNo as string
  
  if (!orderNo) {
    ElMessage.error('订单号无效')
    loading.value = false
    return
  }

  loading.value = true
  try {
    const res = await getSeckillOrderDetail(orderNo)
    orderDetail.value = res.data
  } catch (error: any) {
    console.error('获取订单详情失败:', error)
    ElMessage.error(error.message || '获取订单详情失败')
  } finally {
    loading.value = false
  }
}

// 去支付
const handlePay = () => {
  if (orderDetail.value?.orderNo) {
    router.push(`/payment?orderNo=${orderDetail.value.orderNo}`)
  }
}

// 取消订单
const handleCancel = async () => {
  if (!orderDetail.value?.orderNo) return
  
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await cancelSeckillOrder(orderDetail.value.orderNo, {
      cancelReason: '用户主动取消'
    })
    
    ElMessage.success('订单已取消')
    fetchOrderDetail()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('取消订单失败:', error)
      ElMessage.error(error.message || '取消订单失败')
    }
  }
}

// 返回
const goBack = () => {
  router.back()
}

onMounted(() => {
  fetchOrderDetail()
})
</script>

<style scoped lang="scss">
.seckill-order-detail-page {
  padding: 20px;
  min-height: calc(100vh - 60px);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .detail-content {
    max-width: 800px;
    margin: 0 auto;

    .status-section {
      margin-bottom: 32px;
    }

    .product-section,
    .price-section,
    .address-section,
    .order-info-section {
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid $border-color-lighter;

      h4 {
        font-size: 16px;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: 16px;
      }
    }

    .product-info {
      display: flex;
      gap: 16px;

      .product-image {
        width: 120px;
        height: 120px;
        border-radius: 8px;
        flex-shrink: 0;

        .image-slot {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          background: $bg-color-light;
          color: $text-placeholder;
          font-size: 32px;
        }
      }

      .info {
        flex: 1;

        .product-name {
          font-size: 16px;
          font-weight: 500;
          color: $text-primary;
          margin-bottom: 12px;
        }

        .product-meta {
          font-size: 14px;
          color: $text-secondary;
          margin-bottom: 12px;
        }

        .specifications {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;

          .spec-item {
            display: flex;
            align-items: center;
            padding: 4px 12px;
            background: $bg-color-light;
            border-radius: 4px;
            font-size: 13px;

            .spec-label {
              color: $text-secondary;
              margin-right: 4px;
            }

            .spec-value {
              color: $text-primary;
              font-weight: 500;
            }
          }
        }
      }
    }

    .price-section {
      .price-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        font-size: 14px;

        .discount {
          color: $success-color;
        }

        &.total {
          border-top: 1px dashed $border-color-light;
          padding-top: 16px;
          margin-top: 8px;

          .total-price {
            font-size: 24px;
            font-weight: 700;
            color: $danger-color;
          }
        }
      }
    }

    .address-section {
      .address-info {
        .address-row {
          display: flex;
          padding: 8px 0;
          font-size: 14px;

          .label {
            width: 100px;
            color: $text-secondary;
          }

          .value {
            flex: 1;
            color: $text-primary;
          }
        }
      }
    }

    .order-info-section {
      .info-row {
        display: flex;
        padding: 8px 0;
        font-size: 14px;

        .label {
          width: 100px;
          color: $text-secondary;
        }

        .value {
          flex: 1;
          color: $text-primary;
        }
      }
    }

    .action-buttons {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-top: 32px;

      .el-button {
        min-width: 150px;
      }
    }
  }
}
</style>

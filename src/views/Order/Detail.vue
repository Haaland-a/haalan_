<template>
  <div class="order-detail-page">
    <el-card v-loading="loading" shadow="never">
      <template #header>
        <div class="card-header">
          <span>订单详情</span>
          <el-button @click="goBack">返回</el-button>
        </div>
      </template>

      <div v-if="orderDetail" class="detail-content">
        <!-- 订单状态 -->
        <div class="status-section">
          <div class="status-icon">
            <el-icon :size="48" :color="getStatusColor(orderDetail.status)">
              <component :is="getStatusIcon(orderDetail.status)" />
            </el-icon>
          </div>
          <div class="status-info">
            <h3>{{ orderDetail.statusName }}</h3>
            <p v-if="orderDetail.status === 0">请尽快完成支付</p>
            <p v-else-if="orderDetail.status === 1">订单已支付成功</p>
            <p v-else-if="orderDetail.status === 2">订单已取消</p>
            <p v-else-if="orderDetail.status === 3">订单已完成</p>
          </div>
        </div>

        <!-- 订单信息 -->
        <el-descriptions title="订单信息" :column="2" border>
          <el-descriptions-item label="订单号">{{ orderDetail.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ orderDetail.createTime }}</el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ orderDetail.payChannelName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="支付时间">{{ orderDetail.payTime || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 收货地址 -->
        <el-descriptions title="收货信息" :column="2" border class="mt-20">
          <el-descriptions-item label="收货人">{{ orderDetail.receiverName }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ orderDetail.receiverPhone }}</el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="2">
            {{ orderDetail.receiverProvince }}{{ orderDetail.receiverCity }}{{ orderDetail.receiverDistrict }}{{ orderDetail.receiverAddress }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 商品列表 -->
        <div class="products-section mt-20">
          <h4>商品信息</h4>
          <div class="product-list">
            <div 
              v-for="(product, index) in orderDetail.products" 
              :key="index"
              class="product-item"
            >
              <el-image 
                :src="product.image" 
                fit="cover"
                class="product-image"
              >
                <template #error>
                  <div class="image-slot">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div class="product-info">
                <div class="product-name">{{ product.name }}</div>
                <div class="product-specs" v-if="product.specifications">
                  {{ formatSpecs(product.specifications) }}
                </div>
              </div>
              <div class="product-price">
                <div class="price">¥{{ product.price.toFixed(2) }}</div>
                <div class="quantity">x{{ product.quantity }}</div>
              </div>
              <div class="product-total">
                ¥{{ (product.price * product.quantity).toFixed(2) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 金额信息 -->
        <div class="amount-section mt-20">
          <div class="amount-row">
            <span>商品总额：</span>
            <span>¥{{ orderDetail.totalAmount.toFixed(2) }}</span>
          </div>
          <div class="amount-row">
            <span>运费：</span>
            <span>¥{{ (orderDetail.freightAmount || 0).toFixed(2) }}</span>
          </div>
          <div class="amount-row discount" v-if="orderDetail.discountAmount">
            <span>优惠：</span>
            <span>-¥{{ orderDetail.discountAmount.toFixed(2) }}</span>
          </div>
          <el-divider />
          <div class="amount-row total">
            <span>实付金额：</span>
            <span class="total-price">¥{{ orderDetail.payAmount.toFixed(2) }}</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons mt-20">
          <el-button 
            v-if="orderDetail.status === 0" 
            type="primary"
            size="large"
            @click="handlePay"
          >
            去支付
          </el-button>
          <el-button 
            v-if="orderDetail.status === 0" 
            size="large"
            @click="handleCancel"
          >
            取消订单
          </el-button>
          <el-button 
            v-if="orderDetail.status === 1" 
            type="danger"
            size="large"
            @click="handleRefund"
          >
            申请退款
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture, Clock, Check, Close } from '@element-plus/icons-vue'
import { getOrderDetail, cancelOrder } from '@/api/order'
import type { OrderDetail as OrderDetailType } from '@/types'

const route = useRoute()
const router = useRouter()

// 状态
const loading = ref(false)
const orderDetail = ref<OrderDetailType | null>(null)

// 获取订单详情
const fetchOrderDetail = async () => {
  const orderNo = route.params.orderNo as string
  if (!orderNo) {
    ElMessage.error('订单号不存在')
    return
  }

  loading.value = true
  try {
    const res = await getOrderDetail(orderNo)
    orderDetail.value = res.data
  } catch (error) {
    console.error('获取订单详情失败:', error)
  } finally {
    loading.value = false
  }
}

// 返回
const goBack = () => {
  router.back()
}

// 获取状态颜色
const getStatusColor = (status: number) => {
  const colors: Record<number, string> = {
    0: '#E6A23C',
    1: '#67C23A',
    2: '#909399',
    3: '#409EFF'
  }
  return colors[status] || '#909399'
}

// 获取状态图标
const getStatusIcon = (status: number) => {
  const icons: Record<number, any> = {
    0: Clock,
    1: Check,
    2: Close,
    3: Check
  }
  return icons[status] || Clock
}

// 格式化规格
const formatSpecs = (specs: Record<string, string>) => {
  return Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join(', ')
}

// 去支付
const handlePay = () => {
  if (orderDetail.value) {
    router.push(`/payment?orderNo=${orderDetail.value.orderNo}`)
  }
}

// 取消订单
const handleCancel = async () => {
  if (!orderDetail.value) return

  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await cancelOrder(orderDetail.value.orderNo, {
      reason: '用户主动取消'
    })
    ElMessage.success('订单已取消')
    fetchOrderDetail()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('取消订单失败:', error)
    }
  }
}

// 申请退款
const handleRefund = () => {
  ElMessage.info('退款功能开发中...')
  // TODO: 实现退款对话框
}

onMounted(() => {
  fetchOrderDetail()
})
</script>

<style scoped lang="scss">
.order-detail-page {
  max-width: 1200px;
  margin: 0 auto;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .detail-content {
    .status-section {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 32px;
      background: linear-gradient(135deg, rgba($primary-color, 0.05) 0%, transparent 100%);
      border-radius: 8px;
      margin-bottom: 24px;

      .status-info {
        h3 {
          font-size: 20px;
          color: $text-primary;
          margin: 0 0 8px 0;
        }

        p {
          font-size: 14px;
          color: $text-secondary;
          margin: 0;
        }
      }
    }

    .mt-20 {
      margin-top: 20px;
    }

    .products-section {
      h4 {
        font-size: 16px;
        color: $text-primary;
        margin-bottom: 16px;
      }

      .product-list {
        border: 1px solid $border-color-light;
        border-radius: 8px;
        overflow: hidden;

        .product-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-bottom: 1px solid $border-color-lighter;

          &:last-child {
            border-bottom: none;
          }

          .product-image {
            width: 100px;
            height: 100px;
            border-radius: 4px;

            .image-slot {
              display: flex;
              justify-content: center;
              align-items: center;
              width: 100%;
              height: 100%;
              background: $bg-color-light;
              color: $text-placeholder;
            }
          }

          .product-info {
            flex: 1;

            .product-name {
              font-size: 14px;
              color: $text-primary;
              margin-bottom: 4px;
            }

            .product-specs {
              font-size: 12px;
              color: $text-secondary;
            }
          }

          .product-price {
            text-align: center;
            min-width: 100px;

            .price {
              font-size: 16px;
              font-weight: 600;
              color: $danger-color;
              margin-bottom: 4px;
            }

            .quantity {
              font-size: 12px;
              color: $text-secondary;
            }
          }

          .product-total {
            font-size: 16px;
            font-weight: 600;
            color: $danger-color;
            min-width: 100px;
            text-align: right;
          }
        }
      }
    }

    .amount-section {
      padding: 20px;
      background: $bg-color-light;
      border-radius: 8px;

      .amount-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        font-size: 14px;
        color: $text-regular;

        &.discount {
          color: $danger-color;
        }

        &.total {
          font-size: 16px;
          font-weight: 600;
          color: $text-primary;

          .total-price {
            font-size: 24px;
            color: $danger-color;
          }
        }
      }
    }

    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
  }
}
</style>

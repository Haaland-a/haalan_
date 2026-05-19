<template>
  <div class="payment-page">
    <el-card v-loading="loading" shadow="never">
      <template #header>
        <div class="card-header">
          <span>订单支付</span>
          <el-button @click="goBack">返回</el-button>
        </div>
      </template>

      <div v-if="orderInfo" class="payment-content">
        <!-- 订单信息 -->
        <div class="order-info-section">
          <h4>订单信息</h4>
          <div class="info-row">
            <span class="label">订单号:</span>
            <span class="value">{{ orderInfo.orderNo }}</span>
          </div>
          <div class="info-row">
            <span class="label">商品名称:</span>
            <span class="value">{{ orderInfo.productName }}</span>
          </div>
          <div class="info-row">
            <span class="label">应付金额:</span>
            <span class="value price">¥{{ (Number(orderInfo.seckillPrice) * Number(orderInfo.quantity)).toFixed(2) }}</span>
          </div>
          <div class="info-row">
            <span class="label">支付截止:</span>
            <span class="value expire-time">{{ orderInfo.payExpireTime }}</span>
          </div>
        </div>

        <!-- 支付方式 -->
        <div class="payment-method-section">
          <h4>选择支付方式</h4>
          <div class="payment-methods">
            <div 
              v-for="method in paymentMethods" 
              :key="method.value"
              class="payment-method-item"
              :class="{ active: selectedMethod === method.value }"
              @click="selectedMethod = method.value"
            >
              <el-icon class="method-icon">
                <component :is="method.icon" />
              </el-icon>
              <span class="method-name">{{ method.label }}</span>
              <el-icon v-if="selectedMethod === method.value" class="check-icon">
                <Check />
              </el-icon>
            </div>
          </div>
        </div>

        <!-- 支付按钮 -->
        <div class="action-buttons">
          <el-button 
            type="primary" 
            size="large" 
            :loading="paying"
            @click="handlePay"
          >
            确认支付
          </el-button>
        </div>
      </div>

      <el-empty v-else description="订单信息加载失败" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Check, Wallet, CreditCard } from '@element-plus/icons-vue'
import { getSeckillOrderDetail } from '@/api/seckill'
import { payOrder } from '@/api/order'
import type { SeckillOrderDetail } from '@/types'

const route = useRoute()
const router = useRouter()

// 状态
const loading = ref(false)
const paying = ref(false)
const orderInfo = ref<SeckillOrderDetail | null>(null)
const selectedMethod = ref('alipay')

// 支付方式
const paymentMethods = [
  { label: '支付宝', value: 'alipay', icon: CreditCard },
  { label: '微信支付', value: 'wechat', icon: Wallet }
]

// 获取订单信息
const fetchOrderInfo = async () => {
  const orderNo = route.query.orderNo as string
  
  if (!orderNo) {
    ElMessage.error('订单号无效')
    return
  }

  loading.value = true
  try {
    const res = await getSeckillOrderDetail(orderNo)
    orderInfo.value = res.data
    
    // 检查订单状态
    if (orderInfo.value.status !== 0) {
      ElMessage.warning('订单状态异常，无法支付')
      setTimeout(() => {
        router.back()
      }, 1500)
    }
  } catch (error: any) {
    console.error('获取订单信息失败:', error)
    ElMessage.error(error.message || '获取订单信息失败')
  } finally {
    loading.value = false
  }
}

// 支付
const handlePay = async () => {
  if (!orderInfo.value?.orderNo) {
    ElMessage.error('订单信息无效')
    return
  }

  paying.value = true
  try {
    const res = await payOrder({
      orderNo: orderInfo.value.orderNo,
      payChannel: selectedMethod.value
    })
    
    ElMessage.success('支付成功')
    
    // 跳转到支付结果页或订单详情页
    setTimeout(() => {
      router.push(`/seckill-order/detail/${orderInfo.value!.orderNo}`)
    }, 1500)
  } catch (error: any) {
    console.error('支付失败:', error)
    ElMessage.error(error.message || '支付失败')
  } finally {
    paying.value = false
  }
}

// 返回
const goBack = () => {
  router.back()
}

onMounted(() => {
  fetchOrderInfo()
})
</script>

<style scoped lang="scss">
.payment-page {
  padding: 20px;
  min-height: calc(100vh - 60px);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .payment-content {
    max-width: 600px;
    margin: 0 auto;

    .order-info-section,
    .payment-method-section {
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

          &.price {
            font-size: 20px;
            font-weight: 700;
            color: $danger-color;
          }

          &.expire-time {
            color: $warning-color;
          }
        }
      }
    }

    .payment-method-section {
      .payment-methods {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .payment-method-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border: 2px solid $border-color-light;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            border-color: $primary-color;
          }

          &.active {
            border-color: $primary-color;
            background: rgba($primary-color, 0.05);
          }

          .method-icon {
            font-size: 24px;
            color: $primary-color;
          }

          .method-name {
            flex: 1;
            font-size: 16px;
            font-weight: 500;
            color: $text-primary;
          }

          .check-icon {
            font-size: 20px;
            color: $primary-color;
          }
        }
      }
    }

    .action-buttons {
      display: flex;
      justify-content: center;
      margin-top: 32px;

      .el-button {
        min-width: 200px;
      }
    }
  }
}
</style>

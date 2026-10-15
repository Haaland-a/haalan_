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
            <span>订单号：</span>
            <span>{{ orderInfo.orderNo }}</span>
          </div>
          <div class="info-row">
            <span>订单金额：</span>
            <span class="amount">¥{{ getOrderAmount(orderInfo).toFixed(2) }}</span>
          </div>
        </div>

        <el-divider />

        <!-- 支付方式选择 -->
        <div class="payment-methods">
          <h4>选择支付方式</h4>
          <div class="method-list">
            <div 
              v-for="method in paymentMethods" 
              :key="method.value"
              class="method-item"
              :class="{ active: selectedMethod === method.value }"
              @click="selectedMethod = method.value"
            >
              <div class="method-icon">
                <el-icon :size="32">
                  <component :is="method.icon" />
                </el-icon>
              </div>
              <div class="method-info">
                <div class="method-name">{{ method.label }}</div>
                <div class="method-desc">{{ method.description }}</div>
              </div>
              <el-icon v-if="selectedMethod === method.value" class="check-icon" color="#409EFF">
                <Check />
              </el-icon>
            </div>
          </div>
        </div>

        <!-- 支付按钮 -->
        <div class="payment-actions">
          <el-button 
            type="primary" 
            size="large" 
            :loading="paying"
            :disabled="selectedMethod === null"
            @click="handlePay"
          >
            确认支付 ¥{{ getOrderAmount(orderInfo).toFixed(2) }}
          </el-button>
          
          <el-button 
            v-if="payUrl"
            type="success" 
            size="large" 
            :loading="checking"
            @click="handleCheckPayment"
          >
            我已支付完成
          </el-button>
        </div>

        <!-- 支付提示 -->
        <el-alert
          title="支付提示"
          type="info"
          :closable="false"
          class="mt-20"
        >
          <p>• 点击“确认支付”后将打开支付页面，请完成支付</p>
          <p>• 支付完成后关闭支付窗口，然后点击“我已支付完成”按钮</p>
          <p>• 系统将查询支付结果，确认成功后即可跳转</p>
          <p>• 如遇到支付问题，请联系客服</p>
        </el-alert>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { CreditCard, Wallet, Money, Check } from '@element-plus/icons-vue'
import { getOrderDetail, payOrder, getPaymentResult } from '@/api/order'
import { getSeckillOrderDetail } from '@/api/seckill'
import type { OrderDetail as OrderDetailType, SeckillOrderDetail } from '@/types'

const route = useRoute()
const router = useRouter()

// 状态
const loading = ref(false)
const paying = ref(false)
const checking = ref(false)  // 查询中
const orderInfo = ref<OrderDetailType | SeckillOrderDetail | null>(null)
const selectedMethod = ref<number | null>(null)
const payUrl = ref('')  // 支付链接

// 支付方式（1-微信 2-支付宝 3-银行卡）
const paymentMethods = [
  {
    value: 2,
    label: '支付宝',
    description: '推荐使用支付宝扫码支付',
    icon: Wallet
  },
  {
    value: 1,
    label: '微信支付',
    description: '使用微信扫码支付',
    icon: CreditCard
  },
  {
    value: 3,
    label: '银行卡支付',
    description: '支持各大银行借记卡、信用卡',
    icon: Money
  }
]

// 获取订单金额（兼容普通订单和秒杀订单）
const getOrderAmount = (order: OrderDetailType | SeckillOrderDetail): number => {
  // 秒杀订单：从订单项中累加计算（必须遍历全部明细，只取 [0] 会漏算多商品订单）
  if ('orderItems' in order && order.orderItems && order.orderItems.length > 0) {
    return order.orderItems.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
      0
    )
  }
  // 普通订单：使用 actualAmount
  return Number((order as OrderDetailType).actualAmount) || 0
}

// 获取订单信息
const fetchOrderInfo = async () => {
  const orderNo = route.query.orderNo as string
  if (!orderNo) {
    ElMessage.error('订单号不存在')
    goBack()
    return
  }

  loading.value = true
  try {
    // 判断是否为秒杀订单（以SK开头）
    const isSeckillOrder = orderNo.startsWith('SK')
    
    if (isSeckillOrder) {
      // 秒杀订单
      const res = await getSeckillOrderDetail(orderNo)
      orderInfo.value = res.data
    } else {
      // 普通订单
      const res = await getOrderDetail(orderNo)
      orderInfo.value = res.data
    }
    
    // 如果订单已支付，跳转到结果页
    if (orderInfo.value.status !== 0) {
      ElMessage.warning('该订单已完成支付或已取消')
      setTimeout(() => {
        const path = isSeckillOrder ? `/seckill-order/detail/${orderNo}` : `/order/detail/${orderNo}`
        router.push(path)
      }, 1500)
    }
  } catch (error: any) {
    console.error('获取订单信息失败:', error)
    ElMessage.error(error.message || '获取订单信息失败')
  } finally {
    loading.value = false
  }
}

// 返回
const goBack = () => {
  router.back()
}

// 支付
const handlePay = async () => {
  if (!orderInfo.value || !selectedMethod.value) return

  paying.value = true
  try {
    const res = await payOrder({
      orderNo: orderInfo.value.orderNo,
      payType: selectedMethod.value
    })
    
    // 获取支付链接
    payUrl.value = res.data.payUrl
    
    // 打开支付页面（新窗口）
    window.open(payUrl.value, '_blank')
    
    ElMessage.success('已打开支付页面，请完成支付后点击“我已支付完成”按钮')
  } catch (error: any) {
    console.error('获取支付链接失败:', error)
    ElMessage.error(error.message || '获取支付链接失败，请重试')
  } finally {
    paying.value = false
  }
}

// 手动查询支付结果
const handleCheckPayment = async () => {
  const orderNo = orderInfo.value?.orderNo
  if (!orderNo) return
  
  checking.value = true
  try {
    const res = await getPaymentResult(orderNo)
    
    // 如果支付成功
    if (res.data.payStatus === 1) {
      ElMessage.success('支付成功')
      
      setTimeout(() => {
        const isSeckillOrder = orderNo.startsWith('SK')
        const path = isSeckillOrder 
          ? `/seckill-order/detail/${orderNo}` 
          : `/order/detail/${orderNo}`
        router.push(path)
      }, 1500)
    } else {
      ElMessage.warning('尚未检测到支付，请确认已完成支付后再试')
    }
  } catch (error: any) {
    console.error('查询支付结果失败:', error)
    ElMessage.error(error.message || '查询支付结果失败')
  } finally {
    checking.value = false
  }
}

onMounted(() => {
  fetchOrderInfo()
})
</script>

<style scoped lang="scss">
.payment-page {
  max-width: 800px;
  margin: 0 auto;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .payment-content {
    .order-info-section {
      h4 {
        font-size: 16px;
        color: $text-primary;
        margin-bottom: 16px;
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        font-size: 14px;

        .amount {
          font-size: 24px;
          font-weight: 600;
          color: $danger-color;
        }
      }
    }

    .payment-methods {
      h4 {
        font-size: 16px;
        color: $text-primary;
        margin-bottom: 16px;
      }

      .method-list {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .method-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          border: 2px solid $border-color-light;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            border-color: $primary-color;
            background: rgba($primary-color, 0.05);
          }

          &.active {
            border-color: $primary-color;
            background: rgba($primary-color, 0.05);
          }

          .method-icon {
            color: $primary-color;
          }

          .method-info {
            flex: 1;

            .method-name {
              font-size: 16px;
              font-weight: 600;
              color: $text-primary;
              margin-bottom: 4px;
            }

            .method-desc {
              font-size: 12px;
              color: $text-secondary;
            }
          }

          .check-icon {
            font-size: 24px;
          }
        }
      }
    }

    .payment-actions {
      margin-top: 32px;
      text-align: center;

      .el-button {
        width: 100%;
        max-width: 400px;
      }
    }

    .mt-20 {
      margin-top: 20px;
    }
  }
}
</style>

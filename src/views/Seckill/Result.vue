<template>
  <div class="seckill-result-page">
    <el-card v-loading="loading" shadow="never">
      <div class="result-container">
        <!-- 成功结果 -->
        <el-result
          v-if="result && result.status === 'SUCCESS'"
          icon="success"
          title="秒杀成功"
          sub-title="恭喜您，秒杀成功！请尽快完成支付"
        >
          <template #extra>
            <div class="order-info" v-if="result.orderInfo">
              <div class="info-row">
                <span class="label">订单号：</span>
                <span class="value">{{ result.orderInfo.orderNo }}</span>
              </div>
              <div class="info-row">
                <span class="label">商品名称：</span>
                <span class="value">{{ result.orderInfo.productName }}</span>
              </div>
              <div class="info-row">
                <span class="label">秒杀价格：</span>
                <span class="value price">¥{{ result.orderInfo.seckillPrice.toFixed(2) }}</span>
              </div>
              <div class="info-row">
                <span class="label">购买数量：</span>
                <span class="value">{{ result.orderInfo.quantity }}</span>
              </div>
              <div class="info-row">
                <span class="label">应付总额：</span>
                <span class="value price">¥{{ result.orderInfo.totalAmount.toFixed(2) }}</span>
              </div>
            </div>
            
            <div class="actions">
              <el-button type="primary" size="large" @click="handlePay">
                去支付
              </el-button>
              <el-button size="large" @click="handleViewOrder">
                查看订单
              </el-button>
              <el-button size="large" @click="goHome">
                返回首页
              </el-button>
            </div>

            <el-alert
              title="温馨提示"
              type="warning"
              :closable="false"
              class="mt-20"
            >
              <p>• 请在30分钟内完成支付，超时订单将自动取消</p>
              <p>• 支付过程中请勿刷新页面或关闭浏览器</p>
            </el-alert>
          </template>
        </el-result>

        <!-- 失败结果 -->
        <el-result
          v-else-if="result && result.status === 'FAILED'"
          icon="error"
          title="秒杀失败"
          :sub-title="result.failReason || '很遗憾，本次秒杀未成功'"
        >
          <template #extra>
            <div class="fail-reason" v-if="result.failReason">
              <h4>失败原因：</h4>
              <p>{{ result.failReason }}</p>
            </div>
            
            <div class="actions">
              <el-button type="primary" size="large" @click="goBack">
                返回活动页
              </el-button>
              <el-button size="large" @click="goHome">
                返回首页
              </el-button>
            </div>

            <el-alert
              title="小贴士"
              type="info"
              :closable="false"
              class="mt-20"
            >
              <p>• 秒杀商品数量有限，售完即止</p>
              <p>• 可以关注其他秒杀活动</p>
              <p>• 确保网络连接稳定</p>
            </el-alert>
          </template>
        </el-result>

        <!-- 处理中 -->
        <el-result
          v-else-if="result && result.status === 'PROCESSING'"
          icon="info"
          title="处理中"
          sub-title="您的秒杀请求正在处理中，请稍候..."
        >
          <template #extra>
            <el-button size="large" @click="fetchResult">
              刷新状态
            </el-button>
          </template>
        </el-result>

        <!-- 未知状态 -->
        <el-result
          v-else
          icon="warning"
          title="未知状态"
          sub-title="无法获取秒杀结果，请稍后重试"
        >
          <template #extra>
            <el-button type="primary" size="large" @click="fetchResult">
              重新查询
            </el-button>
            <el-button size="large" @click="goHome">
              返回首页
            </el-button>
          </template>
        </el-result>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getSeckillResult } from '@/api/seckill'
import type { SeckillResult as SeckillResultType } from '@/types'

const route = useRoute()
const router = useRouter()

// 状态
const loading = ref(false)
const result = ref<SeckillResultType | null>(null)

// 获取秒杀结果
const fetchResult = async () => {
  const requestId = route.params.requestId as string
  if (!requestId) {
    ElMessage.error('请求ID不存在')
    return
  }

  loading.value = true
  try {
    const res = await getSeckillResult(requestId)
    result.value = res.data
  } catch (error: any) {
    console.error('查询结果失败:', error)
    ElMessage.error(error.message || '查询结果失败')
  } finally {
    loading.value = false
  }
}

// 去支付
const handlePay = () => {
  if (result.value?.orderInfo?.orderNo) {
    router.push(`/payment?orderNo=${result.value.orderInfo.orderNo}`)
  }
}

// 查看订单
const handleViewOrder = () => {
  if (result.value?.orderInfo?.orderNo) {
    router.push(`/order/detail/${result.value.orderInfo.orderNo}`)
  }
}

// 返回活动页
const goBack = () => {
  router.back()
}

// 返回首页
const goHome = () => {
  router.push('/')
}

onMounted(() => {
  fetchResult()
})
</script>

<style scoped lang="scss">
.seckill-result-page {
  padding: 40px 20px;
  min-height: calc(100vh - 60px);
  
  .result-container {
    max-width: 700px;
    margin: 0 auto;

    .order-info {
      background: $bg-color-light;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;

      .info-row {
        display: flex;
        align-items: center;
        padding: 12px 0;
        font-size: 14px;
        border-bottom: 1px solid $border-color-lighter;

        &:last-child {
          border-bottom: none;
        }

        .label {
          width: 100px;
          color: $text-secondary;
        }

        .value {
          color: $text-primary;
          font-weight: 500;

          &.price {
            font-size: 18px;
            font-weight: 600;
            color: $danger-color;
          }
        }
      }
    }

    .fail-reason {
      background: rgba($danger-color, 0.05);
      border-left: 4px solid $danger-color;
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 24px;

      h4 {
        font-size: 14px;
        color: $danger-color;
        margin-bottom: 8px;
      }

      p {
        font-size: 14px;
        color: $text-regular;
        line-height: 1.6;
      }
    }

    .actions {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-bottom: 24px;

      .el-button {
        min-width: 120px;
      }
    }

    .mt-20 {
      margin-top: 20px;
    }
  }
}
</style>

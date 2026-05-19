<template>
  <div class="seckill-order-page">
    <div class="page-container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h2>我的秒杀订单</h2>
        <el-button @click="goBack">返回</el-button>
      </div>

      <!-- 订单列表 -->
      <el-skeleton :rows="5" animated v-if="loading" />
      
      <div v-else-if="orderList.length > 0" class="order-list">
        <el-card 
          v-for="order in orderList" 
          :key="order.orderNo"
          class="order-card"
          shadow="hover"
        >
          <div class="order-header">
            <div class="order-info">
              <span class="label">订单号：</span>
              <span class="value">{{ order.orderNo }}</span>
            </div>
            <div class="order-status">
              <el-tag :type="getStatusType(order.status)">
                {{ order.statusName }}
              </el-tag>
            </div>
          </div>

          <div class="order-body">
            <div class="product-info">
              <el-image 
                :src="getProductImage(order.productImage)" 
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
                <div class="product-name">{{ order.productName }}</div>
                <div class="product-detail">
                  <span>数量：{{ order.quantity }}</span>
                  <span class="price">¥{{ (Number(order.seckillPrice) || 0).toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <div class="order-footer">
              <div class="amount-info">
                <span>实付金额：</span>
                <span class="total-price">¥{{ ((Number(order.seckillPrice) || 0) * (Number(order.quantity) || 0)).toFixed(2) }}</span>
              </div>
              <div class="time-info">
                <span>下单时间：{{ order.createTime }}</span>
                <span v-if="order.payExpireTime" class="expire-tip">
                  （支付截止：{{ order.payExpireTime }}）
                </span>
              </div>
              <div class="actions">
                <el-button 
                  v-if="order.status === 0" 
                  type="primary" 
                  size="small"
                  @click="handlePay(order)"
                >
                  去支付
                </el-button>
                <el-button 
                  v-if="order.status === 0" 
                  size="small"
                  @click="handleCancel(order)"
                >
                  取消订单
                </el-button>
                <el-button 
                  size="small"
                  @click="handleViewDetail(order)"
                >
                  查看详情
                </el-button>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            @current-change="fetchOrderList"
            @size-change="fetchOrderList"
          />
        </div>
      </div>
      
      <el-empty v-else description="暂无秒杀订单" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { getUserSeckillRecords, cancelSeckillOrder } from '@/api/seckill'
import type { UserSeckillRecord } from '@/types'

const router = useRouter()

// 状态
const loading = ref(false)
const orderList = ref<UserSeckillRecord[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 获取订单列表
const fetchOrderList = async () => {
  loading.value = true
  try {
    const res = await getUserSeckillRecords({
      pageNum: currentPage.value,
      pageSize: pageSize.value
    })
    
    console.log('秒杀订单响应数据:', res)
    console.log('res.data:', res.data)
    
    // 根据实际返回结构调整
    if (res.data && res.data.list) {
      orderList.value = res.data.list
      total.value = Number(res.data.total) || 0
    } else if (res.data && res.data.records) {
      orderList.value = res.data.records
      total.value = Number(res.data.total) || 0
    } else if (Array.isArray(res.data)) {
      // 如果直接返回数组
      orderList.value = res.data
      total.value = res.data.length
    }
    
    console.log('orderList:', orderList.value)
    console.log('total:', total.value)
  } catch (error: any) {
    console.error('获取订单列表失败:', error)
    ElMessage.error(error.message || '获取订单列表失败')
  } finally {
    loading.value = false
  }
}

// 获取状态类型
const getStatusType = (status: number) => {
  const types: Record<number, any> = {
    0: 'warning',    // 待支付
    1: 'success',    // 已支付
    2: '',           // 已完成
    3: 'danger',     // 已取消
    4: 'info'        // 已退款
  }
  return types[status] || ''
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

// 去支付
const handlePay = (order: UserSeckillRecord) => {
  router.push(`/payment?orderNo=${order.orderNo}`)
}

// 取消订单
const handleCancel = async (order: UserSeckillRecord) => {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 调用秒杀订单取消接口
    await cancelSeckillOrder(order.orderNo, {
      cancelReason: '用户主动取消'
    })
    
    ElMessage.success('订单已取消')
    fetchOrderList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('取消订单失败:', error)
      ElMessage.error(error.message || '取消订单失败')
    }
  }
}

// 查看详情
const handleViewDetail = (order: UserSeckillRecord) => {
  router.push(`/seckill-order/detail/${order.orderNo}`)
}

// 返回
const goBack = () => {
  router.back()
}

onMounted(() => {
  fetchOrderList()
})
</script>

<style scoped lang="scss">
.seckill-order-page {
  padding: 20px;
  min-height: calc(100vh - 60px);

  .page-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      font-size: 24px;
      color: $text-primary;
      margin: 0;
    }
  }

  .order-list {
    .order-card {
      margin-bottom: 16px;

      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 12px;
        border-bottom: 1px solid $border-color-lighter;
        margin-bottom: 16px;

        .order-info {
          .label {
            color: $text-secondary;
            font-size: 14px;
          }

          .value {
            color: $text-primary;
            font-size: 14px;
            font-weight: 500;
          }
        }
      }

      .order-body {
        .product-info {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;

          .product-image {
            width: 100px;
            height: 100px;
            border-radius: 4px;
            flex-shrink: 0;

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

          .info {
            flex: 1;

            .product-name {
              font-size: 16px;
              font-weight: 500;
              color: $text-primary;
              margin-bottom: 8px;
            }

            .product-detail {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 14px;
              color: $text-secondary;

              .price {
                font-size: 18px;
                font-weight: 600;
                color: $danger-color;
              }
            }
          }
        }

        .order-footer {
          padding-top: 16px;
          border-top: 1px solid $border-color-lighter;

          .amount-info {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            font-size: 14px;

            .total-price {
              font-size: 20px;
              font-weight: 600;
              color: $danger-color;
            }
          }

          .time-info {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            font-size: 12px;
            color: $text-placeholder;
            margin-bottom: 12px;

            .expire-tip {
              color: $warning-color;
            }
          }

          .actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
          }
        }
      }
    }

    .pagination {
      display: flex;
      justify-content: center;
      margin-top: 24px;
    }
  }
}
</style>

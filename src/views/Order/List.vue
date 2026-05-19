<template>
  <div class="order-list-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>我的订单</span>
          <el-radio-group v-model="statusFilter" @change="handleStatusChange">
            <el-radio-button :label="undefined">全部</el-radio-button>
            <el-radio-button :label="0">待支付</el-radio-button>
            <el-radio-button :label="1">已支付</el-radio-button>
            <el-radio-button :label="2">已取消</el-radio-button>
            <el-radio-button :label="3">已完成</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <!-- 订单列表 -->
      <div v-loading="loading" class="order-list">
        <el-empty v-if="!loading && orderList.length === 0" description="暂无订单" />
        
        <div v-else class="order-items">
          <div v-for="order in orderList" :key="order.orderNo" class="order-item">
            <!-- 订单头部 -->
            <div class="order-header">
              <div class="order-info">
                <span class="order-no">订单号：{{ order.orderNo }}</span>
                <span class="order-time">{{ order.createTime }}</span>
              </div>
              <el-tag :type="getStatusType(order.status)" size="small">
                {{ order.statusName }}
              </el-tag>
            </div>

            <!-- 订单商品 -->
            <div class="order-products">
              <div 
                v-for="(product, index) in order.products" 
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
                  <span class="price">¥{{ product.price.toFixed(2) }}</span>
                  <span class="quantity">x{{ product.quantity }}</span>
                </div>
              </div>
            </div>

            <!-- 订单底部 -->
            <div class="order-footer">
              <div class="order-total">
                共{{ order.totalQuantity }}件商品，合计：
                <span class="total-price">¥{{ order.totalAmount.toFixed(2) }}</span>
              </div>
              <div class="order-actions">
                <el-button 
                  v-if="order.status === 0" 
                  size="small" 
                  type="primary"
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
                <el-button 
                  v-if="order.status === 1" 
                  size="small"
                  type="danger"
                  @click="handleRefund(order)"
                >
                  申请退款
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <el-pagination
          v-if="total > 0"
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="pagination"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { getOrderList, cancelOrder } from '@/api/order'
import type { OrderBrief } from '@/types'

const router = useRouter()

// 状态
const loading = ref(false)
const statusFilter = ref<number | undefined>(undefined)
const orderList = ref<OrderBrief[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 获取订单列表
const fetchOrderList = async () => {
  loading.value = true
  try {
    const res = await getOrderList({
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      status: statusFilter.value
    })
    orderList.value = res.data.list
    total.value = parseInt(res.data.total)
  } catch (error) {
    console.error('获取订单列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 状态筛选变化
const handleStatusChange = () => {
  currentPage.value = 1
  fetchOrderList()
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchOrderList()
}

// 页码变化
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  fetchOrderList()
}

// 获取状态类型
const getStatusType = (status: number) => {
  const types: Record<number, any> = {
    0: 'warning',
    1: 'success',
    2: 'info',
    3: ''
  }
  return types[status] || ''
}

// 格式化规格
const formatSpecs = (specs: Record<string, string>) => {
  return Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join(', ')
}

// 去支付
const handlePay = (order: OrderBrief) => {
  router.push(`/payment?orderNo=${order.orderNo}`)
}

// 取消订单
const handleCancel = async (order: OrderBrief) => {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await cancelOrder(order.orderNo, {
      reason: '用户主动取消'
    })
    ElMessage.success('订单已取消')
    fetchOrderList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('取消订单失败:', error)
    }
  }
}

// 查看详情
const handleViewDetail = (order: OrderBrief) => {
  router.push(`/order/detail/${order.orderNo}`)
}

// 申请退款
const handleRefund = (order: OrderBrief) => {
  ElMessage.info('退款功能开发中...')
  // TODO: 实现退款对话框
}

onMounted(() => {
  fetchOrderList()
})
</script>

<style scoped lang="scss">
.order-list-page {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .order-list {
    min-height: 400px;
  }

  .order-items {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .order-item {
    border: 1px solid $border-color-light;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: $bg-color-light;
      border-bottom: 1px solid $border-color-lighter;

      .order-info {
        display: flex;
        gap: 24px;
        font-size: 14px;

        .order-no {
          color: $text-primary;
        }

        .order-time {
          color: $text-secondary;
        }
      }
    }

    .order-products {
      padding: 16px;

      .product-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px 0;
        border-bottom: 1px solid $border-color-lighter;

        &:last-child {
          border-bottom: none;
        }

        .product-image {
          width: 80px;
          height: 80px;
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
          text-align: right;

          .price {
            display: block;
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
      }
    }

    .order-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: $bg-color-light;
      border-top: 1px solid $border-color-lighter;

      .order-total {
        font-size: 14px;
        color: $text-regular;

        .total-price {
          font-size: 18px;
          font-weight: 600;
          color: $danger-color;
          margin-left: 8px;
        }
      }

      .order-actions {
        display: flex;
        gap: 8px;
      }
    }
  }

  .pagination {
    margin-top: 24px;
    justify-content: flex-end;
  }
}
</style>

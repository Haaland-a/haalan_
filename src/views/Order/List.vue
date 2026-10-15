<template>
  <div class="order-list-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>我的订单</span>
          <el-radio-group v-model="statusFilter" @change="handleStatusChange">
            <el-radio-button :value="undefined">全部</el-radio-button>
            <el-radio-button :value="0">待支付</el-radio-button>
            <el-radio-button :value="1">已支付</el-radio-button>
            <el-radio-button :value="2">已发货</el-radio-button>
            <el-radio-button :value="3">已完成</el-radio-button>
            <el-radio-button :value="4">已取消</el-radio-button>
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
              <div class="product-item">
                <el-image
                  :src="order.productImage"
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
                  <div class="product-name">{{ order.productName }}</div>
                </div>
                <div class="product-price">
                  <span class="price">¥{{ Number(order.totalAmount).toFixed(2) }}</span>
                  <span class="quantity">x{{ order.quantity }}</span>
                </div>
              </div>
            </div>

            <!-- 订单底部 -->
            <div class="order-footer">
              <div class="order-total">
                共{{ order.quantity }}件商品，合计：
                <span class="total-price">¥{{ Number(order.totalAmount).toFixed(2) }}</span>
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

    <!-- 退款申请对话框 -->
    <el-dialog v-model="refundVisible" title="申请退款" width="460px">
      <el-form ref="refundFormRef" :model="refundForm" :rules="refundRules" label-width="90px">
        <el-form-item label="订单号">
          <span class="refund-order-no">{{ refundForm.orderNo }}</span>
        </el-form-item>
        <el-form-item label="退款金额" prop="refundAmount">
          <el-input-number
            v-model="refundForm.refundAmount"
            :min="0.01"
            :max="refundMaxAmount"
            :precision="2"
            :step="1"
            controls-position="right"
            class="refund-amount"
          />
          <span class="refund-tip">最多可退 ¥{{ refundMaxAmount.toFixed(2) }}</span>
        </el-form-item>
        <el-form-item label="退款原因" prop="refundReason">
          <el-input
            v-model="refundForm.refundReason"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="请说明退款原因，便于客服审核"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="refundVisible = false">取消</el-button>
        <el-button type="primary" :loading="refundSubmitting" @click="submitRefund">
          提交申请
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { getOrderList, cancelOrder, applyRefund } from '@/api/order'
import type { OrderBrief } from '@/types'

const router = useRouter()

// 状态
const loading = ref(false)
const statusFilter = ref<number | undefined>(undefined)
const orderList = ref<OrderBrief[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 退款
const refundVisible = ref(false)
const refundSubmitting = ref(false)
const refundFormRef = ref<FormInstance>()
const refundForm = reactive({
  orderNo: '',
  refundAmount: 0,
  refundReason: ''
})
const refundRules: FormRules = {
  refundAmount: [
    { required: true, message: '请输入退款金额', trigger: 'blur' },
    {
      validator: (_rule: any, value: any, callback: any) => {
        const amount = Number(value)
        if (!Number.isFinite(amount) || amount <= 0) {
          callback(new Error('退款金额必须大于 0'))
        } else if (amount > refundMaxAmount.value) {
          callback(new Error(`退款金额不能超过实付金额 ¥${refundMaxAmount.value.toFixed(2)}`))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  refundReason: [{ required: true, message: '请填写退款原因', trigger: 'blur' }]
}
const refundMaxAmount = ref(0)

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
    ElMessage.error('获取订单列表失败，请稍后重试')
    orderList.value = []
    total.value = 0
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
    2: '',
    3: 'info',
    4: 'info'
  }
  return types[status] || ''
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
      cancelReason: '用户主动取消'
    })
    ElMessage.success('订单已取消')
    fetchOrderList()
  } catch (error: any) {
    // 'cancel' 是 ElMessageBox 用户点取消的返回值，不算错误
    if (error !== 'cancel') {
      console.error('取消订单失败:', error)
      ElMessage.error('取消订单失败，请稍后重试')
    }
  }
}

// 查看详情
const handleViewDetail = (order: OrderBrief) => {
  router.push(`/order/detail/${order.orderNo}`)
}

// 申请退款
const handleRefund = (order: OrderBrief) => {
  refundMaxAmount.value = Number(order.actualAmount ?? order.totalAmount)
  refundForm.orderNo = order.orderNo
  refundForm.refundAmount = refundMaxAmount.value
  refundForm.refundReason = ''
  refundVisible.value = true
}

const submitRefund = async () => {
  if (!refundFormRef.value) return
  try {
    await refundFormRef.value.validate()
  } catch {
    return
  }
  refundSubmitting.value = true
  try {
    const res = await applyRefund({
      orderNo: refundForm.orderNo,
      refundAmount: refundForm.refundAmount,
      refundReason: refundForm.refundReason
    })
    const info = res.data
    ElMessage.success(info?.statusName ? `退款申请已提交：${info.statusName}` : '退款申请已提交')
    refundVisible.value = false
    fetchOrderList()
  } catch (error: any) {
    ElMessage.error(error?.message || '退款申请失败')
  } finally {
    refundSubmitting.value = false
  }
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

.refund-order-no {
  font-family: monospace;
  color: $text-regular;
}

.refund-amount {
  width: 160px;
}

.refund-tip {
  margin-left: 12px;
  font-size: 12px;
  color: $text-secondary;
}
</style>

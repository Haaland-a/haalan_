<template>
  <div class="records-page">
    <el-card shadow="never">
      <template #header>
        <span>我的秒杀记录</span>
      </template>

      <!-- 记录列表 -->
      <div v-loading="loading" class="records-list">
        <el-empty v-if="!loading && recordList.length === 0" description="暂无秒杀记录" />
        
        <div v-else class="record-items">
          <div v-for="record in recordList" :key="record.orderNo" class="record-item">
            <!-- 商品信息 -->
            <div class="product-section">
              <el-image 
                :src="getProductImage(record.productImage)" 
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
                <div class="product-name">{{ record.productName }}</div>
                <div class="activity-name">{{ record.activityName }}</div>
              </div>
            </div>

            <!-- 订单信息 -->
            <div class="order-section">
              <div class="info-row">
                <span class="label">订单号：</span>
                <span class="value">{{ record.orderNo }}</span>
              </div>
              <div class="info-row">
                <span class="label">秒杀价格：</span>
                <span class="value price">¥{{ (Number(record.seckillPrice) || 0).toFixed(2) }}</span>
              </div>
              <div class="info-row">
                <span class="label">购买数量：</span>
                <span class="value">{{ record.quantity }}</span>
              </div>
              <div class="info-row">
                <span class="label">下单时间：</span>
                <span class="value">{{ record.createTime }}</span>
              </div>
              <div class="info-row">
                <span class="label">订单状态：</span>
                <el-tag :type="getStatusType(record.status)" size="small">
                  {{ record.statusName }}
                </el-tag>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="action-section">
              <el-button 
                v-if="record.status === 0" 
                size="small" 
                type="primary"
                @click="handlePay(record)"
              >
                去支付
              </el-button>
              <el-button 
                size="small"
                @click="handleViewOrder(record)"
              >
                查看订单
              </el-button>
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
import { Picture } from '@element-plus/icons-vue'
import { getUserSeckillRecords } from '@/api/seckill'
import type { UserSeckillRecord } from '@/types'

const router = useRouter()

// 状态
const loading = ref(false)
const recordList = ref<UserSeckillRecord[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 获取秒杀记录
const fetchRecords = async () => {
  loading.value = true
  try {
    const res = await getUserSeckillRecords({
      pageNum: currentPage.value,
      pageSize: pageSize.value
    })
    recordList.value = res.data.list
    total.value = parseInt(res.data.total)
  } catch (error) {
    console.error('获取秒杀记录失败:', error)
  } finally {
    loading.value = false
  }
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchRecords()
}

// 页码变化
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  fetchRecords()
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
const handlePay = (record: UserSeckillRecord) => {
  router.push(`/payment?orderNo=${record.orderNo}`)
}

// 查看订单
const handleViewOrder = (record: UserSeckillRecord) => {
  router.push(`/seckill-order/detail/${record.orderNo}`)
}

onMounted(() => {
  fetchRecords()
})
</script>

<style scoped lang="scss">
.records-page {
  .records-list {
    min-height: 400px;
  }

  .record-items {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .record-item {
    display: flex;
    gap: 24px;
    padding: 20px;
    border: 1px solid $border-color-light;
    border-radius: 8px;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    }

    .product-section {
      display: flex;
      gap: 16px;
      min-width: 300px;

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
          font-size: 16px;
          font-weight: 600;
          color: $text-primary;
          margin-bottom: 8px;
        }

        .activity-name {
          font-size: 14px;
          color: $primary-color;
        }
      }
    }

    .order-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .info-row {
        display: flex;
        align-items: center;
        font-size: 14px;

        .label {
          color: $text-secondary;
          min-width: 80px;
        }

        .value {
          color: $text-primary;

          &.price {
            font-size: 16px;
            font-weight: 600;
            color: $danger-color;
          }
        }
      }
    }

    .action-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
      justify-content: center;
      min-width: 100px;
    }
  }

  .pagination {
    margin-top: 24px;
    justify-content: flex-end;
  }
}
</style>

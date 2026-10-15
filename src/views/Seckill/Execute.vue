<template>
  <div class="seckill-execute-page">
    <el-card v-loading="loading" shadow="never">
      <template #header>
        <div class="card-header">
          <span>确认订单</span>
          <el-button @click="goBack">返回</el-button>
        </div>
      </template>

      <div v-if="productDetail" class="execute-content">
        <!-- 商品信息 -->
        <div class="product-section">
          <h4>商品信息</h4>
          <div class="product-info">
            <el-image 
              :src="productDetail.productImages && productDetail.productImages.length > 0 ? productDetail.productImages[0] : ''" 
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
              <div class="name">{{ productDetail.productName }}</div>
              <div class="price">
                <span class="label">秒杀价：</span>
                <span class="value">¥{{ Number(productDetail.seckillPrice).toFixed(2) }}</span>
              </div>
              <div class="stock">
                <span class="label">剩余库存：</span>
                <span class="value">{{ productDetail.stock }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 收货地址选择 -->
        <div class="address-section">
          <h4>
            收货地址
            <el-button link type="primary" @click="showAddressDialog = true">
              选择地址
            </el-button>
          </h4>
          
          <div v-if="selectedAddress" class="address-card">
            <div class="address-header">
              <span class="name">{{ selectedAddress.receiverName }}</span>
              <span class="phone">{{ selectedAddress.receiverPhone }}</span>
              <el-tag v-if="selectedAddress.isDefault" size="small" type="success">默认</el-tag>
            </div>
            <div class="address-detail">
              {{ selectedAddress.fullAddress }} {{ selectedAddress.detailAddress }}
            </div>
          </div>
          <el-empty v-else description="请选择收货地址" :image-size="80" />
        </div>

        <!-- 购买数量 -->
        <div class="quantity-section">
          <h4>购买数量</h4>
          <el-input-number 
            v-model="quantity" 
            :min="1" 
            :max="maxQuantity"
            :disabled="!selectedAddress"
          />
          <span class="limit-tip" v-if="Number(productDetail.limitPerUser) > 0">
            （每人限购{{ productDetail.limitPerUser }}件）
          </span>
        </div>

        <!-- 金额信息 -->
        <div class="amount-section">
          <div class="amount-row">
            <span>商品总额：</span>
            <span>¥{{ (Number(productDetail.seckillPrice) * quantity).toFixed(2) }}</span>
          </div>
          <div class="amount-row">
            <span>运费：</span>
            <span>¥0.00</span>
          </div>
          <el-divider />
          <div class="amount-row total">
            <span>应付总额：</span>
            <span class="total-price">¥{{ (Number(productDetail.seckillPrice) * quantity).toFixed(2) }}</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-checkbox v-model="agreeTerms">
            我已阅读并同意
            <el-link type="primary" :underline="false">《秒杀活动规则》</el-link>
          </el-checkbox>
          <el-button 
            type="danger" 
            size="large"
            :loading="submitting"
            :disabled="!canSubmit"
            @click="handleSubmit"
          >
            立即秒杀
          </el-button>
        </div>

        <!-- 注意事项 -->
        <el-alert
          title="注意事项"
          type="warning"
          :closable="false"
          class="mt-20"
        >
          <p>• 秒杀商品数量有限，售完即止</p>
          <p>• 秒杀成功后需在30分钟内完成支付，超时将自动取消订单</p>
          <p>• 请确保收货地址和联系方式准确无误</p>
          <p>• 秒杀订单不支持修改，请仔细核对</p>
        </el-alert>
      </div>
    </el-card>

    <!-- 地址选择对话框 -->
    <el-dialog
      v-model="showAddressDialog"
      title="选择收货地址"
      width="600px"
    >
      <div v-loading="addressLoading" class="address-list">
        <el-empty v-if="!addressLoading && addressList.length === 0" description="暂无收货地址">
          <el-button type="primary" @click="goToAddressManage">去添加</el-button>
        </el-empty>
        
        <div v-else class="address-items">
          <div 
            v-for="addr in addressList" 
            :key="addr.addressId"
            class="address-item"
            :class="{ active: selectedAddress?.addressId === addr.addressId }"
            @click="selectAddress(addr)"
          >
            <div class="address-header">
              <span class="name">{{ addr.receiverName }}</span>
              <span class="phone">{{ addr.receiverPhone }}</span>
              <el-tag v-if="addr.isDefault" size="small" type="success">默认</el-tag>
            </div>
            <div class="address-detail">
              {{ addr.fullAddress }} {{ addr.detailAddress }}
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { getSeckillProductDetail, executeSeckill, getSeckillToken } from '@/api/seckill'
import { getAddressList } from '@/api/user'
import { generateRequestId, getDeviceId } from '@/utils/common'
import type { SeckillProductDetail, AddressInfo } from '@/types'

const route = useRoute()
const router = useRouter()

// 状态
const loading = ref(false)
const submitting = ref(false)
const addressLoading = ref(false)
const showAddressDialog = ref(false)
const agreeTerms = ref(false)
const quantity = ref(1)

const productDetail = ref<SeckillProductDetail | null>(null)
const addressList = ref<AddressInfo[]>([])
const selectedAddress = ref<AddressInfo | null>(null)

// 最大购买数量
const maxQuantity = computed(() => {
  if (!productDetail.value) return 1
  const limit = Number(productDetail.value.limitPerUser)
  return limit > 0
    ? Math.min(limit, productDetail.value.stock)
    : productDetail.value.stock
})

// 是否可以提交
const canSubmit = computed(() => {
  return selectedAddress.value?.addressId && agreeTerms.value && quantity.value > 0
})

// 获取商品详情
const fetchProductDetail = async () => {
  const seckillProductId = Number(route.query.seckillProductId)
  const activityId = route.query.activityId ? Number(route.query.activityId) : undefined
  
  if (!seckillProductId) {
    ElMessage.error('参数错误')
    goBack()
    return
  }

  loading.value = true
  try {
    const res = await getSeckillProductDetail(seckillProductId, activityId)
    productDetail.value = res.data
  } catch (error: any) {
    ElMessage.error(error.message || '获取商品信息失败')
    goBack()
  } finally {
    loading.value = false
  }
}

// 获取地址列表
const fetchAddressList = async () => {
  addressLoading.value = true
  try {
    const res = await getAddressList()
    // 规范化地址数据，兼容后端可能返回的 addressId 或 id
    addressList.value = (res.data || []).map((addr: any) => ({
      ...addr,
      addressId: addr.addressId || addr.id
    }))

    // 自动选择默认地址
    const defaultAddr = addressList.value.find(addr => addr.isDefault)
    if (defaultAddr) {
      selectedAddress.value = defaultAddr
    }
  } catch (error) {
    console.error('获取地址列表失败:', error)
  } finally {
    addressLoading.value = false
  }
}

// 选择地址
const selectAddress = (addr: AddressInfo) => {
  selectedAddress.value = addr
  showAddressDialog.value = false
}

// 跳转到地址管理
const goToAddressManage = () => {
  showAddressDialog.value = false
  router.push('/user/addresses')
}

// 返回
const goBack = () => {
  router.back()
}

// 提交秒杀
const handleSubmit = async () => {
  if (!productDetail.value || !selectedAddress.value?.addressId) {
    ElMessage.warning('请选择收货地址')
    return
  }

  if (!agreeTerms.value) {
    ElMessage.warning('请同意秒杀活动规则')
    return
  }

  submitting.value = true
  try {
    const seckillProductId = Number(route.query.seckillProductId)
    const activityId = Number(route.query.activityId)
    
    // 获取令牌
    const tokenRes = await getSeckillToken({
      activityId,
      seckillProductId,
      clientInfo: {
        deviceId: getDeviceId(),
        userAgent: navigator.userAgent
      }
    })
    
    // 执行秒杀
    const requestId = generateRequestId()
    await executeSeckill({
      requestId,
      activityId,
      seckillProductId,
      skuId: seckillProductId,
      seckillToken: tokenRes.data.seckillToken,
      quantity: quantity.value,
      addressId: selectedAddress.value.addressId
    })
    
    ElMessage.success('秒杀成功')
    
    // 跳转到结果页
    setTimeout(() => {
      router.push(`/seckill/result/${requestId}`)
    }, 500)
  } catch (error: any) {
    console.error('秒杀失败:', error)
    ElMessage.error(error.message || '秒杀失败，请重试')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchProductDetail()
  fetchAddressList()
})
</script>

<style scoped lang="scss">
.seckill-execute-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .execute-content {
    h4 {
      font-size: 16px;
      color: $text-primary;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .product-section {
      margin-bottom: 32px;

      .product-info {
        display: flex;
        gap: 20px;
        padding: 20px;
        background: $bg-color-light;
        border-radius: 8px;

        .product-image {
          width: 120px;
          height: 120px;
          border-radius: 8px;

          .image-slot {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
            background: #fff;
            color: $text-placeholder;
          }
        }

        .info {
          flex: 1;

          .name {
            font-size: 16px;
            font-weight: 600;
            color: $text-primary;
            margin-bottom: 12px;
          }

          .price, .stock {
            font-size: 14px;
            margin-bottom: 8px;

            .label {
              color: $text-secondary;
            }

            .value {
              color: $text-primary;
              font-weight: 600;
            }
          }

          .price .value {
            color: $danger-color;
            font-size: 18px;
          }
        }
      }
    }

    .address-section {
      margin-bottom: 32px;

      .address-card {
        padding: 16px;
        border: 2px solid $primary-color;
        border-radius: 8px;
        background: rgba($primary-color, 0.05);

        .address-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;

          .name {
            font-size: 16px;
            font-weight: 600;
            color: $text-primary;
          }

          .phone {
            font-size: 14px;
            color: $text-secondary;
          }
        }

        .address-detail {
          font-size: 14px;
          color: $text-regular;
        }
      }
    }

    .quantity-section {
      margin-bottom: 32px;

      .limit-tip {
        margin-left: 12px;
        font-size: 14px;
        color: $text-secondary;
      }
    }

    .amount-section {
      padding: 20px;
      background: $bg-color-light;
      border-radius: 8px;
      margin-bottom: 32px;

      .amount-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        font-size: 14px;

        &.total {
          font-size: 16px;
          font-weight: 600;

          .total-price {
            font-size: 24px;
            color: $danger-color;
          }
        }
      }
    }

    .action-buttons {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      .el-button {
        width: 200px;
        height: 50px;
        font-size: 18px;
      }
    }

    .mt-20 {
      margin-top: 20px;
    }
  }

  .address-list {
    min-height: 200px;
    max-height: 400px;
    overflow-y: auto;

    .address-items {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .address-item {
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

        .address-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;

          .name {
            font-size: 16px;
            font-weight: 600;
            color: $text-primary;
          }

          .phone {
            font-size: 14px;
            color: $text-secondary;
          }
        }

        .address-detail {
          font-size: 14px;
          color: $text-regular;
        }
      }
    }
  }
}
</style>

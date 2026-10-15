<template>
  <div class="order-create-page">
    <el-breadcrumb separator="/" class="breadcrumb">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>确认订单</el-breadcrumb-item>
    </el-breadcrumb>

    <el-card v-loading="loading" shadow="never" class="main-card">
      <template #header>
        <div class="card-header">
          <span>确认订单</span>
        </div>
      </template>

      <div v-if="error" class="error-block">
        <el-result icon="warning" title="无法确认订单" :sub-title="error">
          <template #extra>
            <el-button type="primary" @click="router.push('/')">去首页</el-button>
          </template>
        </el-result>
      </div>

      <div v-else class="create-content">
        <!-- 收货地址 -->
        <div class="section">
          <div class="section-title">收货地址</div>
          <div v-if="addresses.length === 0" class="empty-address">
            <span>您还没有收货地址</span>
            <el-button type="primary" link @click="goAddressPage">去添加</el-button>
          </div>
          <el-radio-group v-else v-model="selectedAddressId" class="address-list">
            <el-radio
              v-for="addr in addresses"
              :key="addr.addressId"
              :label="addr.addressId"
              class="address-item"
              border
            >
              <div class="address-body">
                <div class="address-line">
                  <span class="receiver">{{ addr.receiverName }}</span>
                  <span class="phone">{{ addr.receiverPhone }}</span>
                  <el-tag v-if="addr.isDefault" size="small" type="danger">默认</el-tag>
                </div>
                <div class="address-detail">{{ formatAddress(addr) }}</div>
              </div>
            </el-radio>
          </el-radio-group>
        </div>

        <!-- 商品信息 -->
        <div class="section">
          <div class="section-title">商品信息</div>
          <div class="product-list">
            <div v-for="item in skuItems" :key="item.skuId" class="product-item">
              <el-image :src="item.images?.[0]" fit="cover" class="product-image">
                <template #error>
                  <div class="image-slot"><el-icon><Picture /></el-icon></div>
                </template>
              </el-image>
              <div class="product-info">
                <div class="product-name">{{ item.skuName || item.skuCode }}</div>
                <div class="product-specs" v-if="item.specifications">
                  {{ formatSpecs(item.specifications) }}
                </div>
              </div>
              <div class="product-price">¥{{ Number(item.price).toFixed(2) }}</div>
              <div class="product-qty">x{{ item.quantity }}</div>
              <div class="product-total">¥{{ (Number(item.price) * Number(item.quantity)).toFixed(2) }}</div>
            </div>
          </div>
        </div>

        <!-- 备注 -->
        <div class="section">
          <div class="section-title">订单备注</div>
          <el-input v-model="remark" type="textarea" :rows="2" maxlength="200" show-word-limit placeholder="选填，请填写和订单相关的备注" />
        </div>

        <!-- 金额汇总 -->
        <div class="section amount-section">
          <div class="amount-row">
            <span>商品总额：</span>
            <span>¥{{ totalAmount }}</span>
          </div>
          <div class="amount-row">
            <span>运费：</span>
            <span>¥0.00</span>
          </div>
          <div class="amount-row total">
            <span>应付总额：</span>
            <span class="total-price">¥{{ totalAmount }}</span>
          </div>
        </div>

        <div class="submit-bar">
          <span class="submit-total">
            应付总额：<em>¥{{ totalAmount }}</em>
          </span>
          <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">提交订单</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { getAddressList } from '@/api/user'
import { getProductDetail, getStockInfo } from '@/api/product'
import { createOrder } from '@/api/order'
import { getSelectedCartItems, removeSelectedCartItems } from '@/api/cart'
import { useCartStore } from '@/stores/cart'
import type { AddressInfo, CartItem, CreateOrderItem, ProductDetail, ProductSku, StockInfo } from '@/types'

const router = useRouter()
const route = useRoute()
const cartStore = useCartStore()

const loading = ref(false)
const submitting = ref(false)
const error = ref('')

const addresses = ref<AddressInfo[]>([])
const selectedAddressId = ref('')
const remark = ref('')

// skuId -> 数量；来自 query.skuId / query.quantity，后续可扩展多商品
const skuQuantityMap = ref<Record<string, number>>({})
const querySpuId = ref<string | undefined>(undefined)
const skuItems = ref<Array<{ skuId: string; skuCode: string; skuName: string; price: number; stock: number | string; specifications: Record<string, string> | string; images?: string[]; spuId: string; quantity: number }>>([])

/** 计算总价（展示用，实际金额以后端返回为准）
 *  注意 price 来自后端，被 JsonConfig 序列化为 string，
 *  必须先 Number() 再累加，否则首轮就是字符串拼接（"1010" 而不是 20.00）。 */
const totalAmount = computed(() => {
  const sum = skuItems.value.reduce((acc, cur) => acc + Number(cur.price) * Number(cur.quantity), 0)
  return sum.toFixed(2)
})

const formatAddress = (addr: AddressInfo) => {
  return addr.fullAddress
    || [addr.province, addr.city, addr.district, addr.detailAddress].filter(Boolean).join(' ')
}

const formatSpecs = (specs: Record<string, string> | string) => {
  if (typeof specs === 'string') return specs
  if (!specs || typeof specs !== 'object') return ''
  return Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join(' / ')
}

const goAddressPage = () => {
  router.push('/user/addresses')
}

// 是否为购物车结算（/order/create?from=cart）
const fromCart = ref(false)

const parseQuery = () => {
  if (route.query.from === 'cart') {
    fromCart.value = true
    return true
  }
  const skuId = route.query.skuId as string | undefined
  const spuId = route.query.spuId as string | undefined
  const quantity = Number(route.query.quantity || 1)
  if (!skuId) {
    error.value = '缺少商品参数，请从商品详情页进入'
    return false
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    error.value = '购买数量不合法'
    return false
  }
  skuQuantityMap.value = { [skuId]: Math.floor(quantity) }
  querySpuId.value = spuId
  return true
}

/** 购物车结算：直接取后端已勾选项，包含商品名/图片/价格/库存 */
const fetchCartItems = async () => {
  const res: any = await getSelectedCartItems()
  const list: CartItem[] = res?.data ?? []
  if (list.length === 0) {
    error.value = '购物车中没有已勾选的商品'
    return
  }
  skuItems.value = list.map((item) => ({
    skuId: item.skuId,
    skuCode: item.skuId,
    skuName: item.productName,
    price: item.price,
    stock: item.stock,
    specifications: item.specifications || '',
    images: item.productImage ? [item.productImage] : [],
    spuId: item.spuId,
    quantity: item.quantity,
  }))
}

const fetchAddresses = async () => {
  const res: any = await getAddressList()
  const list = res?.data ?? res ?? []
  addresses.value = list
  const def = list.find((a: AddressInfo) => a.isDefault)
  selectedAddressId.value = def ? def.addressId : (list[0]?.addressId || '')
}

const fetchSkuItems = async () => {
  const entries = Object.entries(skuQuantityMap.value)
  const detailPromises = entries.map(async ([skuId, quantity]) => {
    const spuId = querySpuId.value
    // 有 spuId 时直接查详情；否则退化为仅靠库存接口拿不到商品名
    const detailRes = spuId ? await getProductDetail(Number(spuId)) : null
    const detail = (detailRes?.data ?? detailRes) as ProductDetail | null
    const sku = detail?.skuList?.find((s: ProductSku) => String(s.skuId) === String(skuId))
    if (sku) {
      return {
        ...sku,
        spuId: String(spuId),
        quantity,
      }
    }
    // 兜底：用库存接口补最小信息
    const stockRes = await getStockInfo(Number(skuId))
    const stock = (stockRes?.data ?? stockRes) as StockInfo | null
    return {
      skuId,
      skuCode: `SKU-${skuId}`,
      skuName: '',
      price: 0,
      stock: stock?.stock ?? 0,
      specifications: '',
      images: [],
      spuId: spuId || '',
      quantity,
    }
  })
  skuItems.value = await Promise.all(detailPromises)
}

onMounted(async () => {
  if (!parseQuery()) return
  loading.value = true
  try {
    await fetchAddresses()
    if (fromCart.value) {
      await fetchCartItems()
    } else {
      await fetchSkuItems()
    }
    if (skuItems.value.some((item) => !item.skuId)) {
      error.value = '商品信息获取失败，请稍后重试'
    }
  } catch (e: any) {
    console.error('加载确认订单页失败', e)
    error.value = '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
})

const handleSubmit = async () => {
  if (!selectedAddressId.value) {
    ElMessage.warning('请选择收货地址')
    return
  }
  if (skuItems.value.length === 0) {
    ElMessage.warning('没有可提交的商品')
    return
  }
  const outOfStock = skuItems.value.find((item) => item.quantity > Number(item.stock))
  if (outOfStock) {
    ElMessage.warning('部分商品库存不足，请返回商品页确认')
    return
  }

  const items: CreateOrderItem[] = skuItems.value.map((item) => ({
    skuId: String(item.skuId),
    quantity: item.quantity,
  }))

  submitting.value = true
  try {
    const res: any = await createOrder({
      addressId: selectedAddressId.value,
      remark: remark.value || undefined,
      items,
    })
    const orderDetail = res?.data ?? res
    const orderNo = orderDetail?.orderNo
    if (!orderNo) {
      ElMessage.error('下单失败，请稍后重试')
      return
    }
    // 购物车结算成功后移除已下单商品，失败不影响下单结果
    if (fromCart.value) {
      try {
        await removeSelectedCartItems()
        cartStore.refreshCount()
      } catch (e) {
        console.warn('清理购物车失败', e)
      }
    }
    ElMessage.success('下单成功，请尽快支付')
    router.replace({ path: '/payment', query: { orderNo } })
  } catch (e: any) {
    console.error('提交订单失败', e)
    ElMessage.error(e?.message || '提交订单失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.order-create-page {
  padding: 20px;
  min-height: calc(100vh - 60px);

  .breadcrumb {
    max-width: 1200px;
    margin: 0 auto 20px;
  }

  .main-card {
    max-width: 1200px;
    margin: 0 auto;
    border-radius: $radius-md;
  }

  .create-content {
    .section {
      padding: 16px 0;
      border-bottom: 1px solid $border-color-light;

      .section-title {
        font-size: 15px;
        font-weight: 600;
        margin-bottom: 12px;
        color: $text-primary;
      }
    }

    .empty-address {
      display: flex;
      align-items: center;
      gap: 8px;
      color: $text-secondary;
    }

    .address-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;

      :deep(.el-radio) {
        margin-right: 0;
        width: 100%;
        height: auto;
        align-items: flex-start;
        padding: 12px 16px;
      }

      :deep(.el-radio__label) {
        width: 100%;
      }

      .address-body {
        .address-line {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4px;

          .receiver {
            font-weight: 600;
          }

          .phone {
            color: $text-regular;
          }
        }

        .address-detail {
          color: $text-regular;
          font-size: 13px;
          line-height: 1.5;
        }
      }
    }

    .product-list {
      .product-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px 0;
        border-bottom: 1px dashed $border-color-light;

        &:last-child {
          border-bottom: none;
        }

        .product-image {
          width: 72px;
          height: 72px;
          border-radius: $radius-sm;
          flex-shrink: 0;
        }

        .image-slot {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          background: #f5f7fa;
          color: #909399;
        }

        .product-info {
          flex: 1;
          min-width: 0;

          .product-name {
            font-weight: 500;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .product-specs {
            font-size: 12px;
            color: $text-secondary;
            margin-top: 4px;
          }
        }

        .product-price,
        .product-qty,
        .product-total {
          color: $text-regular;
          font-size: 14px;
          min-width: 80px;
          text-align: right;
        }

        .product-total {
          font-weight: 600;
          color: $text-primary;
        }
      }
    }

    .amount-section {
      .amount-row {
        display: flex;
        justify-content: flex-end;
        gap: 24px;
        padding: 4px 0;
        color: $text-regular;

        &.total {
          font-size: 15px;
          color: $text-primary;
          font-weight: 600;

          .total-price {
            color: $danger-color;
            font-size: 20px;
          }
        }
      }
    }
  }

  .submit-bar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 24px;
    padding-top: 16px;

    .submit-total {
      color: $text-regular;

      em {
        font-style: normal;
        color: $danger-color;
        font-size: 22px;
        font-weight: 700;
      }
    }
  }
}
</style>

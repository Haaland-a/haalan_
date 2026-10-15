<template>
  <div class="cart-page">
    <div class="page-container">
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>购物车</el-breadcrumb-item>
      </el-breadcrumb>

      <div class="page-header">
        <h2 class="page-title">我的购物车</h2>
        <span v-if="cart.totalCount > 0" class="page-subtitle">
          共 {{ cart.totalCount }} 种商品
        </span>
      </div>

      <el-skeleton :rows="6" animated v-if="loading" />

      <el-empty v-else-if="cart.items.length === 0" description="购物车还是空的">
        <el-button type="primary" @click="router.push('/products')">去逛逛</el-button>
      </el-empty>

      <div v-else class="cart-content">
        <!-- 表头 -->
        <div class="cart-head">
          <div class="col-check">
            <el-checkbox
              :model-value="allSelected"
              :indeterminate="indeterminate"
              @change="handleSelectAll"
            >
              全选
            </el-checkbox>
          </div>
          <div class="col-product">商品信息</div>
          <div class="col-price">单价</div>
          <div class="col-qty">数量</div>
          <div class="col-total">小计</div>
          <div class="col-action">操作</div>
        </div>

        <!-- 商品行 -->
        <div class="cart-list">
          <div
            v-for="item in cart.items"
            :key="item.id"
            class="cart-row"
            :class="{ invalid: !item.valid }"
          >
            <div class="col-check">
              <el-checkbox
                :model-value="item.selected === 1"
                :disabled="!item.valid"
                @change="(val: any) => handleSelect(item, val)"
              />
            </div>

            <div class="col-product">
              <el-image :src="item.productImage" fit="cover" class="row-image" @click="goProduct(item)">
                <template #error>
                  <div class="image-fallback"><el-icon><Picture /></el-icon></div>
                </template>
              </el-image>
              <div class="row-info">
                <div class="row-name" @click="goProduct(item)">{{ item.productName }}</div>
                <div v-if="item.specifications" class="row-specs">
                  {{ formatSpecs(item.specifications) }}
                </div>
                <el-tag v-if="!item.valid" size="small" type="danger" effect="plain">
                  {{ item.invalidReason || '商品已失效' }}
                </el-tag>
                <span v-else-if="item.stock <= 5" class="row-stock-warn">
                  仅剩 {{ item.stock }} 件
                </span>
              </div>
            </div>

            <div class="col-price">¥{{ formatPrice(item.price) }}</div>

            <div class="col-qty">
              <el-input-number
                :model-value="item.quantity"
                :min="1"
                :max="Math.max(1, item.stock)"
                :disabled="!item.valid"
                size="small"
                @change="(val: any) => handleQuantityChange(item, val)"
              />
            </div>

            <div class="col-total">
              <span class="row-total">¥{{ formatPrice(item.totalPrice) }}</span>
            </div>

            <div class="col-action">
              <el-button type="danger" link @click="handleRemove(item)">删除</el-button>
            </div>
          </div>
        </div>

        <!-- 结算栏 -->
        <div class="cart-footer">
          <div class="footer-left">
            <el-checkbox
              :model-value="allSelected"
              :indeterminate="indeterminate"
              @change="handleSelectAll"
            >
              全选
            </el-checkbox>
            <el-button type="danger" link :disabled="selectedItems.length === 0" @click="handleBatchRemove">
              删除选中
            </el-button>
            <el-button type="danger" link @click="handleClear">清空购物车</el-button>
          </div>

          <div class="footer-right">
            <div class="footer-summary">
              <span class="summary-label">已选 <em>{{ selectedQuantity }}</em> 件</span>
              <span class="summary-amount">
                合计：<em>¥{{ formatPrice(cart.selectedAmount) }}</em>
              </span>
            </div>
            <el-button
              type="primary"
              size="large"
              :disabled="selectedItems.length === 0"
              @click="handleCheckout"
            >
              去结算
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import {
  getCart,
  updateCartQuantity,
  removeCartItem,
  removeCartItems,
  clearCart,
  selectCartItem,
  selectAllCartItems
} from '@/api/cart'
import { useCartStore } from '@/stores/cart'
import { formatPrice } from '@/utils/common'
import type { CartInfo, CartItem } from '@/types'

const router = useRouter()
const cartStore = useCartStore()

const loading = ref(false)
const cart = ref<CartInfo>({
  items: [],
  totalCount: 0,
  totalQuantity: 0,
  selectedAmount: 0
})

const validItems = computed(() => cart.value.items.filter((i) => i.valid))
const selectedItems = computed(() => validItems.value.filter((i) => i.selected === 1))
const selectedQuantity = computed(() =>
  selectedItems.value.reduce((acc, cur) => acc + cur.quantity, 0)
)
const allSelected = computed(
  () => validItems.value.length > 0 && selectedItems.value.length === validItems.value.length
)
const indeterminate = computed(
  () => selectedItems.value.length > 0 && selectedItems.value.length < validItems.value.length
)

const formatSpecs = (specs: Record<string, string> | null) => {
  if (!specs) return ''
  return Object.entries(specs)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' / ')
}

const fetchCart = async () => {
  loading.value = true
  try {
    const res: any = await getCart()
    cart.value = res?.data ?? res
    if (!cart.value.items) {
      cart.value = { items: [], totalCount: 0, totalQuantity: 0, selectedAmount: 0 }
    }
    cartStore.refreshCount()
  } catch (e: any) {
    ElMessage.error(e?.message || '获取购物车失败')
  } finally {
    loading.value = false
  }
}

const handleQuantityChange = async (item: CartItem, quantity: number | undefined) => {
  if (!quantity || quantity === item.quantity) return
  try {
    await updateCartQuantity(item.id, quantity)
    await fetchCart()
  } catch (e: any) {
    ElMessage.error(e?.message || '修改数量失败')
    await fetchCart()
  }
}

const handleSelect = async (item: CartItem, val: any) => {
  try {
    await selectCartItem(item.id, val ? 1 : 0)
    await fetchCart()
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  }
}

const handleSelectAll = async (val: any) => {
  try {
    await selectAllCartItems(val ? 1 : 0)
    await fetchCart()
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  }
}

const handleRemove = async (item: CartItem) => {
  try {
    await ElMessageBox.confirm('确定要从购物车移除该商品吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await removeCartItem(item.id)
    ElMessage.success('已移除')
    await fetchCart()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e?.message || '移除失败')
    }
  }
}

const handleBatchRemove = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedItems.value.length} 件商品吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await removeCartItems(selectedItems.value.map((i) => i.id))
    ElMessage.success('已删除')
    await fetchCart()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e?.message || '删除失败')
    }
  }
}

const handleClear = async () => {
  try {
    await ElMessageBox.confirm('确定要清空购物车吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await clearCart()
    ElMessage.success('购物车已清空')
    await fetchCart()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e?.message || '清空失败')
    }
  }
}

const goProduct = (item: CartItem) => {
  if (item.spuId) {
    router.push(`/product/${item.spuId}`)
  }
}

const handleCheckout = () => {
  // 结算页从购物车读取已勾选项（from=cart），不通过 URL 传商品明细
  router.push({ path: '/order/create', query: { from: 'cart' } })
}

onMounted(() => {
  fetchCart()
})
</script>

<style scoped lang="scss">
.cart-page {
  padding: 20px;
  min-height: calc(100vh - 64px);
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
}

.breadcrumb {
  margin-bottom: 16px;
}

.page-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;

  .page-title {
    font-size: 22px;
    font-weight: 700;
    color: $text-primary;
    margin: 0;
  }

  .page-subtitle {
    font-size: 13px;
    color: $text-secondary;
  }
}

.cart-content {
  background: $bg-primary;
  border: 1px solid $border-color-lighter;
  border-radius: $radius-lg;
  overflow: hidden;
}

.cart-head,
.cart-row {
  display: grid;
  grid-template-columns: 60px minmax(280px, 1fr) 120px 150px 130px 90px;
  align-items: center;
  gap: 12px;
}

.cart-head {
  padding: 14px 20px;
  background: $bg-secondary;
  border-bottom: 1px solid $border-color-lighter;
  font-size: 13px;
  font-weight: 600;
  color: $text-regular;
}

.cart-list {
  .cart-row {
    padding: 20px;
    border-bottom: 1px solid $border-color-lighter;
    transition: background 0.2s;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: $bg-secondary;
    }

    &.invalid {
      opacity: 0.6;
    }
  }
}

.col-check {
  display: flex;
  align-items: center;
}

.col-product {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;

  .row-image {
    width: 80px;
    height: 80px;
    border-radius: $radius-md;
    background: $bg-tertiary;
    flex-shrink: 0;
    cursor: pointer;
  }

  .image-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $text-placeholder;
    font-size: 24px;
    background: $bg-tertiary;
  }

  .row-info {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .row-name {
    font-size: 14px;
    font-weight: 500;
    color: $text-primary;
    line-height: 1.4;
    cursor: pointer;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;

    &:hover {
      color: $primary-color;
    }
  }

  .row-specs {
    font-size: 12px;
    color: $text-secondary;
  }

  .row-stock-warn {
    font-size: 12px;
    color: $warning-color;
  }
}

.col-price {
  font-size: 14px;
  color: $text-regular;
}

.col-total {
  .row-total {
    font-size: 16px;
    font-weight: 700;
    color: $danger-color;
  }
}

.cart-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 20px;
  background: $bg-secondary;
  border-top: 1px solid $border-color-lighter;
  position: sticky;
  bottom: 0;
  flex-wrap: wrap;

  .footer-left {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .footer-right {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .footer-summary {
    display: flex;
    align-items: baseline;
    gap: 20px;
    font-size: 14px;
    color: $text-regular;

    em {
      font-style: normal;
      font-weight: 700;
      color: $danger-color;
    }

    .summary-amount em {
      font-size: 22px;
    }
  }
}

@media (max-width: 992px) {
  .cart-head {
    display: none;
  }

  .cart-row {
    grid-template-columns: 40px 1fr;
    grid-template-areas:
      'check product'
      '. price'
      '. qty'
      '. total'
      '. action';
    row-gap: 12px;

    .col-check { grid-area: check; }
    .col-product { grid-area: product; }
    .col-price { grid-area: price; }
    .col-qty { grid-area: qty; }
    .col-total { grid-area: total; }
    .col-action { grid-area: action; }
  }

  .cart-footer {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

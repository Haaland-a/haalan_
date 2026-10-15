<template>
  <div class="product-card" @click="goDetail">
    <div class="card-image">
      <el-image :src="product.mainImage" fit="cover" lazy>
        <template #error>
          <div class="image-fallback">
            <el-icon><Picture /></el-icon>
          </div>
        </template>
        <template #placeholder>
          <div class="image-fallback">
            <el-icon class="is-loading"><Loading /></el-icon>
          </div>
        </template>
      </el-image>
      <div v-if="soldOut" class="sold-out-mask">已售罄</div>
    </div>

    <div class="card-body">
      <h3 class="card-title" :title="product.spuName">{{ product.spuName }}</h3>

      <div class="card-price">
        <span class="price-symbol">¥</span>
        <span class="price-value">{{ formatPrice(product.minPrice) }}</span>
        <span v-if="hasRange" class="price-range">起</span>
      </div>

      <div class="card-meta">
        <span class="sales">已售 {{ product.sales || 0 }}</span>
        <el-tag v-if="skuCount > 1" size="small" type="info" effect="plain">
          {{ skuCount }} 种规格
        </el-tag>
      </div>
    </div>

    <div class="card-actions" @click.stop>
      <el-button
        type="primary"
        size="small"
        :icon="ShoppingCart"
        :disabled="soldOut"
        @click="handleAdd"
      >
        加入购物车
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Picture, Loading, ShoppingCart } from '@element-plus/icons-vue'
import { addToCart } from '@/api/cart'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import { formatPrice } from '@/utils/common'
import type { ProductSpu } from '@/types'

const props = defineProps<{
  product: ProductSpu
}>()

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()

const skuCount = computed(() => props.product.skuList?.length || 0)
const hasRange = computed(() => Number(props.product.maxPrice) > Number(props.product.minPrice))

/** 所有 SKU 都无库存（或无 SKU 信息）视为售罄 */
const soldOut = computed(() => {
  const skus = props.product.skuList
  if (!skus || skus.length === 0) return false
  return skus.every((sku) => Number(sku.stock) === 0)
})

/** 取第一个有库存的 SKU，用于列表页快捷加购 */
const firstAvailableSku = computed(() => {
  const skus = props.product.skuList || []
  return skus.find((sku) => Number(sku.stock) > 0) || skus[0]
})

const goDetail = () => {
  router.push(`/product/${props.product.spuId}`)
}

const handleAdd = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
    return
  }

  const sku = firstAvailableSku.value
  // 多规格商品需要到详情页选规格，避免加错
  if (!sku || (props.product.skuList?.length || 0) > 1) {
    ElMessage.info('该商品有多个规格，请进入详情页选择')
    goDetail()
    return
  }

  try {
    await addToCart(sku.skuId, 1)
    ElMessage.success('已加入购物车')
    cartStore.refreshCount()
  } catch (e: any) {
    ElMessage.error(e?.message || '加入购物车失败')
  }
}
</script>

<style scoped lang="scss">
.product-card {
  background: $bg-primary;
  border: 1px solid $border-color-lighter;
  border-radius: $radius-lg;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-md;
    border-color: $border-color;
  }

  .card-image {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    background: $bg-tertiary;
    overflow: hidden;

    :deep(.el-image) {
      width: 100%;
      height: 100%;
      display: block;
    }

    .image-fallback {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: $bg-tertiary;
      color: $text-placeholder;
      font-size: 28px;
    }

    .sold-out-mask {
      position: absolute;
      inset: 0;
      background: rgba(30, 41, 59, 0.45);
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      letter-spacing: 1px;
    }
  }

  .card-body {
    padding: 12px 14px 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .card-title {
    font-size: 14px;
    font-weight: 500;
    color: $text-primary;
    line-height: 1.45;
    height: 40px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    margin: 0;
  }

  .card-price {
    display: flex;
    align-items: baseline;
    gap: 2px;
    color: $danger-color;

    .price-symbol {
      font-size: 13px;
      font-weight: 600;
    }

    .price-value {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.3px;
    }

    .price-range {
      font-size: 12px;
      color: $text-secondary;
      margin-left: 4px;
    }
  }

  .card-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;

    .sales {
      font-size: 12px;
      color: $text-secondary;
    }
  }

  .card-actions {
    padding: 12px 14px 14px;

    .el-button {
      width: 100%;
    }
  }
}
</style>

<template>
  <div class="product-detail-page">
    <el-skeleton :rows="10" animated v-if="loading" />
    
    <div v-else-if="productDetail" class="detail-container">
      <!-- 面包屑导航 -->
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>商品详情</el-breadcrumb-item>
      </el-breadcrumb>

      <div class="product-main">
        <!-- 商品图片 -->
        <div class="product-gallery">
          <el-carousel 
            v-if="productDetail.images && productDetail.images.length > 0"
            trigger="click"
            height="400px"
            arrow="always"
          >
            <el-carousel-item v-for="(img, index) in productDetail.images" :key="index">
              <el-image 
                :src="img" 
                fit="contain"
                style="width: 100%; height: 100%"
              />
            </el-carousel-item>
          </el-carousel>
          <el-image 
            v-else
            :src="productDetail.mainImage" 
            fit="contain"
            class="main-image"
          />
        </div>

        <!-- 商品信息 -->
        <div class="product-info">
          <h1 class="product-name">{{ productDetail.spuName }}</h1>
          
          <div class="price-section">
            <div class="price-label">价格</div>
            <div class="price-value">
              <span class="current-price">¥{{ calculateMinPrice().toFixed(2) }}</span>
              <span v-if="calculateMaxPrice() > calculateMinPrice()" class="price-range">
                - ¥{{ calculateMaxPrice().toFixed(2) }}
              </span>
            </div>
          </div>

          <div class="info-section">
            <div class="info-row">
              <span class="label">销量</span>
              <span class="value">{{ selectedSku?.soldCount || '0' }}</span>
            </div>
            <div class="info-row">
              <span class="label">品牌</span>
              <span class="value">{{ productDetail.brandName || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">分类</span>
              <span class="value">{{ productDetail.categoryName || '-' }}</span>
            </div>
          </div>

          <div class="description-section">
            <h4>商品描述</h4>
            <p>{{ productDetail.description || '暂无描述' }}</p>
          </div>

          <!-- SKU选择 -->
          <div v-if="productDetail.skuList && productDetail.skuList.length > 0" class="sku-section">
            <h4>选择规格</h4>
            <div class="sku-list">
              <div 
                v-for="sku in productDetail.skuList" 
                :key="sku.skuId"
                class="sku-item"
                :class="{ active: selectedSku?.skuId === sku.skuId }"
                @click="selectSku(sku)"
              >
                <div class="sku-name">{{ sku.skuName }}</div>
                <div class="sku-specs">
                  {{ formatSpecs(sku.specifications) }}
                </div>
                <div class="sku-price">¥{{ sku.price.toFixed(2) }}</div>
                <div class="sku-stock">库存：{{ sku.stock }}</div>
              </div>
            </div>
          </div>

          <!-- 购买数量 -->
          <div class="quantity-section">
            <span class="label">数量</span>
            <el-input-number
              v-model="quantity"
              :min="1"
              :max="maxQuantity"
              :disabled="!selectedSku || Number(selectedSku.stock) === 0"
              size="large"
            />
            <span v-if="selectedSku" class="stock-hint">
              库存 {{ selectedSku.stock }} 件
            </span>
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <el-button 
              type="primary" 
              size="large"
              :disabled="!selectedSku || Number(selectedSku.stock) === 0"
              @click="handleBuyNow"
            >
              立即购买
            </el-button>
            <el-button
              size="large"
              :icon="ShoppingCart"
              :disabled="!selectedSku || Number(selectedSku.stock) === 0"
              :loading="addingToCart"
              @click="handleAddToCart"
            >
              加入购物车
            </el-button>
          </div>
        </div>
      </div>

      <!-- 商品详情 -->
      <div class="product-detail-content">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="商品描述" name="detail">
            <div class="detail-content">
              <p>{{ productDetail.description || '暂无详细描述' }}</p>
            </div>
          </el-tab-pane>
          <el-tab-pane label="规格参数" name="specs">
            <div v-if="selectedSku && selectedSku.specifications" class="specs-content">
              <el-descriptions :column="2" border>
                <el-descriptions-item 
                  v-for="(value, key) in selectedSku.specifications" 
                  :key="key"
                  :label="key"
                >
                  {{ value }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
            <el-empty v-else description="暂无规格信息" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <el-empty v-else description="商品不存在" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ShoppingCart } from '@element-plus/icons-vue'
import { getProductDetail } from '@/api/product'
import { addToCart } from '@/api/cart'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import type { ProductDetail, SkuInfo } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()

// 状态
const loading = ref(false)
const quantity = ref(1)
const addingToCart = ref(false)
const productDetail = ref<ProductDetail | null>(null)
const selectedSku = ref<SkuInfo | null>(null)
const activeTab = ref('detail')

// 获取商品详情
const fetchProductDetail = async () => {
  const spuId = Number(route.params.spuId)
  if (!spuId) {
    ElMessage.error('商品ID无效')
    return
  }

  loading.value = true
  try {
    const res = await getProductDetail(spuId)
    productDetail.value = res.data

    // 默认选中第一个SKU
    if (res.data.skuList && res.data.skuList.length > 0) {
      selectedSku.value = res.data.skuList[0]
    }
  } catch (error: any) {
    console.error('获取商品详情失败:', error)
    ElMessage.error(error.message || '获取商品详情失败')
  } finally {
    loading.value = false
  }
}

// 选择SKU
const selectSku = (sku: SkuInfo) => {
  selectedSku.value = sku
  // 切换规格时数量重置，避免超出新规格库存
  quantity.value = 1
}

// 可选数量上限
const maxQuantity = computed(() => {
  const stock = Number(selectedSku.value?.stock ?? 0)
  return stock > 0 ? stock : 1
})

// 格式化规格
const formatSpecs = (specs: Record<string, string>) => {
  return Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join(', ')
}

// 计算最低价格
const calculateMinPrice = () => {
  if (!productDetail.value?.skuList || productDetail.value.skuList.length === 0) {
    return 0
  }
  return Math.min(...productDetail.value.skuList.map(sku => sku.price))
}

// 计算最高价格
const calculateMaxPrice = () => {
  if (!productDetail.value?.skuList || productDetail.value.skuList.length === 0) {
    return 0
  }
  return Math.max(...productDetail.value.skuList.map(sku => sku.price))
}

// 立即购买
const handleBuyNow = () => {
  if (!selectedSku.value) {
    ElMessage.warning('请选择商品规格')
    return
  }

  if (Number(selectedSku.value.stock) === 0) {
    ElMessage.warning('该规格已售罄')
    return
  }

  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }

  router.push({
    path: '/order/create',
    query: {
      spuId: productDetail.value?.spuId,
      skuId: selectedSku.value.skuId,
      quantity: quantity.value,
    },
  })
}

// 加入购物车
const handleAddToCart = async () => {
  if (!selectedSku.value) {
    ElMessage.warning('请选择商品规格')
    return
  }

  if (Number(selectedSku.value.stock) === 0) {
    ElMessage.warning('该规格已售罄')
    return
  }

  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }

  addingToCart.value = true
  try {
    await addToCart(selectedSku.value.skuId, quantity.value)
    ElMessage.success('已加入购物车')
    cartStore.refreshCount()
  } catch (error: any) {
    ElMessage.error(error?.message || '加入购物车失败')
  } finally {
    addingToCart.value = false
  }
}

onMounted(() => {
  fetchProductDetail()
})
</script>

<style scoped lang="scss">
.product-detail-page {
  padding: 20px;
  min-height: calc(100vh - 60px);
  
  .breadcrumb {
    max-width: 1200px;
    margin: 0 auto 20px;
  }

  .detail-container {
    max-width: 1200px;
    margin: 0 auto;
    background: #fff;
    border-radius: $radius-md;
  }

  .product-main {
    display: grid;
    grid-template-columns: 500px 1fr;
    gap: 40px;
    padding: 24px;

    .product-gallery {
      .main-image {
        width: 100%;
        height: 400px;
        border-radius: 8px;
      }
    }

    .product-info {
      .product-name {
        font-size: 24px;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: 24px;
      }

      .price-section {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
        background: linear-gradient(135deg, rgba($danger-color, 0.1) 0%, transparent 100%);
        border-radius: 8px;
        margin-bottom: 24px;

        .price-label {
          font-size: 14px;
          color: $text-secondary;
        }

        .price-value {
          .current-price {
            font-size: 32px;
            font-weight: 700;
            color: $danger-color;
          }

          .price-range {
            font-size: 20px;
            color: $danger-color;
            margin-left: 8px;
          }
        }
      }

      .info-section {
        margin-bottom: 24px;

        .info-row {
          display: flex;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid $border-color-lighter;

          .label {
            width: 80px;
            font-size: 14px;
            color: $text-secondary;
          }

          .value {
            font-size: 14px;
            color: $text-primary;
          }
        }
      }

      .description-section {
        margin-bottom: 24px;

        h4 {
          font-size: 16px;
          color: $text-primary;
          margin-bottom: 12px;
        }

        p {
          font-size: 14px;
          color: $text-regular;
          line-height: 1.8;
        }
      }

      .sku-section {
        margin-bottom: 24px;

        h4 {
          font-size: 16px;
          color: $text-primary;
          margin-bottom: 12px;
        }

        .sku-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;

          .sku-item {
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

            .sku-name {
              font-size: 14px;
              font-weight: 600;
              color: $text-primary;
              margin-bottom: 8px;
            }

            .sku-specs {
              font-size: 12px;
              color: $text-secondary;
              margin-bottom: 8px;
            }

            .sku-price {
              font-size: 18px;
              font-weight: 600;
              color: $danger-color;
              margin-bottom: 4px;
            }

            .sku-stock {
              font-size: 12px;
              color: $text-secondary;
            }
          }
        }
      }

      .quantity-section {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;

        .label {
          font-size: 14px;
          color: $text-regular;
          min-width: 40px;
        }

        .stock-hint {
          font-size: 13px;
          color: $text-secondary;
        }
      }

      .action-buttons {
        display: flex;
        gap: 16px;

        .el-button {
          flex: 1;
        }
      }
    }
  }

  .product-detail-content {
    padding: 24px;
    border-top: 1px solid $border-color-lighter;

    .detail-html {
      padding: 20px 0;
      line-height: 1.8;
      color: $text-regular;
    }
  }
}
</style>

@media (max-width: 768px) {
  .product-detail-page {
    .product-main {
      grid-template-columns: 1fr;
    }
  }
}
<template>
  <div class="home-page">
    <!-- Hero Banner -->
    <section class="hero-section">
      <div class="hero-container">
        <div class="hero-text">
          <h1 class="hero-title">限时秒杀，<br/>超值好物等你来抢</h1>
          <p class="hero-subtitle">每日精选品质好物，低至一折起</p>
          <div class="hero-search">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索你想要的商品..."
              size="large"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
              <template #append>
                <el-button type="primary" @click="handleSearch">搜索</el-button>
              </template>
            </el-input>
          </div>
        </div>
        <div class="hero-visual">
          <div class="hero-card">
            <div class="hero-card-icon">⚡</div>
            <div class="hero-card-value">限时秒杀</div>
            <div class="hero-card-label">每日多场，准时开抢</div>
          </div>
          <div class="hero-card hero-card-2">
            <div class="hero-card-icon">🏆</div>
            <div class="hero-card-value">正品保障</div>
            <div class="hero-card-label">品质承诺，放心购买</div>
          </div>
          <div class="hero-card hero-card-3">
            <div class="hero-card-icon">🚚</div>
            <div class="hero-card-value">极速发货</div>
            <div class="hero-card-label">下单即发，闪电送达</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 秒杀专区（置顶保留） -->
    <section class="section seckill-section">
      <div class="section-container">
        <div class="section-header">
          <div class="section-title-group">
            <span class="section-badge">⚡</span>
            <h2 class="section-title">火热进行中</h2>
          </div>
          <span class="section-subtitle">限时秒杀，不容错过</span>
        </div>

        <el-skeleton :rows="3" animated v-if="loadingActivities" />

        <div v-else-if="activities.length > 0" class="activities-grid">
          <div
            v-for="activity in activities"
            :key="activity.activityId"
            class="activity-card"
            @click="goToActivity(activity.activityId)"
          >
            <div class="activity-top">
              <h3 class="activity-name">{{ activity.activityName }}</h3>
              <el-tag size="small" :type="getStatusType(activity.status)">
                {{ activity.statusName }}
              </el-tag>
            </div>
            <p class="activity-desc">{{ activity.activityDesc }}</p>
            <div class="activity-meta">
              <div class="meta-item">
                <span class="meta-label">商品数量</span>
                <span class="meta-value">{{ activity.productCount }}</span>
              </div>
              <div class="meta-divider"></div>
              <div class="meta-item">
                <span class="meta-label">开始时间</span>
                <span class="meta-value time">{{ formatTime(activity.startTime) }}</span>
              </div>
            </div>
          </div>
        </div>

        <el-empty v-else description="暂无秒杀活动" :image-size="80" />
      </div>
    </section>

    <!-- 分类楼层：普通商品入口 -->
    <section
      v-for="floor in floors"
      :key="floor.categoryId"
      class="section floor-section"
    >
      <div class="section-container">
        <div class="section-header">
          <div class="section-title-group">
            <h2 class="section-title">{{ floor.name }}</h2>
            <span class="section-subtitle">{{ floor.subtitle }}</span>
          </div>
          <el-button link type="primary" @click="goCategory(floor.categoryId)">
            查看全部 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>

        <el-skeleton :rows="2" animated v-if="floor.loading" />

        <div v-else-if="floor.products.length > 0" class="products-grid">
          <ProductCard
            v-for="product in floor.products"
            :key="product.spuId"
            :product="product"
          />
        </div>

        <el-empty v-else description="该分类暂无商品" :image-size="80" />
      </div>
    </section>

    <!-- 全部商品入口 -->
    <section class="section all-products-section">
      <div class="section-container">
        <div class="all-products-card" @click="router.push('/products')">
          <div class="all-products-text">
            <h3>浏览全部商品</h3>
            <p>发现更多优质好物，支持分类筛选与价格排序</p>
          </div>
          <el-button type="primary" size="large">
            进入商品列表 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ArrowRight } from '@element-plus/icons-vue'
import { getSeckillActivities } from '@/api/seckill'
import { searchProducts, getCategoryTree } from '@/api/product'
import { useCartStore } from '@/stores/cart'
import ProductCard from '@/components/ProductCard.vue'
import type { SeckillActivityBrief, CategoryNode, ProductSpu } from '@/types'
import { formatTime } from '@/utils/common'
import { ElMessage } from 'element-plus'

const router = useRouter()
const cartStore = useCartStore()

const loadingActivities = ref(false)
const activities = ref<SeckillActivityBrief[]>([])
const searchKeyword = ref('')

interface Floor {
  categoryId: string
  name: string
  subtitle: string
  products: ProductSpu[]
  loading: boolean
}

const floors = ref<Floor[]>([])

// 一级分类对应的副标题（无匹配时用通用文案）
const SUBTITLES: Record<string, string> = {
  '1': '当季新款，穿出你的风格',
  '2': '数码好物，科技生活',
  '3': '零食饮料，随时随地'
}

const getStatusType = (status: number) => {
  switch (status) {
    case 0: return 'info'
    case 1: return 'success'
    case 2: return ''
    default: return ''
  }
}

const fetchActivities = async () => {
  loadingActivities.value = true
  try {
    const res: any = await getSeckillActivities(1)
    activities.value = res?.data ?? []
  } catch (error: any) {
    ElMessage.error(error?.message || '获取活动列表失败')
  } finally {
    loadingActivities.value = false
  }
}

/** 拉取分类树的一级分类，并为每个分类建一个楼层 */
const fetchFloors = async () => {
  try {
    const res: any = await getCategoryTree('0', 1)
    const categories: CategoryNode[] = res?.data ?? []

    // 先建立楼层骨架，让页面立刻有结构
    floors.value = categories.map((cat) => ({
      categoryId: cat.categoryId,
      name: cat.name,
      subtitle: SUBTITLES[cat.categoryId] || '精选好物推荐',
      products: [],
      loading: true
    }))

    // 各楼层并行加载商品，互不阻塞
    await Promise.all(
      floors.value.map(async (floor) => {
        try {
          const productRes: any = await searchProducts({
            categoryId: Number(floor.categoryId),
            pageNum: 1,
            pageSize: 8
          })
          floor.products = (productRes?.data?.list as any) ?? []
        } catch (e) {
          floor.products = []
        } finally {
          floor.loading = false
        }
      })
    )
  } catch (error: any) {
    ElMessage.error(error?.message || '加载分类失败')
  }
}

const goToActivity = (activityId: string) => {
  router.push(`/seckill/activity/${activityId}`)
}

const goCategory = (categoryId: string) => {
  router.push({ path: '/products', query: { categoryId } })
}

const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  router.push({
    path: '/product/search',
    query: { keyword: searchKeyword.value.trim() }
  })
}

onMounted(() => {
  fetchActivities()
  fetchFloors()
  cartStore.refreshCount()
})
</script>

<style scoped lang="scss">
.home-page {
  padding-bottom: 40px;
}

/* Hero */
.hero-section {
  background: $gradient-hero-light;
  padding: 48px 0;
}

.hero-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 40px;
  align-items: center;
}

.hero-title {
  font-size: 40px;
  font-weight: 800;
  color: $text-primary;
  line-height: 1.25;
  letter-spacing: -1px;
  margin: 0 0 12px;
}

.hero-subtitle {
  font-size: 16px;
  color: $text-regular;
  margin: 0 0 24px;
}

.hero-search {
  max-width: 520px;
}

.hero-visual {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  .hero-card {
    background: #fff;
    border-radius: $radius-lg;
    padding: 16px;
    box-shadow: $shadow-sm;
    text-align: center;

    &.hero-card-3 {
      grid-column: span 2;
    }

    .hero-card-icon {
      font-size: 24px;
      margin-bottom: 6px;
    }

    .hero-card-value {
      font-size: 14px;
      font-weight: 600;
      color: $text-primary;
    }

    .hero-card-label {
      font-size: 12px;
      color: $text-secondary;
      margin-top: 2px;
    }
  }
}

/* 通用 section */
.section {
  padding: 32px 0;
}

.section-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.section-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-badge {
  font-size: 20px;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: $text-primary;
  margin: 0;
  letter-spacing: -0.3px;
}

.section-subtitle {
  font-size: 13px;
  color: $text-secondary;
}

/* 秒杀活动卡片 */
.seckill-section {
  background: $bg-primary;
}

.activities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
}

.activity-card {
  background: #fff;
  border: 1px solid $border-color-lighter;
  border-radius: $radius-lg;
  padding: 20px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-md;
    border-color: $border-color;
  }

  .activity-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;

    .activity-name {
      font-size: 16px;
      font-weight: 600;
      color: $text-primary;
      margin: 0;
    }
  }

  .activity-desc {
    font-size: 13px;
    color: $text-secondary;
    margin: 0 0 16px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    min-height: 38px;
  }

  .activity-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    padding-top: 14px;
    border-top: 1px dashed $border-color;

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .meta-label {
        font-size: 12px;
        color: $text-secondary;
      }

      .meta-value {
        font-size: 14px;
        font-weight: 600;
        color: $text-primary;

        &.time {
          font-size: 13px;
          font-weight: 500;
        }
      }
    }

    .meta-divider {
      width: 1px;
      height: 24px;
      background: $border-color;
    }
  }
}

/* 分类楼层 */
.floor-section {
  &:nth-of-type(even) {
    background: $bg-primary;
  }
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

/* 全部商品入口 */
.all-products-section {
  padding-bottom: 0;
}

.all-products-card {
  background: $primary-gradient;
  border-radius: $radius-xl;
  padding: 32px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  cursor: pointer;
  box-shadow: $shadow-glow;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-lg;
  }

  .all-products-text {
    h3 {
      font-size: 22px;
      font-weight: 700;
      color: #fff;
      margin: 0 0 6px;
    }

    p {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.85);
      margin: 0;
    }
  }

  .el-button {
    flex-shrink: 0;
    background: #fff;
    border-color: #fff;
    color: $primary-color;
    font-weight: 600;

    &:hover {
      background: rgba(255, 255, 255, 0.9);
      border-color: rgba(255, 255, 255, 0.9);
      color: $primary-hover;
    }
  }
}

@media (max-width: 992px) {
  .hero-container {
    grid-template-columns: 1fr;
  }

  .hero-visual {
    grid-template-columns: repeat(3, 1fr);

    .hero-card-3 {
      grid-column: auto;
    }
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 28px;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .all-products-card {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
}
</style>

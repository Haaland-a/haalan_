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

    <!-- Active Activities -->
    <section class="section">
      <div class="section-container">
        <div class="section-header">
          <h2 class="section-title">火热进行中</h2>
          <span class="section-subtitle">限时秒杀，不容错过</span>
        </div>

        <el-skeleton :rows="3" animated v-if="loading" />

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

        <el-empty v-else description="暂无活动" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { getSeckillActivities } from '@/api/seckill'
import type { SeckillActivityBrief } from '@/types'
import { formatTime } from '@/utils/common'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const activities = ref<SeckillActivityBrief[]>([])
const searchKeyword = ref('')

const getStatusType = (status: number) => {
  switch (status) {
    case 0: return 'info'
    case 1: return 'success'
    case 2: return ''
    default: return ''
  }
}

const fetchActivities = async () => {
  loading.value = true
  try {
    const res = await getSeckillActivities(1)
    activities.value = res.data
  } catch (error: any) {
    ElMessage.error(error.message || '获取活动列表失败')
  } finally {
    loading.value = false
  }
}

const goToActivity = (activityId: string) => {
  router.push(`/seckill/activity/${activityId}`)
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
})
</script>

<style lang="scss" scoped>
.home-page {
  min-height: calc(100vh - 64px);
}

// Hero
.hero-section {
  background: $gradient-hero-light;
  padding: 60px 24px;
  border-bottom: 1px solid $border-color-lighter;
}

.hero-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 60px;
}

.hero-text {
  flex: 1;

  .hero-title {
    font-size: 40px;
    font-weight: 800;
    color: $text-primary;
    line-height: 1.25;
    margin-bottom: 16px;
    letter-spacing: -1px;
  }

  .hero-subtitle {
    font-size: 18px;
    color: $text-regular;
    margin-bottom: 32px;
    line-height: 1.6;
  }

  .hero-search {
    max-width: 480px;

    :deep(.el-input__wrapper) {
      border-radius: 10px 0 0 10px;
      box-shadow: 0 0 0 1px $border-color !important;
      transition: box-shadow 0.2s;
    }

    :deep(.el-input__wrapper.is-focus) {
      box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2) !important;
      border-color: $primary-color;
    }

    :deep(.el-input-group__append) {
      .el-button {
        border-radius: 0 10px 10px 0;
        height: 44px;
        padding: 0 28px;
        font-size: 15px;
        font-weight: 500;
      }
    }
  }
}

.hero-visual {
  display: flex;
  gap: 16px;
  flex-shrink: 0;

  .hero-card {
    background: #fff;
    border-radius: 14px;
    padding: 24px 20px;
    width: 140px;
    text-align: center;
    box-shadow: $shadow-sm;
    border: 1px solid $border-color-lighter;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-4px);
      box-shadow: $shadow-md;
      border-color: transparent;
    }

    .hero-card-icon {
      font-size: 28px;
      margin-bottom: 12px;
    }

    .hero-card-value {
      font-size: 15px;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 6px;
    }

    .hero-card-label {
      font-size: 12px;
      color: $text-secondary;
      line-height: 1.4;
    }
  }
}

// Section
.section {
  padding: 48px 24px 64px;

  .section-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .section-header {
    text-align: center;
    margin-bottom: 36px;

    .section-title {
      font-size: 26px;
      font-weight: 700;
      color: $text-primary;
      margin-bottom: 8px;
    }

    .section-subtitle {
      font-size: 15px;
      color: $text-secondary;
    }
  }

  .activities-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 20px;
  }

  .activity-card {
    background: #fff;
    border-radius: 12px;
    padding: 28px;
    cursor: pointer;
    transition: all 0.3s;
    border: 1px solid $border-color-lighter;
    box-shadow: $shadow-sm;

    &:hover {
      transform: translateY(-4px);
      box-shadow: $shadow-md;
      border-color: transparent;
    }

    .activity-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;

      .activity-name {
        font-size: 18px;
        font-weight: 600;
        color: $text-primary;
        margin: 0;
        flex: 1;
        margin-right: 12px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .activity-desc {
      color: $text-regular;
      margin-bottom: 20px;
      line-height: 1.6;
      font-size: 14px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .activity-meta {
      display: flex;
      align-items: center;
      gap: 20px;
      padding-top: 16px;
      border-top: 1px solid $border-color-lighter;

      .meta-item {
        display: flex;
        flex-direction: column;
        gap: 4px;

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
            font-weight: 400;
            color: $text-regular;
          }
        }
      }

      .meta-divider {
        width: 1px;
        height: 32px;
        background: $border-color-lighter;
      }
    }
  }
}

// Responsive
@media (max-width: $breakpoint-lg) {
  .hero-container {
    flex-direction: column;
    text-align: center;
    gap: 40px;
  }

  .hero-text {
    .hero-search {
      margin: 0 auto;
    }

    .hero-title {
      font-size: 32px;
    }
  }
}

@media (max-width: $breakpoint-md) {
  .hero-visual {
    .hero-card {
      width: 110px;
      padding: 16px;
    }
  }

  .activities-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<template>
  <div class="home-page">
    <!-- Banner -->
    <section class="banner-section">
      <div class="banner-container">
        <h1 class="banner-title">限时秒杀 超值优惠</h1>
        <p class="banner-subtitle">每日精选好物，等你来抢</p>
      </div>
    </section>

    <!-- Seckill Activities -->
    <section class="activities-section">
      <div class="section-container">
        <h2 class="section-title">正在进行的活动</h2>
        
        <el-skeleton :rows="3" animated v-if="loading" />
        
        <div v-else-if="activities.length > 0" class="activities-grid">
          <div
            v-for="activity in activities"
            :key="activity.activityId"
            class="activity-card"
            @click="goToActivity(activity.activityId)"
          >
            <div class="activity-header">
              <h3 class="activity-name">{{ activity.activityName }}</h3>
              <el-tag :type="getStatusType(activity.status)">
                {{ activity.statusName }}
              </el-tag>
            </div>
            <p class="activity-desc">{{ activity.activityDesc }}</p>
            <div class="activity-info">
              <span>商品数量: {{ activity.productCount }}</span>
              <span>{{ formatTime(activity.startTime) }} 开始</span>
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
import { getSeckillActivities } from '@/api/seckill'
import type { SeckillActivityBrief } from '@/types'
import { formatTime } from '@/utils/common'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const activities = ref<SeckillActivityBrief[]>([])

const getStatusType = (status: number) => {
  switch (status) {
    case 0:
      return 'info'
    case 1:
      return 'success'
    case 2:
      return ''
    default:
      return ''
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

onMounted(() => {
  fetchActivities()
})
</script>

<style lang="scss" scoped>
.home-page {
  min-height: calc(100vh - 60px);
}

.banner-section {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  padding: 60px 20px;
  text-align: center;
  color: #fff;
  
  .banner-container {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .banner-title {
    font-size: 48px;
    font-weight: bold;
    margin-bottom: 16px;
  }
  
  .banner-subtitle {
    font-size: 20px;
    opacity: 0.9;
  }
}

.activities-section {
  padding: 40px 20px;
  
  .section-container {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .section-title {
    font-size: 28px;
    color: $text-primary;
    margin-bottom: 30px;
    text-align: center;
  }
  
  .activities-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;
  }
  
  .activity-card {
    background: #fff;
    border-radius: $radius-md;
    padding: 24px;
    box-shadow: $shadow-sm;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: $shadow-md;
    }
    
    .activity-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      
      .activity-name {
        font-size: 20px;
        color: $text-primary;
        margin: 0;
      }
    }
    
    .activity-desc {
      color: $text-secondary;
      margin-bottom: 16px;
      line-height: 1.6;
    }
    
    .activity-info {
      display: flex;
      justify-content: space-between;
      color: $text-regular;
      font-size: 14px;
    }
  }
}

@media (max-width: $breakpoint-md) {
  .banner-title {
    font-size: 32px !important;
  }
  
  .activities-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>

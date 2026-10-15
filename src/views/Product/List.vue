<template>
  <div class="product-list-page">
    <div class="page-container">
      <!-- 面包屑 -->
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>全部商品</el-breadcrumb-item>
        <el-breadcrumb-item v-if="currentCategoryName">{{ currentCategoryName }}</el-breadcrumb-item>
      </el-breadcrumb>

      <div class="list-layout">
        <!-- 左侧分类导航 -->
        <aside class="category-aside">
          <div class="aside-title">商品分类</div>
          <el-skeleton :rows="8" animated v-if="treeLoading" />
          <ul v-else class="category-menu">
            <li
              class="menu-item"
              :class="{ active: !categoryId }"
              @click="selectCategory('', '全部商品')"
            >
              <span>全部商品</span>
            </li>
            <li
              v-for="level1 in categoryTree"
              :key="level1.categoryId"
              class="menu-group"
            >
              <div
                class="menu-item level-1"
                :class="{ active: categoryId === level1.categoryId }"
                @click="selectCategory(level1.categoryId, level1.name)"
              >
                <span>{{ level1.name }}</span>
                <el-icon v-if="level1.children && level1.children.length" class="arrow">
                  <ArrowRight />
                </el-icon>
              </div>
              <ul v-if="level1.children && level1.children.length" class="submenu">
                <li
                  v-for="level2 in level1.children"
                  :key="level2.categoryId"
                  class="submenu-item"
                  :class="{ active: categoryId === level2.categoryId }"
                  @click="selectCategory(level2.categoryId, level2.name)"
                >
                  {{ level2.name }}
                </li>
              </ul>
            </li>
          </ul>
        </aside>

        <!-- 右侧商品区 -->
        <main class="product-main">
          <!-- 排序工具栏 -->
          <div class="toolbar">
            <div class="toolbar-left">
              <el-input
                v-model="keyword"
                placeholder="在当前结果中搜索..."
                clearable
                class="keyword-input"
                @keyup.enter="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>

            <div class="toolbar-right">
              <span class="result-count">
                共 <em>{{ Number(total) }}</em> 件商品
              </span>
              <div class="sort-tabs">
                <span
                  v-for="option in sortOptions"
                  :key="option.value"
                  class="sort-tab"
                  :class="{ active: sortField === option.value }"
                  @click="handleSort(option.value)"
                >
                  {{ option.label }}
                  <el-icon v-if="option.value === 'price'" class="sort-arrow">
                    <Bottom v-if="sortDirection === 'asc'" />
                    <Top v-else />
                  </el-icon>
                </span>
              </div>
            </div>
          </div>

          <!-- 商品网格 -->
          <div v-loading="loading" class="result-area">
            <el-empty
              v-if="!loading && productList.length === 0"
              description="没有找到符合条件的商品"
            >
              <el-button @click="resetFilters">重置筛选</el-button>
            </el-empty>

            <div v-else class="products-grid">
              <ProductCard
                v-for="product in productList"
                :key="product.spuId"
                :product="product"
              />
            </div>
          </div>

          <!-- 分页 -->
          <div v-if="Number(total) > 0" class="pagination-wrap">
             <el-pagination
              v-model:current-page="pageNum"
              v-model:page-size="pageSize"
              :total="Number(total)"
              :page-sizes="[12, 20, 40]"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="handlePageSizeChange"
              @current-change="fetchProducts"
            />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, ArrowRight, Top, Bottom } from '@element-plus/icons-vue'
import { searchProducts, getCategoryTree } from '@/api/product'
import { useCartStore } from '@/stores/cart'
import ProductCard from '@/components/ProductCard.vue'
import type { ProductSpu, CategoryNode, PageDTOResult } from '@/types'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

const loading = ref(false)
const treeLoading = ref(false)

const productList = ref<ProductSpu[]>([])
const total = ref('0')
const pageNum = ref(1)
const pageSize = ref(20)

const keyword = ref((route.query.keyword as string) || '')
const categoryId = ref((route.query.categoryId as string) || '')
const categoryName = ref('')

// sort 参数拆成「排序字段 + 方向」，便于 UI 表达
const sortField = ref<'default' | 'price' | 'sales'>(
  (route.query.sort as string)?.startsWith('price') ? 'price' : 'default'
)
const sortDirection = ref<'asc' | 'desc'>(
  (route.query.sort as string) === 'price_asc' ? 'asc' : 'desc'
)

const sortOptions = [
  { label: '综合', value: 'default' as const },
  { label: '价格', value: 'price' as const },
  { label: '销量', value: 'sales' as const }
]

// 传给后端的 sort 字符串
const sort = computed(() => {
  if (sortField.value === 'price') {
    return sortDirection.value === 'asc' ? 'price_asc' : 'price_desc'
  }
  if (sortField.value === 'sales') {
    return 'sales_desc'
  }
  return ''
})

const categoryTree = ref<CategoryNode[]>([])

const currentCategoryName = computed(() => {
  if (categoryName.value) return categoryName.value
  const found = findCategoryName(categoryTree.value, categoryId.value)
  return found || ''
})

const findCategoryName = (nodes: CategoryNode[], id: string): string => {
  for (const node of nodes) {
    if (node.categoryId === id) return node.name
    if (node.children && node.children.length) {
      const found = findCategoryName(node.children, id)
      if (found) return found
    }
  }
  return ''
}

const fetchProducts = async () => {
  loading.value = true
  try {
    const res: any = await searchProducts({
      keyword: keyword.value || undefined,
      categoryId: categoryId.value ? Number(categoryId.value) : undefined,
      sort: (sort.value || undefined) as any,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    })
    // 后端返回 PageDTO：{ total, pages, list }，没有 pageNum / pageSize
    const page = (res?.data ?? {}) as PageDTOResult<ProductSpu>
    productList.value = page.list ?? []
    total.value = String(page.total ?? 0)
    syncQuery()
  } catch (error: any) {
    ElMessage.error(error?.message || '加载商品失败')
    productList.value = []
    total.value = '0'
  } finally {
    loading.value = false
  }
}

/** 把当前筛选状态同步进 URL，保证可分享 / 可后退 */
const syncQuery = () => {
  const query: Record<string, string> = {}
  if (keyword.value) query.keyword = keyword.value
  if (categoryId.value) query.categoryId = categoryId.value
  if (sort.value) query.sort = sort.value
  if (pageNum.value > 1) query.pageNum = String(pageNum.value)
  router.replace({ path: '/products', query })
}

const fetchCategoryTree = async () => {
  treeLoading.value = true
  try {
    // 一次性取三层，避免展开时才请求造成闪烁
    const res: any = await getCategoryTree('0', 3)
    categoryTree.value = res?.data ?? []
  } catch (error: any) {
    ElMessage.error(error?.message || '加载分类失败')
  } finally {
    treeLoading.value = false
  }
}

const selectCategory = (id: string, name: string) => {
  categoryId.value = id
  categoryName.value = name
  pageNum.value = 1
  fetchProducts()
}

const handleSort = (value: 'default' | 'price' | 'sales') => {
  if (value === 'price' && sortField.value === 'price') {
    // 再次点击价格切换升降序
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else if (value === 'price') {
    sortField.value = 'price'
    sortDirection.value = 'asc'
  } else {
    sortField.value = value
  }
  pageNum.value = 1
  fetchProducts()
}

const handleSearch = () => {
  pageNum.value = 1
  fetchProducts()
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  pageNum.value = 1
  fetchProducts()
}

const resetFilters = () => {
  keyword.value = ''
  categoryId.value = ''
  categoryName.value = ''
  sortField.value = 'default'
  sortDirection.value = 'desc'
  pageNum.value = 1
  fetchProducts()
}

// 支持从首页分类楼层跳转过来时带 query
watch(
  () => route.query,
  (q) => {
    if (route.path !== '/products') return
    const nextCategoryId = (q.categoryId as string) || ''
    const nextKeyword = (q.keyword as string) || ''
    if (nextCategoryId !== categoryId.value || nextKeyword !== keyword.value) {
      categoryId.value = nextCategoryId
      keyword.value = nextKeyword
      categoryName.value = ''
      pageNum.value = 1
      fetchProducts()
    }
  }
)

onMounted(() => {
  fetchCategoryTree()
  fetchProducts()
  cartStore.refreshCount()
})
</script>

<style scoped lang="scss">
.product-list-page {
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

.list-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 20px;
  align-items: start;
}

/* 左侧分类 */
.category-aside {
  background: $bg-primary;
  border: 1px solid $border-color-lighter;
  border-radius: $radius-lg;
  overflow: hidden;
  position: sticky;
  top: 84px;

  .aside-title {
    padding: 14px 16px;
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
    border-bottom: 1px solid $border-color-lighter;
    background: $bg-secondary;
  }
}

.category-menu {
  list-style: none;
  margin: 0;
  padding: 8px 0;

  .menu-group {
    border-bottom: 1px solid $border-color-lighter;

    &:last-child {
      border-bottom: none;
    }
  }

  .menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    font-size: 14px;
    color: $text-regular;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      color: $primary-color;
      background: $primary-light;
    }

    &.active {
      color: $primary-color;
      font-weight: 600;
      background: $primary-light;
    }

    .arrow {
      font-size: 12px;
      color: $text-placeholder;
    }
  }

  .submenu {
    list-style: none;
    margin: 0;
    padding: 0 0 8px;

    .submenu-item {
      padding: 7px 16px 7px 30px;
      font-size: 13px;
      color: $text-secondary;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        color: $primary-color;
      }

      &.active {
        color: $primary-color;
        font-weight: 600;
      }
    }
  }
}

/* 右侧工具栏 */
.product-main {
  min-width: 0;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  background: $bg-primary;
  border: 1px solid $border-color-lighter;
  border-radius: $radius-lg;
  margin-bottom: 16px;
  flex-wrap: wrap;

  .keyword-input {
    width: 240px;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .result-count {
    font-size: 13px;
    color: $text-secondary;

    em {
      font-style: normal;
      font-weight: 700;
      color: $primary-color;
    }
  }

  .sort-tabs {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .sort-tab {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 6px 14px;
    font-size: 14px;
    color: $text-regular;
    border-radius: $radius-sm;
    cursor: pointer;
    user-select: none;
    transition: all 0.2s;

    &:hover {
      color: $primary-color;
      background: $primary-light;
    }

    &.active {
      color: #fff;
      background: $primary-color;
      font-weight: 600;
    }

    .sort-arrow {
      font-size: 12px;
    }
  }
}

.result-area {
  min-height: 400px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

@media (max-width: 992px) {
  .list-layout {
    grid-template-columns: 1fr;
  }

  .category-aside {
    position: static;
  }

  .category-menu .submenu {
    display: none;
  }
}

@media (max-width: 768px) {
  .toolbar {
    .keyword-input {
      width: 100%;
    }

    .toolbar-right {
      width: 100%;
      justify-content: space-between;
    }
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>

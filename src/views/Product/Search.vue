<template>
  <div class="search-page">
    <div class="search-container">
      <!-- 搜索框 -->
      <div class="search-header">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索商品..."
          prefix-icon="Search"
          clearable
          size="large"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button :icon="Search" @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
      </div>

      <!-- 筛选条件 -->
      <div class="filter-bar">
        <el-select
          v-model="categoryId"
          placeholder="全部分类"
          clearable
          style="width: 200px"
          @change="handleCategoryChange"
        >
          <el-option label="全部分类" value="" />
          <!-- 分类选项将从分类树动态生成 -->
        </el-select>

        <el-select
          v-model="sortType"
          placeholder="默认排序"
          style="width: 150px"
          @change="handleSearch"
        >
          <el-option label="默认排序" value="" />
          <el-option label="价格升序" value="price_asc" />
          <el-option label="价格降序" value="price_desc" />
          <el-option label="销量优先" value="sales_desc" />
        </el-select>
      </div>

      <!-- 分类树 -->
      <div class="category-tree-container">
        <el-card shadow="never" class="category-tree-card">
          <template #header>
            <div class="tree-header">
              <span>商品分类</span>
              <el-button 
                v-if="selectedCategoryId" 
                size="small" 
                text 
                type="primary"
                @click="clearCategorySelection"
              >
                清除选择
              </el-button>
            </div>
          </template>
          <div v-loading="treeLoading" class="category-tree">
            <div v-if="categoryTree.length === 0 && !treeLoading" class="empty-tree">
              暂无分类数据
            </div>
            <div v-else class="tree-content">
              <!-- 一级分类 -->
              <div 
                v-for="level1 in categoryTree" 
                :key="level1.categoryId"
                class="tree-level level-1"
              >
                <div 
                  class="tree-node"
                  :class="{ active: selectedCategoryId === level1.categoryId }"
                  @click="handleCategoryClick(level1)"
                >
                  <span class="node-icon">{{ level1.children && level1.children.length > 0 ? '▶' : '•' }}</span>
                  <span class="node-name">{{ level1.name }}</span>
                </div>
                
                <!-- 二级分类 -->
                <div v-if="expandedCategories.has(level1.categoryId) && level1.children" class="tree-children">
                  <div 
                    v-for="level2 in level1.children" 
                    :key="level2.categoryId"
                    class="tree-level level-2"
                  >
                    <div 
                      class="tree-node"
                      :class="{ active: selectedCategoryId === level2.categoryId }"
                      @click="handleCategoryClick(level2)"
                    >
                      <span class="node-icon">{{ level2.children && level2.children.length > 0 ? '▶' : '•' }}</span>
                      <span class="node-name">{{ level2.name }}</span>
                    </div>
                    
                    <!-- 三级分类 -->
                    <div v-if="expandedCategories.has(level2.categoryId) && level2.children" class="tree-children">
                      <div 
                        v-for="level3 in level2.children" 
                        :key="level3.categoryId"
                        class="tree-level level-3"
                      >
                        <div 
                          class="tree-node"
                          :class="{ active: selectedCategoryId === level3.categoryId }"
                          @click="handleCategoryClick(level3)"
                        >
                          <span class="node-icon">•</span>
                          <span class="node-name">{{ level3.name }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 搜索结果 -->
      <div v-loading="loading" class="search-results">
        <el-empty v-if="!loading && productList.length === 0" description="暂无搜索结果" />

        <div v-else class="product-list">
          <div
            v-for="product in productList"
            :key="product.spuId"
            class="product-card"
            @click="goToDetail(product.spuId)"
          >
            <el-image
              :src="product.mainImage"
              fit="cover"
              class="product-image"
            />
            <div class="product-info">
              <h3 class="product-name">{{ product.spuName }}</h3>
              <div class="product-price">
                <span class="price">¥{{ product.minPrice.toFixed(2) }}</span>
                <span v-if="product.maxPrice > product.minPrice" class="price-range">
                  - ¥{{ product.maxPrice.toFixed(2) }}
                </span>
              </div>
              <div class="product-sales">
                销量：{{ product.sales }}
              </div>
              <!-- SKU列表预览 -->
              <div v-if="product.skuList && product.skuList.length > 0" class="sku-preview">
                <el-tag
                  v-for="sku in product.skuList.slice(0, 2)"
                  :key="sku.skuId"
                  size="small"
                  type="info"
                >
                  {{ sku.skuName }}
                </el-tag>
                <span v-if="product.skuList.length > 2" class="more-skus">
                  +{{ product.skuList.length - 2 }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="Number(total) > 0" class="pagination-container">
          <el-pagination
            v-model:current-page="pageNum"
            v-model:page-size="pageSize"
            :total="Number(total)"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSearch"
            @current-change="handleSearch"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { searchProducts, getCategoryTree } from '@/api/product'
import type { ProductSpu, CategoryNode } from '@/types'

const route = useRoute()
const router = useRouter()

// 状态
const loading = ref(false)
const treeLoading = ref(false)
const productList = ref<ProductSpu[]>([])
const total = ref('0')
const pageNum = ref(1)
const pageSize = ref(20)

// 搜索参数
const searchKeyword = ref(route.query.keyword as string || '')
const categoryId = ref(route.query.categoryId as string || '')
const sortType = ref(route.query.sort as string || '')

// 分类树相关
const categoryTree = ref<CategoryNode[]>([])
const expandedCategories = ref<Set<string>>(new Set())
const selectedCategoryId = ref('')

// 搜索
const handleSearch = async () => {
  loading.value = true
  try {
    const res = await searchProducts({
      keyword: searchKeyword.value || undefined,
      categoryId: categoryId.value ? Number(categoryId.value) : undefined,
      sort: sortType.value as any || undefined,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    })

    productList.value = res.data.list
    total.value = res.data.total

    // 更新URL参数
    router.push({
      query: {
        keyword: searchKeyword.value || undefined,
        categoryId: categoryId.value || undefined,
        sort: sortType.value || undefined,
        pageNum: pageNum.value.toString()
      }
    })
  } catch (error: any) {
    ElMessage.error(error.message || '搜索失败')
  } finally {
    loading.value = false
  }
}

// 跳转到商品详情
const goToDetail = (spuId: string) => {
  router.push(`/product/${spuId}`)
}

// 加载一级分类
const loadRootCategories = async () => {
  treeLoading.value = true
  try {
    const res = await getCategoryTree('0', 1)
    categoryTree.value = res.data
  } catch (error: any) {
    ElMessage.error(error.message || '加载分类失败')
  } finally {
    treeLoading.value = false
  }
}

// 处理分类点击
const handleCategoryClick = async (category: CategoryNode) => {
  // 如果有子分类且未展开，则加载子分类
  if (category.children === null && category.level < 3) {
    await loadChildrenCategories(category.categoryId, category.level + 1)
  }
  
  // 切换展开/收起状态
  if (category.children && category.children.length > 0) {
    if (expandedCategories.value.has(category.categoryId)) {
      expandedCategories.value.delete(category.categoryId)
    } else {
      expandedCategories.value.add(category.categoryId)
    }
  }
  
  // 选择该分类并搜索
  selectedCategoryId.value = category.categoryId
  categoryId.value = category.categoryId
  pageNum.value = 1
  handleSearch()
}

// 加载子分类
const loadChildrenCategories = async (parentId: string, level: number) => {
  try {
    const res = await getCategoryTree(parentId, level)
    // 更新父节点的children
    updateCategoryChildren(categoryTree.value, parentId, res.data)
  } catch (error: any) {
    ElMessage.error(error.message || '加载子分类失败')
  }
}

// 递归更新分类树的children
const updateCategoryChildren = (
  categories: CategoryNode[], 
  parentId: string, 
  children: CategoryNode[]
) => {
  for (const category of categories) {
    if (category.categoryId === parentId) {
      category.children = children
      return true
    }
    if (category.children) {
      if (updateCategoryChildren(category.children, parentId, children)) {
        return true
      }
    }
  }
  return false
}

// 处理分类下拉框变化
const handleCategoryChange = () => {
  selectedCategoryId.value = categoryId.value
  pageNum.value = 1
  handleSearch()
}

// 清除分类选择
const clearCategorySelection = () => {
  selectedCategoryId.value = ''
  categoryId.value = ''
  pageNum.value = 1
  handleSearch()
}

onMounted(() => {
  loadRootCategories()
  handleSearch()
})
</script>

<style scoped lang="scss">
.search-page {
  min-height: calc(100vh - 60px);
  background-color: #f5f5f5;
  padding: 20px;
}

.search-container {
  max-width: 1200px;
  margin: 0 auto;
}

.search-header {
  margin-bottom: 20px;

  :deep(.el-input) {
    max-width: 600px;
    margin: 0 auto;
  }
}

.filter-bar {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: #fff;
  border-radius: 8px;
}

.category-tree-container {
  margin-bottom: 20px;
  
  .category-tree-card {
    :deep(.el-card__header) {
      padding: 15px 20px;
      border-bottom: 1px solid #ebeef5;
    }
    
    :deep(.el-card__body) {
      padding: 0;
      max-height: 500px;
      overflow-y: auto;
    }
  }
  
  .tree-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 500;
  }
  
  .category-tree {
    min-height: 200px;
    
    .empty-tree {
      text-align: center;
      padding: 40px 20px;
      color: #999;
    }
    
    .tree-content {
      padding: 10px 0;
    }
    
    .tree-level {
      &.level-1 {
        margin-bottom: 5px;
      }
      
      &.level-2 {
        margin-left: 20px;
        margin-bottom: 3px;
      }
      
      &.level-3 {
        margin-left: 40px;
        margin-bottom: 2px;
      }
    }
    
    .tree-node {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.3s;
      
      &:hover {
        background-color: #f5f7fa;
      }
      
      &.active {
        background-color: #ecf5ff;
        color: #409eff;
        font-weight: 500;
      }
      
      .node-icon {
        width: 20px;
        font-size: 12px;
        color: #909399;
        margin-right: 8px;
      }
      
      .node-name {
        flex: 1;
        font-size: 14px;
      }
    }
    
    .tree-children {
      margin-top: 2px;
    }
  }
}

.search-results {
  min-height: 400px;
}

.product-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.product-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  .product-image {
    width: 100%;
    height: 250px;
  }

  .product-info {
    padding: 15px;

    .product-name {
      font-size: 14px;
      font-weight: 500;
      color: #333;
      margin: 0 0 10px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      min-height: 40px;
    }

    .product-price {
      margin-bottom: 8px;

      .price {
        font-size: 20px;
        font-weight: bold;
        color: #ff4d4f;
      }

      .price-range {
        font-size: 14px;
        color: #999;
        margin-left: 5px;
      }
    }

    .product-sales {
      font-size: 12px;
      color: #999;
      margin-bottom: 8px;
    }

    .sku-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      align-items: center;

      .more-skus {
        font-size: 12px;
        color: #999;
      }
    }
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}
</style>

import { Request } from '@/utils/request'
import type { 
  ProductSpu, 
  ProductDetail, 
  StockInfo,
  PageParams,
  PageResult,
  CategoryNode
} from '@/types'

/**
 * 商品搜索
 */
export function searchProducts(params: PageParams & {
  keyword?: string
  categoryId?: number
  sort?: 'price_asc' | 'price_desc'
}) {
  // search-service 的 ProductSearchDTO 继承 PageQuery，字段名为 pageNo（不是 pageNum），
  // 直接传 pageNum 会被后端忽略并永远返回第 1 页，这里做一次字段映射。
  const { pageNum, ...rest } = params
  return Request.get<PageResult<ProductSpu>>('/product/search', {
    ...rest,
    ...(pageNum !== undefined ? { pageNo: pageNum } : {})
  })
}

/**
 * 商品详情
 */
export function getProductDetail(spuId: number) {
  return Request.get<ProductDetail>(`/product/detail/${spuId}`)
}

/**
 * 实时库存查询
 */
export function getStockInfo(skuId: number) {
  return Request.get<StockInfo>(`/product/stock/${skuId}`)
}

/**
 * 获取分类树
 */
export function getCategoryTree(id?: string, level?: number) {
  const params: any = {}
  if (id !== undefined) params.id = id
  if (level !== undefined) params.level = level
  return Request.get<CategoryNode[]>('/category/tree', params)
}

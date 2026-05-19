import { Request } from '@/utils/request'
import type { 
  ProductSpu, 
  ProductDetail, 
  StockInfo,
  PageParams,
  PageResult 
} from '@/types'

/**
 * 商品搜索
 */
export function searchProducts(params: PageParams & {
  keyword?: string
  categoryId?: number
  sort?: 'price_asc' | 'price_desc'
}) {
  return Request.get<PageResult<ProductSpu>>('/product/search', params)
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

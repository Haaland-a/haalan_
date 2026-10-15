import { Request } from '@/utils/request'
import type { CartInfo, CartItem } from '@/types'

/**
 * 获取购物车列表（含实时商品信息）
 */
export function getCart() {
  return Request.get<CartInfo>('/cart/list')
}

/**
 * 购物车商品件数（顶部角标）
 */
export function getCartCount() {
  return Request.get<number>('/cart/count')
}

/**
 * 加入购物车（已存在则累加数量），返回加入后该 SKU 的总数量
 */
export function addToCart(skuId: string | number, quantity = 1) {
  return Request.post<number>('/cart/add', { skuId: String(skuId), quantity })
}

/**
 * 修改购物车项数量
 */
export function updateCartQuantity(cartItemId: string | number, quantity: number) {
  return Request.put<void>(`/cart/${cartItemId}/quantity`, { quantity })
}

/**
 * 删除购物车项
 */
export function removeCartItem(cartItemId: string | number) {
  return Request.delete<void>(`/cart/${cartItemId}`)
}

/**
 * 批量删除购物车项
 */
export function removeCartItems(cartItemIds: Array<string | number>) {
  return Request.delete<void>('/cart/batch', undefined, { data: cartItemIds })
}

/**
 * 清空购物车
 */
export function clearCart() {
  return Request.delete<void>('/cart/clear')
}

/**
 * 勾选/取消勾选单个购物车项
 */
export function selectCartItem(cartItemId: string | number, selected: number) {
  return Request.put<void>(`/cart/${cartItemId}/selected`, { selected })
}

/**
 * 全选/取消全选
 */
export function selectAllCartItems(selected: number) {
  return Request.put<void>('/cart/selected/all', { selected })
}

/**
 * 获取已勾选的购物车项（结算页用）
 */
export function getSelectedCartItems() {
  return Request.get<CartItem[]>('/cart/selected')
}

/**
 * 移除已勾选的购物车项（下单成功后调用）
 */
export function removeSelectedCartItems() {
  return Request.delete<void>('/cart/selected')
}

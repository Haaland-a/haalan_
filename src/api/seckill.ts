import { Request } from '@/utils/request'
import type { 
  SeckillActivityBrief,
  SeckillActivityDetail,
  SeckillProductDetail,
  SeckillTokenRequest,
  SeckillTokenResponse,
  SeckillExecuteRequest,
  SeckillOrderInfo,
  SeckillResult,
  UserSeckillRecord,
  SeckillOrderDetail,
  PageParams,
  PageResult
} from '@/types'

/**
 * 获取秒杀活动列表
 */
export function getSeckillActivities(status?: number) {
  return Request.get<SeckillActivityBrief[]>('/seckill/activities', { status })
}

/**
 * 获取活动商品列表
 */
export function getActivityProducts(activityId: number) {
  return Request.get<SeckillActivityDetail>(`/seckill/activity/${activityId}/products`)
}

/**
 * 获取秒杀商品详情
 */
export function getSeckillProductDetail(seckillProductId: number, activityId?: number) {
  return Request.get<SeckillProductDetail>(`/seckill/product/${seckillProductId}`, { activityId })
}

/**
 * 获取秒杀令牌
 */
export function getSeckillToken(data: SeckillTokenRequest) {
  return Request.post<SeckillTokenResponse>('/seckill/token', data)
}

/**
 * 执行秒杀
 */
export function executeSeckill(data: SeckillExecuteRequest) {
  return Request.post<SeckillOrderInfo>('/seckill/execute', data)
}

/**
 * 查询秒杀结果
 */
export function getSeckillResult(requestId: string) {
  return Request.get<SeckillResult>(`/seckill/result/${requestId}`)
}

/**
 * 查询用户秒杀记录
 */
export function getUserSeckillRecords(params: PageParams) {
  return Request.get<PageResult<UserSeckillRecord>>('/seckill/user/records', params)
}

/**
 * 取消秒杀订单
 */
export function cancelSeckillOrder(orderNo: string, data: { cancelReason: string }) {
  return Request.post<{ orderNo: string; status: number; statusName: string }>(`/order/seckill/cancel/${orderNo}`, data)
}

/**
 * 获取秒杀订单详情
 */
export function getSeckillOrderDetail(orderNo: string) {
  return Request.get<SeckillOrderDetail>(`/order/seckill/detail/${orderNo}`)
}

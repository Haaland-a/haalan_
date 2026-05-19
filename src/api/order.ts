import { Request } from '@/utils/request'
import type { 
  OrderBrief,
  OrderDetail,
  PayRequest,
  PayResponse,
  PaymentResult,
  CancelOrderRequest,
  RefundApplyRequest,
  RefundInfo,
  PageParams,
  PageResult
} from '@/types'

/**
 * 订单列表
 */
export function getOrderList(params: PageParams & { status?: number }) {
  return Request.get<PageResult<OrderBrief>>('/order/list', params)
}

/**
 * 秒杀订单列表
 */
export function getSeckillOrderList(params: PageParams & { status?: number }) {
  return Request.get<PageResult<OrderBrief>>('/order/seckill/list', params)
}

/**
 * 订单详情
 */
export function getOrderDetail(orderNo: string) {
  return Request.get<OrderDetail>(`/order/seckill/detail/${orderNo}`)
}

/**
 * 取消订单
 */
export function cancelOrder(orderNo: string, data: CancelOrderRequest) {
  return Request.post<{ orderNo: string; status: number; statusName: string }>(`/order/cancel/${orderNo}`, data)
}

/**
 * 订单支付
 */
export function payOrder(data: PayRequest) {
  return Request.post<PayResponse>('/payment/pay', data)
}

/**
 * 支付结果查询
 */
export function getPaymentResult(orderNo: string) {
  return Request.get<PaymentResult>(`/payment/result/${orderNo}`)
}

/**
 * 退款申请
 */
export function applyRefund(data: RefundApplyRequest) {
  return Request.post<RefundInfo>('/payment/refund', data)
}

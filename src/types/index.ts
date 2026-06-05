// API响应基础类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: string
}

// 分页请求参数
export interface PageParams {
  pageNum?: number
  pageSize?: number
}

// 分页响应数据
export interface PageResult<T> {
  total: string
  pageNum: number
  pageSize: number
  list: T[]
}

// 用户登录请求
export interface LoginRequest {
  username: string
  password: string
}

// 用户注册请求
export interface RegisterRequest {
  username: string
  password: string
  confirmPassword: string
  phone: string
  email?: string
  smsCode?: string
}

// 用户信息
export interface UserInfo {
  userId: string
  username: string
  phone: string
  email: string
  avatar: string
  memberLevel: number
  lastLoginTime: string
  lastLoginIp: string | null
  avatarUpdateTime?: string  // 头像最后修改时间
}

// 用户更新请求
export interface UserUpdateRequest {
  username?: string
  phone?: string
  email?: string
  avatar?: string
}

// 修改密码请求
export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
  confirmNewPassword: string
}

// 分类树节点
export interface CategoryNode {
  categoryId: string
  name: string
  level: number
  children: CategoryNode[] | null
}

// 地址信息
export interface AddressInfo {
  addressId: string
  receiverName: string
  receiverPhone: string
  province: string
  city: string
  district: string
  detailAddress: string
  fullAddress: string
  isDefault: boolean
}

// 地址创建/更新请求
export interface AddressRequest {
  receiverName: string
  receiverPhone: string
  province: string
  city: string
  district: string
  detailAddress: string
  isDefault?: boolean
}

// 商品SPU信息
export interface ProductSpu {
  spuId: string
  spuName: string
  mainImage: string
  minPrice: number
  maxPrice: number
  sales: number
  skuList?: ProductSku[]
}

// 商品SKU信息
export interface ProductSku {
  skuId: string
  skuCode: string
  skuName: string
  price: number
  originalPrice?: number
  stock: number | string
  soldCount?: string
  status?: number
  specifications: Record<string, string>
  images?: string[]
}

// SKU信息（用于商品详情）
export interface SkuInfo {
  skuId: string
  skuCode: string
  skuName: string
  price: number
  originalPrice?: number
  stock: number | string
  soldCount?: string
  status?: number
  specifications: Record<string, string>
  images?: string[]
}

// 商品详情
export interface ProductDetail {
  spuId: string
  spuCode: string
  spuName: string
  description: string
  mainImage: string
  images: string[]
  categoryId: string
  categoryName: string
  brandName: string
  skuList: ProductSku[]
}

// 库存信息
export interface StockInfo {
  skuId: string
  stock: number
  status: number
  statusName: string
}

// 秒杀活动简要信息
export interface SeckillActivityBrief {
  activityId: string
  activityName: string
  startTime: string
  endTime: string
  status: number
  statusName: string
  activityDesc: string
  productCount: number
}

// 秒杀活动商品
export interface SeckillProduct {
  productId: string  // 秒杀商品ID（用于跳转详情）
  skuId: string
  skuCode: string
  name: string
  images: string[]
  originalPrice: number
  seckillPrice: number
  stock: string
  soldCount: string
  limitPerUser: string
  userCanBuy: boolean
  startTime: string
  endTime: string
  status: number
  specifications: Record<string, string>
}

// 秒杀活动详情
export interface SeckillActivityDetail {
  activityId: string
  activityName: string
  startTime: string
  endTime: string
  serverTime: string
  products: SeckillProduct[]
}

// 秒杀商品详情
export interface SeckillProductDetail {
  seckillProductId: string
  activityId: string
  skuId: string
  productName: string
  productImages: string[]
  specifications: Record<string, string>
  originalPrice: number
  seckillPrice: number
  stock: number
  limitPerUser: string
  userPurchaseCount: number
  startTime: string
  endTime: string
  countdown: string
  status: number
}

// 秒杀令牌请求
export interface SeckillTokenRequest {
  activityId: number
  seckillProductId: number
  clientInfo: {
    deviceId: string
    userAgent: string
  }
}

// 秒杀令牌响应
export interface SeckillTokenResponse {
  seckillToken: string
  expireTime: number
  seckillProductId: string
}

// 秒杀执行请求
export interface SeckillExecuteRequest {
  requestId: string
  activityId: number
  seckillProductId: number
  skuId: number
  seckillToken: string
  quantity: number
  addressId: string
}

// 秒杀订单信息
export interface SeckillOrderInfo {
  orderNo: string
  seckillProductId: string
  productName: string
  seckillPrice: number
  quantity: number
  totalAmount: number
  payExpireTime: string
  status?: number
  statusName?: string
}

// 秒杀结果
export interface SeckillResult {
  requestId: string
  status: string
  orderNo: string | null
  orderInfo?: SeckillOrderInfo
  failReason?: string | null
}

// 用户秒杀记录
export interface UserSeckillRecord {
  orderNo: string
  activityId: string
  activityName: string
  productName: string
  productImage: string
  seckillPrice: number
  quantity: number
  status: number
  statusName: string
  createTime: string
  payExpireTime: string
}

// 秒杀订单详情
export interface SeckillOrderDetail {
  orderId: string
  orderNo: string
  userId: string
  orderType: number
  orderTypeName: string
  totalAmount: number
  discountAmount: number | null
  actualAmount: number | null
  status: number
  statusName: string
  createTime: string
  payExpireTime: string
  remainingSeconds: string
  orderItems: SeckillOrderItem[]
  addressInfo: SeckillOrderAddress
}

// 秒杀订单项
export interface SeckillOrderItem {
  skuId: string
  spuId: string
  productName: string
  productImage: string
  specifications: Record<string, string>
  price: number
  quantity: number
  totalPrice: number
}

// 秒杀订单地址
export interface SeckillOrderAddress {
  receiverName: string
  receiverPhone: string
  fullAddress: string
  province?: string
  city?: string
  district?: string
  detailAddress?: string
}

// 订单简要信息
export interface OrderBrief {
  orderNo: string
  orderType: number
  orderTypeName: string
  totalAmount: number
  actualAmount: number | null
  status: number
  statusName: string
  productImage: string | null
  productName: string
  quantity: number
  createTime: string | null
  payExpireTime?: string
}

// 订单详情
export interface OrderDetail {
  orderId: string
  orderNo: string
  userId: string
  orderType: number
  orderTypeName: string
  totalAmount: number
  discountAmount: number | null
  actualAmount: number | null
  status: number
  statusName: string
  createTime: string
  payExpireTime: string
  remainingSeconds: string
  orderItems: OrderItem[]
  addressInfo: OrderAddressInfo
}

// 订单项
export interface OrderItem {
  skuId: string
  spuId: string
  productName: string
  productImage: string
  specifications: Record<string, string>
  price: number
  quantity: number
  totalPrice: number
}

// 订单地址信息
export interface OrderAddressInfo {
  receiverName: string
  receiverPhone: string
  fullAddress: string
  province?: string
  city?: string
  district?: string
  detailAddress?: string
}

// 支付请求
export interface PayRequest {
  orderNo: string
  payType: number
  returnUrl?: string
}

// 支付响应
export interface PayResponse {
  orderNo: string
  payAmount: number
  payType: number
  payTypeName: string
  payUrl: string
  qrCode: string | null
  expireTime: string
}

// 支付结果
export interface PaymentResult {
  orderNo: string
  payStatus: number
  payStatusName: string
  payAmount: number
  payType: number
  payTypeName: string
  transactionId: string
  payTime: string
}

// 取消订单请求
export interface CancelOrderRequest {
  cancelReason: string
}

// 退款申请
export interface RefundApplyRequest {
  orderNo: string
  refundAmount: number
  refundReason: string
}

// 退款信息
export interface RefundInfo {
  refundNo: string
  orderNo: string
  refundAmount: number
  status: number
  statusName: string
}

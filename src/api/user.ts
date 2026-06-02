import { Request } from '@/utils/request'
import type { 
  LoginRequest, 
  RegisterRequest, 
  UserInfo, 
  UserUpdateRequest,
  AddressInfo,
  AddressRequest,
  ChangePasswordRequest
} from '@/types'

/**
 * 用户登录
 */
export function login(data: LoginRequest) {
  return Request.post<{ userId: string; username: string; token: string }>('/user/login', data)
}

/**
 * 用户注册
 */
export function register(data: RegisterRequest) {
  return Request.post<{ userId: string; username: string }>('/user/register', data)
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
  return Request.get<UserInfo>('/user/info')
}

/**
 * 更新用户信息
 */
export function updateUserInfo(data: UserUpdateRequest) {
  return Request.put('/user/info', data)
}

/**
 * 退出登录
 */
export function logout() {
  return Request.get('/user/logout')
}

/**
 * 获取地址列表
 */
export function getAddressList() {
  return Request.get<AddressInfo[]>('/user/address')
}

/**
 * 新增地址
 */
export function addAddress(data: AddressRequest) {
  return Request.post<{ addressId: string }>('/user/address', data)
}

/**
 * 更新地址
 */
export function updateAddress(addressId: string, data: AddressRequest) {
  return Request.put(`/user/address/${addressId}`, data)
}

/**
 * 删除地址
 */
export function deleteAddress(addressId: string) {
  return Request.delete(`/user/address/${addressId}`)
}

/**
 * 获取地址详情
 */
export function getAddressDetail(addressId: string) {
  return Request.get<AddressInfo>(`/user/address/${addressId}`)
}

/**
 * 修改密码
 */
export function changePassword(data: ChangePasswordRequest) {
  return Request.post('/user/change-password', data)
}

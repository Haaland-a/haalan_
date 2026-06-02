import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, AddressInfo } from '@/types'
import { login as loginApi, register as registerApi, getUserInfo, logout as logoutApi, changePassword as changePasswordApi } from '@/api/user'
import { encryptPassword } from '@/utils/common'

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref<string>(localStorage.getItem('access_token') || '')
  const userInfo = ref<UserInfo | null>(null)
  const addressList = ref<AddressInfo[]>([])

  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const userId = computed(() => userInfo.value?.userId || '')
  const username = computed(() => userInfo.value?.username || '')

  // Actions
  /**
   * 用户登录
   */
  async function login(username: string, password: string) {
    try {
      // 密码加密
      const encryptedPassword = encryptPassword(password)
      
      const res = await loginApi({
        username,
        password: encryptedPassword
      })
      
      // 保存token
      token.value = res.data.token
      localStorage.setItem('access_token', res.data.token)
      
      // 获取用户信息
      await fetchUserInfo()
      
      return res
    } catch (error) {
      throw error
    }
  }

  /**
   * 用户注册
   */
  async function register(data: {
    username: string
    password: string
    confirmPassword: string
    phone: string
    email?: string
  }) {
    try {
      // 密码加密
      const encryptedPassword = encryptPassword(data.password)
      const encryptedConfirmPassword = encryptPassword(data.confirmPassword)
      
      const res = await registerApi({
        ...data,
        password: encryptedPassword,
        confirmPassword: encryptedConfirmPassword
      })
      
      return res
    } catch (error) {
      throw error
    }
  }

  /**
   * 获取用户信息
   */
  async function fetchUserInfo() {
    try {
      const res = await getUserInfo()
      userInfo.value = res.data
      
      // 保存到localStorage
      localStorage.setItem('user_info', JSON.stringify(res.data))
      
      return res
    } catch (error) {
      throw error
    }
  }

  /**
   * 退出登录
   */
  async function logout() {
    try {
      await logoutApi()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // 清除本地数据
      token.value = ''
      userInfo.value = null
      addressList.value = []
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_info')
    }
  }

  /**
   * 初始化用户状态
   */
  function initUserState() {
    const savedToken = localStorage.getItem('access_token')
    const savedUserInfo = localStorage.getItem('user_info')
    
    if (savedToken) {
      token.value = savedToken
    }
    
    if (savedUserInfo) {
      try {
        userInfo.value = JSON.parse(savedUserInfo)
      } catch (e) {
        console.error('Parse user info error:', e)
      }
    }
  }

  /**
   * 修改密码
   */
  async function changePassword(oldPassword: string, newPassword: string, confirmNewPassword: string) {
    try {
      // 密码加密
      const encryptedOldPassword = encryptPassword(oldPassword)
      const encryptedNewPassword = encryptPassword(newPassword)
      const encryptedConfirmNewPassword = encryptPassword(confirmNewPassword)
      
      const res = await changePasswordApi({
        oldPassword: encryptedOldPassword,
        newPassword: encryptedNewPassword,
        confirmNewPassword: encryptedConfirmNewPassword
      })
      
      return res
    } catch (error) {
      throw error
    }
  }

  return {
    token,
    userInfo,
    addressList,
    isLoggedIn,
    userId,
    username,
    login,
    register,
    fetchUserInfo,
    logout,
    initUserState,
    changePassword
  }
})

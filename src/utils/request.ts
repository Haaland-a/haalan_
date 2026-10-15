import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { ApiResponse } from '@/types'

// 创建axios实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从localStorage获取token
    const token = localStorage.getItem('access_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加时间戳防止缓存
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      }
    }
    
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
// 这里必须「欺骗」axios 的拦截器类型：拦截器契约要求返回 AxiosResponse，
// 但我们实际想返回的是 response.data（即 ApiResponse<T>）。
// 用 axios.AxiosInterceptorManager 的 any 泛型签名注册，再用一个带类型的
// 内部函数做真正的实现，这样既保留调用点的 ApiResponse<T> 类型，
// 又不把类型抹成 any。
const responseInterceptor: Parameters<AxiosInstance['interceptors']['response']['use']>[0] =
  ((response: AxiosResponse) => {
    const res = response.data as ApiResponse

    // 如果返回的状态码不是200，则认为是错误
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')

      // 401: 未授权，需要重新登录
      if (res.code === 401) {
        handleUnauthorized()
      }

      return Promise.reject(new Error(res.message || '请求失败'))
    }

    return res as unknown as ApiResponse
  }) as never

service.interceptors.response.use(
  responseInterceptor,
  (error) => {
    console.error('响应错误:', error)
    
    let message = '网络错误，请稍后重试'
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '请求参数错误'
          break
        case 401:
          message = '未授权，请重新登录'
          handleUnauthorized()
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        case 502:
          message = '网关错误'
          break
        case 503:
          message = '服务不可用'
          break
        case 504:
          message = '网关超时'
          break
        default:
          message = `连接错误${error.response.status}`
      }
    } else if (error.message.includes('timeout')) {
      message = '请求超时，请稍后重试'
    } else if (error.message.includes('Network Error')) {
      message = '网络连接异常'
    }
    
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

// 处理未授权
function handleUnauthorized() {
  ElMessageBox.confirm('登录已过期，请重新登录', '提示', {
    confirmButtonText: '重新登录',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 清除用户信息
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_info')
    
    // 跳转到登录页
    window.location.href = '/login'
  }).catch(() => {})
}

// 导出通用请求方法
export class Request {
  /**
   * GET请求
   */
  static get<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.get(url, { params, ...config })
  }

  /**
   * POST请求
   */
  static post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.post(url, data, config)
  }

  /**
   * PUT请求
   */
  static put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.put(url, data, config)
  }

  /**
   * DELETE请求
   */
  static delete<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.delete(url, { params, ...config })
  }

  /**
   * 上传文件
   */
  static upload<T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  /**
   * 下载文件
   */
  static download(url: string, params?: any, config?: AxiosRequestConfig): Promise<Blob> {
    return service.get(url, {
      params,
      ...config,
      responseType: 'blob'
    }).then(response => response.data as Blob)
  }
}

export default service

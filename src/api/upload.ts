import { Request } from '@/utils/request'

/**
 * OSS凭证信息
 */
export interface OssCredential {
  accessKeyId: string
  accessKeySecret: string
  securityToken: string
  endpoint?: string        // OSS Endpoint（优先使用）
  regionId?: string        // OSS Region ID（备选）
  bucketName: string
  filePrefix: string
  expiration: string
}

/**
 * 获取OSS上传凭证
 */
export function getOssCredential() {
  return Request.get<OssCredential>('/user/oss/credential')
}

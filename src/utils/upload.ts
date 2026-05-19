import OSS from 'ali-oss'
import { getOssCredential } from '@/api/upload'
import type { OssCredential } from '@/api/upload'

/**
 * 上传文件到阿里云OSS
 * @param file 文件对象
 * @param folder 文件夹路径（可选）
 * @returns 文件URL
 */
export async function uploadToOSS(file: File, folder: string = 'avatar'): Promise<string> {
  try {
    // 1. 获取上传凭证
    const credentialRes = await getOssCredential()
    const credential: OssCredential = credentialRes.data

    // 2. 创建OSS客户端（支持endpoint和regionId两种方式）
    const client = new OSS({
      // 优先使用endpoint，如果没有则使用regionId
      region: credential.regionId || credential.endpoint?.replace('https://', '').replace('http://', '').replace('oss-', '').replace('.aliyuncs.com', ''),
      endpoint: credential.endpoint,
      accessKeyId: credential.accessKeyId,
      accessKeySecret: credential.accessKeySecret,
      stsToken: credential.securityToken,
      bucket: credential.bucketName,
      secure: true  // 使用HTTPS
    })

    // 3. 生成文件名
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${credential.filePrefix}/${timestamp}_${randomStr}.${fileExtension}`

    // 4. 直接上传到OSS（不经过服务器）
    const result = await client.put(fileName, file)

    // 5. 返回文件URL
    return result.url
  } catch (error) {
    console.error('OSS上传失败:', error)
    throw new Error('文件上传失败，请重试')
  }
}

/**
 * 验证图片文件
 * @param file 文件对象
 * @param maxSize 最大文件大小（MB），默认5MB
 * @returns 验证结果
 */
export function validateImageFile(file: File, maxSize: number = 5): { valid: boolean; message?: string } {
  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      message: '只支持 JPG、PNG、GIF、WEBP 格式的图片'
    }
  }

  // 检查文件大小
  const maxBytes = maxSize * 1024 * 1024
  if (file.size > maxBytes) {
    return {
      valid: false,
      message: `图片大小不能超过 ${maxSize}MB`
    }
  }

  return { valid: true }
}

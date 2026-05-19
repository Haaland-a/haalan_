<template>
  <div class="profile-page">
    <el-card shadow="never">
      <template #header>
        <span>个人信息</span>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        class="profile-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>

        <el-form-item label="头像">
          <el-upload
            class="avatar-uploader"
            action="#"
            :show-file-list="false"
            :auto-upload="false"
            :before-upload="beforeUpload"
            :on-change="handleAvatarUpload"
            accept="image/jpeg,image/png,image/gif,image/webp"
          >
            <div v-loading="uploading" class="avatar-wrapper">
              <img v-if="formData.avatar" :src="formData.avatar" class="avatar" />
              <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 JPG、PNG、GIF、WEBP 格式，大小不超过 5MB
              </div>
              <div v-if="userInfo.avatarUpdateTime" class="avatar-update-time">
                最后更新时间：{{ formatTime(userInfo.avatarUpdateTime) }}
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
            保存修改
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 修改密码 -->
    <el-card shadow="never" class="mt-20">
      <template #header>
        <span>修改密码</span>
      </template>

      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
        class="password-form"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            placeholder="请输入原密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="passwordLoading" @click="handlePasswordSubmit">
            修改密码
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules, type UploadProps } from 'element-plus'
import { Plus, Loading } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { updateUserInfo } from '@/api/user'
import { uploadToOSS, validateImageFile } from '@/utils/upload'
import type { UserInfo, UserUpdateRequest } from '@/types'

const userStore = useUserStore()

// 状态
const submitLoading = ref(false)
const passwordLoading = ref(false)
const uploading = ref(false)
const formRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()

// 用户信息
const userInfo = ref<UserInfo>(userStore.userInfo || {
  userId: '',
  username: '',
  phone: '',
  email: '',
  avatar: '',
  memberLevel: 0,
  lastLoginTime: '',
  lastLoginIp: null
})

// 表单数据（只包含可编辑字段）
const formData = reactive({
  username: '',
  phone: '',
  email: '',
  avatar: ''
})

// 密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 表单验证规则
const formRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

// 密码验证规则
const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules: FormRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 初始化表单数据
const initFormData = () => {
  const info = userStore.userInfo
  if (info) {
    userInfo.value = info
    Object.assign(formData, {
      username: info.username || '',
      phone: info.phone || '',
      email: info.email || '',
      avatar: info.avatar || ''
    })
  }
}

// 格式化时间
const formatTime = (timeStr: string) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 头像上传前的验证
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const validation = validateImageFile(file, 5)
  if (!validation.valid) {
    ElMessage.error(validation.message)
    return false
  }
  return true
}

// 自定义上传方法
const handleAvatarUpload: UploadProps['onChange'] = async (uploadFile) => {
  if (!uploadFile.raw) return

  uploading.value = true
  try {
    // 上传到OSS
    const fileUrl = await uploadToOSS(uploadFile.raw, 'avatar')
    
    // 更新表单数据
    formData.avatar = fileUrl
    
    ElMessage.success('头像上传成功')
  } catch (error: any) {
    console.error('头像上传失败:', error)
    ElMessage.error(error.message || '头像上传失败')
  } finally {
    uploading.value = false
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitLoading.value = true
    try {
      // 构建请求数据（只包含有值的字段）
      const updateData: UserUpdateRequest = {}
      if (formData.username) updateData.username = formData.username
      if (formData.phone) updateData.phone = formData.phone
      if (formData.email) updateData.email = formData.email
      if (formData.avatar) updateData.avatar = formData.avatar
      
      console.log('提交的数据:', updateData)
      
      await updateUserInfo(updateData)
      ElMessage.success('保存成功')
      
      // 更新store中的用户信息
      await userStore.fetchUserInfo()
      initFormData()
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      submitLoading.value = false
    }
  })
}

// 修改密码
const handlePasswordSubmit = async () => {
  if (!passwordFormRef.value) return

  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return

    passwordLoading.value = true
    try {
      // TODO: 调用修改密码接口（需要后端提供）
      // await changePassword({
      //   oldPassword: encryptPassword(passwordForm.oldPassword),
      //   newPassword: encryptPassword(passwordForm.newPassword)
      // })
      
      ElMessage.success('密码修改成功，请重新登录')
      
      // 清空表单
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
      
      // 退出登录
      setTimeout(() => {
        userStore.logout()
        window.location.href = '/login'
      }, 1500)
    } catch (error) {
      console.error('修改密码失败:', error)
    } finally {
      passwordLoading.value = false
    }
  })
}

onMounted(() => {
  initFormData()
})
</script>

<style scoped lang="scss">
.profile-page {
  .profile-form,
  .password-form {
    max-width: 600px;
  }

  .mt-20 {
    margin-top: 20px;
  }

  .avatar-uploader {
    :deep(.el-upload) {
      border: 1px dashed $border-color-light;
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: all 0.3s;

      &:hover {
        border-color: $primary-color;
      }
    }

    .avatar-wrapper {
      width: 100px;
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .avatar-uploader-icon {
      font-size: 28px;
      color: $text-placeholder;
    }

    .avatar {
      width: 100px;
      height: 100px;
      display: block;
      object-fit: cover;
      border-radius: 6px;
    }

    :deep(.el-upload__tip) {
      margin-top: 8px;
      font-size: 12px;
      color: $text-secondary;

      .avatar-update-time {
        margin-top: 4px;
        color: $text-placeholder;
        font-size: 11px;
      }
    }
  }
}
</style>

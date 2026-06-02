<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-box">
        <h2 class="register-title">创建账号</h2>
        <p class="register-subtitle">注册后即可参与限时秒杀</p>
        
        <el-form
          ref="formRef"
          :model="registerForm"
          :rules="rules"
          label-width="0"
          size="large"
        >
          <el-form-item prop="username">
            <el-input
              v-model="registerForm.username"
              placeholder="请输入用户名（3-20位字母数字）"
              prefix-icon="User"
            />
          </el-form-item>
          
          <el-form-item prop="phone">
            <el-input
              v-model="registerForm.phone"
              placeholder="请输入手机号"
              prefix-icon="Phone"
            />
          </el-form-item>
          
          <el-form-item prop="email">
            <el-input
              v-model="registerForm.email"
              placeholder="请输入邮箱（可选）"
              prefix-icon="Message"
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="请输入密码（8-20位）"
              prefix-icon="Lock"
              show-password
            />
          </el-form-item>
          
          <el-form-item prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="请确认密码"
              prefix-icon="Lock"
              show-password
            />
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              class="register-btn"
              :loading="loading"
              @click="handleRegister"
            >
              注册
            </el-button>
          </el-form-item>
        </el-form>
        
        <div class="register-footer">
          <span>已有账号？</span>
          <router-link to="/login">立即登录</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const registerForm = reactive({
  username: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const validatePass = (_rule: any, value: string, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9]{3,20}$/, message: '用户名为3-20位字母数字组合', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 20, message: '密码长度为8-20个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validatePass, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.register(registerForm)
        ElMessage.success('注册成功')
        router.push('/login')
      } catch (error: any) {
        ElMessage.error(error.message || '注册失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 50%, #F5F3FF 100%);
}

.register-container {
  width: 100%;
  max-width: 420px;
  padding: 20px;
}

.register-box {
  background: #fff;
  border-radius: 16px;
  padding: 44px 40px 36px;
  box-shadow: $shadow-lg;
  border: 1px solid $border-color-lighter;

  .register-title {
    text-align: center;
    font-size: 26px;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
  }

  .register-subtitle {
    text-align: center;
    font-size: 14px;
    color: $text-secondary;
    margin-bottom: 32px;
  }

  .register-btn {
    width: 100%;
    height: 46px;
    font-size: 15px;
    font-weight: 600;
    border-radius: 10px;
    transition: all 0.2s;

    &:hover {
      transform: translateY(-1px);
      box-shadow: $shadow-glow;
    }
  }

  .register-footer {
    text-align: center;
    margin-top: 24px;
    color: $text-secondary;
    font-size: 14px;

    a {
      color: $primary-color;
      margin-left: 4px;
      font-weight: 500;

      &:hover {
        color: $primary-hover;
      }
    }
  }
}
</style>

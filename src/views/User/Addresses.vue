<template>
  <div class="addresses-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>我的地址</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增地址
          </el-button>
        </div>
      </template>

      <!-- 地址列表 -->
      <div v-loading="loading" class="address-list">
        <el-empty v-if="!loading && addressList.length === 0" description="暂无收货地址" />
        
        <div v-else class="address-items">
          <div 
            v-for="addr in addressList" 
            :key="addr.addressId"
            class="address-item"
            :class="{ 'is-default': addr.isDefault }"
          >
            <div class="address-info">
              <div class="address-header">
                <span class="receiver-name">{{ addr.receiverName }}</span>
                <span class="receiver-phone">{{ addr.receiverPhone }}</span>
                <el-tag v-if="addr.isDefault" size="small" type="success">默认</el-tag>
              </div>
              <div class="address-detail">
                {{ addr.fullAddress }} {{ addr.detailAddress }}
              </div>
            </div>
            <div class="address-actions">
              <el-button link type="primary" @click="handleEdit(addr)">编辑</el-button>
              <el-button link type="danger" @click="handleDelete(addr)">删除</el-button>
              <el-button 
                v-if="!addr.isDefault" 
                link 
                type="primary" 
                @click="handleSetDefault(addr)"
              >
                设为默认
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 新增/编辑地址对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑地址' : '新增地址'"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="收货人" prop="receiverName">
          <el-input v-model="formData.receiverName" placeholder="请输入收货人姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="receiverPhone">
          <el-input v-model="formData.receiverPhone" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="所在地区" prop="region">
          <el-cascader
            v-model="formData.region"
            :options="regionOptions"
            placeholder="请选择省/市/区"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="详细地址" prop="detailAddress">
          <el-input
            v-model="formData.detailAddress"
            type="textarea"
            :rows="3"
            placeholder="请输入街道、门牌号等详细地址"
          />
        </el-form-item>
        <el-form-item label="默认地址">
          <el-switch v-model="formData.isDefault" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getAddressList, addAddress, updateAddress, deleteAddress } from '@/api/user'
import type { AddressInfo, AddressRequest } from '@/types'

// 状态
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const addressList = ref<AddressInfo[]>([])

// 表单数据
const formData = reactive<AddressRequest & { region?: string[] }>({
  receiverName: '',
  receiverPhone: '',
  province: '',
  city: '',
  district: '',
  detailAddress: '',
  isDefault: false,
  region: []
})

// 地区选项（简化版，实际应该使用地区数据）
const regionOptions = [
  {
    value: '北京市',
    label: '北京市',
    children: [
      {
        value: '北京市',
        label: '北京市',
        children: [
          { value: '东城区', label: '东城区' },
          { value: '西城区', label: '西城区' },
          { value: '朝阳区', label: '朝阳区' },
          { value: '海淀区', label: '海淀区' }
        ]
      }
    ]
  },
  {
    value: '上海市',
    label: '上海市',
    children: [
      {
        value: '上海市',
        label: '上海市',
        children: [
          { value: '黄浦区', label: '黄浦区' },
          { value: '徐汇区', label: '徐汇区' },
          { value: '浦东新区', label: '浦东新区' }
        ]
      }
    ]
  },
  {
    value: '广东省',
    label: '广东省',
    children: [
      {
        value: '广州市',
        label: '广州市',
        children: [
          { value: '天河区', label: '天河区' },
          { value: '越秀区', label: '越秀区' },
          { value: '海珠区', label: '海珠区' }
        ]
      },
      {
        value: '深圳市',
        label: '深圳市',
        children: [
          { value: '福田区', label: '福田区' },
          { value: '南山区', label: '南山区' },
          { value: '宝安区', label: '宝安区' }
        ]
      }
    ]
  }
]

// 当前编辑的地址ID
let currentAddressId = ''

// 表单验证规则
const formRules: FormRules = {
  receiverName: [
    { required: true, message: '请输入收货人姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  receiverPhone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  region: [
    { required: true, message: '请选择所在地区', trigger: 'change' }
  ],
  detailAddress: [
    { required: true, message: '请输入详细地址', trigger: 'blur' },
    { min: 5, message: '详细地址至少5个字符', trigger: 'blur' }
  ]
}

// 获取地址列表
const fetchAddressList = async () => {
  loading.value = true
  try {
    const res = await getAddressList()
    addressList.value = res.data
  } catch (error) {
    console.error('获取地址列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 新增地址
const handleAdd = () => {
  isEdit.value = false
  dialogVisible.value = true
}

// 编辑地址
const handleEdit = (addr: AddressInfo) => {
  isEdit.value = true
  currentAddressId = addr.addressId
  
  // 填充表单数据
  formData.receiverName = addr.receiverName
  formData.receiverPhone = addr.receiverPhone
  formData.province = addr.province
  formData.city = addr.city
  formData.district = addr.district
  formData.detailAddress = addr.detailAddress
  formData.isDefault = addr.isDefault
  
  // 设置地区级联选择器的值
  formData.region = [addr.province, addr.city, addr.district]
  
  dialogVisible.value = true
}

// 删除地址
const handleDelete = async (addr: AddressInfo) => {
  try {
    await ElMessageBox.confirm('确定要删除该地址吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteAddress(addr.addressId)
    ElMessage.success('删除成功')
    fetchAddressList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除地址失败:', error)
    }
  }
}

// 设为默认地址
const handleSetDefault = async (addr: AddressInfo) => {
  try {
    await updateAddress(addr.addressId, {
      receiverName: addr.receiverName,
      receiverPhone: addr.receiverPhone,
      province: addr.province,
      city: addr.city,
      district: addr.district,
      detailAddress: addr.detailAddress,
      isDefault: true
    })
    ElMessage.success('设置成功')
    fetchAddressList()
  } catch (error) {
    console.error('设置默认地址失败:', error)
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      // 从地区级联选择器中提取省市区
      if (formData.region && formData.region.length === 3) {
        formData.province = formData.region[0]
        formData.city = formData.region[1]
        formData.district = formData.region[2]
      }
      
      const data: AddressRequest = {
        receiverName: formData.receiverName,
        receiverPhone: formData.receiverPhone,
        province: formData.province,
        city: formData.city,
        district: formData.district,
        detailAddress: formData.detailAddress,
        isDefault: formData.isDefault
      }
      
      if (isEdit.value) {
        await updateAddress(currentAddressId, data)
        ElMessage.success('更新成功')
      } else {
        await addAddress(data)
        ElMessage.success('添加成功')
      }
      
      dialogVisible.value = false
      fetchAddressList()
    } catch (error) {
      console.error('提交失败:', error)
    } finally {
      submitLoading.value = false
    }
  })
}

// 关闭对话框
const handleDialogClose = () => {
  formRef.value?.resetFields()
  Object.assign(formData, {
    receiverName: '',
    receiverPhone: '',
    province: '',
    city: '',
    district: '',
    detailAddress: '',
    isDefault: false,
    region: []
  })
  currentAddressId = ''
}

onMounted(() => {
  fetchAddressList()
})
</script>

<style scoped lang="scss">
.addresses-page {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .address-list {
    min-height: 400px;
  }

  .address-items {
    display: grid;
    gap: 16px;
  }

  .address-item {
    padding: 20px;
    border: 1px solid $border-color-light;
    border-radius: 8px;
    transition: all 0.3s;

    &:hover {
      border-color: $primary-color;
      box-shadow: 0 2px 12px rgba($primary-color, 0.1);
    }

    &.is-default {
      border-color: $success-color;
      background: linear-gradient(135deg, rgba($success-color, 0.05) 0%, transparent 100%);
    }

    .address-info {
      margin-bottom: 12px;

      .address-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;

        .receiver-name {
          font-size: 16px;
          font-weight: 600;
          color: $text-primary;
        }

        .receiver-phone {
          font-size: 14px;
          color: $text-secondary;
        }
      }

      .address-detail {
        font-size: 14px;
        color: $text-regular;
        line-height: 1.6;
      }
    }

    .address-actions {
      display: flex;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid $border-color-lighter;
    }
  }
}

:deep(.el-dialog) {
  .el-form-item {
    margin-bottom: 20px;
  }
}
</style>

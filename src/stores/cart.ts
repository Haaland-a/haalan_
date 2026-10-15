import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCartCount } from '@/api/cart'
import { useUserStore } from '@/stores/user'

export const useCartStore = defineStore('cart', () => {
  // 购物车商品件数（顶部角标）
  const count = ref(0)

  /**
   * 刷新购物车角标；未登录时清零
   */
  async function refreshCount() {
    const userStore = useUserStore()
    if (!userStore.isLoggedIn) {
      count.value = 0
      return
    }
    try {
      const res: any = await getCartCount()
      count.value = Number(res?.data ?? 0)
    } catch (e) {
      // 角标失败不打扰用户
      count.value = 0
    }
  }

  function reset() {
    count.value = 0
  }

  return { count, refreshCount, reset }
})

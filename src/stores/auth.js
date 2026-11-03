import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'

const TOKEN_KEY = 'bes_token'
const USER_KEY = 'bes_user'
const ADMIN_KEY = 'bes_admin'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const user = ref(JSON.parse(localStorage.getItem(USER_KEY) || 'null'))
  const adminToken = ref(localStorage.getItem(ADMIN_KEY) || '')

  const isLogged = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  function persist(t, u) {
    token.value = t
    user.value = u
    localStorage.setItem(TOKEN_KEY, t)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
  }

  async function login(email, password) {
    const data = await authApi.login({ email, password })
    persist(data.token, data.user)
    return data.user
  }

  async function register(payload) {
    const data = await authApi.register(payload)
    persist(data.token, data.user)
    return data.user
  }

  async function adminLogin(email, password) {
    const data = await authApi.adminLogin({ email, password })
    persist(data.token, data.user)
    localStorage.setItem(ADMIN_KEY, '1')
    return data.user
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(ADMIN_KEY)
  }

  /** 拉取最新用户信息（积分变动后同步） */
  async function refresh() {
    if (!token.value) return null
    try {
      const me = await authApi.me()
      user.value = me
      localStorage.setItem(USER_KEY, JSON.stringify(me))
      return me
    } catch {
      logout()
      return null
    }
  }

  return { token, user, adminToken, isLogged, isAdmin, login, register, adminLogin, logout, refresh }
})

import axios from 'axios'
import { ElMessage } from 'element-plus'
import { setupMock } from './mock'

const USE_MOCK = String(import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 120000
})

// 无后端时挂上内置 Mock（在浏览器内模拟 48 个接口）
if (USE_MOCK) setupMock(http)

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('bes_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  async (response) => {
    const body = response.data

    // 下载接口用 responseType:'blob'，服务端报错时会返回 JSON —— 这里还原成业务错误
    if (body instanceof Blob) {
      if (body.type && body.type.includes('application/json')) {
        try {
          const parsed = JSON.parse(await body.text())
          if (parsed && typeof parsed.code === 'number' && parsed.code !== 0) {
            const err = new Error(parsed.message || '请求失败')
            err.code = parsed.code
            throw err
          }
        } catch (e) {
          if (e instanceof Error && typeof e.code === 'number') throw e
          /* 非 JSON 错误体：当作正常文件返回 */
        }
      }
      return body
    }

    // 统一响应包裹 { code, message, data }
    if (body && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'code')) {
      if (body.code === 0) return body.data
      const err = new Error(body.message || '请求失败')
      err.code = body.code
      return Promise.reject(err)
    }
    return body // 非包裹的其它响应
  },
  async (error) => {
    const status = error.response?.status
    let body = error.response?.data || {}

    // 下载接口 4xx 时响应体是 Blob，需要先还原成 JSON
    if (body instanceof Blob && body.type && body.type.includes('application/json')) {
      try {
        body = JSON.parse(await body.text())
      } catch {
        body = {}
      }
    }

    const message = body?.message || error.message || '网络异常'
    if (status === 401) {
      localStorage.removeItem('bes_token')
      localStorage.removeItem('bes_user')
      if (!location.pathname.startsWith('/login')) {
        ElMessage.warning('登录已过期，请重新登录')
        location.href = '/login'
      }
    }
    const err = new Error(message)
    err.code = body?.code
    err.status = status
    return Promise.reject(err)
  }
)

export default http

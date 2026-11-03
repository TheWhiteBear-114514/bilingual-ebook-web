import http from './http'

/* ---------------- 认证 ---------------- */
export const authApi = {
  register: (payload) => http.post('/auth/register', payload),
  login: (payload) => http.post('/auth/login', payload),
  me: () => http.get('/auth/me'),
  adminLogin: (payload) => http.post('/admin/login', payload)
}

/* ---------------- 引擎 / 语言 / 公告 ---------------- */
export const metaApi = {
  engines: () => http.get('/engines'),
  languages: () => http.get('/languages'),
  notices: () => http.get('/notices'),
  noticeView: (id) => http.post(`/notices/${id}/view`)
}

/* ---------------- 书籍 ---------------- */
export const bookApi = {
  list: (params) => http.get('/books', { params }),
  detail: (id) => http.get(`/books/${id}`),
  create: (formData, onProgress) =>
    http.post('/books', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }),
  retry: (id) => http.post(`/books/${id}/retry`),
  remove: (id) => http.delete(`/books/${id}`),
  download: (id, format = 'epub') =>
    http.get(`/books/${id}/download`, { params: { format }, responseType: 'blob' })
}

/* ---------------- 积分 / 反馈 ---------------- */
export const pointApi = {
  balance: () => http.get('/points'),
  logs: (params) => http.get('/points/logs', { params }),
  checkin: () => http.post('/points/checkin'),
  rate: () => http.get('/points/rate')
}

export const feedbackApi = {
  submit: (payload) => http.post('/feedback', payload),
  mine: () => http.get('/feedback/my')
}

/* ---------------- 管理端 ---------------- */
export const adminApi = {
  dashboard: () => http.get('/admin/dashboard'),

  users: (params) => http.get('/admin/users', { params }),
  toggleUser: (id) => http.put(`/admin/users/${id}/status`),
  resetPassword: (id) => http.post(`/admin/users/${id}/reset-password`),
  deleteUser: (id) => http.delete(`/admin/users/${id}`),

  tasks: (params) => http.get('/admin/tasks', { params }),
  cancelTask: (id) => http.post(`/admin/tasks/${id}/cancel`),
  retryTask: (id) => http.post(`/admin/tasks/${id}/retry`),
  deleteTask: (id) => http.delete(`/admin/tasks/${id}`),

  cache: (params) => http.get('/admin/cache', { params }),
  deleteCache: (id) => http.delete(`/admin/cache/${id}`),
  clearCache: () => http.delete('/admin/cache'),

  engines: () => http.get('/admin/engines'),
  toggleEngine: (id, enabled) => http.put(`/admin/engines/${id}/status`, { enabled }),

  officialApi: () => http.get('/admin/official-api'),
  saveOfficialApi: (payload) => http.put('/admin/official-api', payload),

  points: (params) => http.get('/admin/points', { params }),
  adjustPoints: (payload) => http.post('/admin/points/adjust', payload),
  clearPoints: (userId) => http.post('/admin/points/clear', { user_id: userId }),
  bulkPoints: (delta) => http.post('/admin/points/bulk', { delta }),
  savePointConfig: (payload) => http.put('/admin/points/config', payload),

  feedbacks: (params) => http.get('/admin/feedback', { params }),
  handleFeedback: (id, payload) => http.post(`/admin/feedback/${id}/handle`, payload),

  riskAlerts: (params) => http.get('/admin/risk/alerts', { params }),
  saveRiskConfig: (payload) => http.put('/admin/risk/config', payload),
  resolveRisk: (id, payload) => http.post(`/admin/risk/${id}/resolve`, payload),

  notices: () => http.get('/admin/notices'),
  createNotice: (payload) => http.post('/admin/notices', payload),
  updateNotice: (id, payload) => http.put(`/admin/notices/${id}`, payload),
  toggleNotice: (id) => http.put(`/admin/notices/${id}/status`),
  deleteNotice: (id) => http.delete(`/admin/notices/${id}`),

  logs: (params) => http.get('/admin/logs', { params })
}

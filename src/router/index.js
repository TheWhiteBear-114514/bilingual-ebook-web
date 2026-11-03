import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/', redirect: '/upload' },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true, title: '登录' }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { public: true, title: '注册' }
  },
  {
    path: '/',
    component: () => import('@/layouts/UserLayout.vue'),
    children: [
      { path: 'upload', name: 'upload', component: () => import('@/views/UploadView.vue'), meta: { title: '上传新书' } },
      { path: 'processing/:id', name: 'processing', component: () => import('@/views/ProcessView.vue'), meta: { title: '生成中' } },
      { path: 'result/:id', name: 'result', component: () => import('@/views/ResultView.vue'), meta: { title: '生成结果' } },
      { path: 'shelf', name: 'shelf', component: () => import('@/views/ShelfView.vue'), meta: { title: '我的书架' } },
      { path: 'books/:id', name: 'book-detail', component: () => import('@/views/DetailView.vue'), meta: { title: '书籍详情' } },
      { path: 'points', name: 'points', component: () => import('@/views/PointsView.vue'), meta: { title: '积分中心' } },
      { path: 'feedback', name: 'feedback', component: () => import('@/views/FeedbackView.vue'), meta: { title: '意见反馈' } }
    ]
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue'), meta: { public: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.public) return true

  if (!auth.isLogged) return { name: 'login', query: { redirect: to.fullPath } }
  return true
})

router.afterEach((to) => {
  const base = import.meta.env.VITE_APP_TITLE || '双语书工厂'
  document.title = to.meta.title ? `${to.meta.title} · ${base}` : base
})

export default router

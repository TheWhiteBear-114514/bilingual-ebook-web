<template>
  <el-container class="admin">
    <el-aside :width="collapsed ? '64px' : '206px'" class="aside">
      <div class="brand">
        <span class="logo">B</span>
        <span v-if="!collapsed" class="brand-text">
          <b>双书工厂</b>
          <small>ADMIN</small>
        </span>
      </div>

      <el-menu
        :default-active="route.path"
        :collapse="collapsed"
        :collapse-transition="false"
        router
        class="menu"
      >
        <el-menu-item v-for="m in menus" :key="m.path" :index="m.path">
          <el-icon><component :is="m.icon" /></el-icon>
          <template #title>{{ m.title }}</template>
          <el-badge v-if="m.badge" :value="m.badge" class="menu-badge" />
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="left">
          <el-button text :icon="collapsed ? 'Expand' : 'Fold'" @click="collapsed = !collapsed" />
          <h2>{{ route.meta.title || '管理控制台' }}</h2>
        </div>
        <div class="right">
          <el-tag size="small" type="info" effect="plain">Mock 演示</el-tag>
          <el-button size="small" text @click="goUser">打开用户端 ↗</el-button>
          <el-dropdown @command="onCommand">
            <span class="user">
              <el-avatar :size="28">{{ (auth.user?.nickname || 'A').slice(0, 1) }}</el-avatar>
              <span class="name">{{ auth.user?.nickname || 'admin' }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { adminApi } from '@/api'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const collapsed = ref(false)

const riskPending = ref(0)

const menus = computed(() => [
  { path: '/admin/dashboard', title: '概览', icon: 'DataLine' },
  { path: '/admin/users', title: '用户管理', icon: 'User' },
  { path: '/admin/points', title: '积分管理', icon: 'Coin' },
  { path: '/admin/tasks', title: '任务管理', icon: 'Notebook' },
  { path: '/admin/cache', title: '翻译缓存', icon: 'Files' },
  { path: '/admin/engines', title: '引擎管理', icon: 'Setting' },
  { path: '/admin/official-api', title: 'API 接入', icon: 'Key' },
  { path: '/admin/feedback', title: '反馈管理', icon: 'ChatDotRound' },
  { path: '/admin/risk', title: '风控中心', icon: 'Warning', badge: riskPending.value || 0 },
  { path: '/admin/notices', title: '公告管理', icon: 'Bell' },
  { path: '/admin/logs', title: '系统日志', icon: 'Document' }
])

function goUser() {
  router.push('/upload')
}

function onCommand(cmd) {
  if (cmd === 'logout') {
    auth.logout()
    router.push('/admin/login')
  }
}

onMounted(async () => {
  try {
    const d = await adminApi.dashboard()
    riskPending.value = d.risk_pending
  } catch {
    /* 忽略角标失败 */
  }
})
</script>

<style scoped>
.admin { height: 100vh; }
.aside {
  background: #fff;
  border-right: 1px solid var(--line);
  transition: width 0.2s;
  overflow-x: hidden;
}
.brand {
  height: 62px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 18px;
  border-bottom: 1px solid var(--line);
}
.logo {
  width: 32px; height: 32px; border-radius: 9px; flex: 0 0 32px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff; font-weight: 800; display: flex; align-items: center; justify-content: center;
}
.brand-text { display: flex; flex-direction: column; line-height: 1.1; }
.brand-text b { font-size: 14.5px; }
.brand-text small { font-size: 9.5px; letter-spacing: 1px; color: var(--sub); }
.menu { border-right: none; }
.menu-badge { margin-left: 6px; }
.header {
  height: 62px;
  background: #fff;
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
}
.header .left { display: flex; align-items: center; gap: 6px; }
.header h2 { font-size: 16px; margin: 0; font-weight: 700; }
.header .right { display: flex; align-items: center; gap: 10px; }
.user { display: flex; align-items: center; gap: 7px; cursor: pointer; }
.name { font-size: 13px; color: var(--sub); }
.main { background: var(--bg); padding: 18px; }
</style>

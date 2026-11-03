<template>
  <div class="shell">
    <header class="topbar">
      <div class="inner">
        <router-link to="/upload" class="brand">
          <span class="logo">B</span>
          <span class="brand-text">
            <b>双语书工厂</b>
            <small>Bilingual E-Book Studio</small>
          </span>
        </router-link>

        <div class="right">
          <el-tag type="info" effect="plain" class="demo-tag">Mock 演示</el-tag>
          <el-tag type="warning" effect="light" round class="points-tag">
            <el-icon><Lightning /></el-icon>
            <span class="points-num">{{ auth.user?.points ?? 0 }}</span>
          </el-tag>
          <el-button type="primary" plain round size="small" @click="checkin">签到</el-button>
          <el-dropdown @command="onCommand">
            <span class="user">
              <el-avatar :size="30">{{ (auth.user?.nickname || 'U').slice(0, 1) }}</el-avatar>
              <span class="hello">{{ auth.user?.nickname || auth.user?.email }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="points">积分中心</el-dropdown-item>
                <el-dropdown-item command="shelf">我的书架</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <nav class="tabs">
      <router-link v-for="t in tabs" :key="t.to" :to="t.to" class="tab" active-class="on">
        {{ t.label }}
      </router-link>
    </nav>

    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { pointApi } from '@/api'

const auth = useAuthStore()
const router = useRouter()

const tabs = computed(() => [
  { to: '/upload', label: '上传新书' },
  { to: '/shelf', label: '我的书架' },
  { to: '/points', label: '积分中心' },
  { to: '/feedback', label: '意见反馈' }
])

async function checkin() {
  try {
    const res = await pointApi.checkin()
    ElMessage.success(`签到成功，+${res.reward} 积分`)
    await auth.refresh()
  } catch (e) {
    ElMessage.warning(e.message)
  }
}

function onCommand(cmd) {
  if (cmd === 'logout') {
    auth.logout()
    router.push('/login')
    ElMessage.success('已退出登录')
    return
  }
  router.push(`/${cmd}`)
}
</script>

<style scoped>
.shell { min-height: 100%; }
.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--line);
}
.inner {
  max-width: 1100px;
  margin: 0 auto;
  height: 62px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand { display: flex; align-items: center; gap: 10px; color: var(--ink); }
.logo {
  width: 34px; height: 34px; border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff; font-weight: 800; font-size: 18px;
  display: flex; align-items: center; justify-content: center;
}
.brand-text { display: flex; flex-direction: column; line-height: 1.15; }
.brand-text b { font-size: 15.5px; }
.brand-text small { font-size: 10.5px; color: var(--sub); }
.right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
.points-tag { display: inline-flex; align-items: center; gap: 4px; font-weight: 700; }
.points-num { margin-left: 2px; }
.user { display: flex; align-items: center; gap: 7px; cursor: pointer; }
.hello { font-size: 13px; color: var(--sub); max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.user:hover .hello { color: var(--brand); }

.tabs {
  max-width: 1100px;
  margin: 18px auto 0;
  padding: 0 20px;
  display: flex;
  gap: 9px;
  flex-wrap: wrap;
}
.tab {
  flex: 1 1 0;
  min-width: 0;
  text-align: center;
  padding: 10px 12px;
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 999px;
  color: var(--sub);
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.15s;
}
.tab.on { background: var(--brand); border-color: var(--brand); color: #fff; font-weight: 600; }

@media (max-width: 720px) {
  .brand-text small { display: none; }
  .demo-tag, .hello { display: none; }
  .inner { gap: 8px; padding: 0 14px; }
  .tabs { padding: 0 14px; gap: 8px; }
  .tab { flex: 1 1 calc(50% - 4px); font-size: 13px; padding: 9px 8px; }
}
</style>

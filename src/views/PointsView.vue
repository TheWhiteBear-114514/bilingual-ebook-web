<template>
  <div class="page">
    <div class="card balance">
      <div class="left">
        <p class="label">当前积分余额</p>
        <p class="value">{{ balance }}</p>
        <p class="muted">每 1 积分可兑换 {{ rate }} tokens 官方翻译额度</p>
      </div>
      <div class="right">
        <el-button type="primary" :loading="checking" @click="checkin">每日签到 · 领 10 积分</el-button>
        <p class="muted">今日已签到：{{ checkedToday ? '是' : '否' }}</p>
      </div>
    </div>

    <div class="card">
      <div class="section-title">
        <span>积分明细</span>
        <el-radio-group v-model="filter" size="small">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="earn">获得</el-radio-button>
          <el-radio-button label="spend">消耗</el-radio-button>
        </el-radio-group>
      </div>

      <el-skeleton v-if="loading" :rows="4" animated />

      <div v-else-if="!filtered.length" class="empty">
        <div class="ic">🪙</div>
        <p>还没有积分变动记录</p>
      </div>

      <ul v-else class="logs">
        <li v-for="log in filtered" :key="log.id">
          <div class="dot" :class="log.delta > 0 ? 'in' : 'out'"></div>
          <div class="mid">
            <b>{{ POINT_TYPES[log.type] || log.type }}</b>
            <p class="muted">{{ log.description }} · {{ fmtDate(log.created_at) }}</p>
          </div>
          <div class="delta" :class="log.delta > 0 ? 'in' : 'out'">
            {{ log.delta > 0 ? '+' : '' }}{{ log.delta }}
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { pointApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { fmtDate } from '@/utils/format'
import { POINT_TYPES } from '@/utils/constants'

const auth = useAuthStore()

const logs = ref([])
const rate = ref(1000)
const loading = ref(true)
const checking = ref(false)
const filter = ref('all')
const checkedToday = ref(false)

const balance = computed(() => auth.user?.points ?? 0)

const filtered = computed(() => {
  if (filter.value === 'earn') return logs.value.filter((l) => l.delta > 0)
  if (filter.value === 'spend') return logs.value.filter((l) => l.delta < 0)
  return logs.value
})

async function load() {
  loading.value = true
  try {
    const [page, rateRes] = await Promise.all([pointApi.logs({ page: 1, size: 50 }), pointApi.rate()])
    logs.value = page.items
    rate.value = rateRes.token_per_point
    const today = new Date().toISOString().slice(0, 10)
    checkedToday.value = page.items.some((l) => l.type === 'checkin' && l.created_at.startsWith(today))
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

async function checkin() {
  checking.value = true
  try {
    const res = await pointApi.checkin()
    ElMessage.success(`签到成功，+${res.reward} 积分`)
    await auth.refresh()
    await load()
  } catch (e) {
    ElMessage.warning(e.message)
  } finally {
    checking.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.balance { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.label { margin: 0; color: var(--sub); font-size: 13px; }
.value { margin: 6px 0; font-size: 34px; font-weight: 800; color: var(--brand); }
.right { text-align: right; }
.logs { list-style: none; margin: 0; padding: 0; }
.logs li { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px dashed var(--line); }
.logs li:last-child { border-bottom: none; }
.dot { width: 8px; height: 8px; border-radius: 50%; flex: 0 0 8px; }
.dot.in { background: var(--ok); }
.dot.out { background: #f59e0b; }
.mid { flex: 1; }
.mid b { font-size: 14px; }
.mid p { margin: 3px 0 0; font-size: 12.5px; }
.delta { font-weight: 700; font-variant-numeric: tabular-nums; }
.delta.in { color: var(--ok); }
.delta.out { color: #b45309; }
@media (max-width: 640px) {
  .balance { flex-direction: column; align-items: flex-start; }
  .right { text-align: left; }
}
</style>

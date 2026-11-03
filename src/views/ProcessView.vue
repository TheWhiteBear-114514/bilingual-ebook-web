<template>
  <div class="page">
    <div class="card proc" v-if="book">
      <el-icon class="big"><Loading class="spin" /></el-icon>
      <h2>正在生成「{{ book.title }}」</h2>
      <p class="muted">
        全书约 {{ book.segment_count || '—' }} 段 · 已用时 {{ elapsed }} 秒 · 请勿关闭页面
      </p>

      <el-progress :percentage="book.progress" :stroke-width="10" :status="book.status === 'failed' ? 'exception' : ''" />
      <p class="muted bar-hint">{{ hint }}</p>

      <ul class="steps">
        <li v-for="(s, i) in steps" :key="i" :class="s.state">
          <span class="dot">{{ s.state === 'done' ? '✓' : i + 1 }}</span>
          <span class="label">{{ s.label }}</span>
          <span class="extra muted">{{ s.extra }}</span>
        </li>
      </ul>

      <div class="actions">
        <el-button @click="cancel">返回上传</el-button>
      </div>
    </div>

    <div class="card" v-else-if="loadError">
      <el-result icon="error" title="任务加载失败" :sub-title="loadError">
        <template #extra>
          <el-button type="primary" @click="$router.push('/upload')">返回上传</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { bookApi } from '@/api'

const route = useRoute()
const router = useRouter()

const book = ref(null)
const loadError = ref('')
const elapsed = ref(0)
const startedAt = Date.now()

let pollTimer = null
let tickTimer = null

const hint = computed(() => {
  const p = book.value?.progress ?? 0
  if (p < 8) return '准备中…'
  if (p < 25) return '正在解析并分句…'
  if (p < 85) return `正在逐段翻译…`
  if (p < 100) return '正在合成 EPUB / PDF…'
  return '完成'
})

const steps = computed(() => {
  const p = book.value?.progress ?? 0
  const segs = book.value?.segment_count || 0
  const translated = Math.min(segs, Math.round(((p - 25) / 60) * segs))
  return [
    { label: '文件校验', state: p >= 8 ? 'done' : p > 2 ? 'doing' : '', extra: p >= 8 ? '格式 / 大小校验通过' : '' },
    { label: '解析分句', state: p >= 25 ? 'done' : p >= 8 ? 'doing' : '', extra: p >= 25 ? `检出 ${segs || '—'} 个翻译单元` : '' },
    {
      label: '逐段翻译',
      state: p >= 85 ? 'done' : p >= 25 ? 'doing' : '',
      extra: p >= 25 ? `已翻译 ${translated} / ${segs || '—'}` : ''
    },
    { label: '排版与导出', state: p >= 100 ? 'done' : p >= 85 ? 'doing' : '', extra: p >= 100 ? '双语 EPUB + PDF 生成完毕' : '' }
  ]
})

async function fetchOnce() {
  const data = await bookApi.detail(route.params.id)
  book.value = data

  if (data.status === 'ready') {
    stop()
    router.replace(`/result/${data.id}`)
  } else if (data.status === 'failed') {
    stop()
    router.replace(`/result/${data.id}`)
  }
}

function stop() {
  if (pollTimer) clearInterval(pollTimer)
  if (tickTimer) clearInterval(tickTimer)
  pollTimer = null
  tickTimer = null
}

function cancel() {
  stop()
  router.push('/upload')
}

onMounted(async () => {
  try {
    await fetchOnce()
    if (book.value && (book.value.status === 'processing' || book.value.status === 'pending')) {
      pollTimer = setInterval(() => fetchOnce().catch(() => {}), 900)
      tickTimer = setInterval(() => {
        elapsed.value = Math.round((Date.now() - startedAt) / 1000)
      }, 1000)
    }
  } catch (e) {
    loadError.value = e.message
  }
})

onBeforeUnmount(stop)
</script>

<style scoped>
.proc { max-width: 620px; margin: 26px auto; text-align: center; padding: 30px 26px; }
.big { font-size: 40px; color: var(--brand); }
.spin { animation: rot 1.4s linear infinite; }
@keyframes rot { to { transform: rotate(360deg); } }
h2 { font-size: 17px; margin: 10px 0 4px; }
.bar-hint { margin: 8px 0 18px; }
.steps { list-style: none; margin: 0; padding: 0; text-align: left; }
.steps li {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 2px; border-bottom: 1px dashed var(--line);
  color: #94a3b8; font-size: 14px;
}
.steps li:last-child { border-bottom: none; }
.steps li.done { color: var(--ink); }
.steps li.doing { color: var(--brand); font-weight: 600; }
.dot {
  width: 24px; height: 24px; border-radius: 50%;
  background: #e5e7eb; color: #64748b;
  display: flex; align-items: center; justify-content: center;
  font-size: 12.5px; flex: 0 0 24px;
}
.steps li.done .dot { background: var(--ok); color: #fff; }
.steps li.doing .dot { background: var(--brand); color: #fff; }
.label { flex: 1; }
.extra { font-size: 12.5px; }
.actions { margin-top: 18px; }
</style>

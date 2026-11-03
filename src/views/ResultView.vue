<template>
  <div class="page" v-if="book">
    <div class="card result-head">
      <div class="ok-icon"><el-icon><Select /></el-icon></div>
      <h2>《{{ book.title }}》{{ LANG_SHORT[book.source_lang] }}→{{ LANG_SHORT[book.target_lang] }} 对照版已生成</h2>
      <p class="muted">
        {{ fmtDate(book.created_at) }} · 目标语言：{{ LANG_NAME[book.target_lang] }}
      </p>

      <div class="stats">
        <div><b>{{ book.segment_count }}</b><span>段</span></div>
        <div><b>{{ book.failed_segments }}</b><span>失败回退</span></div>
        <div><b>{{ duration || '—' }}</b><span>耗时</span></div>
        <div><b>{{ ENGINE_NAME[book.engine] || book.engine }}</b><span>引擎</span></div>
      </div>

      <div class="actions">
        <el-button type="primary" :loading="downloading" @click="downloadEpub">
          <el-icon><Download /></el-icon> 下载 EPUB
        </el-button>
        <el-button @click="printPdf"><el-icon><Printer /></el-icon> 打印 / 另存 PDF</el-button>
        <el-button text @click="$router.push('/shelf')">查看我的书架</el-button>
        <el-button text @click="$router.push('/upload')">再生成一本</el-button>
      </div>
    </div>

    <div class="card">
      <div class="section-title">
        <span>双语效果预览</span>
        <span class="muted">逐段上下对照 · 浅色底纹为译文</span>
      </div>
      <SegmentList :segments="book.segments" />
    </div>
  </div>

  <div class="page" v-else>
    <div class="card">
      <el-skeleton :rows="6" animated />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import SegmentList from '@/components/SegmentList.vue'
import { bookApi } from '@/api'
import { downloadBlob } from '@/utils/epub'
import { printBook } from '@/utils/print'
import { fmtDate, durationBetween, fileSafeName } from '@/utils/format'
import { LANG_NAME, LANG_SHORT, ENGINE_NAME } from '@/utils/constants'

const route = useRoute()
const book = ref(null)
const downloading = ref(false)

const duration = computed(() => {
  const sec = durationBetween(book.value?.started_at, book.value?.finished_at)
  return sec ? `${Math.round(sec)} 秒` : ''
})

async function load() {
  book.value = await bookApi.detail(route.params.id)
}

async function downloadEpub() {
  downloading.value = true
  try {
    const blob = await bookApi.download(book.value.id, 'epub')
    downloadBlob(
      blob,
      `${fileSafeName(book.value.title)}-${LANG_SHORT[book.value.source_lang]}${LANG_SHORT[book.value.target_lang]}对照.epub`
    )
    ElMessage.success('EPUB 已开始下载，可用 Calibre / Apple Books 打开')
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    downloading.value = false
  }
}

function printPdf() {
  const ok = printBook(book.value)
  if (!ok) ElMessage.warning('浏览器拦截了打印窗口，请允许弹窗后重试')
}

onMounted(() => {
  load().catch((e) => ElMessage.error(e.message))
})
</script>

<style scoped>
.result-head { text-align: center; }
.ok-icon {
  width: 56px; height: 56px; border-radius: 50%;
  background: #ecfdf3; color: var(--ok);
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; margin: 0 auto 12px;
}
h2 { font-size: 18px; margin: 0 0 6px; }
.stats {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 12px; margin: 20px 0;
}
.stats div {
  background: #f8fafc; border: 1px solid var(--line);
  border-radius: 12px; padding: 12px 8px;
}
.stats b { display: block; font-size: 18px; }
.stats span { font-size: 12px; color: var(--sub); }
.actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
@media (max-width: 720px) {
  .stats { grid-template-columns: repeat(2, 1fr); }
}
</style>

<template>
  <div class="page" v-if="book">
    <div class="card head">
      <div class="title-row">
        <h2>《{{ book.title }}》</h2>
        <el-tag :type="statusMeta.type" effect="light">{{ statusMeta.label }}</el-tag>
      </div>
      <p class="muted">
        {{ LANG_NAME[book.source_lang] }} → {{ LANG_NAME[book.target_lang] }} ·
        {{ ENGINE_NAME[book.engine] || book.engine }} · {{ fmtDate(book.created_at) }}
      </p>

      <div class="stats">
        <div><b>{{ book.segment_count }}</b><span>翻译单元</span></div>
        <div><b>{{ book.failed_segments }}</b><span>失败回退</span></div>
        <div><b>{{ book.char_count }}</b><span>源文字符</span></div>
        <div><b>{{ book.cached_segments }}</b><span>缓存命中</span></div>
      </div>

      <el-alert
        v-if="book.status === 'failed'"
        :title="book.error_msg || '生成失败'"
        type="error"
        :closable="false"
        show-icon
        class="err"
      />

      <div class="actions">
        <el-button type="primary" :disabled="book.status !== 'ready'" @click="downloadEpub">下载 EPUB</el-button>
        <el-button :disabled="book.status !== 'ready'" @click="printPdf">打印 / 另存 PDF</el-button>
        <el-button @click="$router.push('/shelf')">返回书架</el-button>
        <el-popconfirm title="确定删除这本书？该操作不可恢复" @confirm="remove">
          <template #reference>
            <el-button type="danger" plain>删除</el-button>
          </template>
        </el-popconfirm>
      </div>
    </div>

    <div class="card" v-if="book.segments?.length">
      <div class="section-title"><span>双语对照</span></div>
      <SegmentList :segments="book.segments" />
    </div>
  </div>

  <div class="page" v-else><div class="card"><el-skeleton :rows="6" animated /></div></div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import SegmentList from '@/components/SegmentList.vue'
import { bookApi } from '@/api'
import { useBookStore } from '@/stores/books'
import { downloadBlob } from '@/utils/epub'
import { printBook } from '@/utils/print'
import { fmtDate, fileSafeName } from '@/utils/format'
import { LANG_NAME, LANG_SHORT, ENGINE_NAME, BOOK_STATUS } from '@/utils/constants'

const route = useRoute()
const router = useRouter()
const store = useBookStore()
const book = ref(null)

const statusMeta = computed(() => BOOK_STATUS[book.value?.status] || { label: '未知', type: 'info' })

async function load() {
  book.value = await bookApi.detail(route.params.id)
}

async function downloadEpub() {
  try {
    const blob = await bookApi.download(book.value.id, 'epub')
    downloadBlob(
      blob,
      `${fileSafeName(book.value.title)}-${LANG_SHORT[book.value.source_lang]}${LANG_SHORT[book.value.target_lang]}对照.epub`
    )
  } catch (e) {
    ElMessage.error(e.message)
  }
}

function printPdf() {
  const ok = printBook(book.value)
  if (!ok) ElMessage.warning('浏览器拦截了打印窗口，请允许弹窗后重试')
}

async function remove() {
  await store.remove(book.value.id)
  ElMessage.success('已删除')
  router.push('/shelf')
}

onMounted(() => load().catch((e) => ElMessage.error(e.message)))
</script>

<style scoped>
.title-row { display: flex; align-items: center; gap: 10px; }
h2 { font-size: 18px; margin: 0; }
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
.stats div { background: #f8fafc; border: 1px solid var(--line); border-radius: 12px; padding: 12px 10px; }
.stats b { display: block; font-size: 17px; }
.stats span { font-size: 12px; color: var(--sub); }
.actions { display: flex; gap: 10px; flex-wrap: wrap; }
.err { margin-bottom: 14px; }
@media (max-width: 720px) { .stats { grid-template-columns: repeat(2, 1fr); } }
</style>

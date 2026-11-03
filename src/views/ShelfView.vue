<template>
  <div class="page">
    <div class="card">
      <div class="section-title">
        <span>我的书架（{{ store.total }}）</span>
        <el-button type="primary" plain size="small" @click="$router.push('/upload')">上传新书</el-button>
      </div>

      <el-skeleton v-if="store.loading" :rows="4" animated />

      <div v-else-if="!store.list.length" class="empty">
        <div class="ic">📚</div>
        <p>书架还是空的，去生成你的第一本双语书吧</p>
        <el-button type="primary" @click="$router.push('/upload')">去上传</el-button>
      </div>

      <div v-else class="grid">
        <div v-for="b in store.list" :key="b.id" class="book" @click="open(b)">
          <div class="cover">{{ (b.title || '?').slice(0, 1).toUpperCase() }}</div>
          <div class="info">
            <h4 :title="b.title">{{ b.title }}</h4>
            <p class="muted">
              {{ LANG_SHORT[b.source_lang] }}→{{ LANG_SHORT[b.target_lang] }} ·
              {{ b.segment_count }} 段 · {{ fmtDate(b.created_at) }}
            </p>
            <el-tag :type="BOOK_STATUS[b.status]?.type || 'info'" size="small" effect="light">
              {{ BOOK_STATUS[b.status]?.label || b.status }}
            </el-tag>
          </div>
          <div class="ops">
            <el-button size="small" text type="primary" @click.stop="download(b)">下载</el-button>
            <el-popconfirm title="删除后不可恢复，确定？" @confirm="remove(b)">
              <template #reference>
                <el-button size="small" text type="danger" @click.stop>删除</el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useBookStore } from '@/stores/books'
import { bookApi } from '@/api'
import { downloadBlob } from '@/utils/epub'
import { fmtDate, fileSafeName } from '@/utils/format'
import { LANG_SHORT, BOOK_STATUS } from '@/utils/constants'

const router = useRouter()
const store = useBookStore()

function open(b) {
  router.push(`/books/${b.id}`)
}

async function download(b) {
  if (b.status !== 'ready') {
    ElMessage.warning('该任务尚未生成完成')
    return
  }
  try {
    const blob = await bookApi.download(b.id, 'epub')
    downloadBlob(blob, `${fileSafeName(b.title)}-${LANG_SHORT[b.source_lang]}${LANG_SHORT[b.target_lang]}对照.epub`)
  } catch (e) {
    ElMessage.error(e.message)
  }
}

async function remove(b) {
  await store.remove(b.id)
  ElMessage.success('已删除')
}

onMounted(() => store.fetchList(1, 50))
</script>

<style scoped>
.grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
.book {
  display: flex; align-items: center; gap: 14px;
  border: 1px solid var(--line); border-radius: 14px;
  padding: 14px 16px; cursor: pointer; transition: all 0.15s; background: #fff;
}
.book:hover { border-color: #bfdbfe; box-shadow: 0 6px 18px rgba(37, 99, 235, 0.08); }
.cover {
  width: 44px; height: 58px; border-radius: 8px; flex: 0 0 44px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #fff; font-weight: 800; font-size: 20px;
  display: flex; align-items: center; justify-content: center;
}
.info { flex: 1; min-width: 0; }
.info h4 { margin: 0 0 4px; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.info p { margin: 0 0 6px; font-size: 12.5px; }
.ops { display: flex; gap: 4px; }
@media (max-width: 640px) {
  .book { flex-wrap: wrap; }
  .ops { width: 100%; justify-content: flex-end; }
}
</style>

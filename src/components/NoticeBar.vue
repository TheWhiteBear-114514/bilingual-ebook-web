<template>
  <div v-if="notices.length" class="notice-card">
    <div class="head">
      <el-icon><Bell /></el-icon>
      <span>公告</span>
      <span class="muted">由管理控制台发布 · 点击查看全文</span>
    </div>
    <ul>
      <li v-for="n in notices" :key="n.id" @click="open(n)">
        <el-tag :type="tagType(n.type)" size="small" effect="light">{{ tagLabel(n.type) }}</el-tag>
        <span class="title">{{ n.title }}</span>
        <span class="time muted">{{ fmtDate(n.created_at) }}</span>
      </li>
    </ul>

    <el-dialog v-model="visible" :title="current?.title" width="560px">
      <p class="body">{{ current?.body }}</p>
      <p class="muted">{{ fmtDate(current?.created_at) }}</p>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { metaApi } from '@/api'
import { fmtDate } from '@/utils/format'
import { NOTICE_TYPES } from '@/utils/constants'

const notices = ref([])
const visible = ref(false)
const current = ref(null)

const tagType = (t) => NOTICE_TYPES[t]?.type || 'info'
const tagLabel = (t) => NOTICE_TYPES[t]?.label || t

function open(n) {
  current.value = n
  visible.value = true
  // 浏览量 +1（设计文档：管理端可查看公告浏览量）
  metaApi.noticeView?.(n.id).then(() => { n.views = (n.views || 0) + 1 }).catch(() => {})
}

onMounted(async () => {
  try {
    notices.value = await metaApi.notices()
  } catch {
    notices.value = []
  }
})
</script>

<style scoped>
.notice-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 16px 18px;
  box-shadow: var(--shadow);
}
.head { display: flex; align-items: center; gap: 7px; font-weight: 700; font-size: 14px; margin-bottom: 10px; }
ul { list-style: none; margin: 0; padding: 0; }
li {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 0; border-top: 1px dashed var(--line); cursor: pointer;
}
li:first-child { border-top: none; }
li:hover .title { color: var(--brand); }
.title { flex: 1; font-size: 13.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.time { font-size: 12px; }
.body { white-space: pre-wrap; line-height: 1.85; margin: 0 0 12px; }
</style>

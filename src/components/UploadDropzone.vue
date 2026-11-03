<template>
  <div
    class="drop"
    :class="{ dragging, has: !!file }"
    @click="pick"
    @dragover.prevent="dragging = true"
    @dragleave.prevent="dragging = false"
    @drop.prevent="onDrop"
  >
    <input ref="input" type="file" accept=".txt,.epub,.pdf" hidden @change="onChange" />

    <template v-if="!file">
      <el-icon class="ic"><UploadFilled /></el-icon>
      <p class="main">点击选择，或将文件拖拽到此处</p>
      <p class="sub">支持 .txt / .epub / .pdf（文本型）· 单个文件 ≤ 10MB</p>
    </template>

    <div v-else class="file">
      <el-icon class="ic-sm"><Document /></el-icon>
      <div class="meta">
        <b>{{ file.name }}</b>
        <span class="muted">{{ fmtSize(file.size) }}</span>
      </div>
      <el-button text type="danger" @click.stop="clear">移除</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fmtSize } from '@/utils/format'

const emit = defineEmits(['update:file'])
const props = defineProps({ file: { type: Object, default: null } })

const input = ref(null)
const dragging = ref(false)

const MAX = 10 * 1024 * 1024

function pick() {
  input.value?.click()
}

function validate(f) {
  if (!/\.(txt|epub|pdf)$/i.test(f.name)) {
    ElMessage.warning('暂不支持该格式，请选择 txt / epub / pdf')
    return false
  }
  if (f.size > MAX) {
    ElMessage.warning('文件超过 10MB 限制')
    return false
  }
  if (/\.pdf$/i.test(f.name)) {
    ElMessage.info('已接收 PDF，正式环境会校验是否为文本型（扫描版不支持）', 3)
  }
  return true
}

function setFile(f) {
  if (!f || !validate(f)) return
  emit('update:file', f)
}

function onDrop(e) {
  dragging.value = false
  setFile(e.dataTransfer?.files?.[0])
}

function onChange(e) {
  setFile(e.target.files?.[0])
  e.target.value = ''
}

function clear() {
  emit('update:file', null)
}
</script>

<style scoped>
.drop {
  border: 1.5px dashed #bfd4f5;
  background: #f7fbff;
  border-radius: 14px;
  padding: 30px 18px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
}
.drop:hover, .drop.dragging { border-color: var(--brand); background: var(--brand-light); }
.ic { font-size: 40px; color: var(--brand); }
.ic-sm { font-size: 22px; color: var(--brand); }
.main { margin: 8px 0 4px; font-weight: 600; font-size: 15px; }
.sub { margin: 0; font-size: 12.5px; color: var(--sub); }
.file { display: flex; align-items: center; gap: 12px; text-align: left; }
.meta { display: flex; flex-direction: column; flex: 1; }
.meta b { font-size: 14px; }
</style>

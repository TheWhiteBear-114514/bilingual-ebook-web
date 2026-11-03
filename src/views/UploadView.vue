<template>
  <div class="page">
    <NoticeBar />

    <div class="card upload-card">
      <div class="section-title">
        <span>上传电子书</span>
        <span class="muted">解析 → 分句 → 翻译 → 排版 → 导出</span>
      </div>

      <UploadDropzone v-model:file="file" />

      <el-form label-position="top" class="form">
        <div class="row-2">
          <el-form-item label="目标语言">
            <el-select v-model="targetLang" style="width: 100%">
              <el-option v-for="l in languages" :key="l.code" :label="l.name" :value="l.code" />
            </el-select>
          </el-form-item>
          <el-form-item label="书名（可选，缺省取文件名）">
            <el-input v-model="title" placeholder="自动从文件读取，可修改" />
          </el-form-item>
        </div>

        <el-form-item>
          <template #label>
            <span class="engine-label">
              翻译引擎
              <el-tag :type="engineReady ? 'success' : 'warning'" size="small" effect="light" round>
                {{ engineReady ? '已接入' : '未接入' }}
              </el-tag>
            </span>
          </template>
          <el-select v-model="engine" style="width: 100%">
            <el-option
              v-for="e in engines"
              :key="e.id"
              :label="e.name"
              :value="e.id"
              :disabled="!engineEnabled(e)"
            />
          </el-select>
          <p class="muted hint">{{ currentEngine?.desc }}</p>
        </el-form-item>

        <div v-if="currentEngine && !currentEngine.official" class="keys">
          <div v-for="f in currentEngine.keyFields" :key="f.k" class="key-item">
            <label>{{ f.label }}</label>
            <el-input
              v-model="keys[f.k]"
              :type="f.type === 'password' ? 'password' : 'text'"
              :show-password="f.type === 'password'"
              :placeholder="f.placeholder"
            />
          </div>
          <p class="muted">
            密钥仅保存在本机浏览器，随请求发送、服务端即用即弃、不落库。
            <el-button text type="primary" @click="clearKeys">清除已保存的密钥</el-button>
          </p>
        </div>

        <div v-if="currentEngine?.official" class="official">
          <el-icon><Lightning /></el-icon>
          <span>
            使用官方引擎按字符消耗积分，本次预计消耗
            <b>{{ estimatedCost }}</b> 积分，当前余额
            <b>{{ auth.user?.points ?? 0 }}</b> 积分。
          </span>
          <el-button text type="primary" @click="goPoints">去签到赚积分</el-button>
        </div>

        <el-button
          type="primary"
          size="large"
          class="generate"
          :loading="submitting"
          :disabled="!file"
          @click="submit"
        >
          开始生成双语书
        </el-button>
        <p class="muted center">同一本书重复处理会命中翻译缓存，速度更快</p>
      </el-form>
    </div>

    <div class="card">
      <div class="section-title"><span>快速体验</span></div>
      <p class="muted">不想准备文件？直接使用内置示例书跑通全流程。</p>
      <el-button plain @click="useSample">使用示例书（Pride and Prejudice）</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import NoticeBar from '@/components/NoticeBar.vue'
import UploadDropzone from '@/components/UploadDropzone.vue'
import { metaApi, bookApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { LANGUAGES, ENGINES } from '@/utils/constants'

const router = useRouter()
const auth = useAuthStore()

const file = ref(null)
const title = ref('')
const targetLang = ref('zh')
const engine = ref('official')
const languages = ref(LANGUAGES)
const engines = ref(ENGINES)
const keys = reactive({})
const submitting = ref(false)

const KEY_STORE = 'bes_engine_keys'

const currentEngine = computed(() => engines.value.find((e) => e.id === engine.value))

const engineReady = computed(() => {
  if (!currentEngine.value) return false
  if (currentEngine.value.official) return true
  return currentEngine.value.keyFields.every((f) => (keys[f.k] || '').trim())
})

const estimatedCost = computed(() => {
  const size = file.value?.size || 6000
  return Math.max(1, Math.ceil((size * 0.35) / 1000))
})

function engineEnabled(e) {
  // 官方引擎若被管理端停用，则不可选
  if (e.official && e.enabled === false) return false
  return true
}

function loadKeys() {
  try {
    Object.assign(keys, JSON.parse(localStorage.getItem(KEY_STORE) || '{}'))
  } catch {
    /* ignore */
  }
}

function persistKeys() {
  localStorage.setItem(KEY_STORE, JSON.stringify(keys))
}

function clearKeys() {
  Object.keys(keys).forEach((k) => delete keys[k])
  persistKeys()
  ElMessage.success('已清除本机保存的密钥')
}

watch(keys, persistKeys, { deep: true })

function useSample() {
  const blob = new Blob([new Array(12000).fill('a').join('')], { type: 'text/plain' })
  const f = new File([blob], 'Pride and Prejudice.txt', { type: 'text/plain' })
  file.value = f
  if (!title.value) title.value = 'Pride and Prejudice'
  ElMessage.success('已载入示例书，点击「开始生成」体验全流程')
}

function goPoints() {
  router.push('/points')
}

async function submit() {
  if (!file.value) {
    ElMessage.warning('请先选择文件或使用示例书')
    return
  }
  if (!engineReady.value) {
    ElMessage.error('翻译引擎未接入，不可翻译：请填写自己申请的 API Key')
    return
  }
  if (currentEngine.value.official && (auth.user?.points ?? 0) < estimatedCost.value) {
    ElMessage.error('积分余额不足，请先签到或改用自带密钥的引擎')
    return
  }

  const fd = new FormData()
  fd.append('file', file.value)
  fd.append('target_lang', targetLang.value)
  fd.append('title', title.value.trim() || file.value.name.replace(/\.[^.]+$/, ''))
  fd.append('engine', engine.value)
  if (!currentEngine.value.official) fd.append('engine_keys', JSON.stringify(keys))

  submitting.value = true
  try {
    const book = await bookApi.create(fd)
    await auth.refresh()
    router.push(`/processing/${book.id}`)
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  loadKeys()
  try {
    const data = await metaApi.engines()
    if (data?.engines?.length) {
      engines.value = data.engines.map((e) => ({
        id: e.id,
        name: e.name,
        official: e.official,
        keyFields: e.key_fields || [],
        enabled: e.enabled,
        desc: ENGINES.find((x) => x.id === e.id)?.desc || ''
      }))
      if (!engines.value.some((e) => e.id === engine.value)) engine.value = engines.value[0].id
    }
  } catch {
    /* 回退到本地常量 */
  }
})
</script>

<style scoped>
.upload-card { margin-top: 18px; }
.form { margin-top: 20px; }
.row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.engine-label { display: inline-flex; align-items: center; gap: 8px; }
.hint { margin: 6px 0 0; }
.keys {
  display: grid;
  gap: 12px;
  background: #f8fafc;
  border: 1px dashed var(--line);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
}
.key-item { display: grid; grid-template-columns: 110px 1fr; align-items: center; gap: 10px; }
.key-item label { font-size: 13px; color: var(--sub); }
.official {
  display: flex; align-items: center; gap: 8px;
  background: var(--brand-light); border: 1px solid #dbeafe;
  border-radius: 12px; padding: 12px 14px; font-size: 13px; margin-bottom: 16px;
}
.generate { width: 100%; }
.center { text-align: center; margin-top: 10px; }
@media (max-width: 720px) {
  .row-2 { grid-template-columns: 1fr; }
  .key-item { grid-template-columns: 1fr; }
}
</style>

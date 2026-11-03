<template>
  <div class="page">
    <div class="card">
      <div class="section-title">
        <span>提交反馈</span>
        <span class="muted">被采纳的反馈会获得积分奖励</span>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="类型">
          <el-radio-group v-model="form.type">
            <el-radio-button value="bug">🐛 Bug</el-radio-button>
            <el-radio-button value="suggest">💡 建议</el-radio-button>
            <el-radio-button value="experience">😊 体验</el-radio-button>
            <el-radio-button value="other">📝 其他</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" maxlength="60" show-word-limit placeholder="一句话描述问题或建议" />
        </el-form-item>
        <el-form-item label="详细描述" prop="body">
          <el-input v-model="form.body" type="textarea" :rows="5" maxlength="500" show-word-limit placeholder="复现步骤、期望结果、实际结果…" />
        </el-form-item>
        <el-form-item label="联系方式（可选）">
          <el-input v-model="form.contact" placeholder="邮箱 / 微信，便于我们回复" />
        </el-form-item>
        <el-button type="primary" :loading="submitting" @click="submit">提交反馈</el-button>
      </el-form>
    </div>

    <div class="card">
      <div class="section-title"><span>我的反馈</span></div>
      <el-skeleton v-if="loading" :rows="3" animated />

      <div v-else-if="!list.length" class="empty">
        <div class="ic">💬</div>
        <p>还没有提交过反馈</p>
      </div>

      <ul v-else class="fb-list">
        <li v-for="f in list" :key="f.id">
          <div class="top">
            <b>{{ FEEDBACK_TYPES[f.type] || f.type }} · {{ f.title }}</b>
            <el-tag v-if="f.status === 'pending'" type="warning" size="small" effect="light">待处理</el-tag>
            <el-tag v-else-if="f.reward > 0" type="success" size="small" effect="light">已奖励 +{{ f.reward }}</el-tag>
            <el-tag v-else type="info" size="small" effect="light">已处理</el-tag>
          </div>
          <p class="body">{{ f.body }}</p>
          <p class="muted">{{ fmtDate(f.created_at) }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { feedbackApi } from '@/api'
import { fmtDate } from '@/utils/format'
import { FEEDBACK_TYPES } from '@/utils/constants'

const formRef = ref(null)
const submitting = ref(false)
const loading = ref(true)
const list = ref([])

const form = reactive({ type: 'bug', title: '', body: '', contact: '' })

const rules = {
  title: [{ required: true, message: '请填写标题', trigger: 'blur' }],
  body: [{ required: true, message: '请填写详细描述', trigger: 'blur' }]
}

async function load() {
  loading.value = true
  try {
    list.value = await feedbackApi.mine()
  } finally {
    loading.value = false
  }
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    await feedbackApi.submit({ ...form })
    ElMessage.success('已提交，感谢反馈！')
    form.title = ''
    form.body = ''
    form.contact = ''
    await load()
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.fb-list { list-style: none; margin: 0; padding: 0; }
.fb-list li { padding: 14px 0; border-bottom: 1px dashed var(--line); }
.fb-list li:last-child { border-bottom: none; }
.top { display: flex; align-items: center; gap: 10px; }
.top b { font-size: 14px; }
.body { margin: 6px 0; font-size: 13.5px; line-height: 1.7; color: #334155; white-space: pre-wrap; }
</style>

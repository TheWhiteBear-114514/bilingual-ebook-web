<template>
  <div class="auth-page">
    <div class="auth-card">
      <aside class="brand-side">
        <div class="logo">B</div>
        <h1>双语书工厂</h1>
        <p>一键生成双语对照电子书 · 语言学习者的阅读伴侣</p>
        <ul>
          <li><el-icon><Select /></el-icon> 支持 txt / epub / pdf（文本型）上传解析</li>
          <li><el-icon><Select /></el-icon> 多翻译引擎 · 中英日韩法德互译</li>
          <li><el-icon><Select /></el-icon> 逐段上下对照排版，保留原书结构</li>
          <li><el-icon><Select /></el-icon> 一键导出双语 EPUB 与 PDF</li>
        </ul>
      </aside>

      <section class="form-side">
        <div class="auth-head">
          <h2>登录</h2>
          <router-link to="/register" class="switch">注册 →</router-link>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="you@example.com" size="large" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" size="large" @keyup.enter="submit" />
          </el-form-item>

          <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon class="err" />

          <el-button type="primary" size="large" class="submit" :loading="loading" @click="submit">登录</el-button>

          <div class="demo">
            <span class="muted">演示账号：demo@book.app / demo123</span>
            <el-button text type="primary" @click="fillDemo">一键填充</el-button>
          </div>
        </el-form>

        <div class="foot">
          <router-link to="/register">还没有账号？去注册</router-link>
          <router-link to="/admin/login" class="muted">管理控制台 →</router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const formRef = ref(null)
const loading = ref(false)
const error = ref('')

const form = reactive({ email: '', password: '' })

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

function fillDemo() {
  form.email = 'demo@book.app'
  form.password = 'demo123'
  error.value = ''
  ElMessage.success('已填充演示账号，点击登录即可体验')
}

async function submit() {
  error.value = ''
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await auth.login(form.email.trim(), form.password)
    ElMessage.success('登录成功')
    router.replace(route.query.redirect || '/upload')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: radial-gradient(1200px 600px at 15% 0%, #e8f1ff 0%, transparent 55%),
    radial-gradient(900px 500px at 100% 100%, #eef4ff 0%, transparent 50%), #f6f8fc;
}
.auth-card {
  display: grid;
  grid-template-columns: 400px 1fr;
  width: min(900px, 100%);
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
  overflow: hidden;
}
.brand-side {
  background: linear-gradient(160deg, #3b82f6, #2563eb 60%, #1d4ed8);
  color: #fff;
  padding: 40px 32px;
}
.brand-side .logo {
  width: 46px; height: 46px; border-radius: 13px;
  background: rgba(255, 255, 255, 0.18);
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; font-weight: 800;
}
.brand-side h1 { font-size: 21px; margin: 18px 0 6px; }
.brand-side p { font-size: 13px; opacity: 0.85; line-height: 1.7; margin: 0 0 22px; }
.brand-side ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; }
.brand-side li { display: flex; gap: 8px; font-size: 13px; opacity: 0.95; }
.form-side { padding: 30px 34px 26px; }
.auth-head {
  display: flex; align-items: baseline; justify-content: space-between;
  margin-bottom: 18px;
}
.auth-head h2 { font-size: 20px; margin: 0; }
.auth-head .switch { font-size: 13px; }
.submit { width: 100%; margin-top: 4px; }
.err { margin-bottom: 12px; }
.demo {
  margin-top: 14px; padding: 10px 12px;
  background: #f8fafc; border: 1px dashed var(--line); border-radius: 10px;
  display: flex; align-items: center; justify-content: space-between; font-size: 12.5px;
}
.foot { display: flex; justify-content: space-between; margin-top: 16px; font-size: 13px; }

@media (max-width: 760px) {
  .auth-card { grid-template-columns: 1fr; }
  .brand-side { display: none; }
  .form-side { padding: 24px 20px; }
}
</style>

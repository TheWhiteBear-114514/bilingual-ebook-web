<template>
  <div class="auth-page">
    <div class="auth-card">
      <aside class="brand-side">
        <div class="logo">B</div>
        <h1>创建账号</h1>
        <p>注册即赠 50 积分，可用于官方引擎翻译，无需自行申请 API Key。</p>
        <ul>
          <li><el-icon><Select /></el-icon> 上传即翻译，逐段双语对照</li>
          <li><el-icon><Select /></el-icon> 每日签到领积分</li>
          <li><el-icon><Select /></el-icon> 书架保存历史成品，可重复下载</li>
        </ul>
      </aside>

      <section class="form-side">
        <h2>注册</h2>
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="you@example.com" size="large" />
          </el-form-item>
          <el-form-item label="昵称（可选）">
            <el-input v-model="form.nickname" placeholder="不填则取邮箱前缀" size="large" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" type="password" show-password placeholder="至少 6 位" size="large" />
          </el-form-item>
          <el-form-item label="确认密码" prop="password2">
            <el-input v-model="form.password2" type="password" show-password placeholder="再次输入密码" size="large" />
          </el-form-item>

          <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon class="err" />

          <el-button type="primary" size="large" class="submit" :loading="loading" @click="submit">注册并登录</el-button>
        </el-form>

        <div class="foot">
          <router-link to="/login">已有账号？去登录</router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const formRef = ref(null)
const loading = ref(false)
const error = ref('')
const form = reactive({ email: '', nickname: '', password: '', password2: '' })

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ],
  password2: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_r, v, cb) => (v === form.password ? cb() : cb(new Error('两次输入的密码不一致'))),
      trigger: 'blur'
    }
  ]
}

async function submit() {
  error.value = ''
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await auth.register({
      email: form.email.trim(),
      password: form.password,
      nickname: form.nickname.trim()
    })
    ElMessage.success('注册成功，已赠送 50 积分')
    router.replace('/upload')
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
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  background: radial-gradient(1200px 600px at 15% 0%, #e8f1ff 0%, transparent 55%), #f6f8fc;
}
.auth-card {
  display: grid; grid-template-columns: 400px 1fr;
  width: min(900px, 100%);
  background: #fff; border-radius: 18px; overflow: hidden;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
}
.brand-side {
  background: linear-gradient(160deg, #3b82f6, #2563eb 60%, #1d4ed8);
  color: #fff; padding: 40px 32px;
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
.brand-side li { display: flex; gap: 8px; font-size: 13px; }
.form-side { padding: 30px 34px 26px; }
.form-side h2 { margin: 0 0 16px; font-size: 18px; }
.submit { width: 100%; }
.err { margin-bottom: 12px; }
.foot { margin-top: 14px; font-size: 13px; }
@media (max-width: 760px) {
  .auth-card { grid-template-columns: 1fr; }
  .brand-side { display: none; }
  .form-side { padding: 24px 20px; }
}
</style>

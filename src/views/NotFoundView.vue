<template>
  <div class="nf">
    <h1>404</h1>
    <p>页面不存在，或你没有访问权限。</p>
    <el-button type="primary" @click="$router.push('/upload')">回到首页</el-button>
  </div>
</template>

<style scoped>
.nf {
  min-height: 100vh; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 10px;
}
h1 { font-size: 64px; margin: 0; color: var(--brand); }
p { color: var(--sub); }
</style>

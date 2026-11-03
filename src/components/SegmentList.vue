<template>
  <div class="seg-list">
    <div v-for="s in segments" :key="s.id || s.seq" class="seg" :class="{ failed: s.is_failed }">
      <p class="s">{{ s.source_text }}</p>
      <p v-if="s.is_failed" class="t">
        <span class="flag">⚠ 翻译失败 · 保留原文</span>
      </p>
      <p v-else class="t">{{ s.translated_text }}</p>
    </div>
    <div v-if="!segments.length" class="empty">
      <div class="ic">📄</div>
      <p>暂无段落内容</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  segments: { type: Array, default: () => [] }
})
</script>

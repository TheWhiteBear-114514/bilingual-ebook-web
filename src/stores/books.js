import { defineStore } from 'pinia'
import { ref } from 'vue'
import { bookApi } from '@/api'

export const useBookStore = defineStore('books', () => {
  const list = ref([])
  const total = ref(0)
  const loading = ref(false)

  async function fetchList(page = 1, size = 12) {
    loading.value = true
    try {
      const data = await bookApi.list({ page, size })
      list.value = data.items
      total.value = data.total
    } finally {
      loading.value = false
    }
  }

  async function fetchDetail(id) {
    return bookApi.detail(id)
  }

  async function remove(id) {
    await bookApi.remove(id)
    list.value = list.value.filter((b) => b.id !== id)
    total.value = Math.max(0, total.value - 1)
  }

  return { list, total, loading, fetchList, fetchDetail, remove }
})

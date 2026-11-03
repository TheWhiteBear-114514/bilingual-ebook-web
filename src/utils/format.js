export function fmtDate(input) {
  if (!input) return '—'
  const d = new Date(String(input).replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return String(input)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function fmtDateShort(input) {
  const full = fmtDate(input)
  return full === '—' ? full : full.slice(5, 16)
}

export function fmtSize(bytes) {
  if (!bytes && bytes !== 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export function fmtNumber(n) {
  return Number(n || 0).toLocaleString('zh-CN')
}

/** 秒数 → 「1 分 20 秒」 */
export function fmtDuration(seconds) {
  if (!seconds) return '—'
  const s = Math.round(seconds)
  if (s < 60) return `${s} 秒`
  return `${Math.floor(s / 60)} 分 ${s % 60} 秒`
}

/** 从 a 到 b 的耗时（DATETIME 字符串） */
export function durationBetween(start, end) {
  if (!start || !end) return null
  const a = new Date(String(start).replace(' ', 'T')).getTime()
  const b = new Date(String(end).replace(' ', 'T')).getTime()
  if (Number.isNaN(a) || Number.isNaN(b)) return null
  return (b - a) / 1000
}

export function fileExt(name = '') {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ''
}

/** 文件名安全化：去掉 Windows / macOS 非法字符 */
export function fileSafeName(name = '') {
  return String(name).replace(/[\\/:*?"<>|]/g, ' ').trim() || 'bilingual-book'
}

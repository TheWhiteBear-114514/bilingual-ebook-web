/** 把书籍渲染成打印版式（浏览器「另存为 PDF」） */
import { LANG_NAME } from '@/utils/constants'
import { fileSafeName } from '@/utils/format'

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function printBook(book) {
  const segs = book.segments || []
  const body = segs
    .map((s) => {
      const src = `<p class="s">${esc(s.source_text)}</p>`
      const tgt = s.is_failed
        ? '<p class="f">⚠ 翻译失败，保留原文</p>'
        : `<p class="t">${esc(s.translated_text)}</p>`
      return `<div class="seg">${src}${tgt}</div>`
    })
    .join('')

  const html = `<!doctype html><html lang="zh"><head><meta charset="utf-8">
<title>${esc(fileSafeName(book.title))} 双语对照版</title>
<style>
  body{font-family:"Songti SC","Noto Serif CJK SC",serif;line-height:1.85;margin:34px 44px;color:#111}
  h1{font-size:20px;text-align:center;margin:0 0 4px}
  .meta{text-align:center;color:#666;font-size:12px;margin-bottom:22px}
  .seg{margin-bottom:12px;page-break-inside:avoid}
  .s{margin:0}
  .t{margin:0 0 6px;color:#1e40af}
  .f{margin:0 0 6px;color:#92400e}
</style></head><body>
<h1>${esc(book.title)}</h1>
<div class="meta">${LANG_NAME[book.source_lang] || book.source_lang} → ${LANG_NAME[book.target_lang] || book.target_lang} · 由双语书工厂生成</div>
${body}
</body></html>`

  const w = window.open('', '_blank')
  if (!w) return false
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 350)
  return true
}

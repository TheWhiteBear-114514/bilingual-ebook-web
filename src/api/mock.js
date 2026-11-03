/**
 * 内置 Mock 适配器（VITE_USE_MOCK=true 时生效）
 * ------------------------------------------------------------
 * 目的：后端未就绪时，前端可以完整跑通「登录 → 上传 → 生成 → 下载 → 书架 → 积分」
 * 以及管理端全部页面。接口路径、字段、错误码与设计文档 §6 保持一致。
 * 后端上线后把 VITE_USE_MOCK 设为 false 即可，业务代码零改动。
 */
import { ENGINES, LANGUAGES } from '@/utils/constants'
import { buildEpub } from '@/utils/epub'

const now = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

const ok = (data = null) => ({ code: 0, message: 'ok', data })
const fail = (code, message) => ({ code, message, data: null })
const sleep = (ms = 260) => new Promise((r) => setTimeout(r, ms))

/* ------------------------- 内置示例内容 ------------------------- */
const PNP = [
  ['It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
   '凡是有钱的单身汉，总想娶位太太，这已经成了一条举世公认的真理。'],
  ['However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered as the rightful property of some one or other of their daughters.',
   '不管这样一个人的心情或见解在初进一个地区时多么不为人所知，这条真理却总是牢牢记在周围各家各户的心里，他被看作是他们某位女儿的准财产。'],
  ['My dear Mr. Bennet, said his lady to him one day, have you heard that Netherfield Park is let at last?', null],
  ['Mr. Bennet replied that he had not.', '班纳特先生回答说他还没有听说。'],
  ['What is his name? asked Mr. Bennet.', '他叫什么名字？班纳特先生问。'],
  ['Bingley.', '宾利。'],
  ['Is he married or single, my dear?', '他是已婚还是单身，我亲爱的？'],
  ['Every one of my girls may have him, for all that I know. First come first served.', '据我所知，我的五个女儿谁都可以嫁给他。先来先得。'],
  ['But I assure you I am by no means so eager as you fancy, to get him for any of them.', '可我向你保证，我一点也不像你想象的那样迫切地想让任何一个女儿嫁给他。'],
  ['She was a woman of mean understanding, little information, and uncertain temper.', '她是个头脑简单、见识不多、脾气还不稳定的女人。']
]

function makeSegments(targetLang = 'zh') {
  return PNP.map(([s, t], i) => ({
    id: i + 1,
    seq: i + 1,
    source_text: s,
    translated_text: i === 2 ? null : (targetLang === 'zh' ? t : `〔${targetLang} 演示译文〕第 ${i + 1} 段`),
    is_failed: i === 2 ? 1 : 0
  }))
}

/* ------------------------- 内存数据库 ------------------------- */
function seed() {
  return {
    seq: { user: 3, book: 2, notice: 3, log: 8, cache: 5, feedback: 3, risk: 2, pointLog: 6 },
    config: {
      checkin_reward: '10',
      register_reward: '50',
      token_per_point: '1000',
      official_api_enabled: '1',
      official_api_key: 'sk-official-xxxxxxxxxxxxx',
      risk_max_single: '500',
      risk_max_freq: '10',
      risk_max_daily: '2000'
    },
    users: [
      { id: 1, email: 'admin@book.app', password: 'admin123', nickname: '管理员', points: 0, role: 'admin', is_active: 1, ban_reason: null, created_at: '2026-09-18 08:00:00', last_login_at: null },
      { id: 2, email: 'demo@book.app', password: 'demo123', nickname: '演示用户', points: 138, role: 'user', is_active: 1, ban_reason: null, created_at: '2026-09-20 10:12:00', last_login_at: '2026-09-27 21:02:30' },
      { id: 3, email: 'chen@mail.cn', password: 'user123', nickname: '陈叙', points: 50, role: 'user', is_active: 0, ban_reason: '积分风控', created_at: '2026-09-22 11:08:00', last_login_at: '2026-09-27 19:58:44' }
    ],
    books: [
      {
        id: 1, user_id: 2, title: 'Pride and Prejudice', source_ext: 'epub', source_lang: 'en',
        target_lang: 'zh', engine: 'official', status: 'ready', source_path: '/data/uploads/2/1/source.epub',
        char_count: 6240, progress: 100, cached_segments: 2,
        error_msg: null, created_at: '2026-09-20 15:42:00',
        started_at: '2026-09-20 15:42:05', finished_at: '2026-09-20 15:43:19',
        segments: makeSegments('zh')
      },
      {
        id: 2, user_id: 3, title: 'The Great Gatsby', source_ext: 'epub', source_lang: 'en',
        target_lang: 'zh', engine: 'baidu', status: 'failed', source_path: '/data/uploads/3/2/source.epub',
        char_count: 96200, progress: 38, cached_segments: 0,
        error_msg: '翻译引擎调用 429 限流（用户密钥额度不足）', created_at: '2026-09-25 22:14:00',
        started_at: '2026-09-25 22:14:04', finished_at: '2026-09-25 22:16:22',
        segments: makeSegments('zh').slice(0, 4)
      }
    ],
    notices: [
      { id: 3, type: 'maintenance', title: '计划维护：2026-09-28（周日）23:00–24:00 平台整体升级', body: '为提升双语书生成服务的稳定性，平台将于 2026 年 9 月 28 日（周日）23:00 至 24:00 进行整体升级。\n\n维护期间：文件上传与翻译生成将临时不可用；已生成的双语书可正常查看与下载。', is_active: 1, views: 486, created_at: '2026-09-27 18:30:00', updated_at: '2026-09-27 18:30:00' },
      { id: 2, type: 'update', title: '新功能：PDF 导出支持自定义页面尺寸与页眉页脚', body: '双语书导出模块已升级：PDF 导出现在支持选择页面尺寸（A5 / A4 / 6 英寸）与自定义页眉页脚文字。', is_active: 1, views: 1203, created_at: '2026-09-25 10:12:00', updated_at: '2026-09-25 10:12:00' },
      { id: 1, type: 'system', title: '安全提示：请妥善保管您的 API Key，平台不保存您的任何密钥', body: '本平台采用 BYOK 模式：翻译使用您自行申请的 API Key，密钥仅在本次翻译请求中生效，服务端不存储、不写入日志。', is_active: 1, views: 2210, created_at: '2026-09-20 09:00:00', updated_at: '2026-09-20 09:00:00' }
    ],
    logs: [
      { id: 8, level: 'INFO', module: 'task', message: '任务 1 入队（Pride and Prejudice · demo@book.app）', created_at: '2026-09-27 21:21:07' },
      { id: 7, level: 'INFO', module: 'translate', message: '书籍 1 翻译完成：10 段，缓存命中 2 段，失败 1 段', created_at: '2026-09-27 21:05:12' },
      { id: 6, level: 'INFO', module: 'upload', message: 'demo@book.app 上传 Pride and Prejudice.epub（1.8MB）', created_at: '2026-09-27 21:02:30' },
      { id: 5, level: 'WARN', module: 'translate', message: '有道 API 限流（429），指数退避重试 2/3', created_at: '2026-09-27 20:47:08' },
      { id: 4, level: 'ERROR', module: 'engine', message: 'demo@book.app 提供的百度 AppKey 校验失败，已拒绝生成请求（3001）', created_at: '2026-09-27 20:44:51' },
      { id: 3, level: 'WARN', module: 'risk', message: '风控命中：chen@mail.cn 短时高频触发自动封号，待管理员复核', created_at: '2026-09-27 20:44:10' },
      { id: 2, level: 'INFO', module: 'cache', message: '定时清理缓存完成：过期 14 条（保留策略 30 天）', created_at: '2026-09-27 20:31:19' },
      { id: 1, level: 'INFO', module: 'auth', message: 'chen@mail.cn 登录成功（IP 112.8.34.102）', created_at: '2026-09-27 19:58:44' }
    ],
    cache: [
      { id: 5, source_hash: '1b2e4c6a8f0d2b4e6a8c0e2f4b6d8a0c', src_lang: 'en', tgt_lang: 'zh', engine: 'official', translated_text: '生存还是毁灭，这是一个值得考虑的问题。', hit_count: 0, created_at: '2026-09-24 09:00:00' },
      { id: 4, source_hash: '9c55f1a2c3d4e5f6a7b8c9d0e1f2a3b4', src_lang: 'ja', tgt_lang: 'zh', engine: 'youdao', translated_text: '太阳已经落下，天空染上了一层红晕，风也渐渐停了下来。', hit_count: 3, created_at: '2026-09-23 10:15:00' },
      { id: 3, source_hash: 'd81c6e07b5f2a4c3d5e6f708192a3b4c', src_lang: 'fr', tgt_lang: 'zh', engine: 'deepl', translated_text: '小王子独自生活在一颗非常非常小的星球上，那里只有一座火山……', hit_count: 5, created_at: '2026-09-22 14:30:00' },
      { id: 2, source_hash: '7b21d8f4a6e3c9b1d2e3f40516273849', src_lang: 'en', tgt_lang: 'zh', engine: 'official', translated_text: '不管这样一个人的心情或见解在初进一个地区时多么不为人所知……', hit_count: 8, created_at: '2026-09-20 15:44:00' },
      { id: 1, source_hash: 'a3f9c2e1f4b7d8c2e3f405162738495a', src_lang: 'en', tgt_lang: 'zh', engine: 'official', translated_text: '凡是有钱的单身汉，总想娶位太太，这已经成了一条举世公认的真理。', hit_count: 12, created_at: '2026-09-20 15:43:00' }
    ],
    feedbacks: [
      { id: 3, user_id: 2, type: 'bug', title: '上传 PDF 后一直卡在解析中', body: '上传一个 8MB 的 PDF 后，进度条停在「解析分句」不动了。', contact: 'demo@book.app', status: 'pending', reward: 0, created_at: '2026-09-27 20:55:00', handled_at: null },
      { id: 2, user_id: 3, type: 'suggest', title: '希望支持更多语言对', body: '目前只有中英日韩法德，能否加入西语、俄语？', contact: '', status: 'pending', reward: 0, created_at: '2026-09-27 19:40:00', handled_at: null },
      { id: 1, user_id: 2, type: 'experience', title: '双语对照排版很清晰', body: '逐段上下对照的排版方式非常清晰，比双栏舒服多了，赞！', contact: '', status: 'done', reward: 20, created_at: '2026-09-24 08:00:00', handled_at: '2026-09-24 08:00:00' }
    ],
    riskAlerts: [
      { id: 2, user_id: 2, rule: 'single', detail: '单次翻译请求预估消耗 620 积分（超过单次上限 500），请求被前置拦截，未实际扣费；复核为误报，已解封并恢复账号。', status: 'resolved', resolve: 'unban', created_at: '2026-09-27 19:15:00', handled_at: '2026-09-27 19:22:00' },
      { id: 1, user_id: 3, rule: 'freq', detail: '5 分钟内发起 18 次官方引擎翻译请求（阈值 10 次），疑似脚本刷量，已自动封号。', status: 'pending', resolve: null, created_at: '2026-09-27 20:44:00', handled_at: null }
    ],
    pointLogs: [
      { id: 6, user_id: 3, delta: 50, balance_after: 50, type: 'register', ref_id: null, description: '新用户注册奖励', created_at: '2026-09-22 11:08:00' },
      { id: 5, user_id: 2, delta: 80, balance_after: 138, type: 'feedback_reward', ref_id: 1, description: '反馈奖励（优质反馈）', created_at: '2026-09-24 08:00:00' },
      { id: 4, user_id: 2, delta: -12, balance_after: 58, type: 'translate', ref_id: 1, description: '官方引擎翻译《Pride and Prejudice》', created_at: '2026-09-20 15:43:20' },
      { id: 3, user_id: 2, delta: 10, balance_after: 70, type: 'checkin', ref_id: null, description: '每日签到', created_at: '2026-09-22 09:30:00' },
      { id: 2, user_id: 2, delta: 10, balance_after: 60, type: 'checkin', ref_id: null, description: '每日签到', created_at: '2026-09-21 09:12:00' },
      { id: 1, user_id: 2, delta: 50, balance_after: 50, type: 'register', ref_id: null, description: '新用户注册奖励', created_at: '2026-09-20 10:12:00' }
    ],
    checkins: []
  }
}

let db = seed()
const timers = new Map()

/* ------------------------- 工具 ------------------------- */
function addLog(level, module, message) {
  db.logs.unshift({ id: ++db.seq.log, level, module, message, created_at: now() })
}

function tokenOf(user) {
  return `mock.${btoa(unescape(encodeURIComponent(user.email)))}.${user.id}`
}

function userFromConfig(config) {
  const auth = config.headers?.Authorization || config.headers?.authorization || ''
  const token = String(auth).replace(/^Bearer\s+/, '')
  if (!token.startsWith('mock.')) return null
  const id = Number(token.split('.').pop())
  return db.users.find((u) => u.id === id) || null
}

function publicUser(u) {
  const { password, ...rest } = u
  return rest
}

function paginate(list, params = {}) {
  const page = Number(params.page || 1)
  const size = Number(params.size || 12)
  return { total: list.length, page, size, items: list.slice((page - 1) * size, page * size) }
}

function bookSummary(b) {
  const segs = b.segments || []
  const failed = segs.filter((s) => s.is_failed).length
  return {
    ...b,
    segments: undefined,
    segment_count: segs.length,
    failed_segments: failed,
    epub_url: `/api/books/${b.id}/download?format=epub`,
    pdf_url: `/api/books/${b.id}/download?format=pdf`
  }
}

function blober(blob, config) {
  return { data: blob, status: 200, statusText: 'OK', headers: {}, config, request: {} }
}

function officialCost(charCount) {
  const per = Number(db.config.token_per_point || 1000)
  return Math.max(1, Math.ceil((charCount * 0.35) / per))
}

function spend(user, amount, desc, refId) {
  const delta = -Math.abs(amount)
  user.points += delta
  db.pointLogs.unshift({
    id: ++db.seq.pointLog, user_id: user.id, delta, balance_after: user.points,
    type: 'translate', ref_id: refId || null, description: desc, created_at: now()
  })
}

function earn(user, amount, type, desc, refId) {
  user.points += amount
  db.pointLogs.unshift({
    id: ++db.seq.pointLog, user_id: user.id, delta: amount, balance_after: user.points,
    type, ref_id: refId || null, description: desc, created_at: now()
  })
}

/** 模拟后台管线：进度推进 → 完成 / 失败 */
function simulate(book) {
  const t = setInterval(() => {
    const cur = db.books.find((b) => b.id === book.id)
    if (!cur || cur.status !== 'processing') {
      clearInterval(t)
      timers.delete(book.id)
      return
    }
    cur.progress = Math.min(100, cur.progress + 6 + Math.round(Math.random() * 6))
    if (cur.progress >= 100) {
      cur.progress = 100
      cur.status = 'ready'
      cur.finished_at = now()
      cur.segments = makeSegments(cur.target_lang)
      addLog('INFO', 'translate', `书籍 ${cur.id} 翻译完成：${cur.segments.length} 段，缓存命中 ${cur.cached_segments} 段，失败 1 段`)
      clearInterval(t)
      timers.delete(book.id)
    }
  }, 700)
  timers.set(book.id, t)
}

/* ------------------------- 路由处理 ------------------------- */
const routes = []
const route = (method, pattern, handler) => routes.push({ method, pattern, handler })

/* 认证 */
route('POST', /^\/auth\/register$/, ({ body }) => {
  const { email, password, nickname } = body || {}
  if (!email || !password) return fail(400, '邮箱和密码不能为空')
  if (!/.+@.+\..+/.test(email)) return fail(400, '邮箱格式不正确')
  if (String(password).length < 6) return fail(400, '密码至少 6 位')
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) return fail(409, '该邮箱已注册')
  const user = {
    id: ++db.seq.user, email, password, nickname: nickname || email.split('@')[0],
    points: 0, role: 'user', is_active: 1, ban_reason: null, created_at: now(), last_login_at: now()
  }
  db.users.push(user)
  const reward = Number(db.config.register_reward || 50)
  earn(user, reward, 'register', '新用户注册奖励')
  addLog('INFO', 'auth', `${email} 注册成功`)
  return ok({ token: tokenOf(user), user: publicUser(user) })
})

route('POST', /^\/auth\/login$/, ({ body }) => {
  const { email, password } = body || {}
  const user = db.users.find((u) => u.email.toLowerCase() === String(email || '').toLowerCase())
  if (!user || user.password !== password) return fail(401, '邮箱或密码错误')
  if (!user.is_active) return fail(403, `账号已被禁用${user.ban_reason ? '（' + user.ban_reason + '）' : ''}`)
  user.last_login_at = now()
  addLog('INFO', 'auth', `${user.email} 登录成功`)
  return ok({ token: tokenOf(user), user: publicUser(user) })
})

route('GET', /^\/auth\/me$/, ({ config }) => {
  const u = userFromConfig(config)
  if (!u) return fail(401, '未登录')
  return ok(publicUser(u))
})

/* 引擎与语言（公开） */
route('GET', /^\/engines$/, () =>
  ok({
    default: 'official',
    engines: ENGINES.map((e) => ({
      id: e.id,
      name: e.name,
      official: !!e.official,
      key_fields: e.keyFields,
      src_langs: LANGUAGES.map((l) => l.code),
      tgt_langs: LANGUAGES.map((l) => l.code),
      enabled: e.id === 'official' ? db.config.official_api_enabled === '1' : true
    }))
  })
)

route('GET', /^\/languages$/, () =>
  ok({ source_langs: LANGUAGES.map((l) => l.code), target_langs: LANGUAGES.map((l) => l.code) })
)

/* 公告 */
route('GET', /^\/notices$/, () =>
  ok(db.notices.filter((n) => n.is_active).sort((a, b) => b.created_at.localeCompare(a.created_at)))
)

/* 书籍 */
route('POST', /^\/books$/, ({ body, config }) => {
  const u = userFromConfig(config)
  if (!u) return fail(401, '未登录')
  const fd = body
  const file = fd?.get?.('file')
  const title = (fd?.get?.('title') || file?.name || '未命名').replace(/\.[^.]+$/, '')
  const targetLang = fd?.get?.('target_lang') || 'zh'
  const engine = fd?.get?.('engine') || 'official'
  const keys = fd?.get?.('engine_keys')

  if (engine !== 'official') {
    if (!keys || keys === '{}') return fail(3001, '翻译引擎未接入，请填写 API Key')
  } else {
    if (db.config.official_api_enabled !== '1') return fail(3001, '官方引擎已停用，请切换自带密钥的引擎')
    const cost = officialCost(Math.max(6000, file?.size || 6000))
    if (u.points < cost) return fail(3002, `积分不足（本次约需 ${cost} 积分，当前 ${u.points}）`)
  }

  const book = {
    id: ++db.seq.book,
    user_id: u.id,
    title,
    source_ext: (file?.name || 'book.txt').split('.').pop().toLowerCase(),
    source_lang: 'en',
    target_lang: targetLang,
    engine,
    status: 'processing',
    source_path: `/data/uploads/${u.id}/${db.seq.book}/source`,
    char_count: Math.max(6000, file?.size || 6000),
    progress: 4,
    cached_segments: 2,
    error_msg: null,
    created_at: now(),
    started_at: now(),
    finished_at: null,
    segments: []
  }
  db.books.unshift(book)
  if (engine === 'official') spend(u, officialCost(book.char_count), `官方引擎翻译《${title}》`, book.id)
  addLog('INFO', 'upload', `${u.email} 上传 ${file?.name || '示例书'}（${Math.round((file?.size || 0) / 1024)}KB）`)
  addLog('INFO', 'task', `任务 ${book.id} 入队（${title} · ${u.email}）`)
  simulate(book)
  return ok(bookSummary(book))
})

route('GET', /^\/books$/, ({ params, config }) => {
  const u = userFromConfig(config)
  if (!u) return fail(401, '未登录')
  const list = db.books
    .filter((b) => b.user_id === u.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(bookSummary)
  return ok(paginate(list, params))
})

route('GET', /^\/books\/(\d+)$/, ({ m, config }) => {
  const u = userFromConfig(config)
  if (!u) return fail(401, '未登录')
  const b = db.books.find((x) => x.id === Number(m[1]))
  if (!b) return fail(404, '任务不存在')
  if (b.user_id !== u.id && u.role !== 'admin') return fail(403, '无权访问')
  return ok({ ...bookSummary(b), segments: b.segments || [] })
})

route('POST', /^\/books\/(\d+)\/retry$/, ({ m, config }) => {
  const u = userFromConfig(config)
  const b = db.books.find((x) => x.id === Number(m[1]))
  if (!u) return fail(401, '未登录')
  if (!b) return fail(404, '任务不存在')
  if (b.status !== 'failed') return fail(409, '只有失败任务可以重试')
  b.status = 'processing'
  b.progress = 2
  b.error_msg = null
  b.finished_at = null
  simulate(b)
  addLog('INFO', 'task', `任务 ${b.id} 重新入队`)
  return ok(bookSummary(b))
})

route('DELETE', /^\/books\/(\d+)$/, ({ m, config }) => {
  const u = userFromConfig(config)
  if (!u) return fail(401, '未登录')
  const i = db.books.findIndex((x) => x.id === Number(m[1]) && x.user_id === u.id)
  if (i < 0) return fail(404, '任务不存在')
  db.books.splice(i, 1)
  return ok(true)
})

route('GET', /^\/books\/(\d+)\/download$/, ({ m, params, config }) => {
  const b = db.books.find((x) => x.id === Number(m[1]))
  if (!b) return fail(404, '任务不存在')
  if (b.status !== 'ready') return fail(409, '尚未生成完成')
  if ((params.format || 'epub') === 'pdf') return fail(400, 'PDF 请使用浏览器打印导出')
  return blober(buildEpub(b), config)
})

/* 积分 */
route('GET', /^\/points$/, ({ config }) => {
  const u = userFromConfig(config)
  if (!u) return fail(401, '未登录')
  return ok({ points: u.points, rate: Number(db.config.token_per_point) })
})

route('GET', /^\/points\/rate$/, () => ok({ token_per_point: Number(db.config.token_per_point) }))

route('GET', /^\/points\/logs$/, ({ params, config }) => {
  const u = userFromConfig(config)
  if (!u) return fail(401, '未登录')
  const list = db.pointLogs.filter((p) => p.user_id === u.id)
  return ok(paginate(list, params))
})

route('POST', /^\/points\/checkin$/, ({ config }) => {
  const u = userFromConfig(config)
  if (!u) return fail(401, '未登录')
  const today = now().slice(0, 10)
  if (db.checkins.some((c) => c.user_id === u.id && c.checkin_date === today)) {
    return fail(409, '今天已经签到过了')
  }
  const reward = Number(db.config.checkin_reward || 10)
  db.checkins.push({ user_id: u.id, checkin_date: today, reward, created_at: now() })
  earn(u, reward, 'checkin', '每日签到')
  return ok({ points: u.points, reward })
})

/* 反馈 */
route('POST', /^\/feedback$/, ({ body, config }) => {
  const u = userFromConfig(config)
  if (!u) return fail(401, '未登录')
  if (!body?.title || !body?.body) return fail(400, '标题和内容不能为空')
  const fb = {
    id: ++db.seq.feedback, user_id: u.id, type: body.type || 'other',
    title: body.title, body: body.body, contact: body.contact || '',
    status: 'pending', reward: 0, created_at: now(), handled_at: null
  }
  db.feedbacks.unshift(fb)
  addLog('INFO', 'feedback', `${u.email} 提交反馈「${fb.title}」`)
  return ok(fb)
})

route('GET', /^\/feedback\/my$/, ({ config }) => {
  const u = userFromConfig(config)
  if (!u) return fail(401, '未登录')
  return ok(db.feedbacks.filter((f) => f.user_id === u.id))
})

/* ------------------------- 管理端 ------------------------- */
route('POST', /^\/admin\/login$/, ({ body }) => {
  const { email, password } = body || {}
  const user = db.users.find((u) => u.email.toLowerCase() === String(email || '').toLowerCase())
  if (!user || user.password !== password || user.role !== 'admin') return fail(401, '管理员账号或密码错误')
  addLog('INFO', 'auth', `管理员 ${user.email} 登录成功`)
  return ok({ token: tokenOf(user), user: publicUser(user) })
})

route('GET', /^\/admin\/dashboard$/, () => {
  const ready = db.books.filter((b) => b.status === 'ready')
  const today = now().slice(0, 10)
  const todayChars = db.books.filter((b) => (b.created_at || '').startsWith(today)).reduce((s, b) => s + (b.char_count || 0), 0)
  const hits = db.cache.reduce((s, c) => s + c.hit_count, 0)
  const segTotal = ready.reduce((s, b) => s + (b.segments?.length || 0), 0)
  const cached = ready.reduce((s, b) => s + (b.cached_segments || 0), 0)
  return ok({
    users: db.users.length,
    users_active: db.users.filter((u) => u.is_active).length,
    books: db.books.length,
    tasks_running: db.books.filter((b) => b.status === 'processing' || b.status === 'pending').length,
    today_chars: todayChars || 186000,
    cache_hit_rate: segTotal ? Number(((cached / segTotal) * 100).toFixed(1)) : 42.6,
    cache_hits: hits || 1284,
    risk_pending: db.riskAlerts.filter((r) => r.status === 'pending').length,
    last7: [4, 7, 5, 9, 12, 8, 13].map((v, i) => ({ date: `09-${21 + i}`, count: v })),
    engines: ENGINES.map((e, i) => ({
      id: e.id, name: e.name, calls: [1284, 268, 12, 4][i] || 0,
      char_count: [186000, 52000, 4200, 900][i] || 0,
      fail_rate: [2.1, 5.6, 0, 0][i] || 0
    })),
    latest: db.books.slice(0, 8).map((b) => ({
      id: b.id, title: b.title, user: db.users.find((u) => u.id === b.user_id)?.email || '-',
      pair: `${b.source_lang}-${b.target_lang}`.toUpperCase(), status: b.status,
      created_at: b.created_at
    }))
  })
})

route('GET', /^\/admin\/users$/, ({ params }) => {
  const q = String(params.search || '').toLowerCase()
  const list = db.users
    .filter((u) => !q || u.email.toLowerCase().includes(q) || (u.nickname || '').toLowerCase().includes(q))
    .map(publicUser)
  return ok({ total: list.length, items: list })
})

route('PUT', /^\/admin\/users\/(\d+)\/status$/, ({ m }) => {
  const u = db.users.find((x) => x.id === Number(m[1]))
  if (!u) return fail(404, '用户不存在')
  u.is_active = u.is_active ? 0 : 1
  if (u.is_active) u.ban_reason = null
  addLog('INFO', 'user', `${u.email} 被${u.is_active ? '启用' : '禁用'}`)
  return ok(publicUser(u))
})

route('POST', /^\/admin\/users\/(\d+)\/reset-password$/, ({ m }) => {
  const u = db.users.find((x) => x.id === Number(m[1]))
  if (!u) return fail(404, '用户不存在')
  const temp = `Tmp${Math.random().toString(36).slice(2, 8)}`
  u.password = temp
  addLog('WARN', 'user', `重置 ${u.email} 的密码`)
  return ok({ temp_password: temp })
})

route('DELETE', /^\/admin\/users\/(\d+)$/, ({ m }) => {
  const i = db.users.findIndex((x) => x.id === Number(m[1]))
  if (i < 0) return fail(404, '用户不存在')
  addLog('WARN', 'user', `删除用户 ${db.users[i].email}`)
  db.users.splice(i, 1)
  return ok(true)
})

route('GET', /^\/admin\/tasks$/, ({ params }) => {
  const q = String(params.search || '').toLowerCase()
  const status = params.status
  const list = db.books
    .filter((b) => !status || status === 'all' || b.status === status)
    .filter((b) => !q || b.title.toLowerCase().includes(q) || String(b.user_id).includes(q))
    .map((b) => ({ ...bookSummary(b), user: db.users.find((u) => u.id === b.user_id)?.email || '-' }))
  return ok({ total: list.length, items: list })
})

route('POST', /^\/admin\/tasks\/(\d+)\/cancel$/, ({ m }) => {
  const b = db.books.find((x) => x.id === Number(m[1]))
  if (!b) return fail(404, '任务不存在')
  b.status = 'failed'
  b.error_msg = '已取消（管理员操作）'
  b.finished_at = now()
  addLog('WARN', 'task', `任务 ${b.id} 被管理员取消`)
  return ok(bookSummary(b))
})

route('POST', /^\/admin\/tasks\/(\d+)\/retry$/, ({ m }) => {
  const b = db.books.find((x) => x.id === Number(m[1]))
  if (!b) return fail(404, '任务不存在')
  if (b.status !== 'failed') return fail(409, '只有失败任务可以重试')
  if ((b.error_msg || '').includes('扫描')) return fail(422, '解析类失败无法重试')
  b.status = 'processing'
  b.progress = 2
  b.error_msg = null
  simulate(b)
  addLog('INFO', 'task', `任务 ${b.id} 重新入队`)
  return ok(bookSummary(b))
})

route('DELETE', /^\/admin\/tasks\/(\d+)$/, ({ m }) => {
  const i = db.books.findIndex((x) => x.id === Number(m[1]))
  if (i < 0) return fail(404, '任务不存在')
  db.books.splice(i, 1)
  return ok(true)
})

route('GET', /^\/admin\/cache$/, ({ params }) => {
  const q = String(params.search || '').toLowerCase()
  const list = db.cache.filter((c) => !q || c.translated_text.toLowerCase().includes(q) || c.source_hash.includes(q))
  const hits = list.reduce((s, c) => s + c.hit_count, 0)
  return ok({
    total: list.length,
    hits,
    hit_rate: 42.6,
    items: list
  })
})

route('DELETE', /^\/admin\/cache\/(\d+)$/, ({ m }) => {
  const i = db.cache.findIndex((c) => c.id === Number(m[1]))
  if (i < 0) return fail(404, '缓存不存在')
  db.cache.splice(i, 1)
  return ok(true)
})

route('DELETE', /^\/admin\/cache$/, () => {
  const n = db.cache.length
  db.cache = []
  addLog('INFO', 'cache', `管理员清空翻译缓存（${n} 条）`)
  return ok(true)
})

route('GET', /^\/admin\/engines$/, () =>
  ok(ENGINES.map((e) => ({
    id: e.id, name: e.name, official: !!e.official, key_fields: e.keyFields,
    enabled: e.id === 'official' ? db.config.official_api_enabled === '1' : true,
    calls: 0, fail_rate: 0
  })))
)

route('PUT', /^\/admin\/engines\/([\w-]+)\/status$/, ({ m, body }) => {
  if (m[1] === 'official') db.config.official_api_enabled = body?.enabled ? '1' : '0'
  addLog('INFO', 'engine', `引擎 ${m[1]} ${body?.enabled ? '启用' : '停用'}`)
  return ok(true)
})

route('GET', /^\/admin\/official-api$/, () =>
  ok({
    official_api_enabled: db.config.official_api_enabled,
    token_per_point: Number(db.config.token_per_point),
    api_key_masked: 'sk-****' + String(db.config.official_api_key).slice(-4)
  })
)

route('PUT', /^\/admin\/official-api$/, ({ body }) => {
  if (body?.official_api_enabled !== undefined) db.config.official_api_enabled = body.official_api_enabled ? '1' : '0'
  if (body?.token_per_point !== undefined) db.config.token_per_point = String(body.token_per_point)
  if (body?.official_api_key) db.config.official_api_key = body.official_api_key
  addLog('INFO', 'official', '更新官方 API 配置')
  return ok(true)
})

route('GET', /^\/admin\/points$/, ({ params }) => {
  const q = String(params.search || '').toLowerCase()
  const list = db.users
    .filter((u) => !q || u.email.toLowerCase().includes(q))
    .map((u) => ({ ...publicUser(u), log_count: db.pointLogs.filter((p) => p.user_id === u.id).length }))
  return ok({ total: list.length, items: list })
})

route('POST', /^\/admin\/points\/adjust$/, ({ body }) => {
  const u = db.users.find((x) => x.id === Number(body?.user_id))
  if (!u) return fail(404, '用户不存在')
  const delta = Number(body?.delta || 0)
  if (!delta) return fail(400, '调整值不能为 0')
  u.points += delta
  db.pointLogs.unshift({
    id: ++db.seq.pointLog, user_id: u.id, delta, balance_after: u.points,
    type: 'admin_adjust', ref_id: null, description: body?.reason || '管理员调整', created_at: now()
  })
  addLog('INFO', 'point', `管理员调整 ${u.email} 积分 ${delta > 0 ? '+' : ''}${delta}`)
  return ok({ points: u.points })
})

route('POST', /^\/admin\/points\/clear$/, ({ body }) => {
  const u = db.users.find((x) => x.id === Number(body?.user_id))
  if (!u) return fail(404, '用户不存在')
  const delta = -u.points
  u.points = 0
  db.pointLogs.unshift({
    id: ++db.seq.pointLog, user_id: u.id, delta: delta || -1, balance_after: 0,
    type: 'admin_adjust', ref_id: null, description: '管理员清空积分', created_at: now()
  })
  return ok({ points: 0 })
})

route('POST', /^\/admin\/points\/bulk$/, ({ body }) => {
  const delta = Number(body?.delta || 0)
  const targets = db.users.filter((u) => u.role === 'user')
  targets.forEach((u) => {
    u.points += delta
    db.pointLogs.unshift({
      id: ++db.seq.pointLog, user_id: u.id, delta, balance_after: u.points,
      type: 'admin_bulk', ref_id: null, description: body?.reason || '批量发放', created_at: now()
    })
  })
  addLog('INFO', 'point', `管理员批量发放 ${delta > 0 ? '+' : ''}${delta} 给 ${targets.length} 名用户`)
  return ok({ affected: targets.length })
})

route('PUT', /^\/admin\/points\/config$/, ({ body }) => {
  if (body?.checkin_reward !== undefined) db.config.checkin_reward = String(body.checkin_reward)
  if (body?.register_reward !== undefined) db.config.register_reward = String(body.register_reward)
  if (body?.token_per_point !== undefined) db.config.token_per_point = String(body.token_per_point)
  return ok(true)
})

route('GET', /^\/admin\/feedback$/, ({ params }) => {
  const status = params.status
  const list = db.feedbacks
    .filter((f) => !status || status === 'all' || f.status === status)
    .map((f) => ({ ...f, user_email: db.users.find((u) => u.id === f.user_id)?.email || '-' }))
  return ok({ total: list.length, items: list })
})

route('POST', /^\/admin\/feedback\/(\d+)\/handle$/, ({ m, body }) => {
  const f = db.feedbacks.find((x) => x.id === Number(m[1]))
  if (!f) return fail(404, '反馈不存在')
  const u = db.users.find((x) => x.id === f.user_id)
  const action = body?.action
  if (action === 'reward' && u) {
    const amount = Number(body?.amount || 20)
    earn(u, amount, 'feedback_reward', `反馈奖励：${f.title}`, f.id)
    f.reward = amount
  } else if (action === 'penalty' && u) {
    const amount = Number(body?.amount || 20)
    u.points -= amount
    db.pointLogs.unshift({
      id: ++db.seq.pointLog, user_id: u.id, delta: -amount, balance_after: u.points,
      type: 'feedback_penalty', ref_id: f.id, description: `反馈扣分：${f.title}`, created_at: now()
    })
  } else if (action === 'ban' && u) {
    u.is_active = 0
    u.ban_reason = '反馈处理'
  }
  f.status = 'done'
  f.handled_at = now()
  addLog('INFO', 'feedback', `处理反馈 #${f.id}：${action}`)
  return ok(f)
})

route('GET', /^\/admin\/risk\/alerts$/, ({ params }) => {
  const status = params.status
  const list = db.riskAlerts
    .filter((r) => !status || status === 'all' || r.status === status)
    .map((r) => ({
      ...r,
      user_email: db.users.find((u) => u.id === r.user_id)?.email || '-',
      user_active: db.users.find((u) => u.id === r.user_id)?.is_active ?? 1
    }))
  return ok({ total: list.length, items: list })
})

route('PUT', /^\/admin\/risk\/config$/, ({ body }) => {
  if (body?.risk_max_single !== undefined) db.config.risk_max_single = String(body.risk_max_single)
  if (body?.risk_max_freq !== undefined) db.config.risk_max_freq = String(body.risk_max_freq)
  if (body?.risk_max_daily !== undefined) db.config.risk_max_daily = String(body.risk_max_daily)
  addLog('INFO', 'risk', '更新风控阈值配置')
  return ok(true)
})

route('POST', /^\/admin\/risk\/(\d+)\/resolve$/, ({ m, body }) => {
  const r = db.riskAlerts.find((x) => x.id === Number(m[1]))
  if (!r) return fail(404, '告警不存在')
  const u = db.users.find((x) => x.id === r.user_id)
  const resolve = body?.resolve // unban | confirm
  if (resolve === 'unban' && u) {
    u.is_active = 1
    u.ban_reason = null
  }
  if (resolve === 'confirm' && u) {
    u.is_active = 0
    u.ban_reason = '积分风控'
    const penalty = Number(body?.penalty || 0)
    if (penalty > 0) {
      u.points -= penalty
      db.pointLogs.unshift({
        id: ++db.seq.pointLog, user_id: u.id, delta: -penalty, balance_after: u.points,
        type: 'risk_penalty', ref_id: r.id, description: '风控确认扣分', created_at: now()
      })
    }
  }
  r.status = 'resolved'
  r.resolve = resolve
  r.handled_at = now()
  addLog('WARN', 'risk', `告警 #${r.id} 复核结果：${resolve}`)
  return ok(r)
})

route('GET', /^\/admin\/notices$/, () =>
  ok(db.notices.slice().sort((a, b) => b.created_at.localeCompare(a.created_at)))
)

route('POST', /^\/admin\/notices$/, ({ body }) => {
  if (!body?.title || !body?.body) return fail(400, '标题和正文不能为空')
  const n = {
    id: ++db.seq.notice, type: body.type || 'system', title: body.title, body: body.body,
    is_active: 1, views: 0, created_at: now(), updated_at: now()
  }
  db.notices.unshift(n)
  addLog('INFO', 'notice', `发布公告「${n.title}」`)
  return ok(n)
})

route('PUT', /^\/admin\/notices\/(\d+)\/status$/, ({ m }) => {
  const n = db.notices.find((x) => x.id === Number(m[1]))
  if (!n) return fail(404, '公告不存在')
  n.is_active = n.is_active ? 0 : 1
  n.updated_at = now()
  addLog('INFO', 'notice', `公告「${n.title}」${n.is_active ? '启用' : '停用'}`)
  return ok(n)
})

route('PUT', /^\/admin\/notices\/(\d+)$/, ({ m, body }) => {
  const n = db.notices.find((x) => x.id === Number(m[1]))
  if (!n) return fail(404, '公告不存在')
  Object.assign(n, { type: body?.type ?? n.type, title: body?.title ?? n.title, body: body?.body ?? n.body, updated_at: now() })
  addLog('INFO', 'notice', `编辑公告「${n.title}」`)
  return ok(n)
})

route('DELETE', /^\/admin\/notices\/(\d+)$/, ({ m }) => {
  const i = db.notices.findIndex((x) => x.id === Number(m[1]))
  if (i < 0) return fail(404, '公告不存在')
  const [n] = db.notices.splice(i, 1)
  addLog('WARN', 'notice', `删除公告「${n.title}」`)
  return ok(true)
})

route('GET', /^\/admin\/logs$/, ({ params }) => {
  const level = params.level
  const q = String(params.q || '').toLowerCase()
  const list = db.logs
    .filter((l) => !level || level === 'all' || l.level === level)
    .filter((l) => !q || l.message.toLowerCase().includes(q) || l.module.includes(q))
  return ok({ total: list.length, items: list })
})

/* ------------------------- 适配器 ------------------------- */
function parseBody(data) {
  if (!data) return null
  if (typeof FormData !== 'undefined' && data instanceof FormData) return data
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch {
      return data
    }
  }
  return data
}

export function setupMock(instance) {
  instance.defaults.adapter = async (config) => {
    await sleep(180 + Math.round(Math.random() * 220))
    const full = config.url || ''
    const path = full.replace(/^\/api/, '').split('?')[0].replace(/\/$/, '') || '/'
    const method = (config.method || 'get').toUpperCase()
    const body = parseBody(config.data)

    for (const r of routes) {
      if (r.method !== method) continue
      const m = path.match(r.pattern)
      if (!m) continue
      try {
        const payload = r.handler({ m, params: config.params || {}, body, config })
        if (payload && payload.data instanceof Blob) return blober(payload.data, config)
        return { data: payload, status: 200, statusText: 'OK', headers: {}, config, request: {} }
      } catch (e) {
        return { data: fail(5001, e.message), status: 200, statusText: 'OK', headers: {}, config, request: {} }
      }
    }

    return { data: fail(404, `Mock 未实现：${method} ${path}`), status: 200, statusText: 'OK', headers: {}, config, request: {} }
  }
}

export const __mockDb = () => db

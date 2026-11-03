/** 与后端 / 设计文档保持一致的口径 */

export const LANGUAGES = [
  { code: 'zh', name: '中文（简体）' },
  { code: 'en', name: '英语' },
  { code: 'ja', name: '日语' },
  { code: 'ko', name: '韩语' },
  { code: 'fr', name: '法语' },
  { code: 'de', name: '德语' }
]

export const LANG_NAME = Object.fromEntries(LANGUAGES.map((l) => [l.code, l.name]))
export const LANG_SHORT = { zh: '中', en: '英', ja: '日', ko: '韩', fr: '法', de: '德' }

/** 引擎目录：后端 GET /api/engines 会返回同样结构，mock 也复用 */
export const ENGINES = [
  {
    id: 'official',
    name: '官方引擎（积分）',
    official: true,
    keyFields: [],
    desc: '无需申请密钥，按字符数消耗积分'
  },
  {
    id: 'baidu',
    name: '百度翻译',
    official: false,
    keyFields: [
      { k: 'app_id', label: 'App ID', type: 'text', placeholder: '百度智能云 应用 ID' },
      { k: 'app_key', label: 'App Key', type: 'password', placeholder: '百度智能云 应用 Key' }
    ],
    desc: '通用领域翻译，每月有免费字符额度'
  },
  {
    id: 'youdao',
    name: '有道智云',
    official: false,
    keyFields: [
      { k: 'app_key', label: 'appKey', type: 'text', placeholder: '有道智云 appKey' },
      { k: 'secret_key', label: 'secretKey', type: 'password', placeholder: '有道智云 secretKey' }
    ],
    desc: '中英互译质量稳定，支持多语种'
  },
  {
    id: 'deepl',
    name: 'DeepL',
    official: false,
    keyFields: [
      { k: 'api_key', label: 'API Key', type: 'password', placeholder: 'DeepL Auth Key' }
    ],
    desc: '欧洲语系质量优秀，中文支持较好'
  }
]

export const ENGINE_NAME = Object.fromEntries(ENGINES.map((e) => [e.id, e.name]))

export const BOOK_STATUS = {
  pending: { label: '排队中', type: 'info' },
  processing: { label: '处理中', type: 'warning' },
  ready: { label: '已完成', type: 'success' },
  failed: { label: '失败', type: 'danger' }
}

export const POINT_TYPES = {
  register: '注册奖励',
  checkin: '每日签到',
  translate: '翻译消耗',
  feedback_reward: '反馈奖励',
  feedback_penalty: '反馈扣分',
  admin_adjust: '管理员调整',
  admin_bulk: '批量发放',
  risk_penalty: '风控扣分'
}

export const NOTICE_TYPES = {
  maintenance: { label: '维护通知', type: 'warning' },
  update: { label: '版本更新', type: 'primary' },
  system: { label: '系统通知', type: 'info' }
}

export const RISK_RULES = {
  single: { label: '单次超限', desc: '单次翻译消耗积分超过上限' },
  freq: { label: '短时高频', desc: '单位时间内请求次数超过阈值' },
  daily: { label: '单日累计', desc: '单日累计消耗积分超过上限' }
}

export const FEEDBACK_TYPES = {
  bug: 'Bug',
  suggest: '建议',
  experience: '体验',
  other: '其他'
}

/** 业务错误码 → 用户可读文案 */
export const ERROR_MESSAGES = {
  3001: '翻译引擎未接入，请填写可用的 API Key',
  3002: '积分不足，请签到或获取积分后再试',
  5001: '服务处理异常，请稍后重试'
}

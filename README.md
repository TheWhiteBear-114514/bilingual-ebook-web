# 双语书工厂 · 用户端（Bilingual E-Book Studio Web）

「双语电子书生成系统」的**用户端**前端：上传单语种电子书 → 自动翻译 → 导出逐段对照的双语 EPUB / PDF。

技术栈：Vue 3 + Vite + Element Plus + Pinia + Vue Router。

配套仓库：

| 仓库 | 内容 |
|---|---|
| `bilingual-ebook-admin` | 管理控制台（vue-next-admin 脚手架） |
| `bilingual-ebook-api` | 接口服务（FastAPI 课堂脚手架） |
| `bilingual-ebook-design` | 原型与数据库设计归档 |

---

## 一、快速开始

```bash
# Node >= 18
pnpm install
pnpm dev          # http://localhost:5173
pnpm build        # 生产构建到 dist/
pnpm preview      # 预览 dist
```

> **不启后端也能跑**：默认 `VITE_USE_MOCK=true`，内置 Mock 适配器在浏览器里模拟全部接口
> （含进度推进、积分扣减、风控处置），开箱即可演示。

### 演示账号

| 账号 | 密码 | 说明 |
|---|---|---|
| `demo@book.app` | `demo123` | 预置书架、138 积分 |
| `chen@mail.cn` | `user123` | 已被风控封号（登录返回 403，用于演示解封） |

---

## 二、目录结构

```
src/
├── api/
│   ├── http.js        # axios 实例、JWT 注入、统一响应解包、错误码处理
│   ├── index.js       # 接口函数（auth / book / point / feedback / meta）
│   └── mock.js        # 内置 Mock 适配器（VITE_USE_MOCK=true 时接管请求）
├── components/        # NoticeBar / UploadDropzone / SegmentList
├── layouts/
│   └── UserLayout.vue # 顶栏 + 四个 Tab
├── router/index.js    # 路由 + 登录守卫
├── stores/            # Pinia：auth、books
├── utils/             # 常量、格式化、EPUB 生成、打印版式
├── views/             # 8 个页面（见下表）
└── styles/main.css

prototype/             # 设计阶段原型（便于检查的副本，非源码）
```

---

## 三、页面清单

| 路由 | 页面 | 说明 |
|---|---|---|
| `/login` `/register` | 登录 / 注册 | 表单校验、演示账号一键填充 |
| `/upload` | 上传新书 | 拖拽上传、目标语言、引擎选择（BYOK / 官方积分） |
| `/processing/:id` | 生成中 | 轮询进度、四步指示器、逐段计数 |
| `/result/:id` | 结果页 | 统计、双语预览、EPUB 下载、打印成 PDF |
| `/shelf` | 我的书架 | 历史成品、重复下载、删除 |
| `/books/:id` | 详情 | 只读查看与下载 |
| `/points` | 积分中心 | 余额、签到、明细筛选 |
| `/feedback` | 意见反馈 | 提交与处理状态 |

---

## 四、接口约定

- 统一响应包裹：`{ code, message, data }`，`code === 0` 为成功
- 鉴权：`Authorization: Bearer <JWT>`，登录态存 `localStorage`
- 业务错误码：`3001` 引擎未接入、`3002` 积分不足、`4001` PDF 需前端打印、`5001` 服务异常
- 完整契约：`bilingual-ebook-api/docs/contract/openapi.json`

### 切换到真实后端

1. 复制 `.env.example` 为 `.env`：

```ini
VITE_API_BASE=/api
VITE_USE_MOCK=false
```

2. 启动后端（默认 `http://127.0.0.1:8000`），Vite 已配置 `/api` 代理；
   跨域部署时把 `VITE_API_BASE` 改成后端完整地址。

---

## 五、与设计资料的对应

- 交互、文案、状态枚举与 `prototype/prototype.html`（用户端原型）一致
- 数据模型与 `bilingual-ebook-design/数据库设计/database.sql`（11 表）一致：
  `books.progress / char_count / source_path`、`translation_cache.engine` 等字段均已在页面中使用
- 本工程是**可运行代码**，不是静态原型

---

## 六、待办

- [ ] 401 无感刷新令牌（当前直接跳登录）
- [ ] 大文件分片上传（后端限制 10MB 时不需要）
- [ ] 单元测试（Vitest）与 E2E（Playwright）
- [ ] 国际化（当前仅中文）

---

> 设计与数据库资料归档在 `bilingual-ebook-design` 仓库；本仓库 `prototype/` 为便于检查的副本。

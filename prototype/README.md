# 原型（设计阶段产出）

| 文件 | 说明 |
|---|---|
| `prototype.html` | 用户端可交互原型：登录 → 上传 → 引擎配置 → 生成进度 → 结果 → 书架 → 积分 → 反馈 |
| `admin-prototype.html` | 管理控制台原型：概览 / 用户 / 积分 / 任务 / 缓存 / 引擎 / API 接入 / 反馈 / 风控 / 公告 / 日志 |
| `bilingual-ebook-design.html` | 软件设计文档 v1.6：技术选型、架构图、时序图、REST 契约、ER 图、界面原型、非功能设计、部署方案、分工 |

三个文件均为**单文件、零依赖**，双击即可在浏览器打开。

> **注意：本目录是原型，不是正式源码。**
> 正式前端源码在仓库根目录的 `src/`，技术栈为 Vue 3 + Vite + Element Plus + Pinia，
> 可用 `pnpm dev` 运行、`pnpm build` 构建，调用的接口见 `bilingual-ebook-contract/openapi.json`。

# Handoff Briefing · 产程陪产助手 (Labor Copilot)

> 给新会话 / 接手 Agent 的零上下文启动简报。请先通读本文件以及 `AGENTS.md`、`docs/PRODUCT-VISION.md`、`docs/ARCHITECTURE.md`、`docs/ROADMAP.md`。

## Task

从零重构并交付 **「护航 · 产程陪产助手 (Labor Copilot)」M1 可推广 MVP**：用一个模块化的 Vite + React + TypeScript 离线优先静态应用，彻底替换个人急救原型 `reference/v0-prototype.html`，做到**通用可配置、医护交接清晰、可公开推广、一键部署至京东云静态微应用底座**。

## Context

- 用户在 2026-11-05 曾让另一个 Agent 用单文件 HTML 赶制过一版「产程陪产助手」，2026-11-06 部署在云端实战非常成功；但用户认为当前代码只是一次性硬编码产物，**不能推广给其他准父母**，要求**全部推倒重构**，按长期可维护、真正可对外推广的开源好产品去设计与实现。
- 前置会话已完成仓库独立化（彻底脱离 `astro-doc`「半亩」）、产品/架构/路线图顶层设计，并在京东云搭建好了 `/opt/apps/sites/` + `/opt/apps/bin/quick-deploy-static` 一键静态部署管道。
- 旧版生产路径 `/birth-3c8a4b3262/` 目前仍保留在服务器上，**M1 完成前不要覆盖它**，新版本默认先部署到 `.env.deploy` 配置的预览 slug（`labor-copilot-preview`），验收通过后再由用户决定是否推广公开或替换旧路径。

## Relevant files

- `AGENTS.md` — 工程铁律（Node 24、`pnpm`、医学内容与 UI 解耦、禁止硬编码病例、隐私底线、验证规范）
- `docs/PRODUCT-VISION.md` — 产品定位、v0 缺陷复盘、三大视角与推广策略
- `docs/ARCHITECTURE.md` — 目录规划、Domain 模型契约（`BirthProfile`、`ContractionRecord`、`ClinicalEvent`）、状态机与存储设计
- `docs/ROADMAP.md` — M0–M4 里程碑定义
- `scripts/deploy.sh` & `.env.deploy` — 京东云独立静态微应用一键发布脚本（注意 `.env.deploy` 和 `reference/` 已在 `.gitignore`，绝对不能提交）
- `reference/v0-prototype.html` — 原型完整快照（仅作 UX 节奏、交互痛点与原有 11 阶段参考，**严禁把其中的个人产检数据写进新代码**）

## Current state

- **M0 已完成**：独立目录 `/Users/imac/Documents/code/labor-copilot/` 已建好并同步至 GitHub。
- **M1 已完成并上线预览**：`Vite + React 19 + TypeScript + Vitest + VitePWA` 工程骨架、`src/domain/` 纯函数引擎、`src/content/` 解耦医学知识库、五大产房移动端视图、30 秒配置器与 `医护亮底模式` 已全部落地，并部署到京东云 `labor-copilot-preview` 预览路径。
- **下一阶段（M2）待办**：见 `docs/ROADMAP.md` 中的 M2 清单（真机离线 PWA 图标与飞行模式实测、产后纪念长图离线绘图导出、医学指南细化索引与无障碍审计）。

## Decisions already locked

1. **工程独立**：本项目不进入 `astro-doc`（「半亩 / Bothy」）；作为静态 + PWA 产物通过 `/opt/apps/bin/quick-deploy-static` 发布到京东云独立 `/opt/apps/sites/<slug>/`。
2. **技术栈**：`Vite` + `React 19` + `TypeScript`（strict）+ `Vitest`，原生 CSS Design Tokens（零重型 UI 库膨胀）。Vite 配置 `base: './'`（或通过 `VITE_BASE_PATH` 传入），确保产物既能部署在 `http://<host>:443/<slug>/` 子路径下，也能直接挂载独立域名根路径。
3. **内容与逻辑分层**：
   - `src/content/` 存放纯数据化医学阶段、提问卡、红线、待产包（不写进组件）；
   - `src/domain/` 存放纯函数（画像裁剪、5-1-1 / 3-1-1 判读、临床交接卡聚合、状态存储）。
4. **隐私与通用性**：默认零登录、纯 `localStorage`；开屏提供「30 秒孕产画像配置」与「直接按预设体验」（至少含“自然临产·初产”“计划催产·初产”“择期剖宫产”3 套预设），彻底移除任何个人具体化验数值。

## Acceptance criteria for Milestone 1

- [ ] 初始化干净的 `Vite + React + TS + Vitest` 工程并配置 `.nvmrc` (`24`)、`pnpm typecheck`、`pnpm test`、`pnpm build`
- [ ] 完成 `src/domain/` 核心模块（`profile`、`stages`、`contractions`、`handover`、`timeline`、`storage`）与完整 Vitest 单元测试
- [ ] 完成 `src/content/` 通用循证知识库（支持自然临产 / 计划催产 / 择期剖宫产三路径 + 常见风险标签动态挂载，无任何个人隐私硬编码）
- [ ] 完成 5 个高完成度移动端界面：**陪产主线**、**单手宫缩计时 (5-1-1)**、**1 分钟医护交接卡**、**高危红线直达**、**给她看（可调呼吸节拍 + 温和夜视安抚）**，外加「30 秒配置 / 预设体验切换」入口
- [ ] 使用无头浏览器 / 移动端视口（`390x844`）检查页面排版、对比度、触控与零 console error
- [ ] 执行 `pnpm build && bash scripts/deploy.sh` 部署预览版至京东云，并验证线上 URL 返回 `200 OK` 且资源加载完整

## Constraints

- 严禁提交 `.env.deploy` 与 `reference/` 到 Git 仓库。
- 不要在未获用户确认前覆盖 `/opt/apps/sites/birth-3c8a4b3262/`。
- 先做扎实的 M1（通用化重构 + 临床交接卡 + 优质移动端体验），M2 PWA/纪念图导出与 M4 双屏 WebSocket 同步留到后续里程碑，避免范围失控。

---

## 新会话开场可直接复制的启动词

打开新会话并切换到目录 `/Users/imac/Documents/code/labor-copilot` 后，直接发送下面这段话即可：

> 请先阅读本项目的 `HANDOFF.md`、`AGENTS.md`、`docs/PRODUCT-VISION.md`、`docs/ARCHITECTURE.md` 和 `docs/ROADMAP.md`（需要参考原版节奏时可按需只读 `reference/v0-prototype.html`，注意绝对不要把其中的个人医疗数值带入新代码）。确认理解后，直接开始搭建 **M1 通用化重构版**：先搭好 `Vite + React + TypeScript + Vitest` 工程骨架和 `src/domain/`、`src/content/` 数据契约，再完成 UI 重构、测试验证，最后用 `scripts/deploy.sh` 部署一个预览版本给我验收。

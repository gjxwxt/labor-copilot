# 护航 · 产程陪产助手 (Labor Copilot)

> 写给陪产者与准妈妈的**产房副驾驶**：零账号、弱网离线可用、按孕产情况动态生成陪产路线图、单手宫缩计时、高危红线直达、10 秒生成给医生/助产士看的交接战报。

## 为什么重构这个项目

最初的 `v0` 原型（`reference/v0-prototype.html`，仅保留在本地）是一份为单次住院催产紧急打造的 1385 行单文件 HTML：思路极其有效，但在实战之外无法直接推广——因为里面写死了个人产检数值、缺乏面向大众的配置器、缺乏对医生交接卡片、也无法做 PWA 离线保障和模块化维护。

本项目旨在将其**完全重构为一个真正可长期维护、可开源、可向更多家庭推广的标准化产品**。

## 核心文档导航

- 产品定位与推广思考：[docs/PRODUCT-VISION.md](docs/PRODUCT-VISION.md)
- 技术架构与数据模型：[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- 分阶段长程路线图：[docs/ROADMAP.md](docs/ROADMAP.md)
- 新会话交接简报：[HANDOFF.md](HANDOFF.md)
- 工程规范：[AGENTS.md](AGENTS.md)

## 部署方式（独立微应用）

本项目构建为纯静态 + PWA 产物，默认通过 `scripts/deploy.sh` 推送到云主机独立静态托管目录（`/opt/apps/sites/<slug>/`），零后端依赖、秒级发布：

```bash
cp .env.deploy.example .env.deploy   # 填入宿主机与部署路径
pnpm build
bash scripts/deploy.sh
```

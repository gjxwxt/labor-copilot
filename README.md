# 护航 · 产程陪产助手 (Labor Copilot)

> 写给陪产者与准妈妈的**产房副驾驶**：零账号、弱网离线可用、按孕产情况动态生成陪产路线图、单手宫缩计时、高危红线直达、10 秒生成给医生/助产士看的交接战报。

## 核心能力（M1）

1. **30 秒孕产画像配置器**：支持自然临产（初产/经产）、计划催产、择期剖宫产三条主线与 6 类常见医学关注标签（GBS+、糖妈 GDM、胎体偏大、血压关注、胆汁酸关注、VBAC），不配置也能用默认预设零门槛直接体验。
2. **动态产程主线（陪产视角）**：按画像裁剪出当下阶段要点、可勾选核对清单、可直接照着念的医生提问卡与循证展开卡，附带分娩待产包清单。
3. **单手宫缩计时 + 安全预警**：拇指大按钮盲操，后台息屏不丢计时；支持初产 5-1-1 / 经产更早入院参考判读，并在单次持续 ≥ 2 分钟或 10 分钟过频时主动红灯提示按铃。
4. **1 分钟医护交接卡**：一键记录破水时间与羊水性状、内检几指、无痛镇痛、入院与出生时刻，支持「医护亮底模式」递给医生扫读，也可导出 Markdown 战报或本地 JSON 备份。
5. **高危红线直达 & 「给她看」柔和视角**：按当前阶段置顶最致命的红线与呼救第一句话术；产妇端内置 `吸4·呼6` / `吸4·呼4` / `吸2·哈2` 呼吸节拍器与夜间护眼降亮开关。
6. **PWA 离线优先与隐私默认**：所有记录仅存浏览器本地 `localStorage`，支持添加到手机主屏幕断网运行。

## 本地开发与验证

```bash
nvm use            # Node >= 22.23.4（推荐 Node 24）
pnpm install
pnpm dev           # 本地开发预览
pnpm typecheck     # TypeScript 严格检查
pnpm test          # Vitest 核心领域单测
pnpm build         # 构建生产静态与 PWA 资源（dist/）
```

## 文档导航

- 产品定位与推广思考：[docs/PRODUCT-VISION.md](docs/PRODUCT-VISION.md)
- 技术架构与数据模型：[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- 分阶段长程路线图：[docs/ROADMAP.md](docs/ROADMAP.md)
- 工程规范与医疗边界铁律：[AGENTS.md](AGENTS.md)

## 部署方式（独立静态微应用）

本项目构建为纯静态 + PWA 产物，默认通过 `scripts/deploy.sh` 推送到云主机独立静态托管目录（`/opt/apps/sites/<slug>/`），零后端依赖、秒级发布：

```bash
cp .env.deploy.example .env.deploy   # 填入宿主机、SSH 密钥与部署 slug
pnpm build
bash scripts/deploy.sh
```

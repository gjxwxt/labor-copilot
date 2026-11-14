# 技术架构与领域模型 (Architecture)

## 1. 技术选型与原则

推荐采用轻量现代静态架构，保证包体积小、离线优先、类型严格、AI 与人类贡献者都能快速上手：

- **构建与语言**：`Vite` + `TypeScript`（strict mode）+ `React 19`（或 `Preact`；优先 `React 19 + TS` 以换取最大生态与可贡献性，Gzip 后首屏仍可控制在 ~55KB 内）
- **样式系统**：原生 CSS Tokens（暗色护眼主调 / 日间高对比切换 + 安全区 `env(safe-area-inset-*)` + 单手拇指热区规范），避免重型 UI 框架带来的臃肿与样式覆盖成本
- **离线能力**：`vite-plugin-pwa`（Workbox `CacheFirst` / 离线预缓存全部核心资产），支持 iOS Safari / Android Chrome「添加到主屏幕」后彻底断网运行
- **测试体系**：`Vitest` 覆盖核心领域逻辑（画像筛选器、状态机流转、5-1-1 宫缩判读算法、临床交接卡聚合、Markdown/JSON 导出），可选 Playwright 做 `390x844` 移动端冒烟验收

## 2. 推荐目录结构

```text
src/
├── domain/                 # 纯函数、无 UI 依赖的核心逻辑（100% 单元测试）
│   ├── profile.ts          # BirthProfile 类型、默认预设与画像匹配器
│   ├── stages.ts           # 产程状态机流转（按发动方式动态裁剪/激活阶段）
│   ├── contractions.ts     # 宫缩计时、间隔/持续统计与 5-1-1 / 3-1-1 判读引擎
│   ├── handover.ts         # 面向医护的 1 分钟临床交接摘要聚合器
│   ├── timeline.ts         # 关键事件打点（破水/镇痛/开全/出生）与纪念/复盘导出
│   └── storage.ts          # localStorage schema 版本化读写与迁移兜底
├── content/                # 与代码完全解耦的循证医学知识库
│   ├── stages.ts           # 通用阶段内容 + 条件片段（when: BirthProfile 谓词）
│   ├── red-lines.ts        # 全局 & 分阶段急救红线（按严重度分级，含就医话术）
│   ├── questions.ts        # 分时机「向医生提问」卡片（按风险标签动态注入）
│   └── checklists.ts       # 待产包（产房随身袋 / 病房袋 / 陪产包）与入院准备
├── components/             # 移动端单手优先 UI 组件
│   ├── layout/             # 顶栏阶段进度条、底部 4+1 主导航、WakeLock 指示器
│   ├── companion/          # 陪产阶段主视图、Checklist、医生提问卡
│   ├── contractions/       # 单手大按钮宫缩计时器、趋势条、5-1-1 判读卡
│   ├── handover/           # 医护交接高对比全屏卡片（一屏展示关键临床事实）
│   ├── redlines/           # 一键直达红线预警 + 呼救说话模板
│   ├── mom/                # 「给她看」柔和视角（4-6 / 自定义呼吸节拍器 + 鼓励语）
│   └── onboarding/         # 30 秒孕产画像配置器 + 预设体验切换
├── styles/
│   └── tokens.css          # 深夜产房护眼色板、字号、安全区与动效降级规范
└── App.tsx
```

## 3. 核心领域数据模型（M1 契约草案）

```ts
export type Parity = 'nulliparous' | 'multiparous'; // 初产 | 经产
export type BirthMode = 'spontaneous' | 'induction' | 'planned_csection'; // 自然临产 | 计划催产 | 择期剖宫产
export type RiskTag = 'macrosomia' | 'gdm' | 'cholestasis' | 'gbs_positive' | 'hypertension' | 'vbac';

export interface BirthProfile {
  id: string;
  label: string;                // 如："通用待产默认" / "初产计划催产"
  parity: Parity;
  birthMode: BirthMode;
  gestationWeeks?: number;      // 可选，不强制收集敏感细节
  riskTags: RiskTag[];          // 用于动态追加提问卡与红线注意项
  partnerAllowedInDelivery: 'yes' | 'no' | 'unknown';
  epiduralIntent: 'wanted' | 'open' | 'no' | 'unknown';
}

export interface ContractionRecord {
  id: string;
  startedAt: number;            // epoch ms
  endedAt?: number;             // 进行中为 undefined
  intensity?: 1 | 2 | 3;        // 轻 / 中 / 强（可选，不强迫点击）
}

export interface ClinicalEvent {
  id: string;
  type:
    | 'admitted'
    | 'water_broke'             // 含羊水性状 note（清亮 / 黄绿 / 血性）
    | 'epidural_placed'
    | 'cervix_check'            // 记录几公分 / 宫颈情况
    | 'baby_born'
    | 'note';
  at: number;
  detail?: string;
}
```

### 关键架构决策（Architectural Decisions）

1. **为什么把 `v0` 的固定 11 阶段改为「条件裁剪状态机」？**
   - 例如选择 `自然临产 (spontaneous)` 时，跳过“催产前夜”与“水囊/塞药促成熟”阶段；选择 `择期剖宫产 (planned_csection)` 时，主轴变为“术前禁食准备 → 进手术室等待 → 术后压沙袋与通气观察 → 产后 2 小时与母婴同室”。
   - 所有阶段文案块通过纯函数 `resolveStages(profile)` 组装，同一套 UI 引擎即可服务所有主流分娩路径。
2. **为什么新增独立的「医护交接卡 (Handover Card)」？**
   - 陪产页服务陪产者“慢慢看”，交接卡服务护士医生“3 秒扫完”。交接卡自动聚合：`破水状态与时长`、`过去 60 分钟宫缩均值`、`最近内检记录`、`高危标签与无痛意愿`、`重要打点时间戳`。
3. **如何为将来「双屏实时同步」留出无缝升级口？**
   - M1–M3 状态持久化抽象在 `StorageAdapter` 接口背后，默认用 `LocalStorageAdapter`。
   - 未来 M4 若增加「爸爸记录 · 妈妈屏实时同步」，只需新增一个可选 `SyncRoomAdapter` 连接到云主机 `/opt/apps/services/labor-sync/`（占 `:3300–:3399` 独立端口，限内存 `256M`），且断线时自动回退到本地模式，**永远不依赖后端即可核心可用**。

import type {
  FocusTag,
  KnowledgeCard,
  KnowledgeCategory,
  LifeStageId,
  StageKey,
  ToolsSubtab,
} from './types';

export interface LifeStageMeta {
  id: LifeStageId;
  label: string;
  shortLabel: string;
  subtitle: string;
  badgeText: string;
  defaultStageKey: StageKey;
  defaultToolsSubtab: ToolsSubtab;
  defaultFocusTags: FocusTag[];
  homeTips: string[];
}

export const ALL_LIFE_STAGES: LifeStageId[] = [
  'pregnant_prep',
  'in_labor',
  'newborn_week1',
  'infant_1_3m',
  'infant_4_12m',
];

export const LIFE_STAGE_META: Record<LifeStageId, LifeStageMeta> = {
  pregnant_prep: {
    id: 'pregnant_prep',
    label: '孕晚期 · 待产准备中',
    shortLabel: '待产准备',
    subtitle: '待产包核对、临产信号识别、提前预习婴儿急救底线',
    badgeText: '即将迎新',
    defaultStageKey: 'prep',
    defaultToolsSubtab: 'companion',
    defaultFocusTags: ['labor_prep', 'emergency', 'feeding'],
    homeTips: [
      '提前和产妇确认“是否要无痛、家属能否进产房、宫缩几分钟去医院”',
      '产前趁有精力看完「呛奶急救」和「安全睡眠」，进月子就不用现查',
    ],
  },
  in_labor: {
    id: 'in_labor',
    label: '已在待产 / 产房陪产中',
    shortLabel: '产房陪产',
    subtitle: '宫缩计时、分阶段行动卡、1 分钟医护交接战报',
    badgeText: '产房实战',
    defaultStageKey: 'latent',
    defaultToolsSubtab: 'companion',
    defaultFocusTags: ['labor_prep', 'emergency', 'soothing'],
    homeTips: [
      '点底部「工具」立即打开宫缩计时与当下陪产卡，顶部可一键呼出红线',
      '破水立即记下“时间 + 羊水颜色”，给护士看战报大字屏最省口舌',
    ],
  },
  newborn_week1: {
    id: 'newborn_week1',
    label: '产后第 1 周 · 新生儿适应',
    shortLabel: '产后1周',
    subtitle: '呛奶急救、黄疸与大小便红线、脐带护理、产妇恶露血压关注',
    badgeText: '黄金第一周',
    defaultStageKey: 'day1',
    defaultToolsSubtab: 'handover',
    defaultFocusTags: ['emergency', 'feeding', 'postpartum'],
    homeTips: [
      '出生 1 周重点盯：喝奶是否呛咳、皮肤黄染是否爬到躯干手脚心、湿尿布片数',
      '产妇产后 48 小时仍需留意头痛、视物模糊、发热与单侧腿肿胀',
    ],
  },
  infant_1_3m: {
    id: 'infant_1_3m',
    label: '1–3 个月 · 肠胀气与拍嗝安抚',
    shortLabel: '1–3月龄',
    subtitle: '拍嗝防吐奶、飞机抱肠绞痛安抚、安全睡眠、热饮防烫伤',
    badgeText: '安抚高频期',
    defaultStageKey: 'day3',
    defaultToolsSubtab: 'handover',
    defaultFocusTags: ['soothing', 'feeding', 'emergency', 'safety'],
    homeTips: [
      '傍晚哭闹优先排查：饿/尿布/过热/拍嗝未出，再用“飞机抱+白噪音”安抚',
      '切记一手抱娃一手端热汤热茶是婴儿烫伤头号场景，餐桌热饮放内侧',
    ],
  },
  infant_4_12m: {
    id: 'infant_4_12m',
    label: '4–12 个月 · 翻身辅食与高发急救',
    shortLabel: '4–12月龄',
    subtitle: '辅食防噎急救、跌落摔头排查、高热惊厥处置、居家烫伤应对',
    badgeText: '探索高发期',
    defaultStageKey: 'day3',
    defaultToolsSubtab: 'handover',
    defaultFocusTags: ['emergency', 'safety', 'feeding'],
    homeTips: [
      '会翻身/爬行后摔床、抓热锅、吞小物件骤增，首页红色急救条随时 0 秒启动',
      '发烧关键是看精神状态与呼吸，而非只盯着体温计小数点盲目捂汗',
    ],
  },
};

export interface FocusTagMeta {
  id: FocusTag;
  label: string;
  summary: string;
}

export const ALL_FOCUS_TAGS: FocusTag[] = [
  'emergency',
  'feeding',
  'soothing',
  'labor_prep',
  'postpartum',
  'safety',
];

export const FOCUS_TAG_META: Record<FocusTag, FocusTagMeta> = {
  emergency: {
    id: 'emergency',
    label: '家庭急救保底',
    summary: '呛奶、烫伤、惊厥、摔床红线',
  },
  feeding: {
    id: 'feeding',
    label: '科学喂养拍嗝',
    summary: '含乳拍嗝、黄疸尿布、辅食防噎',
  },
  soothing: {
    id: 'soothing',
    label: '安抚与睡眠',
    summary: '飞机抱肠胀气、安全睡眠 ABC',
  },
  labor_prep: {
    id: 'labor_prep',
    label: '待产与无痛',
    summary: '宫缩医院时机、无痛与呼吸节拍',
  },
  postpartum: {
    id: 'postpartum',
    label: '产后护理恢复',
    summary: '恶露血压、饮食禁忌、脐带照护',
  },
  safety: {
    id: 'safety',
    label: '居家安全避坑',
    summary: '热饮边界、床周防护、不踩偏方坑',
  },
};

export const KNOWLEDGE_CATEGORY_LABELS: Record<KnowledgeCategory | 'all', string> = {
  all: '全部',
  emergency: '急诊急救',
  feeding: '科学喂养',
  soothing: '安抚睡眠',
  labor: '待产产程',
  postpartum: '产后照护',
  safety: '居家安全',
};

export function isLaborFocusedStage(stage: LifeStageId): boolean {
  return stage === 'pregnant_prep' || stage === 'in_labor';
}

export interface RankKnowledgeOptions {
  lifeStage: LifeStageId;
  focusTags: FocusTag[];
  query?: string;
  category?: KnowledgeCategory | 'all';
  onlyFavorites?: boolean;
  favoriteIds?: string[];
}

export function filterKnowledgeCards(
  cards: KnowledgeCard[],
  options: Pick<RankKnowledgeOptions, 'query' | 'category' | 'onlyFavorites' | 'favoriteIds'>,
): KnowledgeCard[] {
  const normalizedQuery = (options.query || '').trim().toLowerCase();
  const favSet = new Set(options.favoriteIds || []);

  return cards.filter((card) => {
    if (options.category && options.category !== 'all' && card.category !== options.category) {
      return false;
    }
    if (options.onlyFavorites && !favSet.has(card.id)) {
      return false;
    }
    if (!normalizedQuery) return true;

    const haystack = [
      card.title,
      card.subtitle,
      card.summary,
      card.sourceName,
      card.caution,
      card.pinnedTip,
      ...card.steps.map((s) => `${s.title} ${s.detail}`),
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function rankKnowledgeForUser(
  cards: KnowledgeCard[],
  options: RankKnowledgeOptions,
): KnowledgeCard[] {
  const filtered = filterKnowledgeCards(cards, options);
  const focusSet = new Set(options.focusTags);
  const favSet = new Set(options.favoriteIds || []);

  return [...filtered]
    .map((card, index) => {
      let score = 0;
      const stageMatchIndex = card.recommendedStages.indexOf(options.lifeStage);
      if (stageMatchIndex === 0) {
        score += 85;
      } else if (stageMatchIndex === 1) {
        score += 55;
      } else if (stageMatchIndex > 1) {
        score += 35;
      }

      let tagBoost = 0;
      for (const tag of card.focusTags) {
        if (focusSet.has(tag)) {
          tagBoost += 18;
        }
      }
      score += Math.min(tagBoost, 40);

      if (card.isEmergency) {
        score += 10;
      }
      if (favSet.has(card.id)) {
        score += 3;
      }

      return { card, score, index };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.card);
}

export interface HomeRecommendations {
  emergencyCards: KnowledgeCard[];
  recommendedCards: KnowledgeCard[];
}

export function getHomeRecommendations(
  cards: KnowledgeCard[],
  lifeStage: LifeStageId,
  focusTags: FocusTag[],
  recommendedLimit: number = 4,
): HomeRecommendations {
  const ranked = rankKnowledgeForUser(cards, { lifeStage, focusTags });

  // Emergency bar keeps core acute family rescue topics first, preferring stage-relevant order
  const emergencyCards = ranked.filter((card) => card.isEmergency);
  const nonEmergency = ranked.filter((card) => !card.isEmergency);

  return {
    emergencyCards,
    recommendedCards: nonEmergency.slice(0, recommendedLimit),
  };
}

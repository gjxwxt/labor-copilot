import type {
  BirthMode,
  BirthProfile,
  EpiduralIntent,
  Parity,
  PartnerAccess,
  RiskTag,
} from './types';

export interface RiskTagMeta {
  tag: RiskTag;
  label: string;
  shortLabel: string;
  summary: string;
}

export const RISK_TAG_META: Record<RiskTag, RiskTagMeta> = {
  macrosomia: {
    tag: 'macrosomia',
    label: '估测偏大 / 巨大儿评估',
    shortLabel: '胎体偏大',
    summary: '重点关注骨盆试产评估、肩难产预案、产后宫缩乏力出血及新生儿早喂养防低血糖。',
  },
  gdm: {
    tag: 'gdm',
    label: '妊娠期糖尿病 (GDM)',
    shortLabel: '糖妈 GDM',
    summary: '待产期间按医嘱监测血糖与补液；宝宝出生后按规范早吸吮并监测足跟血糖。',
  },
  cholestasis: {
    tag: 'cholestasis',
    label: '肝内胆汁淤积 (ICP)',
    shortLabel: '胆汁酸关注',
    summary: '入院确认最新总胆汁酸指标与监护频率，高度留意胎动与皮肤瘙痒变化。',
  },
  gbs_positive: {
    tag: 'gbs_positive',
    label: 'B 族链球菌阳性 (GBS+)',
    shortLabel: 'GBS+',
    summary: '临产或破水后及时告知医护 GBS 阳性，争取在分娩前按规范完成足时抗生素预防。',
  },
  hypertension: {
    tag: 'hypertension',
    label: '妊娠期高血压 / 子痫关注',
    shortLabel: '血压关注',
    summary: '全程密切关注血压与头痛、视物模糊、上腹痛等信号，产后 48 小时内同样不能松懈。',
  },
  vbac: {
    tag: 'vbac',
    label: '剖宫产后阴道试产 (VBAC)',
    shortLabel: 'VBAC 试产',
    summary: '需持续胎心监护，一旦出现下腹瘢痕处持续疼痛、压痛或胎心异常立即通知医生。',
  },
};

export const ALL_RISK_TAGS: RiskTag[] = [
  'gbs_positive',
  'gdm',
  'macrosomia',
  'hypertension',
  'cholestasis',
  'vbac',
];

export const PARITY_LABELS: Record<Parity, string> = {
  nulliparous: '初产妇（第一胎）',
  multiparous: '经产妇（二胎及以上）',
};

export const BIRTH_MODE_LABELS: Record<BirthMode, string> = {
  spontaneous: '自然临产',
  induction: '计划催产',
  planned_csection: '择期剖宫产',
};

export const EPIDURAL_LABELS: Record<EpiduralIntent, string> = {
  wanted: '明确希望打无痛',
  open: '看疼痛情况再定',
  no: '暂不考虑无痛',
  unknown: '待入院沟通',
};

export const PARTNER_ACCESS_LABELS: Record<PartnerAccess, string> = {
  yes: '允许家属进产房陪产',
  no: '仅病房陪护，产房不进',
  unknown: '暂不确定医院规定',
};

export const PROFILE_PRESETS: BirthProfile[] = [
  {
    id: 'preset_spontaneous_first',
    label: '自然临产 · 初产妇',
    parity: 'nulliparous',
    birthMode: 'spontaneous',
    riskTags: [],
    partnerAllowedInDelivery: 'unknown',
    epiduralIntent: 'wanted',
  },
  {
    id: 'preset_induction_first',
    label: '计划催产 · 初产妇',
    parity: 'nulliparous',
    birthMode: 'induction',
    riskTags: [],
    partnerAllowedInDelivery: 'unknown',
    epiduralIntent: 'wanted',
  },
  {
    id: 'preset_spontaneous_multi',
    label: '自然临产 · 经产妇',
    parity: 'multiparous',
    birthMode: 'spontaneous',
    riskTags: [],
    partnerAllowedInDelivery: 'unknown',
    epiduralIntent: 'open',
  },
  {
    id: 'preset_planned_csection',
    label: '择期剖宫产',
    parity: 'nulliparous',
    birthMode: 'planned_csection',
    riskTags: [],
    partnerAllowedInDelivery: 'no',
    epiduralIntent: 'no',
  },
];

export function createDefaultProfile(): BirthProfile {
  const first = PROFILE_PRESETS[0]!;
  return {
    ...first,
    riskTags: [...first.riskTags],
  };
}

export function getPresetById(id: string): BirthProfile | undefined {
  const found = PROFILE_PRESETS.find((preset) => preset.id === id);
  if (!found) return undefined;
  return {
    ...found,
    riskTags: [...found.riskTags],
  };
}

export function formatProfileShortLabel(profile: BirthProfile): string {
  const parityShort = profile.parity === 'nulliparous' ? '初产' : '经产';
  const modeShort = BIRTH_MODE_LABELS[profile.birthMode];
  return `${modeShort} · ${parityShort}`;
}

export function hasRiskTag(profile: BirthProfile, tag: RiskTag): boolean {
  return profile.riskTags.includes(tag);
}

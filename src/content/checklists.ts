import type { BirthProfile, BreathingPresetId } from '../domain/types';

export interface PackingCategory {
  id: string;
  title: string;
  subtitle: string;
  when?: (profile: BirthProfile) => boolean;
  items: Array<{ id: string; text: string; note?: string }>;
}

export const PACKING_CATEGORIES: PackingCategory[] = [
  {
    id: 'pack_docs',
    title: '证件文件袋（单独一袋，最先拿）',
    subtitle: '办理入院、无痛签字和后续出生证明都会用到，别塞大箱子',
    items: [
      { id: 'doc_id', text: '夫妻双方身份证原件及复印件' },
      { id: 'doc_book', text: '产检手册、近期 B 超与关键化验报告（含 GBS / 血常规 / 凝血）' },
      { id: 'doc_card', text: '医保卡 / 院内就诊卡 / 手机电子医保凭证' },
      { id: 'doc_pay', text: '住院押金常用银行卡与少量零钱备用' },
    ],
  },
  {
    id: 'pack_delivery',
    title: '产房随身袋（一拎就进待产室）',
    subtitle: '进待产室或术前准备时随身携带',
    when: (p) => p.birthMode !== 'planned_csection',
    items: [
      { id: 'del_pad', text: '产褥垫（大号 1 包，按医院要求准备）' },
      { id: 'del_straw', text: '吸管保温杯 + 弯头吸管（躺着也能喝水，不易呛）' },
      { id: 'del_food', text: '易消化高能量零食（巧克力、能量胶、电解质水）' },
      { id: 'del_belt', text: '胎心监护带（按本院要求提前备好）' },
      { id: 'del_tissue', text: '抽纸、湿巾与产妇专用一次性内裤' },
      { id: 'del_power', text: '充电线 + 满电充电宝（保持手机在线与宫缩计时）' },
    ],
  },
  {
    id: 'pack_ward',
    title: '病房生活袋（妈妈与宝宝）',
    subtitle: '分娩后回病房或剖宫产术后恢复使用',
    items: [
      { id: 'ward_pad', text: '产妇卫生巾 / 安心裤 + 会阴冲洗器（温水冲洗用）' },
      { id: 'ward_clothes', text: '前开扣哺乳睡衣、月子袜、软底防滑拖鞋' },
      { id: 'ward_baby_clothes', text: '新生儿纯棉和尚服 2–3 套、包被 / 抱毯、护脐贴' },
      { id: 'ward_diaper', text: 'NB 码纸尿裤 1 小包、绵柔巾、护臀膏' },
      { id: 'ward_feed', text: '小勺/小杯、备用配方奶及冲泡练手记录（仅在医护建议补喂时使用）' },
      {
        id: 'ward_binder',
        text: '剖宫产专用腹带（下床活动护伤口用）',
      },
    ],
  },
  {
    id: 'pack_partner',
    title: '陪产者个人装备',
    subtitle: '陪产者自己稳住，产妇才不会更慌',
    items: [
      { id: 'pat_jacket', text: '医院走廊/手术室空调较凉，备一件外套' },
      { id: 'pat_food', text: '自己的水、干粮与简单洗漱用品' },
      { id: 'pat_slippers', text: '静音防滑拖鞋 + 手机充电器' },
    ],
  },
];

export interface BreathingPresetConfig {
  id: BreathingPresetId;
  label: string;
  shortLabel: string;
  inhaleSec: number;
  exhaleSec: number;
  inhaleHint: string;
  exhaleHint: string;
  useCase: string;
}

export const BREATHING_PRESETS: BreathingPresetConfig[] = [
  {
    id: '4-6',
    label: '4-6 深缓呼吸（推荐常规）',
    shortLabel: '吸4 · 呼6',
    inhaleSec: 4,
    exhaleSec: 6,
    inhaleHint: '鼻子缓缓吸气，肩膀下沉，腹部轻鼓',
    exhaleHint: '嘴巴缩唇慢慢呼出，像吹灭远处的蜡烛',
    useCase: '适合潜伏期及中等强度宫缩，拉长呼气帮助全身泄力。',
  },
  {
    id: '4-4',
    label: '4-4 匀速呼吸（痛感较强）',
    shortLabel: '吸4 · 呼4',
    inhaleSec: 4,
    exhaleSec: 4,
    inhaleHint: '跟着圆圈稳稳吸气，不要耸肩',
    exhaleHint: '匀速把气吐净，手和下颌一起松开',
    useCase: '适合宫缩变密、较难做超长呼气时保持节奏不憋气。',
  },
  {
    id: '2-2',
    label: '2-2 浅快哈气（防提前用力）',
    shortLabel: '吸2 · 哈2',
    inhaleSec: 2,
    exhaleSec: 2,
    inhaleHint: '轻浅快速吸气',
    exhaleHint: '张口轻轻「哈——」出去，绝不往下使劲',
    useCase: '适合快开全或助产士喊「停！不要用力、哈气！」时保护会阴。',
  },
];

export function getBreathingPreset(id: BreathingPresetId): BreathingPresetConfig {
  return BREATHING_PRESETS.find((p) => p.id === id) ?? BREATHING_PRESETS[0]!;
}

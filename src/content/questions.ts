import type { QuestionCard, StageKey } from '../domain/types';

export interface StageQuestionEntry extends QuestionCard {
  stageKeys: StageKey[];
}

export const STAGE_QUESTIONS: StageQuestionEntry[] = [
  // ── 入院/准备 ──
  {
    id: 'q_prep_bishop',
    stageKeys: ['prep'],
    tag: '入院评估',
    text: '「大夫，现在宫颈条件（如宫颈评分/软硬消退情况）怎么样？下一步主要是等自然发动还是先促宫颈成熟？」',
    when: (p) => p.birthMode === 'induction',
  },
  {
    id: 'q_prep_policy',
    stageKeys: ['prep'],
    tag: '流程确认',
    text: '「咱们医院一般开几指/几公分进待产室？打无痛需要提前做什么检查或签字？允许家属进产房陪产吗？」',
    when: (p) => p.birthMode !== 'planned_csection',
  },
  {
    id: 'q_prep_fasting',
    stageKeys: ['prep', 'csection_or'],
    tag: '术前禁食',
    text: '「请问手术预计排在什么时间？从几点开始严格禁食禁水，平时的常规药物需要怎么吃？」',
    when: (p) => p.birthMode === 'planned_csection',
  },
  {
    id: 'q_prep_macrosomia',
    stageKeys: ['prep', 'second'],
    badge: '胎体偏大',
    tag: '试产与保护预案',
    text: '「产检提示胎体偏大，麻烦内检评估一下骨盆和胎头衔接条件；试产过程中产房对肩难产有怎样的预案？」',
    when: (p) => p.riskTags.includes('macrosomia') && p.birthMode !== 'planned_csection',
  },
  {
    id: 'q_prep_gbs',
    stageKeys: ['prep', 'latent', 'ripening'],
    badge: 'GBS+',
    tag: '抗生素时机',
    text: '「产妇 GBS 筛查是阳性，如果破水或者进入正式临产，什么时候开始静脉用预防性抗生素？」',
    when: (p) => p.riskTags.includes('gbs_positive') && p.birthMode !== 'planned_csection',
  },
  {
    id: 'q_prep_icp',
    stageKeys: ['prep'],
    badge: '胆汁酸关注',
    tag: '化验复查',
    text: '「孕期有总胆汁酸升高/ICP 情况，这次入院复查胆汁酸和肝功能结果出来了吗？监护频率怎么安排？」',
    when: (p) => p.riskTags.includes('cholestasis'),
  },
  {
    id: 'q_prep_gdm',
    stageKeys: ['prep', 'csection_or'],
    badge: '糖妈 GDM',
    tag: '产程血糖',
    text: '「产妇有妊娠期糖尿病，待产/术前期间需要多久测一次血糖？进食或输液有没有特别要求？」',
    when: (p) => p.riskTags.includes('gdm'),
  },
  {
    id: 'q_prep_vbac',
    stageKeys: ['prep', 'latent'],
    badge: 'VBAC 试产',
    tag: '瘢痕监护',
    text: '「本次是剖宫产后试产（VBAC），是不是需要持续胎心监护？哪些疼痛信号出现时必须马上排查瘢痕情况？」',
    when: (p) => p.riskTags.includes('vbac') && p.birthMode !== 'planned_csection',
  },

  // ── 促宫颈成熟 ──
  {
    id: 'q_ripen_balloon',
    stageKeys: ['ripening'],
    tag: '变化时问',
    text: '「如果水囊/球囊自己掉出来了，是不是说明宫颈已经开了几公分？下一步是要上缩宫素还是再观察？」',
  },
  {
    id: 'q_ripen_plan',
    stageKeys: ['ripening'],
    tag: '进度确认',
    text: '「如果这轮促成熟后还没规律宫缩，咱们后续的时间表和下一步方案是什么？」',
  },

  // ── 规律宫缩 ──
  {
    id: 'q_latent_checkin',
    stageKeys: ['latent'],
    tag: '通知护士',
    text: '「现在宫缩大概几分钟一次、每次几十秒，持续有一段时间了，麻烦看看需不需要内检或进待产室？」',
  },
  {
    id: 'q_latent_epidural',
    stageKeys: ['latent'],
    tag: '无痛准备',
    text: '「我们希望/考虑打无痛分娩，现在需要先做凝血抽血或麻醉评估吗？夜间麻醉医生响应大概多久？」',
    when: (p) => p.epiduralIntent === 'wanted' || p.epiduralIntent === 'open',
  },

  // ── 打无痛 ──
  {
    id: 'q_anesth_pca',
    stageKeys: ['anesth'],
    tag: '镇痛管理',
    text: '「无痛泵接好后如果又觉得疼，产妇自己能按追加键吗，还是需要叫护士调整？现在还能少量喝水吗？」',
    when: (p) => p.epiduralIntent !== 'no',
  },
  {
    id: 'q_anesth_non_epi',
    stageKeys: ['anesth'],
    tag: '非药物镇痛',
    text: '「如果不打无痛，产房里可以用分娩球、自由体位或吸笑气等方式辅助减痛吗？」',
    when: (p) => p.epiduralIntent === 'no',
  },

  // ── 活跃期等开全 ──
  {
    id: 'q_active_progress',
    stageKeys: ['active'],
    tag: '定期确认',
    text: '「现在宫口开到几公分了？胎头下降和胎心监护波形都好吗？需要人工破膜吗？」',
  },
  {
    id: 'q_active_phone',
    stageKeys: ['active'],
    tag: '电话里带她呼吸',
    text: '「宫缩来了跟我一起吸四拍、呼六拍，肩膀松下来；这波过去就闭眼养神，我一直都在外面/在线上。」',
    when: (p) => p.partnerAllowedInDelivery !== 'yes',
  },

  // ── 第二产程 ──
  {
    id: 'q_second_protect',
    stageKeys: ['second'],
    tag: '沟通助产士',
    text: '「现在胎心好吗？如果条件允许，请尽量帮我们做会阴保护；需要侧切或产钳辅助时请随时告诉我们。」',
  },

  // ── 剖宫产术前/术中 ──
  {
    id: 'q_cs_or_confirm',
    stageKeys: ['csection_or'],
    tag: '术前核对',
    text: '「术前备皮、导尿、核对过敏史和抗生素皮试都完成了吗？大概几点回病房，我需要在哪个区域等通知？」',
  },
  {
    id: 'q_cs_postop_care',
    stageKeys: ['csection_postop'],
    tag: '术后护理',
    text: '「术后沙袋/腹带压迫需要持续几小时？止痛泵怎么按？什么时候可以开始喝温水、翻身和尝试下床？」',
  },

  // ── 第三产程 & 产后 2 小时 ──
  {
    id: 'q_third_check',
    stageKeys: ['third'],
    tag: '分娩后确认',
    text: '「胎盘完整娩出了吗？出血量大概多少？宝宝出生时间、体重、身长和阿氏（Apgar）评分是多少？」',
  },
  {
    id: 'q_post2h_watch',
    stageKeys: ['post2h'],
    tag: '产后观察',
    text: '「现在子宫收缩硬不硬、恶露出血量正常吗？产妇什么时候可以喝水吃清淡流食、什么时候必须完成第一次排尿？」',
  },
  {
    id: 'q_post_bp',
    stageKeys: ['post2h', 'day1'],
    badge: '血压关注',
    tag: '产后血压',
    text: '「产妇孕期有血压偏高情况，现在产后血压监测稳吗？降压药需要继续按原方案吃还是调整？」',
    when: (p) => p.riskTags.includes('hypertension'),
  },

  // ── 产后第 1–3 天 ──
  {
    id: 'q_day1_glucose',
    stageKeys: ['day1'],
    badge: '血糖筛查',
    tag: '新生儿血糖',
    text: '「宝宝出生后足跟血糖测了吗、数值正常吗？需要加强按频次喂养或暂时补喂一点配方奶吗？」',
    when: (p) => p.riskTags.includes('macrosomia') || p.riskTags.includes('gdm'),
  },
  {
    id: 'q_day1_general',
    stageKeys: ['day1'],
    tag: '母婴日常',
    text: '「伤口护理怎么操作？宝宝胎便、小便次数和黄疸值今天怎么样，乙肝和卡介苗什么时候接种？」',
  },
  {
    id: 'q_day2_feeding',
    stageKeys: ['day2'],
    tag: '哺乳与护脐',
    text: '「宝宝含乳姿势有效吗？生理性涨奶很硬时是先亲喂再冷敷吗？脐带护理和洗澡怎么配合？」',
  },
  {
    id: 'q_day3_discharge',
    stageKeys: ['day3'],
    tag: '出院核对',
    text: '「出院小结、出生医学证明办理流程、产后 42 天复查预约和宝宝黄疸/足底血复查都齐了吗？回家后哪些情况必须立刻回医院？」',
  },
];

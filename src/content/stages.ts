import type { StageKey, StageTemplate } from '../domain/types';
import { STAGE_QUESTIONS } from './questions';
import { RED_LINE_ITEMS } from './red-lines';

function questionsFor(stageKey: StageKey) {
  return STAGE_QUESTIONS.filter((q) => q.stageKeys.includes(stageKey)).map(
    ({ stageKeys: _sk, ...rest }) => rest,
  );
}

function redLinesFor(stageKey: StageKey) {
  return RED_LINE_ITEMS.filter(
    (r) => !r.stageKeys || r.stageKeys.includes(stageKey),
  );
}

export const STAGE_TEMPLATES: StageTemplate[] = [
  {
    key: 'prep',
    name: '入院准备 · 临行前核对',
    shortName: '准备',
    applicableModes: ['spontaneous', 'induction', 'planned_csection'],
    headline: '今晚或出发前只做两件事：把证件随身袋封好，然后让她稳住休息。',
    subHeadline: '陪产者先把包和路线备齐，别到阵痛变密或临进医院时再满屋翻证件。',
    evidenceRef: 'WHO Intrapartum Care / 待产入院准备临床常规',
    dos: [
      {
        id: 'prep_bags',
        text: '证件袋（身份证、产检本、医保卡、关键化验单）单独放在门口最顺手的位置。',
      },
      {
        id: 'prep_phone',
        text: '两人手机与充电宝充至满电，存好医院产科急诊电话与半夜出发路线。',
      },
      {
        id: 'prep_sleep',
        text: '陪产者抓紧补觉、备好自己的外套与干粮——产程常持续十余小时，别先消耗掉体力。',
      },
      {
        id: 'prep_eat_vaginal',
        text: '饮食保持清淡易消化，不盲目大补或狂喝高糖饮料，保持平稳体力即可。',
        when: (p) => p.birthMode !== 'planned_csection',
      },
      {
        id: 'prep_fasting_cs',
        text: '严格按医生交代的术前禁食、禁水时间执行，提前摘除首饰、隐形眼镜及美甲。',
        when: (p) => p.birthMode === 'planned_csection',
      },
      {
        id: 'prep_gbs_note',
        text: '把「GBS 阳性」化验单夹在产检本最首页，一入院和破水时第一时间告知护士。',
        badge: 'GBS+',
        when: (p) => p.riskTags.includes('gbs_positive'),
      },
      {
        id: 'prep_gdm_note',
        text: '准备好日常血糖监测记录与常用零食/血糖仪（按医院要求），防止待产期间血糖波动。',
        badge: '糖妈 GDM',
        when: (p) => p.riskTags.includes('gdm'),
      },
      {
        id: 'prep_carseat',
        text: '提前确认新生儿出院提篮 / 安全座椅与包被已备妥在车内或家中显眼处。',
      },
    ],
    questions: questionsFor('prep'),
    redLines: redLinesFor('prep'),
    knowledgeBlocks: [
      {
        id: 'kb_prep_induction',
        title: '为什么计划催产常常先「促宫颈成熟」，而不是直接挂催产素？',
        evidenceRef: 'ACOG Practice Bulletin: Induction of Labor / 中华医学会促宫颈成熟指南',
        when: (p) => p.birthMode === 'induction',
        bullets: [
          '催产能否顺利启动，关键看宫颈成熟度（Bishop 评分），而不仅仅是孕周到了没有。',
          '如果宫颈还偏硬、宫颈管未消退就直接强上缩宫素，往往事倍功半、产妇辛苦且转剖概率上升。',
          '标准流程通常是先用球囊（水囊）或前列腺素药物把宫颈软化打开，通常需要 6–12 小时甚至更久，期间保持耐心陪伴即可。',
        ],
      },
      {
        id: 'kb_prep_spontaneous',
        title: '什么时候该启程去医院？（初产 vs 经产差异）',
        evidenceRef: 'ACOG Signs of Labor / WHO 产程照护建议',
        when: (p) => p.birthMode === 'spontaneous',
        bullets: [
          '破水、阴道出血像月经量、胎动明显异常——不论宫缩是否规律，立刻去医院。',
          '初产妇通常参考 5-1-1 法则：宫缩间隔 ≤5 分钟、每次持续 ≥40–60 秒、稳定持续 1 小时。',
          '经产妇产程常常提速明显，一旦宫缩变规律（约 5–7 分钟一次且逐渐增强）就应准备出发，切勿卡死等 1 小时。',
        ],
      },
    ],
    mom: {
      headline: '包已经备好了\n你今晚只管好好睡觉',
      dos: [
        { id: 'mom_prep_1', text: '杂事、证件和路线都交给陪产的人，你不用操心。' },
        { id: 'mom_prep_2', text: '睡不着就闭眼放空，练几次「吸 4 秒、呼 6 秒」的深呼吸。' },
        { id: 'mom_prep_3', text: '发现破水、见红量大或胎动异常，随时告诉身边的人去医院。' },
      ],
    },
  },

  {
    key: 'ripening',
    name: '促宫颈成熟 · 球囊 / 塞药',
    shortName: '促成熟',
    applicableModes: ['induction'],
    headline: '这段时间你是主心骨：帮她保持体位舒适，留心破水、出血和规律痛感。',
    subHeadline: '宫颈正在软化打开，可能出现不规律发紧或酸痛。别催进展，先稳住她的节奏。',
    evidenceRef: 'ACOG Practice Bulletin No.107 / 产科催产护理常规',
    dos: [
      {
        id: 'rip_urine',
        text: '提醒她每 2 小时排尿一次。充盈的膀胱会明显加重宫缩不适并阻碍胎头下降。',
      },
      {
        id: 'rip_position',
        text: '疼痛或腰酸时协助她侧卧，双腿间夹一个枕头，或者扶着床沿轻缓摇摆骨盆。',
      },
      {
        id: 'rip_observe',
        text: '每隔 1–2 小时问一次感受：肚子紧痛规律了吗？下身有没有突发温热流水或出血增多？',
      },
      {
        id: 'rip_balloon_note',
        text: '若放的是球囊/水囊，它自行滑出不是失败，往往说明宫颈已软化扩张——通知护士即可。',
      },
      {
        id: 'rip_rest',
        text: '不规律发紧阶段鼓励她闭眼休息，你也抓紧轮流小睡保存体力。',
      },
    ],
    questions: questionsFor('ripening'),
    redLines: redLinesFor('ripening'),
    mom: {
      headline: '侧躺，两腿之间夹个枕头\n不规律发紧时先别跟着使劲',
      dos: [
        { id: 'mom_rip_1', text: '能排尿就及时去厕所，别憋尿。' },
        { id: 'mom_rip_2', text: '宫缩来了鼻子吸气、嘴巴慢慢呼，肩膀往下沉。' },
        { id: 'mom_rip_3', text: '一旦感觉下面一股温热液体止不住流出，马上躺下叫人。' },
      ],
    },
  },

  {
    key: 'latent',
    name: '第一产程潜伏期 · 规律宫缩',
    shortName: '规律宫缩',
    applicableModes: ['spontaneous', 'induction'],
    headline: '切到「宫缩」页按真实痛感记录，达标即通知护士或启程入院。',
    subHeadline:
      '从零散发紧变成有节奏的疼。潜伏期往往最磨人，你的稳定感比任何安慰都重要。',
    evidenceRef: 'WHO Intrapartum Care Guidelines / 产程潜伏期护理规范',
    dos: [
      {
        id: 'lat_timer',
        text: '每波宫缩她一说「开始紧/疼」就点开始，「退下去」就点结束，交给系统算 5-1-1 趋势。',
      },
      {
        id: 'lat_multi_warn',
        text: '经产妇潜伏期向活跃期切换很快，只要间隔接近 5–7 分钟且痛感渐强就该联系医院或进待产室。',
        badge: '经产提醒',
        when: (p) => p.parity === 'multiparous',
      },
      {
        id: 'lat_urine',
        text: '至少每 1 小时提醒排尿一次，同时小口补充温水或电解质饮料。',
      },
      {
        id: 'lat_move',
        text: '未破水前，在走廊或床边扶着站立、慢走、靠墙深蹲或坐分娩球，比一直平躺开指更顺。',
      },
      {
        id: 'lat_rest_gap',
        text: '宫缩间隙立刻让她闭眼躺靠放松，少聊天、别一直追问「开几指了」。',
      },
      {
        id: 'lat_vbac',
        text: 'VBAC 试产期间留意宫缩间隙下腹部是否完全放松；若间隙也持续刺痛需立即汇报。',
        badge: 'VBAC 试产',
        when: (p) => p.riskTags.includes('vbac'),
      },
    ],
    questions: questionsFor('latent'),
    redLines: redLinesFor('latent'),
    mom: {
      headline: '宫缩来了：吸 4 拍、呼 6 拍\n间隙闭眼，什么都别想',
      dos: [
        { id: 'mom_lat_1', text: '别平躺，侧躺夹枕头或扶着站立摇摆骨盆更舒服。' },
        { id: 'mom_lat_2', text: '每波痛来临，让陪产者用掌根从后腰往下轻揉或热敷。' },
        { id: 'mom_lat_3', text: '疼痛退去那一刻，立刻松开拳头和牙关休息。' },
      ],
    },
  },

  {
    key: 'anesth',
    name: '进待产室 · 镇痛与无痛评估',
    shortName: '镇痛/无痛',
    applicableModes: ['spontaneous', 'induction'],
    headline: '进入待产室后，配合镇痛评估；若打无痛，前 15 分钟紧盯不良反应。',
    subHeadline: '无论选择无痛分娩还是非药物减痛，安全与体位管理永远排第一。',
    evidenceRef: 'ASA / ACOG 产科镇痛麻醉临床实践指南',
    dos: [
      {
        id: 'ane_curl',
        text: '打硬膜外无痛时提醒她：「蜷成虾米、下巴低向胸口、背往外弓、身体千万别突然动」。',
        when: (p) => p.epiduralIntent !== 'no',
      },
      {
        id: 'ane_15min',
        text: '置管注药后 15 分钟内密切问她有没有头晕、耳鸣、嘴唇发麻、心慌——出现立刻叫麻醉师。',
        when: (p) => p.epiduralIntent !== 'no',
      },
      {
        id: 'ane_fall',
        text: '打完无痛双腿常发麻无力，绝对不能自己下床走路或上厕所，防跌倒比什么都重要。',
        when: (p) => p.epiduralIntent !== 'no',
      },
      {
        id: 'ane_tilt',
        text: '保持侧卧或床头垫斜左侧卧 15–30 度，避免完全仰卧压迫下腔静脉影响宝宝供血。',
      },
      {
        id: 'ane_non_epi',
        text: '若暂不打无痛，用温热敷腰骶、自由体位、拉玛泽呼吸或请助产士协助非药物减痛。',
        when: (p) => p.epiduralIntent === 'no',
      },
      {
        id: 'ane_timer_takeover',
        text: '镇痛起效后她可能感觉不到宫缩，由陪产者通过胎监曲线或手触宫底变化接管节奏观察。',
        when: (p) => p.epiduralIntent !== 'no',
      },
    ],
    questions: questionsFor('anesth'),
    redLines: redLinesFor('anesth'),
    mom: {
      headline: '保持侧卧，放松养神\n不疼了就睡一会儿攒体力',
      dos: [
        {
          id: 'mom_ane_1',
          text: '打完无痛腿麻是正常的，绝对不要自己试着下床站立。',
          when: (p) => p.epiduralIntent !== 'no',
        },
        {
          id: 'mom_ane_2',
          text: '感到头晕、嘴麻、恶心或只半边麻，立刻说出来，别硬忍。',
          when: (p) => p.epiduralIntent !== 'no',
        },
        { id: 'mom_ane_3', text: '把呼吸放慢，能睡着就闭眼小睡，后半程需要体力。' },
      ],
    },
  },

  {
    key: 'active',
    name: '活跃期 · 等开全冲刺前',
    shortName: '等开全',
    applicableModes: ['spontaneous', 'induction'],
    headline: '保持通讯与补给畅通：她需要持续被托住，你也要留住最后冲刺的体力。',
    subHeadline: '宫口加速扩张期。无论你在床旁还是产房门外，节奏感比焦虑追问更有效。',
    evidenceRef: 'WHO Care in Normal Birth / 中华医学会正常分娩临床实践指南',
    dos: [
      {
        id: 'act_outside_kit',
        text: '若家属不能进待产室：进门前把吸管温水、软吸管饮料和抽纸挂在床头她一伸手就能拿到的位置。',
        when: (p) => p.partnerAllowedInDelivery !== 'yes',
      },
      {
        id: 'act_voice',
        text: '若电话连线陪产：宫缩来时你在话筒里稳稳数拍子带她呼气；不疼时让她挂着闭眼休息。',
        when: (p) => p.partnerAllowedInDelivery !== 'yes',
      },
      {
        id: 'act_inside',
        text: '若在床旁陪护：少说话、多给稳定眼神和手部支撑，按她喜好揉腰或递水，及时同步宫缩变化。',
        when: (p) => p.partnerAllowedInDelivery === 'yes',
      },
      {
        id: 'act_milestone_log',
        text: '每次内检开指或破水后，顺手在「交接卡」打个点，方便随时核对产程进展。',
      },
      {
        id: 'act_urge_warn',
        text: '一旦她说「突然特别想大便、忍不住想往下使劲」，立刻叫助产士内检，切勿私自用力。',
      },
    ],
    questions: questionsFor('active'),
    redLines: redLinesFor('active'),
    mom: {
      headline: '想用力时先喊护士\n别自己在床上使劲',
      dos: [
        { id: 'mom_act_1', text: '没确认开全前突然有排便感，张口「哈——」出去，同时喊人。' },
        { id: 'mom_act_2', text: '保持侧躺夹枕头，口渴就小口吸温水。' },
        { id: 'mom_act_3', text: '宫缩过去立刻闭眼休息，省下每一分力气。' },
      ],
    },
  },

  {
    key: 'second',
    name: '第二产程 · 上产床与用力',
    shortName: '上产床',
    applicableModes: ['spontaneous', 'induction'],
    headline: '一切听助产士口令：陪产者站头侧协助呼吸与递水，不站脚侧、不抢口令。',
    subHeadline: '从宫口开全到宝宝娩出，重点是精准配合长劲与关键时刻的「哈气刹车」。',
    evidenceRef: 'ACOG Approaches to Limit Intervention During Labor and Birth',
    dos: [
      {
        id: 'sec_headside',
        text: '若进产房陪产：站在产妇头侧，握手擦汗、递吸管水、帮她用下巴抵胸，别去盯产台下方。',
        when: (p) => p.partnerAllowedInDelivery !== 'no',
      },
      {
        id: 'sec_wait_out',
        text: '若产房外等候：手机开最大音量不走远，准备好产房随身袋里的婴儿衣物和产褥垫，随时响应医护呼叫。',
        when: (p) => p.partnerAllowedInDelivery === 'no',
      },
      {
        id: 'sec_push',
        text: '助产士喊「使劲」时配合向下长推；间隙立刻把头靠回枕头完全松懈回血。',
      },
      {
        id: 'sec_pant',
        text: '助产士喊「停！哈气！不要再用力！」时，大声清晰替她复述「别使劲了，张嘴哈气！」，能有效防严重撕裂。',
      },
      {
        id: 'sec_emergency_space',
        text: '若突发紧急按铃多人冲入，立刻退至靠墙安全区，不挡通道、不打断医护口令。',
      },
      {
        id: 'sec_shoulder',
        text: '若遇胎肩娩出困难医护喊抱腿（McRoberts 体位），果断配合助产士协助把她双腿屈向胸侧。',
        badge: '胎体偏大',
        when: (p) => p.riskTags.includes('macrosomia'),
      },
    ],
    questions: questionsFor('second'),
    redLines: redLinesFor('second'),
    mom: {
      headline: '听助产士口令\n喊「哈气」就立刻停下用力',
      dos: [
        { id: 'mom_sec_1', text: '用力时下巴贴胸口、眼睛看肚脐，像解干硬大便那样往下推长劲。' },
        { id: 'mom_sec_2', text: '一旦听到「哈气、别使劲」，立刻松开肚皮张嘴哈气。' },
        { id: 'mom_sec_3', text: '胎头快出来时会有灼热感，这正是快见面了，别慌。' },
      ],
    },
  },

  {
    key: 'csection_or',
    name: '择期剖宫产 · 术前与进手术室',
    shortName: '术前/手术室',
    applicableModes: ['planned_csection'],
    headline: '核对禁食时间、完成备皮导尿与签署知情同意；你在手术室外手机保持畅通。',
    subHeadline: '择期剖宫产流程清晰紧凑，陪产者稳住情绪、接好物品交接即可。',
    evidenceRef: 'ERAS Society Guidelines for Antenatal & Intraoperative Care in Cesarean Delivery',
    dos: [
      {
        id: 'cs_fasting',
        text: '再次确认她已严格遵医嘱禁食禁水，取下活动假牙、眼镜、发卡和全部金属首饰。',
      },
      {
        id: 'cs_prep_items',
        text: '按医院清单准备好产褥垫、新生儿第一套衣物包巾与住院手环核对。',
      },
      {
        id: 'cs_wait',
        text: '她进手术室后你在指定家属区等候，别走远、别调静音，随时准备听医生沟通与看宝宝第一眼。',
      },
      {
        id: 'cs_anesthesia_reassure',
        text: '提前告诉她：半身麻醉（腰硬联合）后手脚仍可能有牵拉感或轻微发冷寒战，属于常见反应，不舒服直接告诉麻醉医生。',
      },
    ],
    questions: questionsFor('csection_or'),
    redLines: redLinesFor('csection_or'),
    mom: {
      headline: '麻醉后手脚发沉发冷很常见\n有任何不适直接告诉麻醉医生',
      dos: [
        { id: 'mom_cs_1', text: '打麻药时配合蜷背不动，有麻电感先说别突然乱动。' },
        { id: 'mom_cs_2', text: '手术中会感觉到肚皮被牵拉按压，但不会有锐痛；头晕恶心马上说话。' },
        { id: 'mom_cs_3', text: '保持吸 4 秒呼 6 秒，很快就能听到宝宝哭声。' },
      ],
    },
  },

  {
    key: 'third',
    name: '第三产程 · 胎盘娩出与早接触',
    shortName: '胎盘/早接触',
    applicableModes: ['spontaneous', 'induction'],
    headline: '宝宝出来了也别只顾拍照：盯紧产后早期出血量，并守护母婴早接触。',
    subHeadline: '胎盘通常在 5–30 分钟内娩出，同时医护会按摩子宫、给缩宫素并检查缝合。',
    evidenceRef: 'WHO Recommendations for Prevention of Postpartum Haemorrhage',
    dos: [
      {
        id: 'thi_skin',
        text: '条件允许时，让宝宝第一时间趴在妈妈胸口做肌肤接触早吸吮，既稳血糖体温也促进子宫收缩。',
      },
      {
        id: 'thi_bleed',
        text: '在旁留心观察出血情况：若血像水流一样不停或产褥垫很快湿透，立刻大声提醒医护。',
      },
      {
        id: 'thi_shiver',
        text: '产后妈妈常突发不受控的寒战发抖，多为激素与散热反应，帮她盖好被子安抚别慌。',
      },
      {
        id: 'thi_record',
        text: '在「交接卡」打点记录宝宝出生时间，核对母婴腕带姓名住院号，并记住体重身长和 Apgar 评分。',
      },
      {
        id: 'thi_atony',
        text: '胎体偏大时子宫肌纤维牵拉更明显，分娩后前 30 分钟更要留意宫缩是否够硬。',
        badge: '胎体偏大',
        when: (p) => p.riskTags.includes('macrosomia'),
      },
    ],
    questions: questionsFor('third'),
    redLines: redLinesFor('third'),
    mom: {
      headline: '宝宝趴在胸口暖着就好\n觉得发冷、头晕、心慌立刻说出来',
      dos: [
        { id: 'mom_thi_1', text: '先别急着看手机回消息，让宝宝贴着你。' },
        { id: 'mom_thi_2', text: '发抖寒战很常见，开口多要一床被子就好。' },
        { id: 'mom_thi_3', text: '缝合或按压肚子时吸气呼气，别憋气绷紧。' },
      ],
    },
  },

  {
    key: 'csection_postop',
    name: '剖宫产术后 · 回病房与早期监护',
    shortName: '术后监护',
    applicableModes: ['planned_csection'],
    headline: '稳稳接回病房：去枕平卧按医嘱压沙袋/腹带、看心电监护与导尿管、防血栓。',
    subHeadline: '术后前 6 小时看血压、宫底出血和导尿；之后核心是翻身防粘连、早吸吮和按期下床。',
    evidenceRef: 'ERAS Society Guidelines for Postoperative Care in Cesarean Delivery',
    dos: [
      {
        id: 'csp_pillow',
        text: '回病房先确认床头枕头、沙袋/腹带压迫、心电监护和输液管路是否按医嘱固定妥当。',
      },
      {
        id: 'csp_bleed',
        text: '前 2 小时每 15–30 分钟查看一次产褥垫出血量及尿袋尿量、颜色是否清亮。',
      },
      {
        id: 'csp_ankle',
        text: '麻醉消退、脚能动之后，提醒她在床上做「勾脚尖-绷脚背」踝泵运动，降低下肢血栓风险。',
      },
      {
        id: 'csp_turn',
        text: '按护士指导时间（通常 6 小时后）协助她每隔 2 小时左右轻柔翻身，有助尽早排气。',
      },
      {
        id: 'csp_milk',
        text: '哪怕伤口还疼、还没排气，只要母婴状况平稳，都可以让宝宝侧卧或怀抱尽早吸吮开奶。',
      },
    ],
    questions: questionsFor('csection_postop'),
    redLines: redLinesFor('csection_postop'),
    mom: {
      headline: '伤口疼就说，止痛泵可以按\n脚能动了多勾脚尖防血栓',
      dos: [
        { id: 'mom_csp_1', text: '咳嗽或翻身前，用手或小枕头轻轻按护住伤口再动。' },
        { id: 'mom_csp_2', text: '按医生指导时间前别急着抬头或喝太多胀气饮料。' },
        { id: 'mom_csp_3', text: '头晕、胸闷、出冷汗或下面突然涌血，立刻叫家人按铃。' },
      ],
    },
  },

  {
    key: 'post2h',
    name: '产后 2 小时 · 黄金观察期',
    shortName: '产后 2h',
    applicableModes: ['spontaneous', 'induction', 'planned_csection'],
    headline: '这 2 小时别离开床边：每 15 分钟看一次产褥垫，防产后出血与第一次晕倒。',
    subHeadline: '产后大出血最常发生在分娩后最初 2 小时内，陪产者是最直接的第一道哨兵。',
    evidenceRef: 'ACOG Practice Bulletin: Postpartum Hemorrhage / 产后 2 小时规范观察',
    dos: [
      {
        id: 'p2h_pad',
        text: '每 15 分钟掀开被角看一眼产褥垫：正常应逐渐变少；若涌出大量鲜血或大血块，立刻按铃。',
      },
      {
        id: 'p2h_fundus',
        text: '配合护士观察子宫收缩（硬如球状为佳）；若摸起来发软、出血增多，需立即按压提醒医护。',
      },
      {
        id: 'p2h_urine',
        text: '关注首次排尿（顺产后 4–6 小时内需排出；剖宫产注意尿管通畅）。憋尿会直接影响宫缩导致出血。',
        when: (p) => p.birthMode !== 'planned_csection',
      },
      {
        id: 'p2h_clear_visitors',
        text: '先请非直系亲友在门外等候、拉好床帘：产妇需要安静补水、隐私清洁和肌肤接触。',
      },
      {
        id: 'p2h_baby_watch',
        text: '观察宝宝呼吸节奏与肤色（红润有哭声正常；发青发白、呻吟或叫不醒立刻叫护士）。',
      },
    ],
    questions: questionsFor('post2h'),
    redLines: redLinesFor('post2h'),
    mom: {
      headline: '先补水休息，别急着下床\n觉得晕、冷、心慌立刻说出来',
      dos: [
        { id: 'mom_p2h_1', text: '第一次下床一定先在床边坐 1 分钟再在搀扶下起身。' },
        { id: 'mom_p2h_2', text: '护士按肚子观察宫缩会有点疼，但这是在保安全，呼吸配合。' },
        { id: 'mom_p2h_3', text: '想排尿马上说，不要憋着。' },
      ],
    },
  },

  {
    key: 'day1',
    name: '产后第 1 天 · 排尿、喂养与监测',
    shortName: '产后 1 天',
    applicableModes: ['spontaneous', 'induction', 'planned_csection'],
    headline: '陪产者升级为「记录员 + 护卫」：盯紧母婴第一次排泄、恶露体温与新生儿喂养。',
    subHeadline: '产妇体力和伤口都处于最脆弱期，把访客挡在门外，把记录抓在手里。',
    evidenceRef: 'WHO Postnatal Care for Mothers and Newborns',
    dos: [
      {
        id: 'd1_baby_peepoop',
        text: '记录宝宝出生 24 小时内的胎便（墨绿色）与小便次数；满 24 小时仍无大小便需主动报告。',
      },
      {
        id: 'd1_feeding',
        text: '每 2–3 小时让宝宝有效吸吮一次（包括夜间唤醒喂养），别只看单次时长而忽略吞咽声。',
      },
      {
        id: 'd1_glucose',
        text: '按护士安排跟进宝宝出生后早期足跟血糖监测；若偏低需要补喂时，严格按医嘱小剂量先喂。',
        badge: '血糖重点',
        when: (p) => p.riskTags.includes('macrosomia') || p.riskTags.includes('gdm'),
      },
      {
        id: 'd1_ambulate',
        text: '第一次下地前先坐起 1 分钟确认不头晕，你全程站在她身侧搀扶防体位性低血压摔倒。',
      },
      {
        id: 'd1_hygiene',
        text: '恶露清洁坚持温水从前向后冲洗/轻拍擦拭；约每 3–4 小时换卫生巾并查看恶露量和气味。',
      },
      {
        id: 'd1_diet',
        text: '饮食先清淡易消化（粥、蒸蛋、软面、温汤），不要一上来猛喝油腻浓汤，避免堵奶与肠胃不适。',
      },
      {
        id: 'd1_vaccine',
        text: '陪宝宝去接种乙肝疫苗第一针与卡介苗（按医院流程），核对并收好预防接种证。',
      },
    ],
    questions: questionsFor('day1'),
    redLines: redLinesFor('day1'),
    mom: {
      headline: '痛就说、饿就吃清淡的\n每次下床一定有人扶着',
      dos: [
        { id: 'mom_d1_1', text: '别因为觉得「奶少」焦虑，初乳量虽少但足够新生儿胃容量，让宝宝多吸。' },
        { id: 'mom_d1_2', text: '每次排尿后用温水从前向后冲洗，保持伤口干爽。' },
        { id: 'mom_d1_3', text: '感到委屈想哭是很常见的产后激素波动，说出来别憋在心里。' },
      ],
    },
  },

  {
    key: 'day2',
    name: '产后第 2 天 · 开奶涨奶与护脐',
    shortName: '产后 2 天',
    applicableModes: ['spontaneous', 'induction', 'planned_csection'],
    headline: '今天守住两件事：帮她理顺喂奶与生理性涨奶，同时坚决替她挡掉无效探视。',
    subHeadline: '伤口酸痛、涨奶发硬、睡眠不足往往在同一天叠满，陪产者把杂活和人情全扛走。',
    evidenceRef: 'Academy of Breastfeeding Medicine (ABM) Clinical Protocol / 产科母乳喂养指南',
    dos: [
      {
        id: 'd2_latch',
        text: '看宝宝是否张大嘴含住大部分乳晕而不仅是乳头；若疼痛破皮，尽早请护士或哺乳指导协助调整姿势。',
      },
      {
        id: 'd2_engorge',
        text: '生理性涨奶发硬时：喂前可极短时温和柔抚疏通，喂后若有胀痛可适度冷敷；发烧或红肿硬块切忌暴力大力揉压。',
      },
      {
        id: 'd2_privacy',
        text: '哺乳、擦洗和查房时主动请访客和男性家属回避，门上可贴「休息/哺乳中，请稍等」。',
      },
      {
        id: 'd2_cord',
        text: '跟护士学一次新生儿洗澡、抚触和肚脐护理（保持脐部干燥透气，纸尿裤腰头反折避开脐带）。',
      },
      {
        id: 'd2_dvt_check',
        text: '帮她按揉小腿时留意双腿粗细和温度是否一致；若单侧突发肿痛发热立刻停手并叫医生。',
      },
    ],
    questions: questionsFor('day2'),
    redLines: redLinesFor('day2'),
    mom: {
      headline: '不想见的人让陪产者去挡\n喂奶疼立刻叫指导看含乳',
      dos: [
        { id: 'mom_d2_1', text: '涨奶先让宝宝吸，吸完仍胀痛再冷敷，别让任何人暴力硬揉。' },
        { id: 'mom_d2_2', text: '白天宝宝睡着时你也跟着闭眼补觉，别忙着回消息。' },
        { id: 'mom_d2_3', text: '觉得心情低落、无助或突然崩溃，直接告诉伴侣和医生。' },
      ],
    },
  },

  {
    key: 'day3',
    name: '出院收尾 · 证件核对与居家交接',
    shortName: '出院收尾',
    applicableModes: ['spontaneous', 'induction', 'planned_csection'],
    headline: '出院不是结束：核对全套出院文件与复查时间，并导出本次产程时间线留念。',
    subHeadline: '把证件、筛查预约和居家红线清清楚楚装进脑子和袋子，平安带母婴回家。',
    evidenceRef: 'WHO Postnatal Discharge & Follow-up Guidance',
    dos: [
      {
        id: 'd3_docs',
        text: '出院小结、出生证明办理指引、疫苗本、听力/足底血采血回执、发票全部收进证件袋并拍照备份。',
      },
      {
        id: 'd3_jaundice',
        text: '记清出院时宝宝经皮黄疸数值，以及医院要求的复测时间、黄疸回院阈值。',
      },
      {
        id: 'd3_home_setup',
        text: '安全提篮/座椅正确反向安装固定，新生儿衣被适量不过度捂热。',
      },
      {
        id: 'd3_chore',
        text: '回家后包揽抱娃以外的家务，提醒产妇少弯腰提重物，感冒咳嗽访客一律谢绝入室。',
      },
      {
        id: 'd3_export',
        text: '点开底部「交接卡」导出本次产程时间线 Markdown / 数据留档，随后按需清理本地隐私。',
      },
    ],
    questions: questionsFor('day3'),
    redLines: redLinesFor('day3'),
    mom: {
      headline: '证件杂事都交给他\n回家第一周只管吃好睡好恢复',
      dos: [
        { id: 'mom_d3_1', text: '不用着急当满分妈妈，有疑问随时翻出医院留的联系单或回院复查。' },
        { id: 'mom_d3_2', text: '出院后仍要留意恶露、体温、头痛血压及伤口情况，有红线别犹豫。' },
        { id: 'mom_d3_3', text: '感谢自己走过这一程，接下来的日子慢慢来。' },
      ],
    },
  },
];

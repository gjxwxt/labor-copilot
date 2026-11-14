import type { RedLineItem } from '../domain/types';

export const RED_LINE_ITEMS: RedLineItem[] = [
  {
    id: 'rl_water_break',
    title: '破水（阴道突然流出不受控的温热液体）',
    action:
      '立刻让她平躺、臀部垫高枕头，不要站起来走动（防脐带脱垂），马上按铃或平卧送医；记住破水时间并观察羊水是否清亮或呈黄绿/血性。',
    severity: 'call_bell_now',
    stageKeys: ['prep', 'ripening', 'latent', 'active', 'csection_or'],
  },
  {
    id: 'rl_bleeding',
    title: '出血量达到或超过月经量、鲜红色或伴有大血块',
    action: '不要擦掉或自己观察等待，保留卫生巾/产褥垫给医护看，立刻按铃。',
    severity: 'call_bell_now',
  },
  {
    id: 'rl_fetal_movement',
    title: '胎动明显减少、消失，或剧烈挣扎后突然归于安静',
    action: '立刻按铃或直接前往医院胎心监护，绝不拖延到次日。',
    severity: 'call_bell_now',
    stageKeys: ['prep', 'ripening', 'latent', 'active', 'csection_or'],
  },
  {
    id: 'rl_constant_pain',
    title: '持续剧烈腹痛不缓解、肚子一直发硬不放松',
    action:
      '正常宫缩有来有去。如果是一直硬、一直剧痛，立刻按铃排查胎盘早剥或子宫过度刺激。',
    severity: 'call_bell_now',
    stageKeys: ['prep', 'ripening', 'latent', 'anesth', 'active', 'second'],
  },
  {
    id: 'rl_vbac_scar',
    title: '剖宫产后试产（VBAC）：下腹原刀口处持续刺痛、压痛或胎心突然异常',
    action: '立刻按铃叫医生评估，不要等待下一次例行查房。',
    severity: 'call_bell_now',
    badge: 'VBAC 试产',
    stageKeys: ['prep', 'latent', 'anesth', 'active', 'second'],
    when: (p) => p.riskTags.includes('vbac') && p.birthMode !== 'planned_csection',
  },
  {
    id: 'rl_urge_to_push',
    title: '进产房前突然控制不住想用力、有强烈排便感',
    action: '立刻喊助产士内检！不要让她自己使劲或去厕所蹲着，引导她张口「哈气」。',
    severity: 'call_bell_now',
    stageKeys: ['latent', 'anesth', 'active'],
    when: (p) => p.birthMode !== 'planned_csection',
  },
  {
    id: 'rl_epidural_reaction',
    title: '打无痛后突发头晕、耳鸣、嘴唇发麻、心慌或一侧/双腿完全无力',
    action: '立刻呼叫麻醉医生和护士，防局麻药反应或低血压，切勿擅自下床站立。',
    severity: 'call_bell_now',
    stageKeys: ['anesth', 'active'],
    when: (p) => p.birthMode !== 'planned_csection' && p.epiduralIntent !== 'no',
  },
  {
    id: 'rl_postpartum_hemorrhage',
    title: '产后大出血或休克前兆（垫子很快湿透、头晕、眼前发黑、冷汗心慌）',
    action: '立刻大声呼救或按床头红铃！产后 2 小时是出血高危窗口，一分钟都不要等。',
    severity: 'call_bell_now',
    stageKeys: ['third', 'csection_postop', 'post2h', 'day1', 'day2', 'day3'],
  },
  {
    id: 'rl_preeclampsia',
    title: '剧烈头痛、视物模糊/重影、右上腹或胃部疼痛、血压明显升高',
    action: '立刻按铃或紧急就医，警惕子痫前期（孕期及产后数天内均可能发生）。',
    severity: 'call_bell_now',
    badge: '血压关注',
  },
  {
    id: 'rl_thrombosis',
    title: '突发胸痛、憋气呼吸困难，或单侧小腿明显肿胀、发热、压痛',
    action: '立刻让产妇制动并呼叫医生，警惕产后深静脉血栓或肺栓塞（剖宫产后尤需注意）。',
    severity: 'call_bell_now',
    stageKeys: ['csection_postop', 'post2h', 'day1', 'day2', 'day3'],
  },
  {
    id: 'rl_infection_fever',
    title: '产妇体温 ≥ 38℃、恶露有明显臭味、伤口红肿流脓或裂开',
    action: '及时通知医护评估产褥感染或乳腺炎，不要硬扛发烧。',
    severity: 'notify_soon',
    stageKeys: ['csection_postop', 'day1', 'day2', 'day3'],
  },
  {
    id: 'rl_baby_danger',
    title: '新生儿脸色发青/惨白、呼吸急促呻吟、抖动抽搐、嗜睡叫不醒或 24h 内皮肤快速变黄',
    action: '立刻抱去或按铃请新生儿科/产科护士评估，警惕低血糖、呼吸窘迫或病理性黄疸。',
    severity: 'call_bell_now',
    stageKeys: ['third', 'post2h', 'day1', 'day2', 'day3'],
  },
  {
    id: 'rl_postpartum_mood',
    title: '产妇情绪崩溃持续哭泣、表达绝望或出现自伤/伤婴念头',
    action: '立刻安排家人寸步不离陪伴，认真倾听不指责，并第一时间联系医生心理支持介入。',
    severity: 'call_bell_now',
    stageKeys: ['day1', 'day2', 'day3'],
  },
];

export const CALL_DOCTOR_SCRIPT: Array<{ step: string; detail: string }> = [
  {
    step: '1. 先说最要命的关键词（别铺垫）',
    detail: '直接说「破水了」「出血很多」「胎动突然没了」「产妇头晕出冷汗」——第一秒让护士判断紧急度。',
  },
  {
    step: '2. 再给数字，或直接亮出「交接卡」',
    detail: '几点发生、垫子湿透多少、宫缩几分钟一次，点开底部「交接卡」给医护一眼扫完。',
  },
  {
    step: '3. 别自我降级，宁可多叫一次',
    detail: '「可能没事，但我们不放心，想请您过来确认一下」——在产房，谨慎永远比逞强安全一万倍。',
  },
];

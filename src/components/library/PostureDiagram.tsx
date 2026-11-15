import type { PostureDiagramId } from '../../domain/types';

interface PostureDiagramProps {
  diagramId: PostureDiagramId;
}

export function PostureDiagram({ diagramId }: PostureDiagramProps) {
  if (diagramId === 'choking') {
    return (
      <figure className="posture-diagram" aria-label="婴儿拍背与压胸标准体位示意图">
        <svg viewBox="0 0 360 132" role="img" aria-label="头低脚高前臂俯卧拍背与仰卧双指压胸">
          <rect x="6" y="6" width="168" height="120" rx="10" className="diag-panel" />
          <text x="16" y="24" className="diag-title">① 俯卧拍背 5 次</text>
          <path d="M22 92 L134 70" className="diag-arm" />
          <ellipse cx="76" cy="68" rx="34" ry="15" transform="rotate(-14 76 68)" className="diag-body" />
          <circle cx="38" cy="79" r="13" className="diag-head" />
          <path d="M68 42 L78 58" className="diag-arrow" />
          <circle cx="79" cy="60" r="4" className="diag-hit" />
          <text x="16" y="114" className="diag-cap">前臂托下颌 · 头低脚高 35°</text>

          <rect x="186" y="6" width="168" height="120" rx="10" className="diag-panel" />
          <text x="196" y="24" className="diag-title">② 仰卧压胸 5 次</text>
          <path d="M204 92 L322 68" className="diag-arm" />
          <ellipse cx="262" cy="68" rx="34" ry="15" transform="rotate(-14 262 68)" className="diag-body" />
          <circle cx="222" cy="79" r="13" className="diag-head" />
          <path d="M276 41 L269 57 M282 43 L275 59" className="diag-arrow" />
          <circle cx="271" cy="60" r="4" className="diag-hit" />
          <text x="196" y="114" className="diag-cap">双指按乳头连线下方 4cm</text>
        </svg>
      </figure>
    );
  }

  if (diagramId === 'scald') {
    return (
      <figure className="posture-diagram" aria-label="烫伤冲脱泡盖送流程图">
        <svg viewBox="0 0 360 112" role="img" aria-label="流动冷水冲洗20分钟、剪衣、保护盖送">
          <rect x="6" y="8" width="108" height="96" rx="10" className="diag-panel" />
          <text x="16" y="28" className="diag-title">1. 冲 20 分钟</text>
          <path d="M58 40 C50 54 46 66 58 70 C70 66 66 54 58 40 Z" className="diag-blue-fill" />
          <text x="16" y="92" className="diag-cap">15–20℃ 流动凉水</text>

          <rect x="126" y="8" width="108" height="96" rx="10" className="diag-panel" />
          <text x="136" y="28" className="diag-title">2. 水下剪除</text>
          <circle cx="180" cy="58" r="14" className="diag-hit-ring" />
          <path d="M168 48 L192 68 M192 48 L168 68" className="diag-arrow" />
          <text x="136" y="92" className="diag-cap">粘连皮肤勿硬撕</text>

          <rect x="246" y="8" width="108" height="96" rx="10" className="diag-panel" />
          <text x="256" y="28" className="diag-title">3. 盖送禁偏方</text>
          <rect x="274" y="42" width="52" height="28" rx="6" className="diag-body" />
          <text x="256" y="92" className="diag-cap">保鲜膜/纱布覆盖</text>
        </svg>
      </figure>
    );
  }

  if (diagramId === 'seizure') {
    return (
      <figure className="posture-diagram" aria-label="高热惊厥侧卧恢复体位图">
        <svg viewBox="0 0 360 112" role="img" aria-label="平放侧卧位让分泌物顺嘴角流出">
          <rect x="6" y="8" width="348" height="96" rx="10" className="diag-panel" />
          <text x="18" y="28" className="diag-title">稳定侧卧位：防呕吐物与口水倒流误吸</text>
          <line x1="28" y1="80" x2="210" y2="80" className="diag-arm" />
          <ellipse cx="132" cy="64" rx="46" ry="15" className="diag-body" />
          <circle cx="72" cy="64" r="15" className="diag-head" />
          <path d="M62 72 Q56 80 58 88" className="diag-arrow" />
          <text x="228" y="54" className="diag-cap">✓ 解开领口、录视频计时</text>
          <text x="228" y="72" className="diag-cap">✗ 禁塞筷子毛巾/禁按住肢体</text>
          <text x="228" y="90" className="diag-cap">⚠ 满 5 分钟抽搐立即打 120</text>
        </svg>
      </figure>
    );
  }

  if (diagramId === 'airplane_hold') {
    return (
      <figure className="posture-diagram" aria-label="婴儿飞机抱安全受力点示意图">
        <svg viewBox="0 0 360 116" role="img" aria-label="前臂托稳胸腹、脸朝外露出口鼻、另一手护背">
          <rect x="6" y="8" width="348" height="100" rx="10" className="diag-panel" />
          <text x="18" y="28" className="diag-title">前臂温热轻托腹部 · 露出口鼻畅通呼吸</text>
          <path d="M40 76 L210 72" className="diag-arm" />
          <ellipse cx="122" cy="60" rx="44" ry="16" className="diag-body" />
          <circle cx="64" cy="58" r="15" className="diag-head" />
          <circle cx="114" cy="66" r="5" className="diag-hit" />
          <text x="224" y="52" className="diag-cap">① 小脸向外露口鼻，不顶气管</text>
          <text x="224" y="70" className="diag-cap">② 大手稳兜胯部，另一手护背</text>
          <text x="224" y="88" className="diag-cap">③ 吃奶刚结束先拍嗝再尝试</text>
        </svg>
      </figure>
    );
  }

  if (diagramId === 'burping') {
    return (
      <figure className="posture-diagram" aria-label="科学拍嗝双姿势对比图">
        <svg viewBox="0 0 360 116" role="img" aria-label="肩抱空心掌拍背与大腿坐姿护颌拍背">
          <rect x="6" y="8" width="168" height="100" rx="10" className="diag-panel" />
          <text x="18" y="28" className="diag-title">肩抱竖拍（新生儿首选）</text>
          <rect x="52" y="42" width="24" height="44" rx="10" className="diag-body" />
          <circle cx="64" cy="36" r="10" className="diag-head" />
          <path d="M100 66 Q86 60 80 56" className="diag-arrow" />
          <text x="18" y="96" className="diag-cap">下巴垫肩上，空心掌由下轻拍</text>

          <rect x="186" y="8" width="168" height="100" rx="10" className="diag-panel" />
          <text x="198" y="28" className="diag-title">大腿坐式（方便观察溢奶）</text>
          <ellipse cx="256" cy="66" rx="14" ry="22" transform="rotate(14 256 66)" className="diag-body" />
          <circle cx="264" cy="40" r="10" className="diag-head" />
          <text x="198" y="96" className="diag-cap">虎口护颌前倾，切勿掐住脖子</text>
        </svg>
      </figure>
    );
  }

  return (
    <figure className="posture-diagram" aria-label="安全睡眠 ABC 黄金准则示意图">
      <svg viewBox="0 0 360 114" role="img" aria-label="独自仰卧于无杂物硬床垫婴儿床">
        <rect x="6" y="8" width="348" height="98" rx="10" className="diag-panel" />
        <text x="18" y="28" className="diag-title">安全睡眠 ABC：Alone 独立 · Back 仰卧 · Crib 空床</text>
        <rect x="24" y="42" width="142" height="50" rx="8" className="diag-body" />
        <circle cx="60" cy="67" r="10" className="diag-head" />
        <rect x="74" y="56" width="56" height="22" rx="8" className="diag-blue-fill" />
        <text x="184" y="54" className="diag-cap">✓ 紧绷床笠 + 分腿睡袋即可</text>
        <text x="184" y="72" className="diag-cap">✗ 清空枕头、床围、厚被与玩偶</text>
        <text x="184" y="90" className="diag-cap">✓ 室温 20–24℃，不戴帽不过热</text>
      </svg>
    </figure>
  );
}

import type { AppState } from './types';
import { BIRTH_MODE_LABELS, PARITY_LABELS } from './profile';
import {
  AMNIOTIC_FLUID_LABELS,
  CLINICAL_EVENT_LABELS,
  sortEventsAsc,
} from './timeline';
import { formatTimeOfDay } from './contractions';

export interface KeepsakeMilestone {
  id: string;
  timeText: string;
  label: string;
  detail?: string;
  highlight?: boolean;
}

export interface BirthKeepsakeData {
  title: string;
  subtitle: string;
  profileSummary: string;
  generatedAtText: string;
  totalContractions: number;
  bornTimeText?: string;
  milestones: KeepsakeMilestone[];
}

export function buildBirthKeepsakeData(state: AppState, now: number): BirthKeepsakeData {
  const ascEvents = sortEventsAsc(state.events);
  const milestones: KeepsakeMilestone[] = ascEvents.map((ev) => {
    let detail = ev.detail;
    if (ev.type === 'water_broke' && ev.meta?.fluidStatus) {
      const fluidText = AMNIOTIC_FLUID_LABELS[ev.meta.fluidStatus];
      detail = detail ? `${fluidText} · ${detail}` : fluidText;
    } else if (ev.type === 'cervix_check' && typeof ev.meta?.dilationCm === 'number') {
      const cmText = `宫口 ${ev.meta.dilationCm} 公分`;
      detail = detail ? `${cmText} · ${detail}` : cmText;
    }

    return {
      id: ev.id,
      timeText: formatTimeOfDay(ev.at),
      label: CLINICAL_EVENT_LABELS[ev.type],
      detail,
      highlight: ev.type === 'baby_born' || ev.type === 'admitted',
    };
  });

  const bornMilestone = milestones.find((m) => m.label === CLINICAL_EVENT_LABELS.baby_born);

  return {
    title: bornMilestone ? '迎新纪念时间轴' : '产程陪产记录卡',
    subtitle: '护航 · 零思考产房副驾驶',
    profileSummary: `${PARITY_LABELS[state.profile.parity]} · ${BIRTH_MODE_LABELS[state.profile.birthMode]}`,
    generatedAtText: `生成于 ${formatTimeOfDay(now)}`,
    totalContractions: state.contractions.length,
    bornTimeText: bornMilestone?.timeText,
    milestones,
  };
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return `${cut}…`;
}

/**
 * 纯离线在浏览器端渲染迎新时间轴纪念 PNG（零外部字体或网络依赖）。
 */
export function renderBirthKeepsakePng(data: BirthKeepsakeData): Promise<Blob | null> {
  if (typeof document === 'undefined') return Promise.resolve(null);

  const width = 760;
  const visibleMilestones = data.milestones.slice(0, 12);
  const rowHeight = 76;
  const height = Math.max(680, 380 + visibleMilestones.length * rowHeight);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve(null);

  const fontStack =
    '-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';

  // Warm parchment backdrop
  ctx.fillStyle = '#faf6ee';
  ctx.fillRect(0, 0, width, height);

  // Subtle top accent band
  ctx.fillStyle = '#1d2d44';
  ctx.fillRect(0, 0, width, 188);

  // Header metadata
  ctx.fillStyle = '#d4a373';
  ctx.font = `700 20px ${fontStack}`;
  ctx.fillText(data.subtitle, 48, 56);

  ctx.fillStyle = '#ffffff';
  ctx.font = `800 40px ${fontStack}`;
  ctx.fillText(data.title, 48, 112);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = `600 21px ${fontStack}`;
  ctx.fillText(`${data.profileSummary} · 累计记录 ${data.totalContractions} 次宫缩`, 48, 152);

  // Milestones timeline
  const timelineX = 88;
  let y = 248;

  if (visibleMilestones.length === 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = `600 24px ${fontStack}`;
    ctx.fillText('暂未记录关键时间节点，陪产过程中点击上方事件打点即可生成。', 48, y + 30);
  } else {
    // Vertical spine
    if (visibleMilestones.length > 1) {
      ctx.strokeStyle = '#d6cfc2';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(timelineX, y + 10);
      ctx.lineTo(timelineX, y + (visibleMilestones.length - 1) * rowHeight + 10);
      ctx.stroke();
    }

    for (const item of visibleMilestones) {
      // Dot
      ctx.beginPath();
      ctx.arc(timelineX, y + 10, item.highlight ? 11 : 8, 0, Math.PI * 2);
      ctx.fillStyle = item.highlight ? '#c2410c' : '#2563eb';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#faf6ee';
      ctx.stroke();

      // Time & Title
      ctx.fillStyle = '#1e293b';
      ctx.font = `800 26px ${fontStack}`;
      ctx.fillText(`${item.timeText}   ${item.label}`, timelineX + 34, y + 19);

      if (item.detail) {
        ctx.fillStyle = '#475569';
        ctx.font = `500 20px ${fontStack}`;
        ctx.fillText(fitText(ctx, item.detail, width - (timelineX + 80)), timelineX + 34, y + 49);
      }

      y += rowHeight;
    }
  }

  // Footer
  ctx.strokeStyle = '#e2dccf';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(48, height - 86);
  ctx.lineTo(width - 48, height - 86);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = `500 18px ${fontStack}`;
  ctx.fillText(`${data.generatedAtText} · 数据仅保存在本机浏览器，不上传任何服务器`, 48, height - 44);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

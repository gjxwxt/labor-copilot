import type {
  AmnioticFluidStatus,
  AppState,
  ClinicalEvent,
  ClinicalEventMeta,
  ClinicalEventType,
} from './types';
import { formatElapsedBrief, formatSecondsCompact, formatTimeOfDay } from './contractions';
import type { HandoverSummary } from './handover';

export const CLINICAL_EVENT_LABELS: Record<ClinicalEventType, string> = {
  admitted: '办理入院',
  water_broke: '破水',
  epidural_placed: '已打无痛',
  cervix_check: '内检开指',
  baby_born: '宝宝出生',
  note: '陪产备注',
};

export const AMNIOTIC_FLUID_LABELS: Record<AmnioticFluidStatus, string> = {
  clear: '清亮（正常）',
  meconium: '黄绿 / 浑浊（需马上告知）',
  bloody: '明显带血（需马上告知）',
  unknown: '暂未看清',
};

export function createClinicalEvent(
  id: string,
  type: ClinicalEventType,
  at: number,
  detail?: string,
  meta?: ClinicalEventMeta,
): ClinicalEvent {
  return {
    id,
    type,
    at,
    ...(detail ? { detail } : {}),
    ...(meta ? { meta } : {}),
  };
}

export function sortEventsDesc(events: ClinicalEvent[]): ClinicalEvent[] {
  return events.slice().sort((a, b) => b.at - a.at);
}

export function sortEventsAsc(events: ClinicalEvent[]): ClinicalEvent[] {
  return events.slice().sort((a, b) => a.at - b.at);
}

export function getLatestEventByType(
  events: ClinicalEvent[],
  type: ClinicalEventType,
): ClinicalEvent | null {
  const matched = events.filter((e) => e.type === type);
  if (matched.length === 0) return null;
  return matched.reduce((latest, cur) => (cur.at >= latest.at ? cur : latest));
}

export function formatEventSummaryLine(event: ClinicalEvent): string {
  const timeStr = formatTimeOfDay(event.at);
  const label = CLINICAL_EVENT_LABELS[event.type];
  if (event.type === 'water_broke' && event.meta?.fluidStatus) {
    return `${timeStr} · ${label}（${AMNIOTIC_FLUID_LABELS[event.meta.fluidStatus]}）${
      event.detail ? ` - ${event.detail}` : ''
    }`;
  }
  if (event.type === 'cervix_check' && typeof event.meta?.dilationCm === 'number') {
    return `${timeStr} · ${label}：${event.meta.dilationCm} 公分${
      event.detail ? `（${event.detail}）` : ''
    }`;
  }
  return `${timeStr} · ${label}${event.detail ? `：${event.detail}` : ''}`;
}

export function exportHandoverMarkdown(
  summary: HandoverSummary,
  state: AppState,
  now: number,
): string {
  const lines: string[] = [
    `# 产程交接与陪产时间线战报`,
    ``,
    `- **生成时间**：${formatTimeOfDay(now)}`,
    `- **当前阶段**：${summary.currentStageName}`,
    `- **基础画像**：${summary.profileSummary}`,
    `- **风险关注**：${summary.riskAlerts.length > 0 ? summary.riskAlerts.map((r) => r.label).join('、') : '无特殊标记'}`,
    ``,
    `## 核心临床快照`,
    `- **破水状态**：${
      summary.waterStatus.broken && summary.waterStatus.at
        ? `已破水（${formatTimeOfDay(summary.waterStatus.at)} · ${formatElapsedBrief(now - summary.waterStatus.at)} · 羊水：${
            AMNIOTIC_FLUID_LABELS[summary.waterStatus.fluidStatus ?? 'unknown']
          }）`
        : '暂未记录破水'
    }`,
    `- **最近 1 小时宫缩**：${summary.contractionStats.recent1hCount} 次，平均间隔 ${
      summary.contractionStats.recent1hAvgIntervalMin !== null
        ? `${summary.contractionStats.recent1hAvgIntervalMin} 分钟`
        : '—'
    }，平均持续 ${formatSecondsCompact(summary.contractionStats.recent1hAvgDurationSec)}`,
    `- **最近内检**：${
      summary.cervixStatus.at
        ? `${typeof summary.cervixStatus.dilationCm === 'number' ? `${summary.cervixStatus.dilationCm} 公分` : '已记录'}（${formatTimeOfDay(summary.cervixStatus.at)}）`
        : '暂未记录'
    }`,
    `- **无痛镇痛**：${
      summary.epiduralStatus.placed && summary.epiduralStatus.at
        ? `已实施（${formatTimeOfDay(summary.epiduralStatus.at)}）`
        : summary.epiduralStatus.intentLabel
    }`,
    ``,
    `## 关键时间节点`,
  ];

  const ascEvents = sortEventsAsc(state.events);
  if (ascEvents.length === 0) {
    lines.push(`- 暂无打点记录`);
  } else {
    for (const ev of ascEvents) {
      lines.push(`- ${formatEventSummaryLine(ev)}`);
    }
  }

  lines.push('');
  lines.push('> 注：以上数据由陪产助手本地记录，仅供医护交接参考，临床决策以院内检查为准。');
  return lines.join('\n');
}

export function exportStateJson(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

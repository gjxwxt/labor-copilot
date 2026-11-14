import type { BirthProfile, ContractionIntensity, ContractionRecord } from './types';

export interface ContractionStats {
  completedCount: number;
  runningRecord: ContractionRecord | null;
  runningDurationSec: number | null;
  lastDurationSec: number | null;
  lastIntervalSec: number | null;
  recent1hCount: number;
  recent1hAvgIntervalMin: number | null;
  recent1hAvgDurationSec: number | null;
  recent10mCount: number;
}

export type LaborEvaluationLevel =
  | 'idle'
  | 'observing'
  | 'approaching'
  | 'go'
  | 'urgent_alert';

export type LaborEvaluationReason =
  | 'none'
  | 'prolonged_contraction'
  | 'tachysystole'
  | 'csection_labor_onset'
  | 'rule_511_met'
  | 'multiparous_regular_met'
  | 'regular_building_span'
  | 'short_frequent'
  | 'irregular_observing';

export interface LaborEvaluation {
  level: LaborEvaluationLevel;
  reason: LaborEvaluationReason;
  headline: string;
  detail: string;
  clusterCount: number;
  clusterAvgGapMin: number | null;
  clusterAvgDurSec: number | null;
  clusterSpanMin: number | null;
}

const PROLONGED_CONTRACTION_SEC = 120;
const TACHYSYSTOLE_10M_THRESHOLD = 6; // > 5 contractions in 10 minutes
const CLUSTER_MAX_GAP_MIN = 6.5;

export function getCompletedContractions(records: ContractionRecord[]): ContractionRecord[] {
  return records
    .filter((r) => typeof r.endedAt === 'number' && r.endedAt >= r.startedAt)
    .slice()
    .sort((a, b) => a.startedAt - b.startedAt);
}

export function getRunningContraction(records: ContractionRecord[]): ContractionRecord | null {
  const running = records.filter((r) => r.endedAt === undefined);
  if (running.length === 0) return null;
  return running[running.length - 1] ?? null;
}

export function startContraction(
  records: ContractionRecord[],
  startedAt: number,
  id: string,
): ContractionRecord[] {
  const hasRunning = records.some((r) => r.endedAt === undefined);
  if (hasRunning) return records;
  return [...records, { id, startedAt }];
}

export function stopContraction(
  records: ContractionRecord[],
  endedAt: number,
  intensity?: ContractionIntensity,
): ContractionRecord[] {
  const idx = records.findIndex((r) => r.endedAt === undefined);
  if (idx < 0) return records;
  const target = records[idx]!;
  const safeEnd = Math.max(target.startedAt + 1000, endedAt);
  const updated: ContractionRecord = {
    ...target,
    endedAt: safeEnd,
    ...(intensity ? { intensity } : {}),
  };
  return [...records.slice(0, idx), updated, ...records.slice(idx + 1)];
}

export function updateContractionIntensity(
  records: ContractionRecord[],
  id: string,
  intensity: ContractionIntensity,
): ContractionRecord[] {
  return records.map((r) => (r.id === id ? { ...r, intensity } : r));
}

export function removeContraction(records: ContractionRecord[], id: string): ContractionRecord[] {
  return records.filter((r) => r.id !== id);
}

export function computeContractionStats(
  records: ContractionRecord[],
  now: number,
): ContractionStats {
  const completed = getCompletedContractions(records);
  const runningRecord = getRunningContraction(records);
  const runningDurationSec = runningRecord
    ? Math.max(0, Math.floor((now - runningRecord.startedAt) / 1000))
    : null;

  const last = completed.length > 0 ? completed[completed.length - 1]! : null;
  const prev = completed.length > 1 ? completed[completed.length - 2]! : null;

  const lastDurationSec =
    last && last.endedAt !== undefined
      ? Math.max(0, Math.round((last.endedAt - last.startedAt) / 1000))
      : null;

  const lastIntervalSec =
    last && prev ? Math.max(0, Math.round((last.startedAt - prev.startedAt) / 1000)) : null;

  const oneHourAgo = now - 60 * 60 * 1000;
  const recent1h = completed.filter((r) => r.startedAt >= oneHourAgo);

  let recent1hAvgDurationSec: number | null = null;
  if (recent1h.length > 0) {
    const totalDurMs = recent1h.reduce(
      (sum, r) => sum + Math.max(0, (r.endedAt ?? r.startedAt) - r.startedAt),
      0,
    );
    recent1hAvgDurationSec = Math.round(totalDurMs / recent1h.length / 1000);
  }

  let recent1hAvgIntervalMin: number | null = null;
  if (recent1h.length >= 2) {
    let totalGapMs = 0;
    for (let i = 1; i < recent1h.length; i += 1) {
      totalGapMs += recent1h[i]!.startedAt - recent1h[i - 1]!.startedAt;
    }
    recent1hAvgIntervalMin = Number((totalGapMs / (recent1h.length - 1) / 60000).toFixed(1));
  }

  const tenMinAgo = now - 10 * 60 * 1000;
  const recent10mCount = records.filter((r) => r.startedAt >= tenMinAgo).length;

  return {
    completedCount: completed.length,
    runningRecord,
    runningDurationSec,
    lastDurationSec,
    lastIntervalSec,
    recent1hCount: recent1h.length,
    recent1hAvgIntervalMin,
    recent1hAvgDurationSec,
    recent10mCount,
  };
}

export function evaluateLaborRule(
  records: ContractionRecord[],
  profile: BirthProfile,
  now: number,
): LaborEvaluation {
  const stats = computeContractionStats(records, now);
  const completed = getCompletedContractions(records);

  // 1. Safety check: prolonged single contraction >= 120s (running or just completed)
  const activeProlonged =
    stats.runningDurationSec !== null && stats.runningDurationSec >= PROLONGED_CONTRACTION_SEC;
  const lastProlonged =
    stats.lastDurationSec !== null &&
    stats.lastDurationSec >= PROLONGED_CONTRACTION_SEC &&
    completed.length > 0 &&
    now - (completed[completed.length - 1]!.endedAt ?? now) <= 15 * 60 * 1000;

  if (activeProlonged || lastProlonged) {
    return {
      level: 'urgent_alert',
      reason: 'prolonged_contraction',
      headline: '单次宫缩持续 ≥ 2 分钟，请立刻通知医护',
      detail:
        '正常宫缩多在 30–70 秒左右。若持续发硬超过 2 分钟不缓解，需立刻让助产士/医生评估胎心与子宫张力（尤其催产或 VBAC 试产期间）。',
      clusterCount: stats.recent1hCount,
      clusterAvgGapMin: stats.recent1hAvgIntervalMin,
      clusterAvgDurSec: stats.recent1hAvgDurationSec,
      clusterSpanMin: null,
    };
  }

  // 2. Safety check: tachysystole (>5 contractions in 10 minutes)
  if (stats.recent10mCount >= TACHYSYSTOLE_10M_THRESHOLD) {
    return {
      level: 'urgent_alert',
      reason: 'tachysystole',
      headline: `近 10 分钟已达 ${stats.recent10mCount} 次宫缩（过频）`,
      detail:
        '10 分钟内超过 5 次宫缩属于宫缩过频，可能影响宝宝血氧恢复。请立即按铃请护士评估（若正在滴注催产素，医护通常会下调速度）。',
      clusterCount: stats.recent10mCount,
      clusterAvgGapMin: stats.recent1hAvgIntervalMin,
      clusterAvgDurSec: stats.recent1hAvgDurationSec,
      clusterSpanMin: 10,
    };
  }

  if (completed.length < 2) {
    return {
      level: completed.length === 0 && !stats.runningRecord ? 'idle' : 'observing',
      reason: completed.length === 0 && !stats.runningRecord ? 'none' : 'irregular_observing',
      headline:
        completed.length === 0
          ? '尚未形成规律趋势，继续按真实痛感记录'
          : '已记录第 1 次宫缩，继续记录以判断间隔规律',
      detail:
        profile.parity === 'multiparous'
          ? '经产妇产程进展通常更快：当间隔稳定到 5–7 分钟内且越来越强时，请提前准备入院或通知护士。'
          : '初产妇通用参考 5-1-1 法则：间隔 ≤ 5 分钟、每次 ≥ 40–60 秒、持续约 1 小时。',
      clusterCount: completed.length,
      clusterAvgGapMin: null,
      clusterAvgDurSec: stats.lastDurationSec,
      clusterSpanMin: null,
    };
  }

  // Build contiguous recent regular cluster walking backward while gaps stay <= CLUSTER_MAX_GAP_MIN
  const latest = completed[completed.length - 1]!;
  // If the latest contraction ended over 30 min ago, the previous cluster has subsided
  if (now - latest.startedAt > 30 * 60 * 1000) {
    return {
      level: 'observing',
      reason: 'irregular_observing',
      headline: '距离上次宫缩已超过 30 分钟，暂未进入规律连续期',
      detail: '如果宫缩重新变密，系统会按新的一轮连续节奏重新计算。',
      clusterCount: 1,
      clusterAvgGapMin: null,
      clusterAvgDurSec: stats.lastDurationSec,
      clusterSpanMin: 0,
    };
  }

  const cluster: ContractionRecord[] = [latest];
  for (let i = completed.length - 1; i >= 1; i -= 1) {
    const gapMin = (completed[i]!.startedAt - completed[i - 1]!.startedAt) / 60000;
    if (gapMin > CLUSTER_MAX_GAP_MIN) break;
    cluster.unshift(completed[i - 1]!);
  }

  if (cluster.length < 3) {
    return {
      level: 'observing',
      reason: 'irregular_observing',
      headline: '目前记录较少或间隔尚不规律，继续观察',
      detail: '至少需要连续 3 次以上间隔相近的宫缩才能稳定判读规律性。',
      clusterCount: cluster.length,
      clusterAvgGapMin: stats.lastIntervalSec ? Number((stats.lastIntervalSec / 60).toFixed(1)) : null,
      clusterAvgDurSec: stats.lastDurationSec,
      clusterSpanMin:
        cluster.length >= 2
          ? Math.round((cluster[cluster.length - 1]!.startedAt - cluster[0]!.startedAt) / 60000)
          : 0,
    };
  }

  let sumGapMs = 0;
  for (let i = 1; i < cluster.length; i += 1) {
    sumGapMs += cluster[i]!.startedAt - cluster[i - 1]!.startedAt;
  }
  const avgGapMin = Number((sumGapMs / (cluster.length - 1) / 60000).toFixed(1));

  const sumDurMs = cluster.reduce(
    (acc, r) => acc + Math.max(0, (r.endedAt ?? r.startedAt) - r.startedAt),
    0,
  );
  const avgDurSec = Math.round(sumDurMs / cluster.length / 1000);
  const spanMin = Math.round((cluster[cluster.length - 1]!.startedAt - cluster[0]!.startedAt) / 60000);

  // Planned C-section with onset of regular contractions
  if (profile.birthMode === 'planned_csection' && avgGapMin <= 6 && avgDurSec >= 35) {
    return {
      level: 'go',
      reason: 'csection_labor_onset',
      headline: `择期剖宫产前出现规律宫缩（约 ${avgGapMin} 分钟一次）`,
      detail: '请联系产科医生或直接前往医院评估，告知已预约择期剖宫产并开始保持禁食禁水。',
      clusterCount: cluster.length,
      clusterAvgGapMin: avgGapMin,
      clusterAvgDurSec: avgDurSec,
      clusterSpanMin: spanMin,
    };
  }

  const isMultiparous = profile.parity === 'multiparous';
  const targetGapMin = isMultiparous ? 6.0 : 5.2;
  const targetDurSec = 40;
  const targetSpanMin = isMultiparous ? 30 : 60;

  const gapOk = avgGapMin <= targetGapMin;
  const durOk = avgDurSec >= targetDurSec;
  const spanOk = spanMin >= targetSpanMin;

  if (gapOk && durOk && spanOk) {
    return {
      level: 'go',
      reason: isMultiparous ? 'multiparous_regular_met' : 'rule_511_met',
      headline: isMultiparous
        ? `经产妇规律临产信号已到：间隔 ${avgGapMin} 分、每次 ${avgDurSec} 秒`
        : `已达 5-1-1 规律宫缩：间隔 ${avgGapMin} 分、每次 ${avgDurSec} 秒`,
      detail: isMultiparous
        ? `连续已持续 ${spanMin} 分钟。二胎/经产产程往往更快，建议立即通知护士或启程前往医院。`
        : `连续已稳定 ${spanMin} 分钟（≥ 60 分钟）。若在家请启程去医院；若已在病房，请通知护士内检评估进待产室。`,
      clusterCount: cluster.length,
      clusterAvgGapMin: avgGapMin,
      clusterAvgDurSec: avgDurSec,
      clusterSpanMin: spanMin,
    };
  }

  if (gapOk && durOk && !spanOk) {
    const remainingMin = Math.max(1, Math.ceil(targetSpanMin - spanMin));
    return {
      level: 'approaching',
      reason: 'regular_building_span',
      headline: `节奏接近达标：间隔 ${avgGapMin} 分、每次 ${avgDurSec} 秒`,
      detail: `当前已持续 ${spanMin} 分钟，还差约 ${remainingMin} 分钟满 ${targetSpanMin} 分钟。先准备好随身证件袋，继续记录。`,
      clusterCount: cluster.length,
      clusterAvgGapMin: avgGapMin,
      clusterAvgDurSec: avgDurSec,
      clusterSpanMin: spanMin,
    };
  }

  if (gapOk && !durOk) {
    return {
      level: 'approaching',
      reason: 'short_frequent',
      headline: `间隔已密（${avgGapMin} 分），但每次仅 ${avgDurSec} 秒（偏短）`,
      detail: '可能是假性宫缩或潜伏期初期。让产妇换侧躺、补水休息，观察强度和时长是否继续爬升。',
      clusterCount: cluster.length,
      clusterAvgGapMin: avgGapMin,
      clusterAvgDurSec: avgDurSec,
      clusterSpanMin: spanMin,
    };
  }

  return {
    level: 'observing',
    reason: 'irregular_observing',
    headline: `当前平均间隔 ${avgGapMin} 分钟、每次 ${avgDurSec} 秒`,
    detail: '仍在潜伏观察区间，无需焦虑频繁内检，陪她调整呼吸、定时排尿保存体力。',
    clusterCount: cluster.length,
    clusterAvgGapMin: avgGapMin,
    clusterAvgDurSec: avgDurSec,
    clusterSpanMin: spanMin,
  };
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function formatClockDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`;
}

export function formatSecondsCompact(sec: number | null): string {
  if (sec === null) return '—';
  const safe = Math.max(0, Math.round(sec));
  if (safe >= 60) {
    const mins = Math.floor(safe / 60);
    const rem = safe % 60;
    return `${mins}分${pad2(rem)}秒`;
  }
  return `${safe}秒`;
}

export function formatTimeOfDay(ms: number): string {
  const d = new Date(ms);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatElapsedBrief(ms: number): string {
  const mins = Math.max(0, Math.floor(ms / 60000));
  if (mins < 60) return `${mins} 分钟前`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} 小时 ${m} 分前` : `${h} 小时前`;
}

import type {
  BirthProfile,
  ContractionIntensity,
  ContractionRecord,
} from '../../domain/types';
import {
  computeContractionStats,
  evaluateLaborRule,
  formatClockDuration,
  getCompletedContractions,
} from '../../domain/contractions';

interface ContractionBarProps {
  profile: BirthProfile;
  records: ContractionRecord[];
  now: number;
  compactForMom: boolean;
  onStart: () => void;
  onStop: () => void;
  onSetIntensity: (id: string, intensity: ContractionIntensity) => void;
  onOpenDrawer: () => void;
}

const INTENSITY_TAGS: Array<{ level: ContractionIntensity; label: string }> = [
  { level: 1, label: '轻' },
  { level: 2, label: '中' },
  { level: 3, label: '强' },
];

export function ContractionBar({
  profile,
  records,
  now,
  compactForMom,
  onStart,
  onStop,
  onSetIntensity,
  onOpenDrawer,
}: ContractionBarProps) {
  const stats = computeContractionStats(records, now);
  const evaluation = evaluateLaborRule(records, profile, now);
  const completed = getCompletedContractions(records);
  const running = stats.runningRecord;
  const latest = completed.length > 0 ? completed[completed.length - 1]! : null;

  // Hide idle bar in calm Mom breathing view so the halo fills the viewport cleanly
  if (compactForMom && !running) {
    return null;
  }

  // Offer quick 1-tap intensity tagging right after stopping without navigating away
  const showQuickIntensity =
    !compactForMom &&
    !running &&
    latest &&
    latest.endedAt &&
    now - latest.endedAt <= 20_000 &&
    !latest.intensity;

  const summaryBadge =
    evaluation.level === 'urgent_alert'
      ? '需立刻按铃'
      : evaluation.level === 'go'
        ? '已达参考指征'
        : stats.recent1hCount > 0
          ? `近1h ${stats.recent1hCount}次 · ${stats.recent1hAvgIntervalMin ?? '—'}分`
          : `记录 ${completed.length} 条`;

  return (
    <div className="ct-floating-dock" role="region" aria-label="快捷宫缩计时条">
      {showQuickIntensity && latest ? (
        <div className="ct-quick-intensity">
          <span>刚才这波痛感：</span>
          <div className="ct-quick-intensity-btns">
            {INTENSITY_TAGS.map((t) => (
              <button
                key={t.level}
                type="button"
                className="ct-qi-btn"
                onClick={() => onSetIntensity(latest.id, t.level)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="ct-dock-row">
        <button
          type="button"
          className={`ct-dock-main${running ? ' running' : ''}`}
          onClick={running ? onStop : onStart}
        >
          <span className="ct-dock-dot" aria-hidden="true" />
          <span className="ct-dock-label">
            {running
              ? `宫缩中 ${formatClockDuration(now - running.startedAt)} · 点此结束`
              : '阵痛来了 · 开始计时'}
          </span>
        </button>

        <button
          type="button"
          className={`ct-dock-stats level-${evaluation.level}`}
          onClick={onOpenDrawer}
          aria-label="打开完整宫缩趋势与历史记录"
        >
          <span>{summaryBadge}</span>
          <span aria-hidden="true">统计 ▾</span>
        </button>
      </div>
    </div>
  );
}

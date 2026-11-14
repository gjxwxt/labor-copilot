import { useState } from 'react';
import type {
  BirthProfile,
  ContractionIntensity,
  ContractionRecord,
} from '../../domain/types';
import {
  computeContractionStats,
  evaluateLaborRule,
  formatClockDuration,
  formatSecondsCompact,
  formatTimeOfDay,
  getCompletedContractions,
} from '../../domain/contractions';

interface ContractionsViewProps {
  profile: BirthProfile;
  records: ContractionRecord[];
  now: number;
  onStart: () => void;
  onStop: () => void;
  onSetIntensity: (id: string, intensity: ContractionIntensity) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

const INTENSITY_LABELS: Record<ContractionIntensity, string> = {
  1: '轻度',
  2: '中度',
  3: '强烈',
};

export function ContractionsView({
  profile,
  records,
  now,
  onStart,
  onStop,
  onSetIntensity,
  onRemove,
  onClearAll,
}: ContractionsViewProps) {
  const [confirmClear, setConfirmClear] = useState(false);

  const stats = computeContractionStats(records, now);
  const evaluation = evaluateLaborRule(records, profile, now);
  const completed = getCompletedContractions(records);
  const running = stats.runningRecord;
  const latestCompleted = completed.length > 0 ? completed[completed.length - 1]! : null;
  const recentReversed = completed.slice(-10).reverse();

  return (
    <div className="view-wrap">
      <section className="card" aria-labelledby="ct-main-title">
        <div className="ct-clock-wrap">
          <div className="ct-clock-label" id="ct-main-title">
            {running ? '正在记录本次宫缩' : '单手宫缩计时'}
          </div>
          <div className={`ct-clock-value${running ? ' running' : ''}`}>
            {running ? formatClockDuration(now - running.startedAt) : '00:00'}
          </div>
        </div>

        <button
          type="button"
          className={`big-ct-btn ${running ? 'stop' : 'start'}`}
          onClick={running ? onStop : onStart}
        >
          {running ? '宫缩结束（点击停止）' : '宫缩开始（点击计时）'}
        </button>

        {!running && latestCompleted ? (
          <div className="intensity-row" role="group" aria-label="补充上一次宫缩痛感">
            <span style={{ fontSize: 12, color: 'var(--fg-subtle)', fontWeight: 700 }}>
              刚才强度:
            </span>
            {([1, 2, 3] as ContractionIntensity[]).map((lvl) => (
              <button
                key={lvl}
                type="button"
                className={`intensity-chip${latestCompleted.intensity === lvl ? ' active' : ''}`}
                onClick={() => onSetIntensity(latestCompleted.id, lvl)}
              >
                {INTENSITY_LABELS[lvl]}
              </button>
            ))}
          </div>
        ) : null}

        <div className="stats-grid">
          <div className="stat-cell">
            <div className="stat-val">{formatSecondsCompact(stats.lastIntervalSec)}</div>
            <div className="stat-key">最近间隔（开始到开始）</div>
          </div>
          <div className="stat-cell">
            <div className="stat-val">{formatSecondsCompact(stats.lastDurationSec)}</div>
            <div className="stat-key">上次持续时长</div>
          </div>
          <div className="stat-cell">
            <div className="stat-val">{stats.recent1hCount} 次</div>
            <div className="stat-key">近 1 小时总次数</div>
          </div>
          <div className="stat-cell">
            <div className="stat-val">
              {stats.recent1hAvgIntervalMin !== null
                ? `${stats.recent1hAvgIntervalMin} 分 / ${formatSecondsCompact(
                    stats.recent1hAvgDurationSec,
                  )}`
                : '—'}
            </div>
            <div className="stat-key">近 1 小时均值（间隔/持续）</div>
          </div>
        </div>

        <div className={`verdict-box ${evaluation.level}`} aria-live="polite">
          <div className="verdict-title">{evaluation.headline}</div>
          <div className="verdict-detail">{evaluation.detail}</div>
        </div>

        <p style={{ marginTop: 10, fontSize: 12.5, color: 'var(--fg-subtle)' }}>
          提示：按她真实的「开始疼/发紧」和「完全退去」点击；即使退到后台，计时时间戳也不会丢。
        </p>
      </section>

      <section className="card" aria-labelledby="ct-history-title">
        <div className="eyebrow" id="ct-history-title">
          <span>最近宫缩记录（共 {completed.length} 次）</span>
          {latestCompleted && !running ? (
            <button
              type="button"
              className="mini-del-btn"
              onClick={() => onRemove(latestCompleted.id)}
            >
              撤销上条
            </button>
          ) : null}
        </div>

        {recentReversed.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--fg-muted)' }}>
            还没有完成的宫缩记录。点击上方红色大按钮开始第一次计时。
          </p>
        ) : (
          <ul className="ct-history-list">
            {recentReversed.map((item, idx) => {
              const ascIdx = completed.length - 1 - idx;
              const prev = ascIdx > 0 ? completed[ascIdx - 1] : null;
              const gapSec = prev
                ? Math.round((item.startedAt - prev.startedAt) / 1000)
                : null;
              const durSec = Math.round(((item.endedAt ?? item.startedAt) - item.startedAt) / 1000);
              return (
                <li key={item.id} className="ct-history-item">
                  <span>
                    {formatTimeOfDay(item.startedAt)} · 第 {ascIdx + 1} 次
                    {item.intensity ? `（${INTENSITY_LABELS[item.intensity]}）` : ''}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>
                      {formatSecondsCompact(durSec)}
                      {gapSec !== null ? ` · 间隔 ${formatSecondsCompact(gapSec)}` : ''}
                    </span>
                    <button
                      type="button"
                      className="mini-del-btn"
                      aria-label={`删除第 ${ascIdx + 1} 次宫缩记录`}
                      onClick={() => onRemove(item.id)}
                    >
                      删
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {records.length > 0 ? (
        <div className="btn-row" style={{ marginTop: 12 }}>
          {!confirmClear ? (
            <button
              type="button"
              className="btn ghost"
              style={{ flex: 1 }}
              onClick={() => setConfirmClear(true)}
            >
              清空宫缩记录
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn ghost"
                onClick={() => setConfirmClear(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={() => {
                  onClearAll();
                  setConfirmClear(false);
                }}
              >
                确认清空全部宫缩
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

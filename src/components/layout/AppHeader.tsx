import type { BirthProfile, StageGroupKey } from '../../domain/types';
import { formatProfileShortLabel } from '../../domain/profile';
import { formatClockDuration } from '../../domain/contractions';
import { STAGE_GROUP_META, type PostpartumCountdown } from '../../domain/autoAdvance';

interface AppHeaderProps {
  stageGroup: StageGroupKey;
  stageIndex: number;
  stageTotal: number;
  stageName: string;
  elapsedMs: number;
  profile: BirthProfile;
  wakeLockActive: boolean;
  wakeLockSupported: boolean;
  postpartumCountdown: PostpartumCountdown | null;
  onOpenRedLines: () => void;
  onOpenProfile: () => void;
}

export function AppHeader({
  stageGroup,
  stageIndex,
  stageTotal,
  stageName,
  elapsedMs,
  profile,
  wakeLockActive,
  wakeLockSupported,
  postpartumCountdown,
  onOpenRedLines,
  onOpenProfile,
}: AppHeaderProps) {
  const showPost2hTimer = Boolean(postpartumCountdown && !postpartumCountdown.completed);

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="header-meta-row">
          <div className="stage-eyebrow">
            <span>
              {STAGE_GROUP_META[stageGroup].label} · {stageIndex + 1}/{stageTotal}
            </span>
            {wakeLockSupported && wakeLockActive ? (
              <span aria-label="屏幕常亮已开启">· 常亮</span>
            ) : null}
          </div>

          <div className="header-actions">
            {showPost2hTimer && postpartumCountdown ? (
              <span className="post2h-pill" title="产后 2 小时黄金观察期倒计时">
                2h {postpartumCountdown.formattedRemaining}
              </span>
            ) : (
              <span className="elapsed-badge" title="本阶段已停留时长">
                {formatClockDuration(elapsedMs)}
              </span>
            )}
            <button
              type="button"
              className="pill-btn danger-pill compact"
              onClick={onOpenRedLines}
              aria-label="查看急诊红线与呼救指南"
            >
              <span className="mini-dot" aria-hidden="true" />
              红线
            </button>
            <button
              type="button"
              className="pill-btn active compact"
              onClick={onOpenProfile}
              aria-label="打开孕产画像与设置"
            >
              {formatProfileShortLabel(profile)}
            </button>
          </div>
        </div>

        <h1 className="stage-title full-row">{stageName}</h1>

        <div className="progress-track" aria-hidden="true">
          {Array.from({ length: stageTotal }, (_, idx) => {
            const stateClass =
              idx < stageIndex ? 'done' : idx === stageIndex ? 'now' : '';
            return <span key={idx} className={stateClass} />;
          })}
        </div>
      </div>
    </header>
  );
}

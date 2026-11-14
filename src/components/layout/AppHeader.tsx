import type { BirthProfile } from '../../domain/types';
import { formatProfileShortLabel } from '../../domain/profile';
import { formatClockDuration } from '../../domain/contractions';

interface AppHeaderProps {
  stageIndex: number;
  stageTotal: number;
  stageName: string;
  elapsedMs: number;
  profile: BirthProfile;
  wakeLockActive: boolean;
  wakeLockSupported: boolean;
  onOpenProfile: () => void;
}

export function AppHeader({
  stageIndex,
  stageTotal,
  stageName,
  elapsedMs,
  profile,
  wakeLockActive,
  wakeLockSupported,
  onOpenProfile,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="header-top">
          <div className="header-stage">
            <div className="stage-eyebrow">
              <span>
                第 {stageIndex + 1} / {stageTotal} 阶段
              </span>
              {wakeLockSupported && wakeLockActive ? (
                <span aria-label="屏幕常亮已开启">· 常亮中</span>
              ) : null}
            </div>
            <h1 className="stage-title">{stageName}</h1>
          </div>

          <div className="header-actions">
            <span className="elapsed-badge" title="本阶段已停留时长">
              {formatClockDuration(elapsedMs)}
            </span>
            <button
              type="button"
              className="pill-btn active"
              onClick={onOpenProfile}
              aria-label="打开孕产画像与设置"
            >
              {formatProfileShortLabel(profile)}
            </button>
          </div>
        </div>

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

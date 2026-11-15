import type { AuthUser, LifeStageId } from '../../domain/types';
import { LIFE_STAGE_META } from '../../domain/recommendations';

interface AppHeaderProps {
  lifeStage: LifeStageId;
  wakeLockActive: boolean;
  wakeLockSupported: boolean;
  authUser: AuthUser | null;
  onOpenCalibration: () => void;
  onOpenRedLines: () => void;
  onOpenAuthOrMe: () => void;
}

export function AppHeader({
  lifeStage,
  wakeLockActive,
  wakeLockSupported,
  authUser,
  onOpenCalibration,
  onOpenRedLines,
  onOpenAuthOrMe,
}: AppHeaderProps) {
  const stageMeta = LIFE_STAGE_META[lifeStage];

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="header-meta-row">
          <div className="brand-block">
            <span className="brand-mark" aria-hidden="true">
              护航
            </span>
            <button
              type="button"
              className="stage-chip-btn"
              onClick={onOpenCalibration}
              title="点击重新校准当前阶段与关注重点"
            >
              <span>{stageMeta.shortLabel}</span>
              <span className="chip-caret" aria-hidden="true">
                切换 ▾
              </span>
            </button>
            {wakeLockSupported && wakeLockActive ? (
              <span className="wakelock-tag" aria-label="屏幕常亮已开启">
                · 常亮
              </span>
            ) : null}
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="pill-btn danger-pill compact"
              onClick={onOpenRedLines}
              aria-label="查看急救与产科红线"
            >
              <span className="mini-dot" aria-hidden="true" />
              急救红线
            </button>
            <button
              type="button"
              className={`pill-btn compact${authUser ? ' active' : ''}`}
              onClick={onOpenAuthOrMe}
              aria-label={authUser ? `已登录 ${authUser.nickname}` : '登录或注册账号'}
            >
              {authUser ? authUser.nickname : '登录'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

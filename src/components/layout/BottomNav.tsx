import type { AppTab } from '../../domain/types';

interface BottomNavProps {
  activeTab: AppTab;
  hasRunningContraction: boolean;
  onSelectTab: (tab: AppTab) => void;
}

export function BottomNav({
  activeTab,
  hasRunningContraction,
  onSelectTab,
}: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="主导航">
      <button
        type="button"
        className={`nav-btn${activeTab === 'companion' ? ' active' : ''}`}
        aria-current={activeTab === 'companion' ? 'page' : undefined}
        onClick={() => onSelectTab('companion')}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
        <span>陪产</span>
      </button>

      <button
        type="button"
        className={`nav-btn${activeTab === 'contractions' ? ' active' : ''}`}
        aria-current={activeTab === 'contractions' ? 'page' : undefined}
        onClick={() => onSelectTab('contractions')}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
        <span>{hasRunningContraction ? '计时中' : '宫缩'}</span>
      </button>

      <button
        type="button"
        className={`nav-btn${activeTab === 'handover' ? ' active' : ''}`}
        aria-current={activeTab === 'handover' ? 'page' : undefined}
        onClick={() => onSelectTab('handover')}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8" />
          <path d="M8 12h8" />
          <path d="M8 16h5" />
        </svg>
        <span>交接卡</span>
      </button>

      <button
        type="button"
        className={`nav-btn danger-tab${activeTab === 'redlines' ? ' active' : ''}`}
        aria-current={activeTab === 'redlines' ? 'page' : undefined}
        onClick={() => onSelectTab('redlines')}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
        <span>红线</span>
      </button>

      <button
        type="button"
        className={`nav-btn${activeTab === 'mom' ? ' active' : ''}`}
        aria-current={activeTab === 'mom' ? 'page' : undefined}
        onClick={() => onSelectTab('mom')}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <span>给她看</span>
      </button>
    </nav>
  );
}

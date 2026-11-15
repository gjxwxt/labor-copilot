import type { AppTab } from '../../domain/types';

interface BottomNavProps {
  activeTab: AppTab;
  favoriteCount: number;
  eventCount: number;
  hasActiveContraction: boolean;
  onSelectTab: (tab: AppTab) => void;
}

export function BottomNav({
  activeTab,
  favoriteCount,
  eventCount,
  hasActiveContraction,
  onSelectTab,
}: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="主导航">
      <button
        type="button"
        className={`nav-btn${activeTab === 'home' ? ' active' : ''}`}
        aria-current={activeTab === 'home' ? 'page' : undefined}
        onClick={() => onSelectTab('home')}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 10.5L12 3l9 7.5" />
          <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
        </svg>
        <span>首页</span>
      </button>

      <button
        type="button"
        className={`nav-btn${activeTab === 'library' ? ' active' : ''}`}
        aria-current={activeTab === 'library' ? 'page' : undefined}
        onClick={() => onSelectTab('library')}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <path d="M10 8l5 3-5 3V8z" />
        </svg>
        <span>知识库</span>
      </button>

      <button
        type="button"
        className={`nav-btn${activeTab === 'tools' ? ' active' : ''}`}
        aria-current={activeTab === 'tools' ? 'page' : undefined}
        onClick={() => onSelectTab('tools')}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2.5 2.5" />
          <path d="M9 2h6" />
        </svg>
        <span>
          {hasActiveContraction
            ? '计时中'
            : eventCount > 0
              ? `工具 (${eventCount})`
              : '工具'}
        </span>
      </button>

      <button
        type="button"
        className={`nav-btn${activeTab === 'me' ? ' active' : ''}`}
        aria-current={activeTab === 'me' ? 'page' : undefined}
        onClick={() => onSelectTab('me')}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>{favoriteCount > 0 ? `我的 (${favoriteCount})` : '我的'}</span>
      </button>
    </nav>
  );
}

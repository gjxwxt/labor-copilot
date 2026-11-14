import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  AppState,
  AppTab,
  BirthProfile,
  BreathingPresetId,
  ClinicalEventMeta,
  ClinicalEventType,
  ContractionIntensity,
  StageKey,
  ThemePreference,
} from './domain/types';
import { STAGE_TEMPLATES } from './content/stages';
import {
  clampStageKey,
  getStageNavigation,
  resolveStages,
} from './domain/stages';
import {
  getRunningContraction,
  removeContraction,
  startContraction,
  stopContraction,
  updateContractionIntensity,
} from './domain/contractions';
import { createClinicalEvent } from './domain/timeline';
import { LocalStorageAdapter } from './domain/storage';
import { AppHeader } from './components/layout/AppHeader';
import { BottomNav } from './components/layout/BottomNav';
import { CompanionView } from './components/companion/CompanionView';
import { ContractionsView } from './components/contractions/ContractionsView';
import { HandoverView } from './components/handover/HandoverView';
import { RedLinesView } from './components/redlines/RedLinesView';
import { MomView } from './components/mom/MomView';
import { ProfileDialog } from './components/onboarding/ProfileDialog';

const THEME_STORAGE_KEY = 'labor-copilot-theme';
const storage = new LocalStorageAdapter();

const TAB_TITLES: Record<AppTab, string> = {
  companion: '陪产主线 | 护航 · 产程陪产助手',
  contractions: '宫缩计时 | 护航 · 产程陪产助手',
  handover: '医护交接卡 | 护航 · 产程陪产助手',
  redlines: '高危红线 | 护航 · 产程陪产助手',
  mom: '给她看 | 护航 · 产程陪产助手',
};

function readInitialTheme(): ThemePreference {
  try {
    const val = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (val === 'dark' || val === 'light') return val;
  } catch {
    // Ignore
  }
  return 'system';
}

function applyThemeMeta(theme: ThemePreference) {
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) {
    meta.setAttribute('content', theme === 'system' ? 'light dark' : theme);
  }
}

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function App() {
  const [state, setState] = useState<AppState>(() => storage.load());
  const [now, setNow] = useState<number>(() => Date.now());
  const [profileOpen, setProfileOpen] = useState(false);
  const [theme, setTheme] = useState<ThemePreference>(() => readInitialTheme());
  const [wakeLockActive, setWakeLockActive] = useState(false);

  const mainRef = useRef<HTMLElement>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const wakeLockSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  // Persist app state to localStorage
  useEffect(() => {
    storage.save(state);
  }, [state]);

  // Live 1s clock for stage duration and contraction stopwatch
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  // Sync theme meta & cross-tab theme preference
  useEffect(() => {
    applyThemeMeta(theme);
  }, [theme]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY) {
        setTheme(readInitialTheme());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Update document title for active tab
  useEffect(() => {
    document.title = TAB_TITLES[state.activeTab];
  }, [state.activeTab]);

  // Wake Lock management
  useEffect(() => {
    if (!wakeLockSupported) return;

    let cancelled = false;

    const acquire = async () => {
      if (!state.wakeLockEnabled || cancelled || wakeLockRef.current) return;
      try {
        const sentinel = await navigator.wakeLock.request('screen');
        if (cancelled) {
          await sentinel.release();
          return;
        }
        wakeLockRef.current = sentinel;
        setWakeLockActive(true);
        sentinel.addEventListener('release', () => {
          wakeLockRef.current = null;
          setWakeLockActive(false);
        });
      } catch {
        setWakeLockActive(false);
      }
    };

    const release = async () => {
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
        } catch {
          // Ignore
        }
        wakeLockRef.current = null;
        setWakeLockActive(false);
      }
    };

    if (state.wakeLockEnabled) {
      void acquire();
    } else {
      void release();
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && state.wakeLockEnabled) {
        void acquire();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void release();
    };
  }, [state.wakeLockEnabled, wakeLockSupported]);

  const resolvedStages = useMemo(
    () => resolveStages(state.profile, STAGE_TEMPLATES),
    [state.profile],
  );

  const safeStageKey = clampStageKey(state.currentStageKey, resolvedStages);
  const stageNav = getStageNavigation(safeStageKey, resolvedStages);

  if (!stageNav) {
    return null;
  }

  const runningContraction = getRunningContraction(state.contractions);

  const scrollMainToTop = () => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  };

  const handleSelectTab = (tab: AppTab) => {
    setState((prev) => ({ ...prev, activeTab: tab }));
    scrollMainToTop();
  };

  const handleSelectStage = (stageKey: StageKey) => {
    const ts = Date.now();
    setState((prev) => ({
      ...prev,
      currentStageKey: stageKey,
      stageStartedAt: ts,
    }));
    scrollMainToTop();
  };

  const handleToggleCheck = (itemId: string) => {
    setState((prev) => ({
      ...prev,
      checkedItems: {
        ...prev.checkedItems,
        [itemId]: !prev.checkedItems[itemId],
      },
    }));
  };

  const handleStartContraction = () => {
    const ts = Date.now();
    setState((prev) => ({
      ...prev,
      contractions: startContraction(prev.contractions, ts, createId('ct')),
    }));
    if (navigator.vibrate) {
      try {
        navigator.vibrate(35);
      } catch {
        // Ignore
      }
    }
  };

  const handleStopContraction = () => {
    const ts = Date.now();
    setState((prev) => ({
      ...prev,
      contractions: stopContraction(prev.contractions, ts),
    }));
    if (navigator.vibrate) {
      try {
        navigator.vibrate([25, 45, 25]);
      } catch {
        // Ignore
      }
    }
  };

  const handleSetIntensity = (id: string, intensity: ContractionIntensity) => {
    setState((prev) => ({
      ...prev,
      contractions: updateContractionIntensity(prev.contractions, id, intensity),
    }));
  };

  const handleRemoveContraction = (id: string) => {
    setState((prev) => ({
      ...prev,
      contractions: removeContraction(prev.contractions, id),
    }));
  };

  const handleClearContractions = () => {
    setState((prev) => ({
      ...prev,
      contractions: [],
    }));
  };

  const handleAddEvent = (
    type: ClinicalEventType,
    detail?: string,
    meta?: ClinicalEventMeta,
  ) => {
    const ts = Date.now();
    const newEvent = createClinicalEvent(createId('ev'), type, ts, detail, meta);
    setState((prev) => ({
      ...prev,
      events: [...prev.events, newEvent],
    }));
  };

  const handleRemoveEvent = (id: string) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.filter((e) => e.id !== id),
    }));
  };

  const handleSaveProfile = (nextProfile: BirthProfile) => {
    const nextStages = resolveStages(nextProfile, STAGE_TEMPLATES);
    const nextStageKey = clampStageKey(state.currentStageKey, nextStages);
    setState((prev) => ({
      ...prev,
      profile: nextProfile,
      hasCompletedOnboarding: true,
      currentStageKey: nextStageKey,
      ...(nextStageKey !== prev.currentStageKey ? { stageStartedAt: Date.now() } : {}),
    }));
    scrollMainToTop();
  };

  const handleChangeTheme = (nextTheme: ThemePreference) => {
    setTheme(nextTheme);
    try {
      if (nextTheme === 'system') {
        window.localStorage.removeItem(THEME_STORAGE_KEY);
      } else {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      }
    } catch {
      // Ignore
    }
  };

  const handleToggleWakeLock = (enabled: boolean) => {
    setState((prev) => ({ ...prev, wakeLockEnabled: enabled }));
  };

  const handleChangeBreathingPreset = (preset: BreathingPresetId) => {
    setState((prev) => ({ ...prev, breathingPreset: preset }));
  };

  const handleResetAllData = () => {
    setState(storage.clear());
    scrollMainToTop();
  };

  return (
    <>
      <AppHeader
        stageIndex={stageNav.index}
        stageTotal={stageNav.total}
        stageName={stageNav.stage.name}
        elapsedMs={now - state.stageStartedAt}
        profile={state.profile}
        wakeLockActive={wakeLockActive}
        wakeLockSupported={wakeLockSupported}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <main ref={mainRef} className="app-main">
        {state.activeTab === 'companion' ? (
          <CompanionView
            profile={state.profile}
            hasCompletedOnboarding={state.hasCompletedOnboarding}
            stages={resolvedStages}
            currentStage={stageNav.stage}
            prevKey={stageNav.prevKey}
            nextKey={stageNav.nextKey}
            checkedItems={state.checkedItems}
            onSelectStage={handleSelectStage}
            onToggleCheck={handleToggleCheck}
            onOpenProfile={() => setProfileOpen(true)}
            onGoRedLines={() => handleSelectTab('redlines')}
          />
        ) : null}

        {state.activeTab === 'contractions' ? (
          <ContractionsView
            profile={state.profile}
            records={state.contractions}
            now={now}
            onStart={handleStartContraction}
            onStop={handleStopContraction}
            onSetIntensity={handleSetIntensity}
            onRemove={handleRemoveContraction}
            onClearAll={handleClearContractions}
          />
        ) : null}

        {state.activeTab === 'handover' ? (
          <HandoverView
            state={state}
            currentStage={stageNav.stage}
            now={now}
            onAddEvent={handleAddEvent}
            onRemoveEvent={handleRemoveEvent}
          />
        ) : null}

        {state.activeTab === 'redlines' ? (
          <RedLinesView
            profile={state.profile}
            currentStageKey={stageNav.stage.key}
            onGoHandover={() => handleSelectTab('handover')}
          />
        ) : null}

        {state.activeTab === 'mom' ? (
          <MomView
            currentStage={stageNav.stage}
            breathingPreset={state.breathingPreset}
            onChangeBreathingPreset={handleChangeBreathingPreset}
          />
        ) : null}
      </main>

      <BottomNav
        activeTab={state.activeTab}
        hasRunningContraction={Boolean(runningContraction)}
        onSelectTab={handleSelectTab}
      />

      <ProfileDialog
        open={profileOpen}
        profile={state.profile}
        theme={theme}
        wakeLockEnabled={state.wakeLockEnabled}
        onClose={() => setProfileOpen(false)}
        onSaveProfile={handleSaveProfile}
        onChangeTheme={handleChangeTheme}
        onToggleWakeLock={handleToggleWakeLock}
        onResetAllData={handleResetAllData}
      />
    </>
  );
}
export default App;

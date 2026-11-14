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
  evaluateLaborRule,
  removeContraction,
  startContraction,
  stopContraction,
  updateContractionIntensity,
} from './domain/contractions';
import {
  evaluateEventTransition,
  getPostpartumCountdown,
  getStageGroup,
  type StageSuggestionPayload,
  type UrgentAlertPayload,
} from './domain/autoAdvance';
import { createClinicalEvent } from './domain/timeline';
import { LocalStorageAdapter } from './domain/storage';
import { AppHeader } from './components/layout/AppHeader';
import { BottomNav } from './components/layout/BottomNav';
import { CompanionView } from './components/companion/CompanionView';
import { HandoverView } from './components/handover/HandoverView';
import { MomView } from './components/mom/MomView';
import { ContractionBar } from './components/contractions/ContractionBar';
import { ContractionsDrawer } from './components/contractions/ContractionsDrawer';
import { RedLinesDialog } from './components/redlines/RedLinesDialog';
import { UrgentAlertModal } from './components/redlines/UrgentAlertModal';
import { ProfileDialog } from './components/onboarding/ProfileDialog';

const THEME_STORAGE_KEY = 'labor-copilot-theme';
const storage = new LocalStorageAdapter();

const TAB_TITLES: Record<AppTab, string> = {
  companion: '当下陪产 | 护航 · 产程陪产助手',
  handover: '战报交接 | 护航 · 产程陪产助手',
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
  const [contractionsOpen, setContractionsOpen] = useState(false);
  const [redLinesOpen, setRedLinesOpen] = useState(false);
  const [theme, setTheme] = useState<ThemePreference>(() => readInitialTheme());
  const [wakeLockActive, setWakeLockActive] = useState(false);

  const [eventSuggestion, setEventSuggestion] = useState<StageSuggestionPayload | null>(null);
  const [goSuggestionDismissed, setGoSuggestionDismissed] = useState(false);
  const [activeUrgentAlert, setActiveUrgentAlert] = useState<UrgentAlertPayload | null>(null);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Record<string, boolean>>({});
  const [nurseBrightNonce, setNurseBrightNonce] = useState(0);

  const mainRef = useRef<HTMLElement>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const wakeLockSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  useEffect(() => {
    storage.save(state);
  }, [state]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

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

  useEffect(() => {
    document.title = TAB_TITLES[state.activeTab];
  }, [state.activeTab]);

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

  const contractionEval = useMemo(
    () => evaluateLaborRule(state.contractions, state.profile, now),
    [state.contractions, state.profile, now],
  );
  const postpartumCountdown = useMemo(
    () => getPostpartumCountdown(state.events, now),
    [state.events, now],
  );

  // Trigger urgent takeover alert on prolonged contraction / tachysystole
  useEffect(() => {
    if (contractionEval.level !== 'urgent_alert') return;
    const latestId =
      state.contractions.length > 0
        ? state.contractions[state.contractions.length - 1]!.id
        : 'none';
    const alertId = `ct_${latestId}_${contractionEval.headline}`;
    if (dismissedAlertIds[alertId] || activeUrgentAlert?.id === alertId) return;
    setActiveUrgentAlert({
      id: alertId,
      title: contractionEval.headline,
      detail: contractionEval.detail,
      primaryActionLabel: '亮出白底交接卡给护士看',
      secondaryActionLabel: '我已呼叫医护，先关提醒',
    });
  }, [contractionEval, state.contractions, dismissedAlertIds, activeUrgentAlert]);

  if (!stageNav) {
    return null;
  }

  const stageGroup = getStageGroup(stageNav.stage.key);

  const activeStageSuggestion: StageSuggestionPayload | null =
    eventSuggestion ??
    (contractionEval.level === 'go' &&
    safeStageKey === 'prep' &&
    !goSuggestionDismissed &&
    resolvedStages.some((s) => s.key === 'latent')
      ? {
          targetKey: 'latent',
          targetName: '规律宫缩',
          message: contractionEval.headline,
        }
      : null);

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

  const handleQuickStart = (updates: Partial<BirthProfile>, targetStage: StageKey) => {
    const mergedProfile: BirthProfile = {
      ...state.profile,
      ...updates,
    };
    const nextStages = resolveStages(mergedProfile, STAGE_TEMPLATES);
    const safeTarget = clampStageKey(targetStage, nextStages);
    setState((prev) => ({
      ...prev,
      profile: mergedProfile,
      hasCompletedOnboarding: true,
      currentStageKey: safeTarget,
      stageStartedAt: Date.now(),
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

  const handleToggleAsked = (questionId: string) => {
    setState((prev) => ({
      ...prev,
      askedQuestions: {
        ...prev.askedQuestions,
        [questionId]: !prev.askedQuestions[questionId],
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
    const transition = evaluateEventTransition(
      newEvent,
      safeStageKey,
      state.profile,
      resolvedStages,
    );

    setState((prev) => ({
      ...prev,
      events: [...prev.events, newEvent],
      ...(transition.autoAdvanceTo
        ? {
            currentStageKey: transition.autoAdvanceTo,
            stageStartedAt: ts,
          }
        : {}),
    }));

    if (transition.urgentAlert) {
      setActiveUrgentAlert(transition.urgentAlert);
    }
    if (transition.suggestStage) {
      setEventSuggestion(transition.suggestStage);
    }
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
    setEventSuggestion(null);
    setActiveUrgentAlert(null);
    setDismissedAlertIds({});
    setGoSuggestionDismissed(false);
    setState(storage.clear());
    scrollMainToTop();
  };

  const dismissUrgentModal = () => {
    if (activeUrgentAlert) {
      setDismissedAlertIds((prev) => ({ ...prev, [activeUrgentAlert.id]: true }));
    }
    setActiveUrgentAlert(null);
  };

  return (
    <>
      <AppHeader
        stageGroup={stageGroup}
        stageIndex={stageNav.index}
        stageTotal={stageNav.total}
        stageName={stageNav.stage.name}
        elapsedMs={now - state.stageStartedAt}
        profile={state.profile}
        wakeLockActive={wakeLockActive}
        wakeLockSupported={wakeLockSupported}
        postpartumCountdown={postpartumCountdown}
        onOpenRedLines={() => setRedLinesOpen(true)}
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
            askedQuestions={state.askedQuestions}
            stageSuggestion={activeStageSuggestion}
            postpartumCountdown={postpartumCountdown}
            onQuickStart={handleQuickStart}
            onSelectStage={handleSelectStage}
            onToggleCheck={handleToggleCheck}
            onToggleAsked={handleToggleAsked}
            onDismissSuggestion={() => {
              if (eventSuggestion) {
                setEventSuggestion(null);
              } else {
                setGoSuggestionDismissed(true);
              }
            }}
            onOpenProfile={() => setProfileOpen(true)}
            onGoRedLines={() => setRedLinesOpen(true)}
            onGoMom={() => handleSelectTab('mom')}
          />
        ) : null}

        {state.activeTab === 'handover' ? (
          <HandoverView
            key={nurseBrightNonce}
            state={state}
            currentStage={stageNav.stage}
            now={now}
            initialNurseBright={nurseBrightNonce > 0}
            onAddEvent={handleAddEvent}
            onRemoveEvent={handleRemoveEvent}
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

      <ContractionBar
        profile={state.profile}
        records={state.contractions}
        now={now}
        compactForMom={state.activeTab === 'mom'}
        onStart={handleStartContraction}
        onStop={handleStopContraction}
        onSetIntensity={handleSetIntensity}
        onOpenDrawer={() => setContractionsOpen(true)}
      />

      <BottomNav
        activeTab={state.activeTab}
        eventCount={state.events.length}
        onSelectTab={handleSelectTab}
      />

      <ContractionsDrawer
        open={contractionsOpen}
        profile={state.profile}
        records={state.contractions}
        now={now}
        onClose={() => setContractionsOpen(false)}
        onStart={handleStartContraction}
        onStop={handleStopContraction}
        onSetIntensity={handleSetIntensity}
        onRemove={handleRemoveContraction}
        onClearAll={handleClearContractions}
      />

      <RedLinesDialog
        open={redLinesOpen}
        profile={state.profile}
        currentStageKey={stageNav.stage.key}
        onClose={() => setRedLinesOpen(false)}
        onGoHandover={() => handleSelectTab('handover')}
      />

      <UrgentAlertModal
        alert={activeUrgentAlert}
        onOpenHandover={() => {
          dismissUrgentModal();
          setContractionsOpen(false);
          setNurseBrightNonce((n) => n + 1);
          handleSelectTab('handover');
        }}
        onDismiss={dismissUrgentModal}
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

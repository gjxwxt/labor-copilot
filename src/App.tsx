import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  AppState,
  AppTab,
  AuthUser,
  BirthProfile,
  BreathingPresetId,
  ClinicalEventMeta,
  ClinicalEventType,
  ContractionIntensity,
  FocusTag,
  LifeStageId,
  StageKey,
  ThemePreference,
} from './domain/types';
import { STAGE_TEMPLATES } from './content/stages';
import { KNOWLEDGE_CARDS, getKnowledgeCardById } from './content/knowledge';
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
  type StageSuggestionPayload,
  type UrgentAlertPayload,
} from './domain/autoAdvance';
import {
  isLaborFocusedStage,
  LIFE_STAGE_META,
} from './domain/recommendations';
import { createClinicalEvent } from './domain/timeline';
import { LocalStorageAdapter } from './domain/storage';
import {
  clearStoredAuth,
  fetchMe,
  getStoredAuth,
  toggleCardFavorite,
} from './api/client';
import { AppHeader } from './components/layout/AppHeader';
import { BottomNav } from './components/layout/BottomNav';
import { HomeView } from './components/home/HomeView';
import { StageCalibrationDialog } from './components/home/StageCalibrationDialog';
import { LibraryView } from './components/library/LibraryView';
import { KnowledgeDetailDialog } from './components/library/KnowledgeDetailDialog';
import { ToolsView } from './components/tools/ToolsView';
import { MomSheetDialog } from './components/tools/MomSheetDialog';
import { MeView } from './components/me/MeView';
import { AuthDialog } from './components/auth/AuthDialog';
import { ContractionBar } from './components/contractions/ContractionBar';
import { ContractionsDrawer } from './components/contractions/ContractionsDrawer';
import { RedLinesDialog } from './components/redlines/RedLinesDialog';
import { UrgentAlertModal } from './components/redlines/UrgentAlertModal';
import { ProfileDialog } from './components/onboarding/ProfileDialog';

const THEME_STORAGE_KEY = 'labor-copilot-theme';
const storage = new LocalStorageAdapter();

const TAB_TITLES: Record<AppTab, string> = {
  home: '首页推荐 | 护航 · 育儿与产程护航助手',
  library: '知识库与视频 | 护航 · 育儿与产程护航助手',
  tools: '实用工具 | 护航 · 育儿与产程护航助手',
  me: '我的与收藏 | 护航 · 育儿与产程护航助手',
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

function mergeUniqueIds(primary: string[], secondary: string[]): string[] {
  return Array.from(new Set([...primary, ...secondary]));
}

export function App() {
  const [state, setState] = useState<AppState>(() => storage.load());
  const [now, setNow] = useState<number>(() => Date.now());
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => getStoredAuth()?.user ?? null);
  const [authToken, setAuthToken] = useState<string | null>(() => getStoredAuth()?.token ?? null);

  const [calibrationOpen, setCalibrationOpen] = useState(false);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [momSheetOpen, setMomSheetOpen] = useState(false);
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
    if (!authToken) return;
    let cancelled = false;
    fetchMe(authToken)
      .then((res) => {
        if (cancelled) return;
        setAuthUser(res.user);
        setState((prev) => ({
          ...prev,
          favoriteCardIds: mergeUniqueIds(res.favoriteIds, prev.favoriteCardIds),
        }));
      })
      .catch((err) => {
        if (cancelled) return;
        // Only invalidate session on explicit 401; stay logged in gracefully when offline
        if (err && typeof err === 'object' && 'status' in err && err.status === 401) {
          clearStoredAuth();
          setAuthUser(null);
          setAuthToken(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [authToken]);

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
      primaryActionLabel: '打开 1 分钟医护交接屏',
      secondaryActionLabel: '我已呼叫医护，先关提醒',
    });
  }, [contractionEval, state.contractions, dismissedAlertIds, activeUrgentAlert]);

  if (!stageNav) {
    return null;
  }

  const hasActiveContraction = state.contractions.some((c) => !c.endedAt);
  const showContractionDock =
    hasActiveContraction ||
    (state.hasCompletedCalibration && isLaborFocusedStage(state.lifeStage));

  const activeCard = activeCardId ? getKnowledgeCardById(activeCardId) ?? null : null;
  const favoriteCards = state.favoriteCardIds
    .map((id) => getKnowledgeCardById(id))
    .filter((card): card is NonNullable<typeof card> => Boolean(card));

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

  const handleConfirmCalibration = (stage: LifeStageId, focusTags: FocusTag[]) => {
    const suggestedLaborStage = LIFE_STAGE_META[stage].defaultStageKey;
    const clampedLaborStage = clampStageKey(suggestedLaborStage, resolvedStages);
    setState((prev) => ({
      ...prev,
      lifeStage: stage,
      focusTags: focusTags.length > 0 ? focusTags : LIFE_STAGE_META[stage].defaultFocusTags,
      hasCompletedCalibration: true,
      currentStageKey: clampedLaborStage,
    }));
    scrollMainToTop();
  };

  const handleToggleFavorite = (cardId: string) => {
    setState((prev) => {
      const exists = prev.favoriteCardIds.includes(cardId);
      const nextFavs = exists
        ? prev.favoriteCardIds.filter((id) => id !== cardId)
        : [cardId, ...prev.favoriteCardIds];
      return { ...prev, favoriteCardIds: nextFavs };
    });

    if (authToken) {
      void toggleCardFavorite(cardId, authToken)
        .then((res) => {
          setState((prev) => ({ ...prev, favoriteCardIds: res.favoriteIds }));
        })
        .catch(() => {
          // Keep optimistic local favorite cleanly when offline
        });
    }
  };

  const handleToggleLikeLocal = (cardId: string, liked: boolean) => {
    setState((prev) => {
      const exists = prev.likedCardIds.includes(cardId);
      if (liked && !exists) {
        return { ...prev, likedCardIds: [cardId, ...prev.likedCardIds] };
      }
      if (!liked && exists) {
        return { ...prev, likedCardIds: prev.likedCardIds.filter((id) => id !== cardId) };
      }
      return prev;
    });
  };

  const handleAuthSuccess = async (payload: {
    token: string;
    user: AuthUser;
    favoriteIds: string[];
  }) => {
    setAuthToken(payload.token);
    setAuthUser(payload.user);
    // Sync any offline local favorites up to account on login/register
    const localOnly = state.favoriteCardIds.filter(
      (id) => !payload.favoriteIds.includes(id),
    );
    let syncedFavorites = mergeUniqueIds(payload.favoriteIds, state.favoriteCardIds);
    for (const cardId of localOnly) {
      try {
        const res = await toggleCardFavorite(cardId, payload.token);
        syncedFavorites = res.favoriteIds;
      } catch {
        break;
      }
    }
    setState((prev) => ({ ...prev, favoriteCardIds: syncedFavorites }));
  };

  const handleLogout = () => {
    clearStoredAuth();
    setAuthToken(null);
    setAuthUser(null);
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
        lifeStage={state.lifeStage}
        wakeLockActive={wakeLockActive}
        wakeLockSupported={wakeLockSupported}
        authUser={authUser}
        onOpenCalibration={() => setCalibrationOpen(true)}
        onOpenRedLines={() => setRedLinesOpen(true)}
        onOpenAuthOrMe={() => {
          if (authUser) {
            handleSelectTab('me');
          } else {
            setAuthInitialMode('login');
            setAuthOpen(true);
          }
        }}
      />

      <main ref={mainRef} className="app-main">
        {state.activeTab === 'home' ? (
          <HomeView
            lifeStage={state.lifeStage}
            focusTags={state.focusTags}
            hasCompletedCalibration={state.hasCompletedCalibration}
            cards={KNOWLEDGE_CARDS}
            favoriteIds={state.favoriteCardIds}
            onConfirmCalibration={handleConfirmCalibration}
            onOpenCalibrationModal={() => setCalibrationOpen(true)}
            onOpenCard={(cardId) => setActiveCardId(cardId)}
            onToggleFavorite={handleToggleFavorite}
            onGoLibrary={() => handleSelectTab('library')}
            onGoTools={() => handleSelectTab('tools')}
          />
        ) : null}

        {state.activeTab === 'library' ? (
          <LibraryView
            cards={KNOWLEDGE_CARDS}
            lifeStage={state.lifeStage}
            focusTags={state.focusTags}
            favoriteIds={state.favoriteCardIds}
            onOpenCard={(cardId) => setActiveCardId(cardId)}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : null}

        {state.activeTab === 'tools' ? (
          <ToolsView
            lifeStage={state.lifeStage}
            state={state}
            stages={resolvedStages}
            currentStage={stageNav.stage}
            prevKey={stageNav.prevKey}
            nextKey={stageNav.nextKey}
            stageSuggestion={activeStageSuggestion}
            postpartumCountdown={postpartumCountdown}
            now={now}
            nurseBrightNonce={nurseBrightNonce}
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
            onOpenMomSheet={() => setMomSheetOpen(true)}
            onOpenCard={(cardId) => setActiveCardId(cardId)}
            onAddEvent={handleAddEvent}
            onRemoveEvent={handleRemoveEvent}
          />
        ) : null}

        {state.activeTab === 'me' ? (
          <MeView
            authUser={authUser}
            lifeStage={state.lifeStage}
            focusTags={state.focusTags}
            profile={state.profile}
            favoriteCards={favoriteCards}
            theme={theme}
            wakeLockEnabled={state.wakeLockEnabled}
            wakeLockSupported={wakeLockSupported}
            onOpenAuth={(mode) => {
              setAuthInitialMode(mode);
              setAuthOpen(true);
            }}
            onLogout={handleLogout}
            onOpenCalibration={() => setCalibrationOpen(true)}
            onOpenProfile={() => setProfileOpen(true)}
            onOpenCard={(cardId) => setActiveCardId(cardId)}
            onToggleFavorite={handleToggleFavorite}
            onChangeTheme={handleChangeTheme}
            onToggleWakeLock={handleToggleWakeLock}
            onResetAllData={handleResetAllData}
          />
        ) : null}
      </main>

      {showContractionDock ? (
        <ContractionBar
          profile={state.profile}
          records={state.contractions}
          now={now}
          compactForMom={momSheetOpen}
          onStart={handleStartContraction}
          onStop={handleStopContraction}
          onSetIntensity={handleSetIntensity}
          onOpenDrawer={() => setContractionsOpen(true)}
        />
      ) : null}

      <BottomNav
        activeTab={state.activeTab}
        favoriteCount={state.favoriteCardIds.length}
        eventCount={state.events.length}
        hasActiveContraction={hasActiveContraction}
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

      <KnowledgeDetailDialog
        card={activeCard}
        authUser={authUser}
        authToken={authToken}
        isFavorite={Boolean(activeCard && state.favoriteCardIds.includes(activeCard.id))}
        isLikedLocal={Boolean(activeCard && state.likedCardIds.includes(activeCard.id))}
        onClose={() => setActiveCardId(null)}
        onToggleFavorite={handleToggleFavorite}
        onToggleLikeLocal={handleToggleLikeLocal}
        onRequestAuth={() => {
          setAuthInitialMode('login');
          setAuthOpen(true);
        }}
      />

      <StageCalibrationDialog
        open={calibrationOpen}
        initialStage={state.lifeStage}
        initialFocusTags={state.focusTags}
        onClose={() => setCalibrationOpen(false)}
        onConfirm={handleConfirmCalibration}
      />

      <MomSheetDialog
        open={momSheetOpen}
        currentStage={stageNav.stage}
        breathingPreset={state.breathingPreset}
        onClose={() => setMomSheetOpen(false)}
        onChangeBreathingPreset={handleChangeBreathingPreset}
      />

      <AuthDialog
        open={authOpen}
        initialMode={authInitialMode}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <RedLinesDialog
        open={redLinesOpen}
        profile={state.profile}
        currentStageKey={stageNav.stage.key}
        onClose={() => setRedLinesOpen(false)}
        onGoHandover={() => {
          setRedLinesOpen(false);
          handleSelectTab('tools');
        }}
      />

      <UrgentAlertModal
        alert={activeUrgentAlert}
        onOpenHandover={() => {
          dismissUrgentModal();
          setContractionsOpen(false);
          setNurseBrightNonce((n) => n + 1);
          handleSelectTab('tools');
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

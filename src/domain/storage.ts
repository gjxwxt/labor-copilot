import type {
  AppState,
  AppTab,
  BirthMode,
  BirthProfile,
  BreathingPresetId,
  ClinicalEvent,
  ContractionRecord,
  EpiduralIntent,
  FocusTag,
  LifeStageId,
  Parity,
  PartnerAccess,
  RiskTag,
  StageKey,
} from './types';
import { createDefaultProfile } from './profile';

export const STORAGE_KEY = 'labor_copilot_state_v1';

export interface StorageAdapter {
  load(): AppState;
  save(state: AppState): void;
  clear(): AppState;
}

const VALID_MODES: BirthMode[] = ['spontaneous', 'induction', 'planned_csection'];
const VALID_PARITY: Parity[] = ['nulliparous', 'multiparous'];
const VALID_RISKS: RiskTag[] = [
  'macrosomia',
  'gdm',
  'cholestasis',
  'gbs_positive',
  'hypertension',
  'vbac',
];
const VALID_PARTNER: PartnerAccess[] = ['yes', 'no', 'unknown'];
const VALID_EPIDURAL: EpiduralIntent[] = ['wanted', 'open', 'no', 'unknown'];
const VALID_TABS: AppTab[] = ['home', 'library', 'tools', 'me'];
const VALID_BREATHING: BreathingPresetId[] = ['4-6', '4-4', '2-2'];
const VALID_LIFE_STAGES: LifeStageId[] = [
  'pregnant_prep',
  'in_labor',
  'newborn_week1',
  'infant_1_3m',
  'infant_4_12m',
];
const VALID_FOCUS_TAGS: FocusTag[] = [
  'emergency',
  'feeding',
  'soothing',
  'labor_prep',
  'postpartum',
  'safety',
];
const VALID_STAGES: StageKey[] = [
  'prep',
  'ripening',
  'latent',
  'anesth',
  'active',
  'second',
  'third',
  'csection_or',
  'csection_postop',
  'post2h',
  'day1',
  'day2',
  'day3',
];

export function createInitialState(now: number = Date.now()): AppState {
  return {
    version: 1,
    lifeStage: 'pregnant_prep',
    focusTags: ['emergency', 'labor_prep'],
    hasCompletedCalibration: false,
    favoriteCardIds: [],
    likedCardIds: [],
    profile: createDefaultProfile(),
    hasCompletedOnboarding: false,
    currentStageKey: 'prep',
    stageStartedAt: now,
    checkedItems: {},
    askedQuestions: {},
    contractions: [],
    events: [],
    activeTab: 'home',
    breathingPreset: '4-6',
    wakeLockEnabled: true,
  };
}

function sanitizeProfile(raw: unknown): BirthProfile {
  const def = createDefaultProfile();
  if (!raw || typeof raw !== 'object') return def;
  const obj = raw as Record<string, unknown>;

  const parity = VALID_PARITY.includes(obj.parity as Parity)
    ? (obj.parity as Parity)
    : def.parity;
  const birthMode = VALID_MODES.includes(obj.birthMode as BirthMode)
    ? (obj.birthMode as BirthMode)
    : def.birthMode;
  const riskTags = Array.isArray(obj.riskTags)
    ? obj.riskTags.filter((tag): tag is RiskTag => VALID_RISKS.includes(tag as RiskTag))
    : [];
  const partnerAllowedInDelivery = VALID_PARTNER.includes(
    obj.partnerAllowedInDelivery as PartnerAccess,
  )
    ? (obj.partnerAllowedInDelivery as PartnerAccess)
    : def.partnerAllowedInDelivery;
  const epiduralIntent = VALID_EPIDURAL.includes(obj.epiduralIntent as EpiduralIntent)
    ? (obj.epiduralIntent as EpiduralIntent)
    : def.epiduralIntent;

  return {
    id: typeof obj.id === 'string' && obj.id ? obj.id : def.id,
    label: typeof obj.label === 'string' && obj.label ? obj.label : def.label,
    parity,
    birthMode,
    riskTags: Array.from(new Set(riskTags)),
    partnerAllowedInDelivery,
    epiduralIntent,
  };
}

function sanitizeContractions(raw: unknown): ContractionRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is ContractionRecord => {
    if (!item || typeof item !== 'object') return false;
    const obj = item as Record<string, unknown>;
    return typeof obj.id === 'string' && typeof obj.startedAt === 'number';
  });
}

function sanitizeEvents(raw: unknown): ClinicalEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is ClinicalEvent => {
    if (!item || typeof item !== 'object') return false;
    const obj = item as Record<string, unknown>;
    return (
      typeof obj.id === 'string' &&
      typeof obj.type === 'string' &&
      typeof obj.at === 'number'
    );
  });
}

function sanitizeStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return Array.from(
    new Set(raw.filter((item): item is string => typeof item === 'string' && item.length > 0)),
  );
}

function sanitizeActiveTab(rawTab: unknown): AppTab {
  if (VALID_TABS.includes(rawTab as AppTab)) {
    return rawTab as AppTab;
  }
  if (
    rawTab === 'companion' ||
    rawTab === 'handover' ||
    rawTab === 'mom' ||
    rawTab === 'contractions'
  ) {
    return 'tools';
  }
  return 'home';
}

export function sanitizeAppState(raw: unknown, now: number = Date.now()): AppState {
  const initial = createInitialState(now);
  if (!raw || typeof raw !== 'object') return initial;
  const obj = raw as Record<string, unknown>;

  const checkedItems: Record<string, boolean> = {};
  if (obj.checkedItems && typeof obj.checkedItems === 'object') {
    for (const [k, v] of Object.entries(obj.checkedItems as Record<string, unknown>)) {
      if (typeof v === 'boolean') checkedItems[k] = v;
    }
  }

  const askedQuestions: Record<string, boolean> = {};
  if (obj.askedQuestions && typeof obj.askedQuestions === 'object') {
    for (const [k, v] of Object.entries(obj.askedQuestions as Record<string, unknown>)) {
      if (typeof v === 'boolean') askedQuestions[k] = v;
    }
  }

  const lifeStage: LifeStageId = VALID_LIFE_STAGES.includes(obj.lifeStage as LifeStageId)
    ? (obj.lifeStage as LifeStageId)
    : initial.lifeStage;

  const rawFocusTags = Array.isArray(obj.focusTags)
    ? obj.focusTags.filter((tag): tag is FocusTag => VALID_FOCUS_TAGS.includes(tag as FocusTag))
    : [];
  const focusTags =
    rawFocusTags.length > 0 ? Array.from(new Set(rawFocusTags)) : initial.focusTags;

  return {
    version: 1,
    lifeStage,
    focusTags,
    hasCompletedCalibration: Boolean(obj.hasCompletedCalibration),
    favoriteCardIds: sanitizeStringList(obj.favoriteCardIds),
    likedCardIds: sanitizeStringList(obj.likedCardIds),
    profile: sanitizeProfile(obj.profile),
    hasCompletedOnboarding: Boolean(obj.hasCompletedOnboarding),
    currentStageKey: VALID_STAGES.includes(obj.currentStageKey as StageKey)
      ? (obj.currentStageKey as StageKey)
      : initial.currentStageKey,
    stageStartedAt:
      typeof obj.stageStartedAt === 'number' ? obj.stageStartedAt : initial.stageStartedAt,
    checkedItems,
    askedQuestions,
    contractions: sanitizeContractions(obj.contractions),
    events: sanitizeEvents(obj.events),
    activeTab: sanitizeActiveTab(obj.activeTab),
    breathingPreset: VALID_BREATHING.includes(obj.breathingPreset as BreathingPresetId)
      ? (obj.breathingPreset as BreathingPresetId)
      : initial.breathingPreset,
    wakeLockEnabled:
      typeof obj.wakeLockEnabled === 'boolean' ? obj.wakeLockEnabled : initial.wakeLockEnabled,
  };
}

export class LocalStorageAdapter implements StorageAdapter {
  private readonly key: string;

  constructor(key: string = STORAGE_KEY) {
    this.key = key;
  }

  load(): AppState {
    try {
      const rawText = window.localStorage.getItem(this.key);
      if (!rawText) return createInitialState();
      return sanitizeAppState(JSON.parse(rawText));
    } catch {
      return createInitialState();
    }
  }

  save(state: AppState): void {
    try {
      window.localStorage.setItem(this.key, JSON.stringify(state));
    } catch {
      // Ignore quota / private-browsing storage errors gracefully
    }
  }

  clear(): AppState {
    try {
      window.localStorage.removeItem(this.key);
    } catch {
      // Ignore
    }
    return createInitialState();
  }
}

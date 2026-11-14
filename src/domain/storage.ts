import type {
  AppState,
  AppTab,
  BirthMode,
  BirthProfile,
  BreathingPresetId,
  ClinicalEvent,
  ContractionRecord,
  EpiduralIntent,
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
const VALID_TABS: AppTab[] = ['companion', 'contractions', 'handover', 'redlines', 'mom'];
const VALID_BREATHING: BreathingPresetId[] = ['4-6', '4-4', '2-2'];
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
    profile: createDefaultProfile(),
    hasCompletedOnboarding: false,
    currentStageKey: 'prep',
    stageStartedAt: now,
    checkedItems: {},
    contractions: [],
    events: [],
    activeTab: 'companion',
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
  const result: ContractionRecord[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    if (typeof obj.id !== 'string' || typeof obj.startedAt !== 'number') continue;
    const record: ContractionRecord = {
      id: obj.id,
      startedAt: obj.startedAt,
      ...(typeof obj.endedAt === 'number' ? { endedAt: obj.endedAt } : {}),
      ...(obj.intensity === 1 || obj.intensity === 2 || obj.intensity === 3
        ? { intensity: obj.intensity }
        : {}),
    };
    result.push(record);
  }
  return result;
}

function sanitizeEvents(raw: unknown): ClinicalEvent[] {
  if (!Array.isArray(raw)) return [];
  const result: ClinicalEvent[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    if (
      typeof obj.id !== 'string' ||
      typeof obj.type !== 'string' ||
      typeof obj.at !== 'number'
    ) {
      continue;
    }
    result.push({
      id: obj.id,
      type: obj.type as ClinicalEvent['type'],
      at: obj.at,
      ...(typeof obj.detail === 'string' ? { detail: obj.detail } : {}),
      ...(obj.meta && typeof obj.meta === 'object'
        ? { meta: obj.meta as ClinicalEvent['meta'] }
        : {}),
    });
  }
  return result;
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

  return {
    version: 1,
    profile: sanitizeProfile(obj.profile),
    hasCompletedOnboarding: Boolean(obj.hasCompletedOnboarding),
    currentStageKey: VALID_STAGES.includes(obj.currentStageKey as StageKey)
      ? (obj.currentStageKey as StageKey)
      : initial.currentStageKey,
    stageStartedAt:
      typeof obj.stageStartedAt === 'number' ? obj.stageStartedAt : initial.stageStartedAt,
    checkedItems,
    contractions: sanitizeContractions(obj.contractions),
    events: sanitizeEvents(obj.events),
    activeTab: VALID_TABS.includes(obj.activeTab as AppTab)
      ? (obj.activeTab as AppTab)
      : initial.activeTab,
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

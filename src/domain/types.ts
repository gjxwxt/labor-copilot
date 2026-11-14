export type Parity = 'nulliparous' | 'multiparous';

export type BirthMode = 'spontaneous' | 'induction' | 'planned_csection';

export type RiskTag =
  | 'macrosomia'
  | 'gdm'
  | 'cholestasis'
  | 'gbs_positive'
  | 'hypertension'
  | 'vbac';

export type PartnerAccess = 'yes' | 'no' | 'unknown';

export type EpiduralIntent = 'wanted' | 'open' | 'no' | 'unknown';

export interface BirthProfile {
  id: string;
  label: string;
  parity: Parity;
  birthMode: BirthMode;
  riskTags: RiskTag[];
  partnerAllowedInDelivery: PartnerAccess;
  epiduralIntent: EpiduralIntent;
}

export type ContractionIntensity = 1 | 2 | 3;

export interface ContractionRecord {
  id: string;
  startedAt: number;
  endedAt?: number;
  intensity?: ContractionIntensity;
}

export type ClinicalEventType =
  | 'admitted'
  | 'water_broke'
  | 'epidural_placed'
  | 'cervix_check'
  | 'baby_born'
  | 'note';

export type AmnioticFluidStatus = 'clear' | 'meconium' | 'bloody' | 'unknown';

export interface ClinicalEventMeta {
  fluidStatus?: AmnioticFluidStatus;
  dilationCm?: number;
}

export interface ClinicalEvent {
  id: string;
  type: ClinicalEventType;
  at: number;
  detail?: string;
  meta?: ClinicalEventMeta;
}

export type AppTab = 'companion' | 'handover' | 'mom';

export type StageGroupKey = 'home' | 'hospital' | 'recovery';

export type BreathingPresetId = '4-6' | '4-4' | '2-2';

export type ThemePreference = 'system' | 'dark' | 'light';

export type StageKey =
  | 'prep'
  | 'ripening'
  | 'latent'
  | 'anesth'
  | 'active'
  | 'second'
  | 'third'
  | 'csection_or'
  | 'csection_postop'
  | 'post2h'
  | 'day1'
  | 'day2'
  | 'day3';

export type ProfilePredicate = (profile: BirthProfile) => boolean;

export interface ConditionalActionItem {
  id: string;
  text: string;
  detail?: string;
  badge?: string;
  when?: ProfilePredicate;
}

export interface QuestionCard {
  id: string;
  tag: string;
  text: string;
  badge?: string;
  when?: ProfilePredicate;
}

export type RedLineSeverity = 'call_bell_now' | 'notify_soon';

export interface RedLineItem {
  id: string;
  title: string;
  action: string;
  severity: RedLineSeverity;
  badge?: string;
  stageKeys?: StageKey[];
  when?: ProfilePredicate;
}

export interface KnowledgeBlock {
  id: string;
  title: string;
  bullets: string[];
  evidenceRef: string;
  when?: ProfilePredicate;
}

export interface MomSupportContent {
  headline: string;
  dos: ConditionalActionItem[];
}

export interface StageTemplate {
  key: StageKey;
  name: string;
  shortName: string;
  applicableModes: BirthMode[];
  applicableParities?: Parity[];
  headline: string;
  subHeadline?: string;
  evidenceRef: string;
  dos: ConditionalActionItem[];
  questions: QuestionCard[];
  redLines: RedLineItem[];
  knowledgeBlocks?: KnowledgeBlock[];
  mom: MomSupportContent;
}

export interface ResolvedStage {
  key: StageKey;
  name: string;
  shortName: string;
  headline: string;
  subHeadline?: string;
  evidenceRef: string;
  dos: ConditionalActionItem[];
  questions: QuestionCard[];
  redLines: RedLineItem[];
  knowledgeBlocks: KnowledgeBlock[];
  mom: {
    headline: string;
    dos: ConditionalActionItem[];
  };
}

export interface AppState {
  version: 1;
  profile: BirthProfile;
  hasCompletedOnboarding: boolean;
  currentStageKey: StageKey;
  stageStartedAt: number;
  checkedItems: Record<string, boolean>;
  askedQuestions: Record<string, boolean>;
  contractions: ContractionRecord[];
  events: ClinicalEvent[];
  activeTab: AppTab;
  breathingPreset: BreathingPresetId;
  wakeLockEnabled: boolean;
}

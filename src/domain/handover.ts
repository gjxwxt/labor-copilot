import type {
  AmnioticFluidStatus,
  BirthProfile,
  ClinicalEvent,
  ContractionRecord,
  ResolvedStage,
} from './types';
import {
  BIRTH_MODE_LABELS,
  EPIDURAL_LABELS,
  PARITY_LABELS,
  RISK_TAG_META,
} from './profile';
import {
  computeContractionStats,
  evaluateLaborRule,
  formatElapsedBrief,
  type ContractionStats,
  type LaborEvaluation,
} from './contractions';
import { getLatestEventByType, sortEventsDesc } from './timeline';

export interface HandoverRiskAlert {
  id: string;
  label: string;
  note: string;
  urgent: boolean;
}

export interface HandoverSummary {
  profileSummary: string;
  currentStageName: string;
  riskAlerts: HandoverRiskAlert[];
  waterStatus: {
    broken: boolean;
    at?: number;
    elapsedText?: string;
    fluidStatus?: AmnioticFluidStatus;
    warningFlag: boolean;
  };
  cervixStatus: {
    dilationCm?: number;
    at?: number;
    detail?: string;
  };
  epiduralStatus: {
    placed: boolean;
    at?: number;
    intentLabel: string;
  };
  admittedAt?: number;
  babyBornAt?: number;
  contractionStats: ContractionStats;
  laborEvaluation: LaborEvaluation;
  recentEvents: ClinicalEvent[];
}

export function buildHandoverSummary(
  profile: BirthProfile,
  contractions: ContractionRecord[],
  events: ClinicalEvent[],
  currentStage: ResolvedStage,
  now: number,
): HandoverSummary {
  const waterEvent = getLatestEventByType(events, 'water_broke');
  const cervixEvent = getLatestEventByType(events, 'cervix_check');
  const epiduralEvent = getLatestEventByType(events, 'epidural_placed');
  const admittedEvent = getLatestEventByType(events, 'admitted');
  const bornEvent = getLatestEventByType(events, 'baby_born');

  const fluidStatus = waterEvent?.meta?.fluidStatus ?? 'unknown';
  const fluidWarning = fluidStatus === 'meconium' || fluidStatus === 'bloody';

  const contractionStats = computeContractionStats(contractions, now);
  const laborEvaluation = evaluateLaborRule(contractions, profile, now);

  const riskAlerts: HandoverRiskAlert[] = profile.riskTags.map((tag) => ({
    id: `risk_${tag}`,
    label: RISK_TAG_META[tag].shortLabel,
    note: RISK_TAG_META[tag].summary,
    urgent: tag === 'vbac' || tag === 'hypertension' || tag === 'gbs_positive',
  }));

  if (waterEvent && fluidWarning) {
    riskAlerts.unshift({
      id: 'alert_fluid',
      label: fluidStatus === 'meconium' ? '羊水黄绿/浑浊' : '破水伴明显血性',
      note: '请立即让助产士/医生查看羊水性状并评估胎心监护。',
      urgent: true,
    });
  }

  if (waterEvent && profile.riskTags.includes('gbs_positive')) {
    riskAlerts.unshift({
      id: 'alert_gbs_water',
      label: 'GBS+ 且已破水',
      note: '破水后需尽快静脉预防性使用抗生素，交接时请第一时间提醒护士。',
      urgent: true,
    });
  }

  return {
    profileSummary: `${PARITY_LABELS[profile.parity]} · ${BIRTH_MODE_LABELS[profile.birthMode]}`,
    currentStageName: currentStage.name,
    riskAlerts,
    waterStatus: {
      broken: Boolean(waterEvent),
      at: waterEvent?.at,
      elapsedText: waterEvent ? formatElapsedBrief(now - waterEvent.at) : undefined,
      fluidStatus: waterEvent ? fluidStatus : undefined,
      warningFlag: fluidWarning,
    },
    cervixStatus: {
      dilationCm: cervixEvent?.meta?.dilationCm,
      at: cervixEvent?.at,
      detail: cervixEvent?.detail,
    },
    epiduralStatus: {
      placed: Boolean(epiduralEvent),
      at: epiduralEvent?.at,
      intentLabel: EPIDURAL_LABELS[profile.epiduralIntent],
    },
    admittedAt: admittedEvent?.at,
    babyBornAt: bornEvent?.at,
    contractionStats,
    laborEvaluation,
    recentEvents: sortEventsDesc(events).slice(0, 12),
  };
}

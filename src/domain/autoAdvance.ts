import type {
  BirthProfile,
  ClinicalEvent,
  ResolvedStage,
  StageGroupKey,
  StageKey,
} from './types';
import { getLatestEventByType } from './timeline';

export const POSTPARTUM_WATCH_WINDOW_MS = 2 * 60 * 60 * 1000;

export const STAGE_GROUP_META: Record<
  StageGroupKey,
  { key: StageGroupKey; label: string; keys: StageKey[] }
> = {
  home: {
    key: 'home',
    label: '在家准备',
    keys: ['prep'],
  },
  hospital: {
    key: 'hospital',
    label: '医院待产',
    keys: [
      'ripening',
      'latent',
      'anesth',
      'active',
      'second',
      'third',
      'csection_or',
      'csection_postop',
    ],
  },
  recovery: {
    key: 'recovery',
    label: '产后恢复',
    keys: ['post2h', 'day1', 'day2', 'day3'],
  },
};

export function getStageGroup(stageKey: StageKey): StageGroupKey {
  if (STAGE_GROUP_META.home.keys.includes(stageKey)) return 'home';
  if (STAGE_GROUP_META.recovery.keys.includes(stageKey)) return 'recovery';
  return 'hospital';
}

export function groupStagesByScene(
  stages: ResolvedStage[],
): Array<{ key: StageGroupKey; label: string; stages: ResolvedStage[] }> {
  const order: StageGroupKey[] = ['home', 'hospital', 'recovery'];
  return order
    .map((groupKey) => {
      const meta = STAGE_GROUP_META[groupKey];
      const matched = stages.filter((s) => meta.keys.includes(s.key));
      return {
        key: groupKey,
        label: meta.label,
        stages: matched,
      };
    })
    .filter((group) => group.stages.length > 0);
}

export interface UrgentAlertPayload {
  id: string;
  title: string;
  detail: string;
  primaryActionLabel: string;
  secondaryActionLabel: string;
}

export interface StageSuggestionPayload {
  targetKey: StageKey;
  targetName: string;
  message: string;
}

export interface EventTransitionResult {
  autoAdvanceTo?: StageKey;
  autoAdvanceNotice?: string;
  suggestStage?: StageSuggestionPayload;
  urgentAlert?: UrgentAlertPayload;
}

function indexOfStage(stages: ResolvedStage[], key: StageKey): number {
  return stages.findIndex((s) => s.key === key);
}

function findStage(stages: ResolvedStage[], key: StageKey): ResolvedStage | undefined {
  return stages.find((s) => s.key === key);
}

/**
 * 依据刚记录的临床事件计算：
 * 1. 是否需要全屏危险接管（如黄绿/血性羊水）
 * 2. 是否自动推进阶段（如宝宝出生 -> 产后2小时）
 * 3. 是否给出温柔的阶段切换建议卡片（如入院 / 开指>=4cm / 已打无痛）
 */
export function evaluateEventTransition(
  event: ClinicalEvent,
  currentStageKey: StageKey,
  profile: BirthProfile,
  resolvedStages: ResolvedStage[],
): EventTransitionResult {
  const currentIdx = indexOfStage(resolvedStages, currentStageKey);
  const result: EventTransitionResult = {};

  if (event.type === 'water_broke') {
    const fluid = event.meta?.fluidStatus;
    if (fluid === 'meconium' || fluid === 'bloody') {
      result.urgentAlert = {
        id: `fluid_${event.id}`,
        title:
          fluid === 'meconium'
            ? '羊水呈黄绿 / 浑浊，立刻按铃叫医护！'
            : '破水伴有明显血性，立刻按铃叫医护！',
        detail:
          '让产妇立刻平躺、臀部垫高枕头不要站立或走动，第一时间把时间与性状报给助产士并上胎心监护。',
        primaryActionLabel: '亮出白底交接卡给护士看',
        secondaryActionLabel: '我已通知医护，关闭提醒',
      };
    }
  }

  if (event.type === 'baby_born') {
    const post2h = findStage(resolvedStages, 'post2h');
    const post2hIdx = indexOfStage(resolvedStages, 'post2h');
    if (post2h && post2hIdx > currentIdx) {
      result.autoAdvanceTo = 'post2h';
      result.autoAdvanceNotice =
        '恭喜宝宝出生！已自动切入「产后 2 小时黄金观察期」并启动 2 小时防出血倒计时。';
    }
    return result;
  }

  if (event.type === 'admitted' && currentStageKey === 'prep') {
    const targetKey: StageKey =
      profile.birthMode === 'planned_csection'
        ? 'csection_or'
        : profile.birthMode === 'induction'
          ? 'ripening'
          : 'latent';
    const target = findStage(resolvedStages, targetKey);
    if (target) {
      result.suggestStage = {
        targetKey,
        targetName: target.shortName,
        message: `已记录入院，可一键切到「${target.shortName}」看医院待产要点`,
      };
    }
    return result;
  }

  if (event.type === 'cervix_check' && typeof event.meta?.dilationCm === 'number') {
    const cm = event.meta.dilationCm;
    const desiredKey: StageKey | null =
      cm >= 10 ? 'second' : cm >= 4 ? 'active' : cm >= 1 ? 'latent' : null;
    if (desiredKey) {
      const targetIdx = indexOfStage(resolvedStages, desiredKey);
      const target = findStage(resolvedStages, desiredKey);
      if (target && targetIdx > currentIdx) {
        result.suggestStage = {
          targetKey: desiredKey,
          targetName: target.shortName,
          message:
            cm >= 10
              ? `宫口已开全（${cm} 公分），建议立刻切到「${target.shortName}」配合用力与哈气`
              : `已开指 ${cm} 公分，建议切到「${target.shortName}」查看当前要点`,
        };
        return result;
      }
    }
  }

  if (event.type === 'epidural_placed') {
    const targetIdx = indexOfStage(resolvedStages, 'anesth');
    const target = findStage(resolvedStages, 'anesth');
    if (target && targetIdx > currentIdx) {
      result.suggestStage = {
        targetKey: 'anesth',
        targetName: target.shortName,
        message: '已打无痛！建议切到「镇痛/无痛」紧盯前 15 分钟不良反应与防跌倒',
      };
      return result;
    }
  }

  return result;
}

export interface PostpartumCountdown {
  bornAt: number;
  elapsedMs: number;
  remainingMs: number;
  completed: boolean;
  progressRatio: number;
  formattedRemaining: string;
  nextCheckPrompt: string;
}

function pad2(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}

export function formatCountdownClock(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

export function getPostpartumCountdown(
  events: ClinicalEvent[],
  now: number,
): PostpartumCountdown | null {
  const bornEvent = getLatestEventByType(events, 'baby_born');
  if (!bornEvent) return null;

  const elapsedMs = Math.max(0, now - bornEvent.at);
  const remainingMs = Math.max(0, POSTPARTUM_WATCH_WINDOW_MS - elapsedMs);
  const completed = remainingMs === 0;
  const progressRatio = Math.min(1, elapsedMs / POSTPARTUM_WATCH_WINDOW_MS);

  const quarterMin = 15 * 60 * 1000;
  const msIntoSlot = elapsedMs % quarterMin;
  const minsUntilNextPadCheck = Math.max(1, Math.ceil((quarterMin - msIntoSlot) / 60_000));

  return {
    bornAt: bornEvent.at,
    elapsedMs,
    remainingMs,
    completed,
    progressRatio,
    formattedRemaining: formatCountdownClock(remainingMs),
    nextCheckPrompt: completed
      ? '产后 2 小时重点窗口已顺利渡过，可准备回病房后仍需留意恶露与首次排尿。'
      : `距下次看一眼产褥垫出血约 ${minsUntilNextPadCheck} 分钟（每 15 分钟查看一次）`,
  };
}

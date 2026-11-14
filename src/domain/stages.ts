import type {
  BirthProfile,
  ProfilePredicate,
  ResolvedStage,
  StageKey,
  StageTemplate,
} from './types';

function matchesPredicate(profile: BirthProfile, when?: ProfilePredicate): boolean {
  return when ? when(profile) : true;
}

export function resolveStages(
  profile: BirthProfile,
  templates: StageTemplate[],
): ResolvedStage[] {
  return templates
    .filter((template) => {
      if (!template.applicableModes.includes(profile.birthMode)) {
        return false;
      }
      if (
        template.applicableParities &&
        !template.applicableParities.includes(profile.parity)
      ) {
        return false;
      }
      return true;
    })
    .map((template) => ({
      key: template.key,
      name: template.name,
      shortName: template.shortName,
      headline: template.headline,
      subHeadline: template.subHeadline,
      evidenceRef: template.evidenceRef,
      dos: template.dos.filter((item) => matchesPredicate(profile, item.when)),
      questions: template.questions.filter((item) => matchesPredicate(profile, item.when)),
      redLines: template.redLines.filter((item) => matchesPredicate(profile, item.when)),
      knowledgeBlocks: (template.knowledgeBlocks ?? []).filter((item) =>
        matchesPredicate(profile, item.when),
      ),
      mom: {
        headline: template.mom.headline,
        dos: template.mom.dos.filter((item) => matchesPredicate(profile, item.when)),
      },
    }));
}

export function clampStageKey(
  stageKey: StageKey,
  stages: ResolvedStage[],
): StageKey {
  if (stages.length === 0) {
    return 'prep';
  }
  const found = stages.some((stage) => stage.key === stageKey);
  return found ? stageKey : stages[0]!.key;
}

export interface StageNavigationInfo {
  index: number;
  total: number;
  stage: ResolvedStage;
  prevKey: StageKey | null;
  nextKey: StageKey | null;
}

export function getStageNavigation(
  stageKey: StageKey,
  stages: ResolvedStage[],
): StageNavigationInfo | null {
  if (stages.length === 0) return null;
  const idx = stages.findIndex((s) => s.key === stageKey);
  const safeIdx = idx >= 0 ? idx : 0;
  const stage = stages[safeIdx]!;
  return {
    index: safeIdx,
    total: stages.length,
    stage,
    prevKey: safeIdx > 0 ? stages[safeIdx - 1]!.key : null,
    nextKey: safeIdx < stages.length - 1 ? stages[safeIdx + 1]!.key : null,
  };
}

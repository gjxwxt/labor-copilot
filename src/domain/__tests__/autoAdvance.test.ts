import { describe, expect, it } from 'vitest';
import { STAGE_TEMPLATES } from '../../content/stages';
import {
  evaluateEventTransition,
  getPostpartumCountdown,
  getStageGroup,
  groupStagesByScene,
  POSTPARTUM_WATCH_WINDOW_MS,
} from '../autoAdvance';
import { createDefaultProfile } from '../profile';
import { resolveStages } from '../stages';
import { createClinicalEvent } from '../timeline';

describe('autoAdvance & scene grouping', () => {
  it('groups stages cleanly into home, hospital, and recovery scenes', () => {
    const profile = createDefaultProfile();
    const stages = resolveStages(profile, STAGE_TEMPLATES);
    const groups = groupStagesByScene(stages);

    expect(groups.map((g) => g.key)).toEqual(['home', 'hospital', 'recovery']);
    expect(getStageGroup('prep')).toBe('home');
    expect(getStageGroup('active')).toBe('hospital');
    expect(getStageGroup('post2h')).toBe('recovery');
  });

  it('suggests the next hospital stage on admitted and cervix checks without moving backwards', () => {
    const now = 1_700_000_000_000;
    const spontaneous = createDefaultProfile();
    const stages = resolveStages(spontaneous, STAGE_TEMPLATES);

    const admRes = evaluateEventTransition(
      createClinicalEvent('e1', 'admitted', now),
      'prep',
      spontaneous,
      stages,
    );
    expect(admRes.suggestStage?.targetKey).toBe('latent');

    const induction = { ...spontaneous, birthMode: 'induction' as const };
    const indStages = resolveStages(induction, STAGE_TEMPLATES);
    expect(
      evaluateEventTransition(
        createClinicalEvent('e2', 'admitted', now),
        'prep',
        induction,
        indStages,
      ).suggestStage?.targetKey,
    ).toBe('ripening');

    const cervix4Res = evaluateEventTransition(
      createClinicalEvent('e3', 'cervix_check', now, undefined, { dilationCm: 4 }),
      'latent',
      spontaneous,
      stages,
    );
    expect(cervix4Res.suggestStage?.targetKey).toBe('active');

    // Should not suggest moving backwards if already in second stage
    const backwardCheck = evaluateEventTransition(
      createClinicalEvent('e4', 'cervix_check', now, undefined, { dilationCm: 5 }),
      'second',
      spontaneous,
      stages,
    );
    expect(backwardCheck.suggestStage).toBeUndefined();
  });

  it('raises urgent takeover modal for meconium/bloody amniotic fluid but not clear fluid', () => {
    const now = 1_700_000_000_000;
    const profile = createDefaultProfile();
    const stages = resolveStages(profile, STAGE_TEMPLATES);

    const clearRes = evaluateEventTransition(
      createClinicalEvent('w1', 'water_broke', now, undefined, { fluidStatus: 'clear' }),
      'latent',
      profile,
      stages,
    );
    expect(clearRes.urgentAlert).toBeUndefined();

    const meconiumRes = evaluateEventTransition(
      createClinicalEvent('w2', 'water_broke', now, undefined, { fluidStatus: 'meconium' }),
      'latent',
      profile,
      stages,
    );
    expect(meconiumRes.urgentAlert?.title).toContain('黄绿');
  });

  it('auto-advances to post2h on baby_born and drives 2-hour postpartum countdown', () => {
    const bornAt = 1_700_000_000_000;
    const profile = createDefaultProfile();
    const stages = resolveStages(profile, STAGE_TEMPLATES);
    const bornEvent = createClinicalEvent('b1', 'baby_born', bornAt);

    const res = evaluateEventTransition(bornEvent, 'second', profile, stages);
    expect(res.autoAdvanceTo).toBe('post2h');

    expect(getPostpartumCountdown([], bornAt)).toBeNull();

    const after15m = getPostpartumCountdown([bornEvent], bornAt + 15 * 60_000 + 1000);
    expect(after15m?.completed).toBe(false);
    expect(after15m?.formattedRemaining).toBe('01:44:59');

    const after2h = getPostpartumCountdown(
      [bornEvent],
      bornAt + POSTPARTUM_WATCH_WINDOW_MS + 10_000,
    );
    expect(after2h?.completed).toBe(true);
    expect(after2h?.formattedRemaining).toBe('00:00:00');
  });
});

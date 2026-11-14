import { describe, expect, it } from 'vitest';
import { STAGE_TEMPLATES } from '../../content/stages';
import { createDefaultProfile, getPresetById } from '../profile';
import { clampStageKey, getStageNavigation, resolveStages } from '../stages';

describe('resolveStages & stage navigation', () => {
  it('excludes induction ripening and C-section stages for spontaneous birth', () => {
    const profile = getPresetById('preset_spontaneous_first')!;
    const resolved = resolveStages(profile, STAGE_TEMPLATES);
    const keys = resolved.map((s) => s.key);

    expect(keys).not.toContain('ripening');
    expect(keys).not.toContain('csection_or');
    expect(keys).not.toContain('csection_postop');
    expect(keys).toContain('latent');
    expect(keys).toContain('second');
    expect(keys).toContain('third');
    expect(keys).toContain('post2h');
  });

  it('includes ripening stage for planned induction', () => {
    const profile = getPresetById('preset_induction_first')!;
    const resolved = resolveStages(profile, STAGE_TEMPLATES);
    const keys = resolved.map((s) => s.key);

    expect(keys).toContain('ripening');
    expect(keys).toContain('latent');
    expect(keys).not.toContain('csection_or');
  });

  it('switches to C-section pathway for planned_csection', () => {
    const profile = getPresetById('preset_planned_csection')!;
    const resolved = resolveStages(profile, STAGE_TEMPLATES);
    const keys = resolved.map((s) => s.key);

    expect(keys).toEqual([
      'prep',
      'csection_or',
      'csection_postop',
      'post2h',
      'day1',
      'day2',
      'day3',
    ]);
  });

  it('dynamically injects risk-tag items and questions when tags are enabled', () => {
    const base = createDefaultProfile();
    const withRisks = {
      ...base,
      riskTags: ['gbs_positive' as const, 'macrosomia' as const, 'vbac' as const],
    };

    const baseStages = resolveStages(base, STAGE_TEMPLATES);
    const riskStages = resolveStages(withRisks, STAGE_TEMPLATES);

    const basePrep = baseStages.find((s) => s.key === 'prep')!;
    const riskPrep = riskStages.find((s) => s.key === 'prep')!;
    expect(riskPrep.dos.some((d) => d.id === 'prep_gbs_note')).toBe(true);
    expect(basePrep.dos.some((d) => d.id === 'prep_gbs_note')).toBe(false);
    expect(riskPrep.questions.some((q) => q.id === 'q_prep_macrosomia')).toBe(true);
    expect(riskPrep.redLines.some((r) => r.id === 'rl_vbac_scar')).toBe(true);
  });

  it('clamps stage key safely when mode changes invalidate current stage', () => {
    const spontaneousStages = resolveStages(
      getPresetById('preset_spontaneous_first')!,
      STAGE_TEMPLATES,
    );
    expect(clampStageKey('ripening', spontaneousStages)).toBe('prep');
    expect(clampStageKey('latent', spontaneousStages)).toBe('latent');

    const nav = getStageNavigation('latent', spontaneousStages);
    expect(nav?.prevKey).toBe('prep');
    expect(nav?.nextKey).toBe('anesth');
  });
});

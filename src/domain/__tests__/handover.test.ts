import { describe, expect, it } from 'vitest';
import { STAGE_TEMPLATES } from '../../content/stages';
import { buildHandoverSummary } from '../handover';
import { createDefaultProfile } from '../profile';
import { resolveStages } from '../stages';
import { createInitialState, sanitizeAppState } from '../storage';
import { createClinicalEvent, exportHandoverMarkdown } from '../timeline';

describe('handover summary, timeline export & storage sanitization', () => {
  it('builds high-priority clinical handover alerts for GBS+ with water broken & meconium fluid', () => {
    const now = 1_700_000_000_000;
    const profile = {
      ...createDefaultProfile(),
      riskTags: ['gbs_positive' as const, 'gdm' as const],
    };
    const stage = resolveStages(profile, STAGE_TEMPLATES)[1]!; // latent
    const events = [
      createClinicalEvent('e1', 'admitted', now - 120 * 60_000),
      createClinicalEvent('e2', 'water_broke', now - 45 * 60_000, undefined, {
        fluidStatus: 'meconium',
      }),
      createClinicalEvent('e3', 'cervix_check', now - 15 * 60_000, undefined, {
        dilationCm: 4,
      }),
      createClinicalEvent('e4', 'epidural_placed', now - 5 * 60_000),
    ];

    const summary = buildHandoverSummary(profile, [], events, stage, now);

    expect(summary.waterStatus.broken).toBe(true);
    expect(summary.waterStatus.warningFlag).toBe(true);
    expect(summary.cervixStatus.dilationCm).toBe(4);
    expect(summary.epiduralStatus.placed).toBe(true);
    expect(summary.riskAlerts.some((a) => a.id === 'alert_gbs_water')).toBe(true);
    expect(summary.riskAlerts.some((a) => a.id === 'alert_fluid')).toBe(true);

    const state = {
      ...createInitialState(now),
      profile,
      events,
    };
    const md = exportHandoverMarkdown(summary, state, now);
    expect(md).toContain('4 公分');
    expect(md).toContain('黄绿');
    expect(md).toContain('已实施');
  });

  it('recovers gracefully from malformed persisted state', () => {
    const recovered = sanitizeAppState(
      {
        profile: {
          parity: 'invalid_parity',
          birthMode: 'induction',
          riskTags: ['gbs_positive', 'unknown_tag', 'gbs_positive'],
        },
        currentStageKey: 'non_existent_stage',
        activeTab: 'bad_tab',
        contractions: [{ id: 'ok', startedAt: 1000 }, { bad: true }],
      },
      9999,
    );

    expect(recovered.profile.parity).toBe('nulliparous');
    expect(recovered.profile.birthMode).toBe('induction');
    expect(recovered.profile.riskTags).toEqual(['gbs_positive']);
    expect(recovered.currentStageKey).toBe('prep');
    expect(recovered.activeTab).toBe('home');
    expect(recovered.contractions).toHaveLength(1);
  });

  it('migrates legacy v1/v2 tabs and sanitizes askedQuestions map', () => {
    const migrated = sanitizeAppState(
      {
        activeTab: 'contractions',
        askedQuestions: { q_prep_policy: true, bad: 'yes' },
      },
      1000,
    );
    expect(migrated.activeTab).toBe('tools');
    expect(migrated.askedQuestions).toEqual({ q_prep_policy: true });

    const migratedCompanion = sanitizeAppState({ activeTab: 'companion' }, 1000);
    expect(migratedCompanion.activeTab).toBe('tools');

    const migratedRedlines = sanitizeAppState({ activeTab: 'redlines' }, 1000);
    expect(migratedRedlines.activeTab).toBe('home');
  });
});

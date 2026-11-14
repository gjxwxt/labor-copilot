import { describe, expect, it } from 'vitest';
import { buildBirthKeepsakeData } from '../keepsake';
import { createInitialState } from '../storage';
import { createClinicalEvent } from '../timeline';

describe('keepsake timeline builder', () => {
  it('orders clinical milestones chronologically and counts contractions cleanly', () => {
    const base = 1_700_000_000_000;
    const state = {
      ...createInitialState(base),
      contractions: [
        { id: 'c1', startedAt: base + 10_000, endedAt: base + 55_000 },
        { id: 'c2', startedAt: base + 310_000, endedAt: base + 365_000 },
      ],
      events: [
        createClinicalEvent('e2', 'baby_born', base + 9_000_000),
        createClinicalEvent('e1', 'admitted', base + 1_000_000),
        createClinicalEvent('e3', 'cervix_check', base + 4_000_000, undefined, {
          dilationCm: 4,
        }),
      ],
    };

    const data = buildBirthKeepsakeData(state, base + 9_100_000);

    expect(data.title).toBe('迎新纪念时间轴');
    expect(data.totalContractions).toBe(2);
    expect(data.milestones.map((m) => m.label)).toEqual([
      '办理入院',
      '内检开指',
      '宝宝出生',
    ]);
    expect(data.milestones[1]?.detail).toContain('4 公分');
    expect(data.bornTimeText).toBeTruthy();
  });
});

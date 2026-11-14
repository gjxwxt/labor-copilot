import { describe, expect, it } from 'vitest';
import {
  computeContractionStats,
  evaluateLaborRule,
  formatClockDuration,
  formatSecondsCompact,
  removeContraction,
  startContraction,
  stopContraction,
} from '../contractions';
import { createDefaultProfile, getPresetById } from '../profile';
import type { ContractionRecord } from '../types';

const MIN = 60 * 1000;
const SEC = 1000;

describe('contractions engine', () => {
  it('starts, stops, and removes contractions cleanly', () => {
    let list: ContractionRecord[] = [];
    list = startContraction(list, 1000, 'c1');
    // Calling start again while running is a no-op
    list = startContraction(list, 2000, 'c2');
    expect(list).toHaveLength(1);

    list = stopContraction(list, 46_000, 2);
    expect(list[0]).toEqual({
      id: 'c1',
      startedAt: 1000,
      endedAt: 46_000,
      intensity: 2,
    });

    list = removeContraction(list, 'c1');
    expect(list).toHaveLength(0);
  });

  it('recognizes 5-1-1 across a >60 minute contiguous cluster for nulliparous', () => {
    const profile = createDefaultProfile();
    const base = 1_700_000_000_000;
    // 14 contractions spaced 5 min apart (65 min span), each lasting 50s
    const records: ContractionRecord[] = Array.from({ length: 14 }, (_, i) => ({
      id: `c_${i}`,
      startedAt: base + i * 5 * MIN,
      endedAt: base + i * 5 * MIN + 50 * SEC,
    }));
    const now = base + 13 * 5 * MIN + 2 * MIN;

    const result = evaluateLaborRule(records, profile, now);
    expect(result.level).toBe('go');
    expect(result.reason).toBe('rule_511_met');
    expect(result.clusterCount).toBe(14);
    expect(result.clusterSpanMin).toBe(65);
  });

  it('triggers earlier regular-labor alert for multiparous profile', () => {
    const profile = getPresetById('preset_spontaneous_multi')!;
    const base = 1_700_000_000_000;
    // 7 contractions spaced 5.5 min apart (33 min span), each 45s
    const records: ContractionRecord[] = Array.from({ length: 7 }, (_, i) => ({
      id: `m_${i}`,
      startedAt: base + i * 5.5 * MIN,
      endedAt: base + i * 5.5 * MIN + 45 * SEC,
    }));
    const now = base + 6 * 5.5 * MIN + 60 * SEC;

    const result = evaluateLaborRule(records, profile, now);
    expect(result.level).toBe('go');
    expect(result.reason).toBe('multiparous_regular_met');
  });

  it('detects short frequent contractions as approaching/prodromal', () => {
    const profile = createDefaultProfile();
    const base = 1_700_000_000_000;
    // 5 contractions every 4 min, only 25s each
    const records: ContractionRecord[] = Array.from({ length: 5 }, (_, i) => ({
      id: `s_${i}`,
      startedAt: base + i * 4 * MIN,
      endedAt: base + i * 4 * MIN + 25 * SEC,
    }));
    const now = base + 4 * 4 * MIN + 60 * SEC;

    const result = evaluateLaborRule(records, profile, now);
    expect(result.level).toBe('approaching');
    expect(result.reason).toBe('short_frequent');
  });

  it('triggers urgent_alert when a single contraction lasts >= 120 seconds', () => {
    const profile = createDefaultProfile();
    const base = 1_700_000_000_000;
    const records: ContractionRecord[] = [{ id: 'long_1', startedAt: base }];
    const now = base + 125 * SEC;

    const result = evaluateLaborRule(records, profile, now);
    expect(result.level).toBe('urgent_alert');
    expect(result.reason).toBe('prolonged_contraction');
  });

  it('triggers urgent_alert on tachysystole (>5 contractions in 10 min)', () => {
    const profile = createDefaultProfile();
    const base = 1_700_000_000_000;
    // 6 contractions in 8.5 minutes
    const records: ContractionRecord[] = Array.from({ length: 6 }, (_, i) => ({
      id: `t_${i}`,
      startedAt: base + i * 1.6 * MIN,
      endedAt: base + i * 1.6 * MIN + 40 * SEC,
    }));
    const now = base + 9 * MIN;

    const stats = computeContractionStats(records, now);
    expect(stats.recent10mCount).toBe(6);

    const result = evaluateLaborRule(records, profile, now);
    expect(result.level).toBe('urgent_alert');
    expect(result.reason).toBe('tachysystole');
  });

  it('formats durations cleanly', () => {
    expect(formatClockDuration(0)).toBe('00:00');
    expect(formatClockDuration(65_000)).toBe('01:05');
    expect(formatClockDuration(3_665_000)).toBe('1:01:05');
    expect(formatSecondsCompact(45)).toBe('45秒');
    expect(formatSecondsCompact(72)).toBe('1分12秒');
    expect(formatSecondsCompact(null)).toBe('—');
  });
});

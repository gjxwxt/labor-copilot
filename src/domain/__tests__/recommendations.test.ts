import { describe, expect, it } from 'vitest';
import { KNOWLEDGE_CARDS } from '../../content/knowledge';
import {
  filterKnowledgeCards,
  getHomeRecommendations,
  isLaborFocusedStage,
  LIFE_STAGE_META,
  rankKnowledgeForUser,
} from '../recommendations';

describe('V3 Keep-style recommendations engine', () => {
  it('reorders home recommendations significantly between pregnant_prep and infant_1_3m', () => {
    const prepRecs = getHomeRecommendations(
      KNOWLEDGE_CARDS,
      'pregnant_prep',
      LIFE_STAGE_META.pregnant_prep.defaultFocusTags,
    );
    const infantRecs = getHomeRecommendations(
      KNOWLEDGE_CARDS,
      'infant_1_3m',
      LIFE_STAGE_META.infant_1_3m.defaultFocusTags,
    );

    expect(prepRecs.emergencyCards.length).toBeGreaterThanOrEqual(4);
    expect(prepRecs.recommendedCards.length).toBeGreaterThanOrEqual(3);

    const prepTopIds = prepRecs.recommendedCards.map((c) => c.id);
    const infantTopIds = infantRecs.recommendedCards.map((c) => c.id);
    expect(prepTopIds).toContain('labor_breathing_epidural');
    expect(infantTopIds[0]).not.toBe('labor_breathing_epidural');
    expect(infantTopIds).toEqual(
      expect.arrayContaining(['airplane_hold', 'burping_anti_spit']),
    );
  });

  it('filters by query, category, and favorites cleanly', () => {
    const scalds = filterKnowledgeCards(KNOWLEDGE_CARDS, { query: '烫伤' });
    expect(scalds.map((c) => c.id)).toContain('scald_burn');

    const emergencyOnly = filterKnowledgeCards(KNOWLEDGE_CARDS, { category: 'emergency' });
    expect(emergencyOnly.every((c) => c.category === 'emergency')).toBe(true);

    const favOnly = filterKnowledgeCards(KNOWLEDGE_CARDS, {
      onlyFavorites: true,
      favoriteIds: ['airplane_hold'],
    });
    expect(favOnly.map((c) => c.id)).toEqual(['airplane_hold']);
  });

  it('marks labor-focused stages accurately for adaptive Tools tab priority', () => {
    expect(isLaborFocusedStage('pregnant_prep')).toBe(true);
    expect(isLaborFocusedStage('in_labor')).toBe(true);
    expect(isLaborFocusedStage('newborn_week1')).toBe(false);
    expect(isLaborFocusedStage('infant_1_3m')).toBe(false);
    expect(isLaborFocusedStage('infant_4_12m')).toBe(false);
  });

  it('boosts cards matching user selected focusTags within the same life stage', () => {
    const withPostpartum = rankKnowledgeForUser(KNOWLEDGE_CARDS, {
      lifeStage: 'newborn_week1',
      focusTags: ['postpartum'],
    });
    const postpartumIds = withPostpartum
      .filter((c) => !c.isEmergency)
      .slice(0, 4)
      .map((c) => c.id);
    expect(postpartumIds).toContain('jaundice_poop_week1');
    expect(postpartumIds).toContain('umbilical_cord_care');
  });
});

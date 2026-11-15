import { useMemo, useState } from 'react';
import type {
  FocusTag,
  KnowledgeCard,
  KnowledgeCategory,
  LifeStageId,
} from '../../domain/types';
import {
  KNOWLEDGE_CATEGORY_LABELS,
  LIFE_STAGE_META,
  rankKnowledgeForUser,
} from '../../domain/recommendations';

interface LibraryViewProps {
  cards: KnowledgeCard[];
  lifeStage: LifeStageId;
  focusTags: FocusTag[];
  favoriteIds: string[];
  onOpenCard: (cardId: string) => void;
  onToggleFavorite: (cardId: string) => void;
}

const CATEGORIES: Array<KnowledgeCategory | 'all'> = [
  'all',
  'emergency',
  'feeding',
  'soothing',
  'labor',
  'postpartum',
  'safety',
];

export function LibraryView({
  cards,
  lifeStage,
  focusTags,
  favoriteIds,
  onOpenCard,
  onToggleFavorite,
}: LibraryViewProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<KnowledgeCategory | 'all'>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const favSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const rankedCards = useMemo(
    () =>
      rankKnowledgeForUser(cards, {
        lifeStage,
        focusTags,
        query,
        category,
        onlyFavorites,
        favoriteIds,
      }),
    [cards, lifeStage, focusTags, query, category, onlyFavorites, favoriteIds],
  );

  return (
    <div className="view-wrap library-view">
      <section className="library-header-card">
        <div className="library-title-row">
          <div>
            <h2 className="section-heading">家庭知识库与严选视频</h2>
            <p className="library-sub">
              站主梳理权威指南与示范位置，按「{LIFE_STAGE_META[lifeStage].shortLabel}」优先排序。
            </p>
          </div>
          <span className="count-pill">{rankedCards.length} 条</span>
        </div>

        <div className="search-bar-wrap">
          <input
            type="search"
            className="text-input search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜：呛奶 / 烫伤 / 飞机抱 / 黄疸 / 辅食 / 无痛..."
            aria-label="搜索知识库"
          />
          {query ? (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setQuery('')}
              aria-label="清空搜索词"
            >
              清空
            </button>
          ) : null}
        </div>

        <div className="category-chip-strip" role="tablist" aria-label="知识分类筛选">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={category === cat}
              className={`category-chip${category === cat ? ' active' : ''}${cat === 'emergency' ? ' emg' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {KNOWLEDGE_CATEGORY_LABELS[cat]}
            </button>
          ))}
          <button
            type="button"
            className={`category-chip fav-filter${onlyFavorites ? ' active' : ''}`}
            aria-pressed={onlyFavorites}
            onClick={() => setOnlyFavorites((prev) => !prev)}
          >
            ★ 只看收藏 ({favoriteIds.length})
          </button>
        </div>
      </section>

      {rankedCards.length === 0 ? (
        <div className="empty-card">
          <p className="empty-title">没有匹配到相关条目</p>
          <p className="empty-sub">试试换个关键词，或者切回「全部」分类看看。</p>
          <button
            type="button"
            className="btn btn-ghost btn-compact"
            onClick={() => {
              setQuery('');
              setCategory('all');
              setOnlyFavorites(false);
            }}
          >
            重置筛选条件
          </button>
        </div>
      ) : (
        <div className="knowledge-card-list">
          {rankedCards.map((card) => {
            const isFav = favSet.has(card.id);
            return (
              <article
                key={card.id}
                className={`knowledge-card${card.isEmergency ? ' is-emergency' : ''}`}
              >
                <div className="kc-cover-row">
                  <span className={`kc-tone-badge tone-${card.coverTone}`}>
                    {card.isEmergency
                      ? '急症优先'
                      : KNOWLEDGE_CATEGORY_LABELS[card.category]}
                  </span>
                  <div className="kc-meta-right">
                    <span className="kc-duration">▶ {card.durationText}</span>
                    <button
                      type="button"
                      className={`fav-icon-btn${isFav ? ' saved' : ''}`}
                      onClick={() => onToggleFavorite(card.id)}
                      aria-label={isFav ? `取消收藏 ${card.title}` : `收藏 ${card.title}`}
                      aria-pressed={isFav}
                    >
                      {isFav ? '★ 已收藏' : '☆ 收藏'}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="kc-body-btn"
                  onClick={() => onOpenCard(card.id)}
                >
                  <h3 className="kc-title">{card.title}</h3>
                  <p className="kc-sub">{card.subtitle}</p>
                  <p className="kc-summary">{card.summary}</p>
                  <div className="kc-footer-meta">
                    <span className="kc-window">{card.keyWindow}</span>
                    <span className="kc-source">{card.sourceName}</span>
                  </div>
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

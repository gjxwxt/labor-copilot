import type { FocusTag, KnowledgeCard, LifeStageId } from '../../domain/types';
import {
  FOCUS_TAG_META,
  getHomeRecommendations,
  isLaborFocusedStage,
  LIFE_STAGE_META,
} from '../../domain/recommendations';
import { StageCalibrationCard } from './StageCalibrationCard';

interface HomeViewProps {
  lifeStage: LifeStageId;
  focusTags: FocusTag[];
  hasCompletedCalibration: boolean;
  cards: KnowledgeCard[];
  favoriteIds: string[];
  onConfirmCalibration: (stage: LifeStageId, focusTags: FocusTag[]) => void;
  onOpenCalibrationModal: () => void;
  onOpenCard: (cardId: string) => void;
  onToggleFavorite: (cardId: string) => void;
  onGoLibrary: () => void;
  onGoTools: () => void;
}

const TONE_LABELS: Record<KnowledgeCard['coverTone'], string> = {
  red: '急救红线',
  amber: '风险处置',
  blue: '实操示范',
  green: '日常护航',
  purple: '安抚减压',
};

export function HomeView({
  lifeStage,
  focusTags,
  hasCompletedCalibration,
  cards,
  favoriteIds,
  onConfirmCalibration,
  onOpenCalibrationModal,
  onOpenCard,
  onToggleFavorite,
  onGoLibrary,
  onGoTools,
}: HomeViewProps) {
  const stageMeta = LIFE_STAGE_META[lifeStage];
  const favSet = new Set(favoriteIds);
  const { emergencyCards, recommendedCards } = getHomeRecommendations(
    cards,
    lifeStage,
    focusTags,
    4,
  );
  const laborStage = isLaborFocusedStage(lifeStage);

  return (
    <div className="view-wrap home-view">
      {!hasCompletedCalibration ? (
        <StageCalibrationCard
          initialStage={lifeStage}
          initialFocusTags={focusTags}
          mode="inline"
          onConfirm={onConfirmCalibration}
        />
      ) : null}

      <section className="emergency-fast-section" aria-label="家庭紧急情况 0 秒直达">
        <div className="section-row-head">
          <div>
            <div className="section-kicker red">突发急症 · 免搜索 0 秒直达</div>
            <h2 className="section-heading">真遇上事直接点这里</h2>
          </div>
          <span className="offline-pill">离线可用</span>
        </div>

        <div className="emergency-fast-grid">
          {emergencyCards.map((card) => (
            <button
              key={card.id}
              type="button"
              className={`emergency-fast-tile tone-${card.coverTone}`}
              onClick={() => onOpenCard(card.id)}
            >
              <span className="emg-tile-top">
                <span className="emg-dot" aria-hidden="true" />
                <span className="emg-tile-badge">{card.keyWindow}</span>
              </span>
              <span className="emg-tile-title">
                {card.emergencyShortLabel || card.title}
              </span>
              <span className="emg-tile-sub">{card.subtitle}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="stage-hero-card" aria-label="当前个人阶段方案">
        <div className="stage-hero-top">
          <div>
            <span className="stage-hero-badge">{stageMeta.badgeText}</span>
            <h2 className="stage-hero-title">{stageMeta.label}</h2>
            <p className="stage-hero-sub">{stageMeta.subtitle}</p>
          </div>
          <button
            type="button"
            className="pill-btn compact"
            onClick={onOpenCalibrationModal}
          >
            重新校准
          </button>
        </div>

        <div className="stage-hero-tags">
          {focusTags.map((tag) => (
            <span key={tag} className="tag-chip-static">
              {FOCUS_TAG_META[tag].label}
            </span>
          ))}
        </div>

        <div className="stage-hero-tips">
          {stageMeta.homeTips.map((tip, idx) => (
            <div key={idx} className="hero-tip-line">
              <span className="hero-tip-index">{idx + 1}</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>

        <div className="stage-hero-actions">
          <button type="button" className="btn btn-primary btn-compact" onClick={onGoTools}>
            {laborStage ? '产程陪产与计时' : '打开急救工具箱'}
          </button>
          <button type="button" className="btn btn-ghost btn-compact" onClick={onGoLibrary}>
            逛全部知识库
          </button>
        </div>
      </section>

      <section className="recommend-section" aria-label="为你推荐本阶段严选视频与图文">
        <div className="section-row-head">
          <div>
            <div className="section-kicker">个性化推荐 · {stageMeta.shortLabel}</div>
            <h2 className="section-heading">为你精选的必学内容</h2>
          </div>
          <button type="button" className="link-more-btn" onClick={onGoLibrary}>
            全部 {cards.length} 节 ›
          </button>
        </div>

        <div className="knowledge-card-list">
          {recommendedCards.map((card) => {
            const isFav = favSet.has(card.id);
            return (
              <article key={card.id} className="knowledge-card">
                <div className="kc-cover-row">
                  <span className={`kc-tone-badge tone-${card.coverTone}`}>
                    {TONE_LABELS[card.coverTone]}
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
                  <div className="kc-footer-meta">
                    <span className="kc-window">{card.keyWindow}</span>
                    <span className="kc-source">{card.sourceName}</span>
                  </div>
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

import { useState } from 'react';
import type {
  BirthProfile,
  ResolvedStage,
  StageGroupKey,
  StageKey,
} from '../../domain/types';
import { PACKING_CATEGORIES } from '../../content/checklists';
import {
  getStageGroup,
  groupStagesByScene,
  type PostpartumCountdown,
  type StageSuggestionPayload,
} from '../../domain/autoAdvance';
import { ContextOnboarding } from './ContextOnboarding';

interface CompanionViewProps {
  profile: BirthProfile;
  hasCompletedOnboarding: boolean;
  stages: ResolvedStage[];
  currentStage: ResolvedStage;
  prevKey: StageKey | null;
  nextKey: StageKey | null;
  checkedItems: Record<string, boolean>;
  askedQuestions: Record<string, boolean>;
  stageSuggestion: StageSuggestionPayload | null;
  postpartumCountdown: PostpartumCountdown | null;
  onQuickStart: (updates: Partial<BirthProfile>, targetStage: StageKey) => void;
  onSelectStage: (key: StageKey) => void;
  onToggleCheck: (itemId: string) => void;
  onToggleAsked: (questionId: string) => void;
  onDismissSuggestion: () => void;
  onOpenProfile: () => void;
  onGoRedLines: () => void;
  onGoMom: () => void;
}

export function CompanionView({
  profile,
  hasCompletedOnboarding,
  stages,
  currentStage,
  prevKey,
  nextKey,
  checkedItems,
  askedQuestions,
  stageSuggestion,
  postpartumCountdown,
  onQuickStart,
  onSelectStage,
  onToggleCheck,
  onToggleAsked,
  onDismissSuggestion,
  onOpenProfile,
  onGoRedLines,
  onGoMom,
}: CompanionViewProps) {
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [openBlocks, setOpenBlocks] = useState<Record<string, boolean>>({});
  const [packingOpen, setPackingOpen] = useState(false);
  const [showAskedDrawer, setShowAskedDrawer] = useState(false);

  const groupedStages = groupStagesByScene(stages);
  const activeGroupKey = getStageGroup(currentStage.key);
  const activeGroup =
    groupedStages.find((g) => g.key === activeGroupKey) ?? groupedStages[0];

  const handleSelectSceneGroup = (groupKey: StageGroupKey) => {
    if (groupKey === activeGroupKey) return;
    const targetGroup = groupedStages.find((g) => g.key === groupKey);
    if (targetGroup && targetGroup.stages.length > 0) {
      onSelectStage(targetGroup.stages[0]!.key);
    }
  };

  const toggleDetail = (id: string) => {
    setExpandedDetails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleBlock = (id: string) => {
    setOpenBlocks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const visiblePackingCategories = PACKING_CATEGORIES.filter((cat) =>
    cat.when ? cat.when(profile) : true,
  );

  const unaskedQuestions = currentStage.questions.filter((q) => !askedQuestions[q.id]);
  const askedQuestionList = currentStage.questions.filter((q) => askedQuestions[q.id]);

  return (
    <div className="view-wrap">
      {!hasCompletedOnboarding ? (
        <ContextOnboarding
          profile={profile}
          onQuickStart={onQuickStart}
          onOpenFullProfile={onOpenProfile}
        />
      ) : null}

      {stageSuggestion ? (
        <section className="suggestion-banner" role="status" aria-live="polite">
          <div className="suggestion-copy">{stageSuggestion.message}</div>
          <div className="suggestion-actions">
            <button
              type="button"
              className="suggestion-go-btn"
              onClick={() => {
                onSelectStage(stageSuggestion.targetKey);
                onDismissSuggestion();
              }}
            >
              切到「{stageSuggestion.targetName}」
            </button>
            <button
              type="button"
              className="mini-del-btn"
              onClick={onDismissSuggestion}
            >
              暂不
            </button>
          </div>
        </section>
      ) : null}

      {currentStage.key === 'post2h' && postpartumCountdown ? (
        <section className="post2h-hero-card" aria-labelledby="post2h-countdown-title">
          <div className="eyebrow">
            <span id="post2h-countdown-title" style={{ color: 'var(--amber)' }}>
              产后 2 小时黄金观察期守护
            </span>
          </div>
          <div className="post2h-clock-row">
            <span className="post2h-clock">
              {postpartumCountdown.completed
                ? '00:00:00'
                : postpartumCountdown.formattedRemaining}
            </span>
            <span className="post2h-status">
              {postpartumCountdown.completed ? '黄金 2h 已平安度过' : '重点守候倒计时'}
            </span>
          </div>
          <div className="post2h-bar" aria-hidden="true">
            <span style={{ width: `${Math.round(postpartumCountdown.progressRatio * 100)}%` }} />
          </div>
          <p className="post2h-note">{postpartumCountdown.nextCheckPrompt}</p>
        </section>
      ) : null}

      <div className="scene-nav-card" role="region" aria-label="场景与产程阶段导航">
        <div className="scene-group-tabs" role="tablist" aria-label="场景阶段分组">
          {groupedStages.map((group) => (
            <button
              key={group.key}
              type="button"
              role="tab"
              aria-selected={group.key === activeGroupKey}
              className={`scene-tab${group.key === activeGroupKey ? ' active' : ''}`}
              onClick={() => handleSelectSceneGroup(group.key)}
            >
              {group.label}
            </button>
          ))}
        </div>

        {activeGroup && activeGroup.stages.length > 1 ? (
          <div className="chips-row">
            {activeGroup.stages.map((s) => (
              <button
                key={s.key}
                type="button"
                className={`chip-btn${s.key === currentStage.key ? ' active' : ''}`}
                aria-pressed={s.key === currentStage.key}
                onClick={() => onSelectStage(s.key)}
              >
                {s.shortName}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <section className="card card-hero" aria-labelledby="hero-stage-focus">
        <div className="eyebrow" id="hero-stage-focus">
          <span>现在只做这一件事</span>
          <button
            type="button"
            className="mini-del-btn"
            style={{ borderColor: 'var(--purple-border)', color: 'var(--purple)' }}
            onClick={onGoMom}
          >
            切给妈妈看 →
          </button>
        </div>
        <p className="hero-headline">{currentStage.headline}</p>
        {currentStage.subHeadline ? (
          <p className="hero-sub">{currentStage.subHeadline}</p>
        ) : null}
        <p className="evidence-tag">循证参考：{currentStage.evidenceRef}</p>
      </section>

      <section className="card" aria-labelledby="stage-dos-heading">
        <div className="eyebrow" id="stage-dos-heading">
          <span>核心动作清单（先看粗体，点开看细节）</span>
        </div>
        <ul className="check-list">
          {currentStage.dos.map((item) => {
            const done = Boolean(checkedItems[item.id]);
            const detailOpen = Boolean(expandedDetails[item.id]);
            return (
              <li key={item.id} className={`check-row-card${done ? ' done' : ''}`}>
                <div className="check-row-main">
                  <button
                    type="button"
                    className={`check-item-btn-v2${done ? ' done' : ''}`}
                    aria-pressed={done}
                    onClick={() => onToggleCheck(item.id)}
                  >
                    <span className="check-box" aria-hidden="true">
                      {done ? '✓' : ''}
                    </span>
                    <span className="check-text-v2">
                      {item.badge ? <span className="badge-tag">{item.badge}</span> : null}
                      {item.text}
                    </span>
                  </button>
                  {item.detail ? (
                    <button
                      type="button"
                      className="detail-toggle-btn"
                      aria-expanded={detailOpen}
                      aria-label={detailOpen ? '收起详细说明' : '展开详细说明'}
                      onClick={() => toggleDetail(item.id)}
                    >
                      {detailOpen ? '收起' : '为什么'}
                    </button>
                  ) : null}
                </div>
                {item.detail && detailOpen ? (
                  <p className="check-detail-copy">{item.detail}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      {currentStage.questions.length > 0 ? (
        <section className="card" aria-labelledby="stage-questions-heading">
          <div className="eyebrow" id="stage-questions-heading">
            <span>照着问医生 / 助产士</span>
            <span>
              {unaskedQuestions.length > 0
                ? `还有 ${unaskedQuestions.length} 句未问`
                : '本阶段已全部问完 ✓'}
            </span>
          </div>

          {unaskedQuestions.length > 0 ? (
            <div className="question-list">
              {unaskedQuestions.map((q) => (
                <div key={q.id} className="question-card">
                  <div className="question-top-row">
                    <div className="question-tag">
                      {q.badge ? <span className="badge-tag">{q.badge}</span> : null}
                      <span>{q.tag}</span>
                    </div>
                    <button
                      type="button"
                      className="q-done-btn"
                      onClick={() => onToggleAsked(q.id)}
                    >
                      已问 ✓
                    </button>
                  </div>
                  <p>{q.text}</p>
                </div>
              ))}
            </div>
          ) : null}

          {askedQuestionList.length > 0 ? (
            <div style={{ marginTop: unaskedQuestions.length > 0 ? 12 : 4 }}>
              <button
                type="button"
                className="text-link-btn"
                aria-expanded={showAskedDrawer}
                onClick={() => setShowAskedDrawer((v) => !v)}
              >
                {showAskedDrawer
                  ? '收起已问过的问题 ▴'
                  : `查看已问过的问题（${askedQuestionList.length} 句）▾`}
              </button>
              {showAskedDrawer ? (
                <div className="question-list" style={{ marginTop: 8 }}>
                  {askedQuestionList.map((q) => (
                    <div key={q.id} className="question-card asked">
                      <div className="question-top-row">
                        <div className="question-tag">
                          <span>已问 · {q.tag}</span>
                        </div>
                        <button
                          type="button"
                          className="mini-del-btn"
                          onClick={() => onToggleAsked(q.id)}
                        >
                          恢复
                        </button>
                      </div>
                      <p>{q.text}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {currentStage.redLines.length > 0 ? (
        <section className="alert-box" aria-labelledby="stage-redlines-heading">
          <div className="alert-title" id="stage-redlines-heading">
            <span className="pulse-dot" aria-hidden="true" />
            <span>本阶段重点红线 · 出现立刻按铃</span>
          </div>
          <ul className="red-list">
            {currentStage.redLines.slice(0, 3).map((rl) => (
              <li key={rl.id} className="red-item">
                <strong>
                  {rl.badge ? <span className="badge-tag danger">{rl.badge}</span> : null}
                  {rl.title}
                </strong>
                <span>{rl.action}</span>
              </li>
            ))}
          </ul>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <button type="button" className="btn danger" onClick={onGoRedLines}>
              查看全部 {currentStage.redLines.length} 条红线与开口话术
            </button>
          </div>
        </section>
      ) : null}

      {currentStage.knowledgeBlocks.map((kb) => {
        const isOpen = Boolean(openBlocks[kb.id]);
        return (
          <div key={kb.id} className="disclosure-card">
            <button
              type="button"
              className="disclosure-trigger"
              aria-expanded={isOpen}
              onClick={() => toggleBlock(kb.id)}
            >
              <span>{kb.title}</span>
              <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen ? (
              <div className="disclosure-body">
                <ul className="bullet-list">
                  {kb.bullets.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
                <p className="evidence-tag">参考来源：{kb.evidenceRef}</p>
              </div>
            ) : null}
          </div>
        );
      })}

      <div className="disclosure-card">
        <button
          type="button"
          className="disclosure-trigger"
          aria-expanded={packingOpen}
          onClick={() => setPackingOpen((v) => !v)}
        >
          <span>待产包与证件分袋核对表（按包收纳）</span>
          <span aria-hidden="true">{packingOpen ? '−' : '+'}</span>
        </button>
        {packingOpen ? (
          <div className="disclosure-body" style={{ paddingTop: 12 }}>
            {visiblePackingCategories.map((cat) => (
              <div key={cat.id} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--blue)' }}>
                  {cat.title}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--fg-subtle)', marginBottom: 8 }}>
                  {cat.subtitle}
                </div>
                <ul className="check-list">
                  {cat.items.map((item) => {
                    const done = Boolean(checkedItems[item.id]);
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={`check-item-btn${done ? ' done' : ''}`}
                          aria-pressed={done}
                          onClick={() => onToggleCheck(item.id)}
                        >
                          <span className="check-box" aria-hidden="true">
                            {done ? '✓' : ''}
                          </span>
                          <span className="check-text">{item.text}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="btn-row" style={{ marginTop: 14 }}>
        <button
          type="button"
          className="btn ghost"
          disabled={!prevKey}
          onClick={() => prevKey && onSelectStage(prevKey)}
        >
          ← 上一步
        </button>
        <button
          type="button"
          className="btn primary"
          disabled={!nextKey}
          onClick={() => nextKey && onSelectStage(nextKey)}
        >
          {nextKey ? '进入下一阶段 →' : '已是最后阶段'}
        </button>
      </div>

      <div className="disclaimer-box">
        本工具依据 WHO / ACOG / ERAS 公开产科循证指南整理，仅作为陪产流程辅助，不能替代执业医师与助产士的临床判断；有任何急症疑虑请第一时间按铃或就医。
      </div>
    </div>
  );
}

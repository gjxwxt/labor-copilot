import { useState } from 'react';
import type { BirthProfile, ResolvedStage, StageKey } from '../../domain/types';
import { PACKING_CATEGORIES } from '../../content/checklists';

interface CompanionViewProps {
  profile: BirthProfile;
  hasCompletedOnboarding: boolean;
  stages: ResolvedStage[];
  currentStage: ResolvedStage;
  prevKey: StageKey | null;
  nextKey: StageKey | null;
  checkedItems: Record<string, boolean>;
  onSelectStage: (key: StageKey) => void;
  onToggleCheck: (itemId: string) => void;
  onOpenProfile: () => void;
  onGoRedLines: () => void;
}

export function CompanionView({
  profile,
  hasCompletedOnboarding,
  stages,
  currentStage,
  prevKey,
  nextKey,
  checkedItems,
  onSelectStage,
  onToggleCheck,
  onOpenProfile,
  onGoRedLines,
}: CompanionViewProps) {
  const [openBlocks, setOpenBlocks] = useState<Record<string, boolean>>({});
  const [packingOpen, setPackingOpen] = useState(false);

  const toggleBlock = (id: string) => {
    setOpenBlocks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const visiblePackingCategories = PACKING_CATEGORIES.filter((cat) =>
    cat.when ? cat.when(profile) : true,
  );

  return (
    <div className="view-wrap">
      {!hasCompletedOnboarding ? (
        <div className="setup-banner">
          <div className="setup-banner-text">
            <strong>当前使用「{profile.label}」预设</strong>
            可 30 秒勾选胎次、发动方式与关注项，动态定制路线图。
          </div>
          <button type="button" className="setup-banner-btn" onClick={onOpenProfile}>
            30 秒定制
          </button>
        </div>
      ) : null}

      <div className="chips-row" role="region" aria-label="产程阶段快速切换">
        {stages.map((s, idx) => (
          <button
            key={s.key}
            type="button"
            className={`chip-btn${s.key === currentStage.key ? ' active' : ''}`}
            aria-pressed={s.key === currentStage.key}
            onClick={() => onSelectStage(s.key)}
          >
            {idx + 1}. {s.shortName}
          </button>
        ))}
      </div>

      <section className="card card-hero" aria-labelledby="hero-stage-focus">
        <div className="eyebrow" id="hero-stage-focus">
          <span>现在只做这一件事</span>
        </div>
        <p className="hero-headline">{currentStage.headline}</p>
        {currentStage.subHeadline ? (
          <p className="hero-sub">{currentStage.subHeadline}</p>
        ) : null}
        <p className="evidence-tag">循证参考：{currentStage.evidenceRef}</p>
      </section>

      <section className="card" aria-labelledby="stage-dos-heading">
        <div className="eyebrow" id="stage-dos-heading">
          <span>记住这几点（点击可打勾）</span>
        </div>
        <ul className="check-list">
          {currentStage.dos.map((item) => {
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
                  <span className="check-text">
                    {item.badge ? <span className="badge-tag">{item.badge}</span> : null}
                    {item.text}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {currentStage.questions.length > 0 ? (
        <section className="card" aria-labelledby="stage-questions-heading">
          <div className="eyebrow" id="stage-questions-heading">
            <span>可以直接照着问医生/助产士</span>
          </div>
          <div className="question-list">
            {currentStage.questions.map((q) => (
              <div key={q.id} className="question-card">
                <div className="question-tag">
                  {q.badge ? <span className="badge-tag">{q.badge}</span> : null}
                  <span>{q.tag}</span>
                </div>
                <p>{q.text}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {currentStage.redLines.length > 0 ? (
        <section className="alert-box" aria-labelledby="stage-redlines-heading">
          <div className="alert-title" id="stage-redlines-heading">
            <span className="pulse-dot" aria-hidden="true" />
            <span>本阶段红线 · 出现立刻按铃</span>
          </div>
          <ul className="red-list">
            {currentStage.redLines.slice(0, 4).map((rl) => (
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
              查看全部红线与呼救话术
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
          <span>待产包与证件分袋核对表（点击展开打勾）</span>
          <span aria-hidden="true">{packingOpen ? '−' : '+'}</span>
        </button>
        {packingOpen ? (
          <div className="disclosure-body">
            {visiblePackingCategories.map((cat) => (
              <div key={cat.id} style={{ marginTop: 14 }}>
                <div className="eyebrow">{cat.title}</div>
                <p style={{ fontSize: 13, color: 'var(--fg-muted)', marginBottom: 8 }}>
                  {cat.subtitle}
                </p>
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
          上一阶段
        </button>
        <button
          type="button"
          className="btn primary"
          disabled={!nextKey}
          onClick={() => nextKey && onSelectStage(nextKey)}
        >
          {nextKey ? '进入下一阶段' : '已到最后阶段'}
        </button>
      </div>

      <p className="disclaimer-box">
        免责边界：本工具为离线陪产辅助备忘，所有临床判断、用药、催产及分娩决策以所在医院医生与助产士的现场评估为准。
      </p>
    </div>
  );
}

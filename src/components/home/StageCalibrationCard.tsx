import { useEffect, useState } from 'react';
import type { FocusTag, LifeStageId } from '../../domain/types';
import {
  ALL_FOCUS_TAGS,
  ALL_LIFE_STAGES,
  FOCUS_TAG_META,
  LIFE_STAGE_META,
} from '../../domain/recommendations';

interface StageCalibrationCardProps {
  initialStage: LifeStageId;
  initialFocusTags: FocusTag[];
  mode?: 'inline' | 'modal';
  onConfirm: (stage: LifeStageId, focusTags: FocusTag[]) => void;
  onCancel?: () => void;
}

export function StageCalibrationCard({
  initialStage,
  initialFocusTags,
  mode = 'inline',
  onConfirm,
  onCancel,
}: StageCalibrationCardProps) {
  const [selectedStage, setSelectedStage] = useState<LifeStageId>(initialStage);
  const [selectedTags, setSelectedTags] = useState<FocusTag[]>(initialFocusTags);

  useEffect(() => {
    setSelectedStage(initialStage);
    setSelectedFocusSafely(initialFocusTags);
  }, [initialStage, initialFocusTags]);

  function setSelectedFocusSafely(tags: FocusTag[]) {
    setSelectedTags(tags.length > 0 ? tags : ['emergency']);
  }

  const handleSelectStage = (stage: LifeStageId) => {
    setSelectedStage(stage);
    // Keep-style smart pre-fill: update suggested tags when switching stage
    setSelectedTags(LIFE_STAGE_META[stage].defaultFocusTags);
  };

  const toggleFocusTag = (tag: FocusTag) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== tag);
      }
      return [...prev, tag];
    });
  };

  const activeMeta = LIFE_STAGE_META[selectedStage];

  return (
    <section
      className={`calibration-card${mode === 'modal' ? ' modal-inner-card' : ''}`}
      aria-label="阶段校准与个性化推荐设置"
    >
      <div className="calibration-head">
        <div>
          <div className="calibration-eyebrow">像 Keep 一样定制你的护航方案</div>
          <h2 className="calibration-title">你家现在处于哪个阶段？</h2>
          <p className="calibration-sub">
            选完立刻为你重排首页急救入口、精选视频课与当下重点，之后可随时在顶部或「我的」重设。
          </p>
        </div>
        {mode === 'modal' && onCancel ? (
          <button type="button" className="icon-close-btn" onClick={onCancel} aria-label="关闭校准弹窗">
            ✕
          </button>
        ) : null}
      </div>

      <div className="calibration-step-label">1. 选择当前阶段</div>
      <div className="stage-choice-grid">
        {ALL_LIFE_STAGES.map((stageId) => {
          const meta = LIFE_STAGE_META[stageId];
          const active = stageId === selectedStage;
          return (
            <button
              key={stageId}
              type="button"
              className={`stage-choice-pill${active ? ' selected' : ''}`}
              onClick={() => handleSelectStage(stageId)}
              aria-pressed={active}
            >
              <span className="stage-choice-top">
                <span className="stage-choice-name">{meta.label}</span>
                <span className="stage-choice-tag">{meta.badgeText}</span>
              </span>
              <span className="stage-choice-desc">{meta.subtitle}</span>
            </button>
          );
        })}
      </div>

      <div className="calibration-step-label">2. 最想重点学 / 关注的主题（可多选）</div>
      <div className="focus-tag-grid">
        {ALL_FOCUS_TAGS.map((tagId) => {
          const meta = FOCUS_TAG_META[tagId];
          const active = selectedTags.includes(tagId);
          return (
            <button
              key={tagId}
              type="button"
              className={`focus-tag-btn${active ? ' selected' : ''}`}
              onClick={() => toggleFocusTag(tagId)}
              aria-pressed={active}
            >
              <span>{meta.label}</span>
              <small>{meta.summary}</small>
            </button>
          );
        })}
      </div>

      <div className="calibration-footer">
        <div className="calibration-preview-text">
          当前匹配：<strong>{activeMeta.shortLabel}</strong> · 将优先推荐{' '}
          {selectedTags.map((t) => FOCUS_TAG_META[t].label).join('、')}
        </div>
        <button
          type="button"
          className="btn btn-primary calibration-submit-btn"
          onClick={() => onConfirm(selectedStage, selectedTags)}
        >
          生成我的专属护航方案
        </button>
      </div>
    </section>
  );
}

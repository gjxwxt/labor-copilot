import { useEffect, useState } from 'react';
import type {
  AppState,
  BirthProfile,
  ClinicalEventMeta,
  ClinicalEventType,
  LifeStageId,
  ResolvedStage,
  StageKey,
  ToolsSubtab,
} from '../../domain/types';
import { isLaborFocusedStage, LIFE_STAGE_META } from '../../domain/recommendations';
import type { PostpartumCountdown, StageSuggestionPayload } from '../../domain/autoAdvance';
import { CompanionView } from '../companion/CompanionView';
import { HandoverView } from '../handover/HandoverView';

interface ToolsViewProps {
  lifeStage: LifeStageId;
  state: AppState;
  stages: ResolvedStage[];
  currentStage: ResolvedStage;
  prevKey: StageKey | null;
  nextKey: StageKey | null;
  stageSuggestion: StageSuggestionPayload | null;
  postpartumCountdown: PostpartumCountdown | null;
  now: number;
  nurseBrightNonce: number;
  onQuickStart: (updates: Partial<BirthProfile>, targetStage: StageKey) => void;
  onSelectStage: (key: StageKey) => void;
  onToggleCheck: (itemId: string) => void;
  onToggleAsked: (questionId: string) => void;
  onDismissSuggestion: () => void;
  onOpenProfile: () => void;
  onGoRedLines: () => void;
  onOpenMomSheet: () => void;
  onOpenCard: (cardId: string) => void;
  onAddEvent: (type: ClinicalEventType, detail?: string, meta?: ClinicalEventMeta) => void;
  onRemoveEvent: (id: string) => void;
}

export function ToolsView({
  lifeStage,
  state,
  stages,
  currentStage,
  prevKey,
  nextKey,
  stageSuggestion,
  postpartumCountdown,
  now,
  nurseBrightNonce,
  onQuickStart,
  onSelectStage,
  onToggleCheck,
  onToggleAsked,
  onDismissSuggestion,
  onOpenProfile,
  onGoRedLines,
  onOpenMomSheet,
  onOpenCard,
  onAddEvent,
  onRemoveEvent,
}: ToolsViewProps) {
  const laborPriority = isLaborFocusedStage(lifeStage);
  const [subtab, setSubtab] = useState<ToolsSubtab>(
    LIFE_STAGE_META[lifeStage].defaultToolsSubtab,
  );

  useEffect(() => {
    setSubtab(LIFE_STAGE_META[lifeStage].defaultToolsSubtab);
  }, [lifeStage]);

  return (
    <div className="tools-view">
      <div className="view-wrap tools-top-pad">
        <section className="tools-mode-banner">
          <div className="tools-banner-head">
            <div>
              <span className="stage-hero-badge">
                {laborPriority ? '产房实战优先' : '育儿与复盘模式'}
              </span>
              <h2 className="tools-banner-title">
                {laborPriority ? '产程陪产 · 宫缩计时 · 1分钟交接' : '家用急救工具 & 产后护航记录'}
              </h2>
            </div>
            <button
              type="button"
              className="pill-btn active compact"
              onClick={onOpenMomSheet}
            >
              ♡ 呼吸光环全屏
            </button>
          </div>

          {!laborPriority ? (
            <div className="quick-tools-grid" aria-label="育儿期高频实操工具">
              <button
                type="button"
                className="quick-tool-btn red"
                onClick={() => onOpenCard('choking_infant')}
              >
                <strong>呛奶 5+5 节拍器</strong>
                <span>震动领节奏拍背压胸</span>
              </button>
              <button
                type="button"
                className="quick-tool-btn amber"
                onClick={() => onOpenCard('scald_burn')}
              >
                <strong>烫伤 20:00 冲水</strong>
                <span>倒计时守住黄金凉水</span>
              </button>
              <button
                type="button"
                className="quick-tool-btn blue"
                onClick={() => onOpenCard('febrile_seizure')}
              >
                <strong>惊厥 5 分钟秒表</strong>
                <span>计时满 5 分提醒打 120</span>
              </button>
              <button
                type="button"
                className="quick-tool-btn green"
                onClick={() => setSubtab('handover')}
              >
                <strong>医护时间线战报</strong>
                <span>导出纪念长图与记录</span>
              </button>
            </div>
          ) : null}

          <div className="tools-subtab-bar" role="tablist" aria-label="工具子模块切换">
            <button
              type="button"
              role="tab"
              aria-selected={subtab === 'companion'}
              className={`tools-subtab-btn${subtab === 'companion' ? ' active' : ''}`}
              onClick={() => setSubtab('companion')}
            >
              {laborPriority ? '当下陪产与阶段卡' : '产程/产后护理清单'}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={subtab === 'handover'}
              className={`tools-subtab-btn${subtab === 'handover' ? ' active' : ''}`}
              onClick={() => setSubtab('handover')}
            >
              1 分钟交接与时间线 ({state.events.length})
            </button>
          </div>
        </section>
      </div>

      {subtab === 'companion' ? (
        <CompanionView
          profile={state.profile}
          hasCompletedOnboarding={state.hasCompletedOnboarding}
          stages={stages}
          currentStage={currentStage}
          prevKey={prevKey}
          nextKey={nextKey}
          checkedItems={state.checkedItems}
          askedQuestions={state.askedQuestions}
          stageSuggestion={stageSuggestion}
          postpartumCountdown={postpartumCountdown}
          onQuickStart={onQuickStart}
          onSelectStage={onSelectStage}
          onToggleCheck={onToggleCheck}
          onToggleAsked={onToggleAsked}
          onDismissSuggestion={onDismissSuggestion}
          onOpenProfile={onOpenProfile}
          onGoRedLines={onGoRedLines}
          onGoMom={onOpenMomSheet}
        />
      ) : (
        <HandoverView
          key={nurseBrightNonce}
          state={state}
          currentStage={currentStage}
          now={now}
          initialNurseBright={nurseBrightNonce > 0}
          onAddEvent={onAddEvent}
          onRemoveEvent={onRemoveEvent}
        />
      )}
    </div>
  );
}

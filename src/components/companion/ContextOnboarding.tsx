import { useState } from 'react';
import type { BirthMode, BirthProfile, Parity, StageKey } from '../../domain/types';

interface ContextOnboardingProps {
  profile: BirthProfile;
  onQuickStart: (updates: Partial<BirthProfile>, targetStage: StageKey) => void;
  onOpenFullProfile: () => void;
}

export function ContextOnboarding({
  profile,
  onQuickStart,
  onOpenFullProfile,
}: ContextOnboardingProps) {
  const [parity, setParity] = useState<Parity>(profile.parity);
  const [hospitalChoiceOpen, setHospitalChoiceOpen] = useState(false);

  const pickHome = () => {
    onQuickStart(
      {
        parity,
        birthMode: profile.birthMode === 'planned_csection' ? 'spontaneous' : profile.birthMode,
        label: parity === 'nulliparous' ? '在家待产 · 头胎' : '在家待产 · 经产',
      },
      'prep',
    );
  };

  const pickHospitalMode = (birthMode: BirthMode, targetStage: StageKey, label: string) => {
    onQuickStart(
      {
        parity,
        birthMode,
        label: `${parity === 'nulliparous' ? '头胎' : '经产'} · ${label}`,
      },
      targetStage,
    );
  };

  const pickDemoMode = () => {
    onQuickStart(
      {
        parity,
        birthMode: 'spontaneous',
        label: '快速体验模式',
      },
      'latent',
    );
  };

  return (
    <section className="onboarding-card" aria-labelledby="onboarding-title">
      <div className="onboarding-top">
        <div>
          <span className="eyebrow-pill">3 秒进入当下</span>
          <h2 id="onboarding-title" className="onboarding-title">
            你们现在到哪一步了？
          </h2>
        </div>

        <div className="parity-toggle" role="group" aria-label="胎次快速选择">
          <button
            type="button"
            className={`parity-pill${parity === 'nulliparous' ? ' active' : ''}`}
            onClick={() => setParity('nulliparous')}
          >
            头胎
          </button>
          <button
            type="button"
            className={`parity-pill${parity === 'multiparous' ? ' active' : ''}`}
            onClick={() => setParity('multiparous')}
          >
            二胎+
          </button>
        </div>
      </div>

      <div className="situation-grid">
        <button type="button" className="situation-btn" onClick={pickHome}>
          <span className="sit-title">还在家 / 准备出发</span>
          <span className="sit-sub">证件打包、何时去医院、5-1-1 计时</span>
        </button>

        <button
          type="button"
          className={`situation-btn${hospitalChoiceOpen ? ' expanded' : ''}`}
          onClick={() => setHospitalChoiceOpen((v) => !v)}
        >
          <span className="sit-title">已在医院待产 / 催产 / 手术</span>
          <span className="sit-sub">
            {hospitalChoiceOpen ? '请选择当前具体方式 ▾' : '跳过在家清单，直接看院内待产要点'}
          </span>
        </button>

        {hospitalChoiceOpen ? (
          <div className="hospital-subgrid">
            <button
              type="button"
              className="submode-btn"
              onClick={() => pickHospitalMode('spontaneous', 'latent', '自然临产')}
            >
              <strong>自然待产 / 宫缩中</strong>
              <span>规律宫缩 · 无痛评估</span>
            </button>
            <button
              type="button"
              className="submode-btn"
              onClick={() => pickHospitalMode('induction', 'ripening', '计划催产')}
            >
              <strong>计划催产 / 放球囊</strong>
              <span>促宫颈成熟 · 催产配合</span>
            </button>
            <button
              type="button"
              className="submode-btn"
              onClick={() => pickHospitalMode('planned_csection', 'csection_or', '择期剖宫产')}
            >
              <strong>择期剖宫产</strong>
              <span>禁食核对 · 术后监护</span>
            </button>
          </div>
        ) : null}

        <div className="onboarding-footer">
          <button type="button" className="text-link-btn" onClick={pickDemoMode}>
            先随便逛逛（演示）
          </button>
          <button type="button" className="text-link-btn strong" onClick={onOpenFullProfile}>
            补充产检标签（GBS+ / 糖妈 / VBAC 等）
          </button>
        </div>
      </div>
    </section>
  );
}

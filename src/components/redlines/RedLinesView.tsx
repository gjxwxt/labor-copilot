import type { BirthProfile, StageKey } from '../../domain/types';
import { CALL_DOCTOR_SCRIPT, RED_LINE_ITEMS } from '../../content/red-lines';

interface RedLinesViewProps {
  profile: BirthProfile;
  currentStageKey: StageKey;
  onGoHandover: () => void;
}

export function RedLinesView({
  profile,
  currentStageKey,
  onGoHandover,
}: RedLinesViewProps) {
  const applicable = RED_LINE_ITEMS.filter((item) =>
    item.when ? item.when(profile) : true,
  );

  const stageMatched = applicable.filter(
    (item) => !item.stageKeys || item.stageKeys.includes(currentStageKey),
  );
  const otherStages = applicable.filter(
    (item) => item.stageKeys && !item.stageKeys.includes(currentStageKey),
  );

  return (
    <div className="view-wrap">
      <section className="alert-box" aria-labelledby="red-current-heading">
        <div className="alert-title" id="red-current-heading">
          <span className="pulse-dot" aria-hidden="true" />
          <span>当前重点红线 · 出现立刻按铃</span>
        </div>
        <ul className="red-list">
          {stageMatched.map((item) => (
            <li key={item.id} className="red-item">
              <strong>
                {item.badge ? <span className="badge-tag danger">{item.badge}</span> : null}
                {item.title}
              </strong>
              <span>{item.action}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card" aria-labelledby="call-script-heading">
        <div className="eyebrow" id="call-script-heading">
          <span>按铃叫医生 / 助产士时怎么开口</span>
        </div>
        <ul className="bullet-list" style={{ marginTop: 0 }}>
          {CALL_DOCTOR_SCRIPT.map((row) => (
            <li key={row.step}>
              <strong style={{ color: 'var(--fg)' }}>{row.step}：</strong>
              {row.detail}
            </li>
          ))}
        </ul>
        <div className="btn-row" style={{ marginTop: 14 }}>
          <button type="button" className="btn primary" onClick={onGoHandover}>
            打开 1 分钟交接卡给医护看
          </button>
        </div>
      </section>

      {otherStages.length > 0 ? (
        <section className="card" aria-labelledby="red-all-heading">
          <div className="eyebrow" id="red-all-heading">
            <span>其他阶段全局红线备查</span>
          </div>
          <ul className="red-list">
            {otherStages.map((item) => (
              <li key={item.id} className="red-item">
                <strong>
                  {item.badge ? <span className="badge-tag danger">{item.badge}</span> : null}
                  {item.title}
                </strong>
                <span>{item.action}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

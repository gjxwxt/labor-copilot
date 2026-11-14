import { useEffect, useState } from 'react';
import type { BreathingPresetId, ResolvedStage } from '../../domain/types';
import { BREATHING_PRESETS, getBreathingPreset } from '../../content/checklists';

interface MomViewProps {
  currentStage: ResolvedStage;
  breathingPreset: BreathingPresetId;
  onChangeBreathingPreset: (preset: BreathingPresetId) => void;
}

export function MomView({
  currentStage,
  breathingPreset,
  onChangeBreathingPreset,
}: MomViewProps) {
  const preset = getBreathingPreset(breathingPreset);
  const [pacerRunning, setPacerRunning] = useState(false);
  const [pacerState, setPacerState] = useState<{ phase: 'in' | 'out'; secondsLeft: number }>({
    phase: 'in',
    secondsLeft: preset.inhaleSec,
  });
  const [nightWarmFilter, setNightWarmFilter] = useState(false);
  const [hapticCue, setHapticCue] = useState(true);

  const { phase, secondsLeft } = pacerState;

  // Reset pacer when switching presets
  useEffect(() => {
    setPacerRunning(false);
    setPacerState({ phase: 'in', secondsLeft: preset.inhaleSec });
  }, [preset.inhaleSec, preset.id]);

  // Single atomic tick avoids nested setState in updaters and StrictMode double-flips
  useEffect(() => {
    if (!pacerRunning) return;
    const timer = window.setInterval(() => {
      setPacerState((prev) => {
        if (prev.secondsLeft > 1) {
          return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        }
        const nextPhase = prev.phase === 'in' ? 'out' : 'in';
        return {
          phase: nextPhase,
          secondsLeft: nextPhase === 'in' ? preset.inhaleSec : preset.exhaleSec,
        };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [pacerRunning, preset.exhaleSec, preset.inhaleSec]);

  useEffect(() => {
    if (!pacerRunning || !hapticCue || !navigator.vibrate) return;
    try {
      navigator.vibrate(phase === 'in' ? 35 : [25, 40, 25]);
    } catch {
      // Ignore unsupported vibrate
    }
  }, [pacerRunning, phase, hapticCue]);

  const togglePacer = () => {
    if (pacerRunning) {
      setPacerRunning(false);
      setPacerState({ phase: 'in', secondsLeft: preset.inhaleSec });
    } else {
      setPacerState({ phase: 'in', secondsLeft: preset.inhaleSec });
      setPacerRunning(true);
    }
  };

  return (
    <div className={`view-wrap${nightWarmFilter ? ' mom-dimmed' : ''}`}>
      <section className="card card-mom" aria-labelledby="mom-focus-title">
        <div className="eyebrow">
          <span id="mom-focus-title">给她看 · 跟着做</span>
          <button
            type="button"
            className="mini-del-btn"
            onClick={() => setNightWarmFilter((v) => !v)}
          >
            {nightWarmFilter ? '恢复标准亮度' : '柔和护眼降亮'}
          </button>
        </div>
        <p className="mom-headline">{currentStage.mom.headline}</p>
      </section>

      <section className="card" aria-labelledby="pacer-heading">
        <div className="eyebrow">
          <span id="pacer-heading">呼吸节拍器</span>
          <button
            type="button"
            className="mini-del-btn"
            onClick={() => setHapticCue((v) => !v)}
          >
            换气震动：{hapticCue ? '开' : '关'}
          </button>
        </div>

        <div className="preset-tabs" role="group" aria-label="选择呼吸节奏">
          {BREATHING_PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`preset-tab${item.id === breathingPreset ? ' active' : ''}`}
              onClick={() => onChangeBreathingPreset(item.id)}
            >
              {item.shortLabel}
            </button>
          ))}
        </div>

        <div className="pacer-box">
          <div className={`pacer-ring${pacerRunning ? ` ${phase}` : ''}`}>
            <span className="pacer-ring-text">
              {pacerRunning ? `${phase === 'in' ? '吸' : '呼'} ${secondsLeft}` : '准备'}
            </span>
          </div>
          <p className="pacer-hint" aria-live="polite">
            {pacerRunning
              ? phase === 'in'
                ? preset.inhaleHint
                : preset.exhaleHint
              : preset.useCase}
          </p>
        </div>

        <button
          type="button"
          className="btn primary"
          style={{ width: '100%', marginTop: 14 }}
          onClick={togglePacer}
        >
          {pacerRunning ? '停止呼吸引导' : `开始 ${preset.shortLabel} 呼吸`}
        </button>
      </section>

      <section className="card" aria-labelledby="mom-tips-title">
        <div className="eyebrow" id="mom-tips-title">
          <span>此时心里默念</span>
        </div>
        <ul className="bullet-list" style={{ marginTop: 0 }}>
          {currentStage.mom.dos.map((item) => (
            <li key={item.id} style={{ fontSize: 15.5, color: 'var(--fg)' }}>
              {item.text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

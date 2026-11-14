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
  const [voiceCue, setVoiceCue] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);

  const speechSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  const { phase, secondsLeft } = pacerState;

  // Reset pacer cleanly when switching presets
  useEffect(() => {
    setPacerRunning(false);
    setPacerState({ phase: 'in', secondsLeft: preset.inhaleSec });
    if (speechSupported) {
      window.speechSynthesis.cancel();
    }
  }, [preset.inhaleSec, preset.id, speechSupported]);

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

  // Haptic & optional gentle voice whisper on phase switch
  useEffect(() => {
    if (!pacerRunning) return;

    if (hapticCue && navigator.vibrate) {
      try {
        navigator.vibrate(phase === 'in' ? 35 : [25, 40, 25]);
      } catch {
        // Ignore unsupported vibrate
      }
    }

    if (voiceCue && speechSupported) {
      try {
        window.speechSynthesis.cancel();
        const phrase =
          phase === 'in'
            ? '吸气'
            : preset.id === '2-2'
              ? '哈气，放松'
              : '慢慢呼气';
        const utter = new SpeechSynthesisUtterance(phrase);
        utter.lang = 'zh-CN';
        utter.rate = 0.85;
        utter.volume = 0.72;
        window.speechSynthesis.speak(utter);
      } catch {
        // Ignore unsupported speech synthesis
      }
    }
  }, [pacerRunning, phase, hapticCue, voiceCue, speechSupported, preset.id]);

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      if (speechSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [speechSupported]);

  const togglePacer = () => {
    if (pacerRunning) {
      setPacerRunning(false);
      setPacerState({ phase: 'in', secondsLeft: preset.inhaleSec });
      if (speechSupported) {
        window.speechSynthesis.cancel();
      }
    } else {
      setPacerState({ phase: 'in', secondsLeft: preset.inhaleSec });
      setPacerRunning(true);
    }
  };

  return (
    <div className={`view-wrap mom-sanctuary${nightWarmFilter ? ' mom-dimmed' : ''}`}>
      <div className="mom-topbar">
        <span className="mom-pill-tag">给她看 · 深呼吸陪护</span>
        <div className="mom-controls-row">
          <button
            type="button"
            className={`mini-del-btn${nightWarmFilter ? ' active-chip' : ''}`}
            onClick={() => setNightWarmFilter((v) => !v)}
          >
            {nightWarmFilter ? '标准亮度' : '护眼降亮'}
          </button>
          <button
            type="button"
            className={`mini-del-btn${hapticCue ? ' active-chip' : ''}`}
            onClick={() => setHapticCue((v) => !v)}
          >
            震动:{hapticCue ? '开' : '关'}
          </button>
          {speechSupported ? (
            <button
              type="button"
              className={`mini-del-btn${voiceCue ? ' active-chip' : ''}`}
              onClick={() => setVoiceCue((v) => !v)}
            >
              轻声:{voiceCue ? '开' : '关'}
            </button>
          ) : null}
        </div>
      </div>

      <p className="mom-whisper-headline">{currentStage.mom.headline}</p>

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

      <div className="pacer-stage-canvas">
        <div
          className={`pacer-halo-outer${pacerRunning ? ` ${phase}` : ''}`}
          aria-hidden="true"
        />
        <button
          type="button"
          className={`pacer-ring pacer-ring-lg${pacerRunning ? ` ${phase}` : ''}`}
          onClick={togglePacer}
          aria-label={pacerRunning ? '停止呼吸引导' : `开始 ${preset.shortLabel} 呼吸`}
        >
          <span className="pacer-ring-text">
            {pacerRunning ? `${phase === 'in' ? '吸' : phase === 'out' && preset.id === '2-2' ? '哈' : '呼'} ${secondsLeft}` : '点此开始'}
          </span>
          <span className="pacer-ring-sub">
            {pacerRunning ? '点击可暂停' : preset.shortLabel}
          </span>
        </button>

        <p className="pacer-hint" aria-live="polite">
          {pacerRunning
            ? phase === 'in'
              ? preset.inhaleHint
              : preset.exhaleHint
            : preset.useCase}
        </p>
      </div>

      <div className="disclosure-card" style={{ marginTop: 14 }}>
        <button
          type="button"
          className="disclosure-trigger"
          aria-expanded={tipsOpen}
          onClick={() => setTipsOpen((v) => !v)}
        >
          <span>本阶段心里默念（{currentStage.mom.dos.length} 句安抚）</span>
          <span aria-hidden="true">{tipsOpen ? '−' : '+'}</span>
        </button>
        {tipsOpen ? (
          <div className="disclosure-body">
            <ul className="bullet-list">
              {currentStage.mom.dos.map((item) => (
                <li key={item.id} style={{ fontSize: 15.5, color: 'var(--fg)' }}>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

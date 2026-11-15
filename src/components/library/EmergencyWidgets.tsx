import { useEffect, useState } from 'react';
import type { InteractiveWidgetType } from '../../domain/types';

interface EmergencyWidgetsProps {
  widgetType: InteractiveWidgetType;
}

function formatMmSs(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function EmergencyWidgets({ widgetType }: EmergencyWidgetsProps) {
  if (widgetType === 'choking_5_5') {
    return <ChokingMetronome />;
  }
  if (widgetType === 'scald_20m') {
    return <ScaldCountdown />;
  }
  return <SeizureStopwatch />;
}

function ChokingMetronome() {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<'back' | 'chest'>('back');
  const [beat, setBeat] = useState(1);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setBeat((prevBeat) => {
        if (prevBeat < 5) {
          return prevBeat + 1;
        }
        setPhase((p) => (p === 'back' ? 'chest' : 'back'));
        return 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    if (navigator.vibrate) {
      try {
        navigator.vibrate(beat === 1 ? [60, 40, 60] : 35);
      } catch {
        // Ignore
      }
    }
  }, [running, beat, phase]);

  return (
    <div className="emg-widget emg-widget-red">
      <div className="emg-widget-top">
        <div>
          <div className="emg-widget-label">实操节拍器 · 5 拍背 + 5 压胸</div>
          <div className="emg-widget-main">
            {running
              ? `${phase === 'back' ? '俯卧拍背' : '仰卧压胸'} · 第 ${beat}/5 次`
              : '手忙脚乱时点启动，跟着震动稳稳做满 5 次交替'}
          </div>
        </div>
        <button
          type="button"
          className={`btn ${running ? 'btn-stop' : 'btn-danger'} btn-compact`}
          onClick={() => {
            if (!running) {
              setPhase('back');
              setBeat(1);
            }
            setRunning((r) => !r);
          }}
        >
          {running ? '停止节拍' : '启动节拍'}
        </button>
      </div>
      {running ? (
        <div className="choking-dots" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((idx) => (
            <span
              key={idx}
              className={`choking-dot${idx <= beat ? ' active' : ''}${phase === 'chest' ? ' chest' : ''}`}
            >
              {idx}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ScaldCountdown() {
  const TOTAL_SECONDS = 20 * 60;
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  return (
    <div className="emg-widget emg-widget-amber">
      <div className="emg-widget-top">
        <div>
          <div className="emg-widget-label">冷水冲洗倒计时（黄金 20 分钟）</div>
          <div className="emg-widget-clock">
            {secondsLeft === 0
              ? '✓ 已冲满 20 分钟 · 纱布轻盖送医'
              : formatMmSs(secondsLeft)}
          </div>
        </div>
        <div className="emg-widget-btns">
          <button
            type="button"
            className={`btn ${running ? 'btn-stop' : 'btn-primary'} btn-compact`}
            onClick={() => setRunning((r) => !r)}
          >
            {running ? '暂停' : secondsLeft === TOTAL_SECONDS ? '开始冲水计时' : '继续'}
          </button>
          {secondsLeft !== TOTAL_SECONDS ? (
            <button
              type="button"
              className="pill-btn compact"
              onClick={() => {
                setRunning(false);
                setSecondsLeft(TOTAL_SECONDS);
              }}
            >
              重置
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SeizureStopwatch() {
  const [running, setRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const urgentCall = elapsedSec >= 300;

  return (
    <div className={`emg-widget ${urgentCall ? 'emg-widget-red' : 'emg-widget-blue'}`}>
      <div className="emg-widget-top">
        <div>
          <div className="emg-widget-label">
            抽搐时长秒表 · 超过 05:00 立即拨打 120
          </div>
          <div className="emg-widget-clock">
            {formatMmSs(elapsedSec)}
            {urgentCall ? ' · 已满5分钟！立即呼救 120' : ''}
          </div>
        </div>
        <div className="emg-widget-btns">
          <button
            type="button"
            className={`btn ${running ? 'btn-stop' : 'btn-primary'} btn-compact`}
            onClick={() => setRunning((r) => !r)}
          >
            {running ? '抽搐已停' : '开始掐表'}
          </button>
          {elapsedSec > 0 ? (
            <button
              type="button"
              className="pill-btn compact"
              onClick={() => {
                setRunning(false);
                setElapsedSec(0);
              }}
            >
              归零
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

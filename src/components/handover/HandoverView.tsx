import { useEffect, useRef, useState } from 'react';
import type {
  AmnioticFluidStatus,
  AppState,
  ClinicalEvent,
  ClinicalEventMeta,
  ClinicalEventType,
  ResolvedStage,
} from '../../domain/types';
import {
  AMNIOTIC_FLUID_LABELS,
  exportHandoverMarkdown,
  exportStateJson,
  formatEventSummaryLine,
} from '../../domain/timeline';
import { buildHandoverSummary } from '../../domain/handover';
import { formatSecondsCompact, formatTimeOfDay } from '../../domain/contractions';

interface HandoverViewProps {
  state: AppState;
  currentStage: ResolvedStage;
  now: number;
  onAddEvent: (type: ClinicalEventType, detail?: string, meta?: ClinicalEventMeta) => void;
  onRemoveEvent: (id: string) => void;
}

type ModalMode = 'water' | 'cervix' | 'note' | null;

export function HandoverView({
  state,
  currentStage,
  now,
  onAddEvent,
  onRemoveEvent,
}: HandoverViewProps) {
  const [nurseBright, setNurseBright] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [dilationCm, setDilationCm] = useState<number>(3);
  const [noteText, setNoteText] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const modalRef = useRef<HTMLDialogElement>(null);

  const summary = buildHandoverSummary(
    state.profile,
    state.contractions,
    state.events,
    currentStage,
    now,
  );

  useEffect(() => {
    const dialog = modalRef.current;
    if (!dialog) return;
    if (modalMode) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [modalMode]);

  useEffect(() => {
    const dialog = modalRef.current;
    if (!dialog) return;
    const onClose = () => {
      dialog.returnValue = '';
      setModalMode(null);
    };
    dialog.addEventListener('close', onClose);
    return () => dialog.removeEventListener('close', onClose);
  }, []);

  const handleCopyMarkdown = async () => {
    const md = exportHandoverMarkdown(summary, state, now);
    try {
      await navigator.clipboard.writeText(md);
      setCopyFeedback('已复制交接战报（Markdown）');
    } catch {
      downloadFile(md, `labor-handover-${formatTimeOfDay(now).replace(':', '')}.md`, 'text/markdown');
      setCopyFeedback('已下载交接战报（.md）');
    }
    setTimeout(() => setCopyFeedback(null), 2600);
  };

  const handleDownloadJson = () => {
    const json = exportStateJson(state);
    downloadFile(json, `labor-backup-${formatTimeOfDay(now).replace(':', '')}.json`, 'application/json');
    setCopyFeedback('已导出本地 JSON 备份');
    setTimeout(() => setCopyFeedback(null), 2600);
  };

  return (
    <div className="view-wrap">
      <section className="card" aria-labelledby="quick-log-heading">
        <div className="eyebrow" id="quick-log-heading">
          <span>一键记录关键节点（自动同步给医护看）</span>
        </div>
        <div className="quick-log-grid">
          <button
            type="button"
            className="quick-log-btn primary-log"
            onClick={() => setModalMode('water')}
          >
            + 破水了
          </button>
          <button
            type="button"
            className="quick-log-btn primary-log"
            onClick={() => setModalMode('cervix')}
          >
            + 内检几指
          </button>
          <button
            type="button"
            className="quick-log-btn"
            onClick={() => onAddEvent('epidural_placed')}
          >
            + 已打无痛
          </button>
          <button
            type="button"
            className="quick-log-btn"
            onClick={() => onAddEvent('admitted')}
          >
            + 办理入院
          </button>
          <button
            type="button"
            className="quick-log-btn"
            onClick={() => onAddEvent('baby_born')}
          >
            + 宝宝出生
          </button>
          <button
            type="button"
            className="quick-log-btn"
            onClick={() => {
              setNoteText('');
              setModalMode('note');
            }}
          >
            + 记一条备注
          </button>
        </div>
      </section>

      <section
        className={`handover-sheet${nurseBright ? ' nurse-bright' : ''}`}
        aria-labelledby="handover-card-title"
      >
        <div className="eyebrow">
          <span id="handover-card-title" style={{ color: 'var(--blue)' }}>
            1 分钟医护交接卡（可直接递给医生/助产士）
          </span>
          <button
            type="button"
            className="mini-del-btn"
            onClick={() => setNurseBright((v) => !v)}
          >
            {nurseBright ? '切回护眼模式' : '医护亮底模式'}
          </button>
        </div>

        <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg)' }}>
          {summary.profileSummary} · 当前：{summary.currentStageName}
        </p>

        {summary.riskAlerts.length > 0 ? (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {summary.riskAlerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  padding: '8px 10px',
                  borderRadius: 10,
                  background: alert.urgent ? 'var(--red-dim)' : 'var(--amber-dim)',
                  border: `1px solid ${alert.urgent ? 'var(--red-border)' : 'var(--amber-border)'}`,
                  fontSize: 13.5,
                  color: 'var(--fg)',
                }}
              >
                <strong style={{ color: alert.urgent ? 'var(--red)' : 'var(--amber)' }}>
                  [{alert.label}]
                </strong>{' '}
                {alert.note}
              </div>
            ))}
          </div>
        ) : null}

        <div className="handover-grid">
          <div className="handover-kv">
            <div className="handover-k">破水状态</div>
            <div className={`handover-v${summary.waterStatus.warningFlag ? ' warn' : ''}`}>
              {summary.waterStatus.broken && summary.waterStatus.at
                ? `${formatTimeOfDay(summary.waterStatus.at)}（${summary.waterStatus.elapsedText}）`
                : '暂未破水'}
            </div>
            {summary.waterStatus.broken ? (
              <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', marginTop: 3 }}>
                羊水：{AMNIOTIC_FLUID_LABELS[summary.waterStatus.fluidStatus ?? 'unknown']}
              </div>
            ) : null}
          </div>

          <div className="handover-kv">
            <div className="handover-k">近 1 小时宫缩</div>
            <div className="handover-v">
              {summary.contractionStats.recent1hCount > 0
                ? `${summary.contractionStats.recent1hCount} 次 · 约 ${
                    summary.contractionStats.recent1hAvgIntervalMin ?? '—'
                  } 分`
                : '暂无规律记录'}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', marginTop: 3 }}>
              平均持续 {formatSecondsCompact(summary.contractionStats.recent1hAvgDurationSec)}
            </div>
          </div>

          <div className="handover-kv">
            <div className="handover-k">最近内检记录</div>
            <div className="handover-v">
              {summary.cervixStatus.at
                ? `${summary.cervixStatus.dilationCm ?? '—'} 公分`
                : '暂未记录'}
            </div>
            {summary.cervixStatus.at ? (
              <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', marginTop: 3 }}>
                {formatTimeOfDay(summary.cervixStatus.at)}
              </div>
            ) : null}
          </div>

          <div className="handover-kv">
            <div className="handover-k">无痛镇痛状态</div>
            <div className="handover-v">
              {summary.epiduralStatus.placed && summary.epiduralStatus.at
                ? `已实施（${formatTimeOfDay(summary.epiduralStatus.at)}）`
                : summary.epiduralStatus.intentLabel}
            </div>
          </div>
        </div>
      </section>

      <section className="card" aria-labelledby="timeline-list-title">
        <div className="eyebrow" id="timeline-list-title">
          <span>时间线打点记录（{state.events.length} 条）</span>
        </div>

        {summary.recentEvents.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--fg-muted)' }}>
            点击上方快捷按钮记录入院、破水、内检和宝宝出生时刻，即可自动生成可导出时间线。
          </p>
        ) : (
          <ul className="ct-history-list">
            {summary.recentEvents.map((ev: ClinicalEvent) => (
              <li key={ev.id} className="ct-history-item">
                <span>{formatEventSummaryLine(ev)}</span>
                <button
                  type="button"
                  className="mini-del-btn"
                  aria-label="删除该时间线节点"
                  onClick={() => onRemoveEvent(ev.id)}
                >
                  删
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="btn-row" style={{ marginTop: 14 }}>
          <button type="button" className="btn primary" onClick={handleCopyMarkdown}>
            复制 / 导出战报 (.md)
          </button>
          <button type="button" className="btn ghost" onClick={handleDownloadJson}>
            备份 JSON
          </button>
        </div>

        {copyFeedback ? (
          <p
            role="status"
            style={{
              marginTop: 8,
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--green)',
              textAlign: 'center',
            }}
          >
            {copyFeedback}
          </p>
        ) : null}
      </section>

      <dialog
        ref={modalRef}
        className="copilot-dialog"
        aria-labelledby="quick-event-dialog-title"
        {...({ closedby: 'any' } as Record<string, string>)}
      >
        <div className="dialog-header">
          <h2 id="quick-event-dialog-title" className="dialog-title">
            {modalMode === 'water'
              ? '记录破水与羊水性状'
              : modalMode === 'cervix'
                ? '记录内检开指情况'
                : '添加陪产备注'}
          </h2>
          <button
            type="button"
            className="dialog-close"
            aria-label="关闭弹窗"
            onClick={() => setModalMode(null)}
          >
            ✕
          </button>
        </div>

        <div className="dialog-body">
          {modalMode === 'water' ? (
            <div className="field-group">
              <span className="field-label">羊水颜色（选择后立即保存当前时间）</span>
              <div className="btn-row" style={{ flexDirection: 'column' }}>
                {(['clear', 'meconium', 'bloody', 'unknown'] as AmnioticFluidStatus[]).map(
                  (status) => (
                    <button
                      key={status}
                      type="button"
                      className={`btn${
                        status === 'meconium' || status === 'bloody' ? ' danger' : ''
                      }`}
                      onClick={() => {
                        onAddEvent('water_broke', undefined, { fluidStatus: status });
                        setModalMode(null);
                      }}
                    >
                      {AMNIOTIC_FLUID_LABELS[status]}
                    </button>
                  ),
                )}
              </div>
            </div>
          ) : null}

          {modalMode === 'cervix' ? (
            <div className="field-group">
              <span className="field-label">医生告知开几公分（1–10 cm）</span>
              <div className="option-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((cm) => (
                  <button
                    key={cm}
                    type="button"
                    className={`option-btn${dilationCm === cm ? ' selected' : ''}`}
                    style={{ textAlign: 'center' }}
                    onClick={() => setDilationCm(cm)}
                  >
                    {cm}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="btn primary"
                style={{ marginTop: 6 }}
                onClick={() => {
                  onAddEvent('cervix_check', undefined, { dilationCm });
                  setModalMode(null);
                }}
              >
                保存内检：{dilationCm} 公分
              </button>
            </div>
          ) : null}

          {modalMode === 'note' ? (
            <div className="field-group">
              <label htmlFor="custom-event-note" className="field-label">
                简短记录（例如：医生查看胎监良好、换球囊等）
              </label>
              <input
                id="custom-event-note"
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="输入要点..."
                style={{
                  minBlockSize: 44,
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border-strong)',
                  background: 'var(--surface-2)',
                  color: 'var(--fg)',
                  fontSize: 15,
                }}
              />
              <button
                type="button"
                className="btn primary"
                disabled={!noteText.trim()}
                onClick={() => {
                  if (!noteText.trim()) return;
                  onAddEvent('note', noteText.trim());
                  setModalMode(null);
                }}
              >
                保存备注
              </button>
            </div>
          ) : null}
        </div>
      </dialog>
    </div>
  );
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

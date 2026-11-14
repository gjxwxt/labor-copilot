import { useRef, useState } from 'react';
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
import { buildBirthKeepsakeData, renderBirthKeepsakePng } from '../../domain/keepsake';
import { useDialogControl } from '../common/useDialogControl';

interface HandoverViewProps {
  state: AppState;
  currentStage: ResolvedStage;
  now: number;
  initialNurseBright?: boolean;
  onAddEvent: (type: ClinicalEventType, detail?: string, meta?: ClinicalEventMeta) => void;
  onRemoveEvent: (id: string) => void;
}

type ModalMode = 'water' | 'cervix' | 'note' | null;

export function HandoverView({
  state,
  currentStage,
  now,
  initialNurseBright = false,
  onAddEvent,
  onRemoveEvent,
}: HandoverViewProps) {
  const [nurseBright, setNurseBright] = useState(initialNurseBright);
  const [fullscreenPlacardOpen, setFullscreenPlacardOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [dilationCm, setDilationCm] = useState<number>(3);
  const [noteText, setNoteText] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [savingPng, setSavingPng] = useState(false);

  const modalRef = useRef<HTMLDialogElement>(null);
  const placardRef = useRef<HTMLDialogElement>(null);

  useDialogControl(modalRef, Boolean(modalMode), () => setModalMode(null), true);
  useDialogControl(placardRef, fullscreenPlacardOpen, () => setFullscreenPlacardOpen(false), true);

  const summary = buildHandoverSummary(
    state.profile,
    state.contractions,
    state.events,
    currentStage,
    now,
  );
  const keepsake = buildBirthKeepsakeData(state, now);

  const notify = (msg: string) => {
    setCopyFeedback(msg);
    window.setTimeout(() => setCopyFeedback(null), 2800);
  };

  const handleCopyMarkdown = async () => {
    const md = exportHandoverMarkdown(summary, state, now);
    try {
      await navigator.clipboard.writeText(md);
      notify('已复制战报（Markdown，可直接粘贴进半亩/备忘录）');
    } catch {
      downloadFile(
        new Blob([md], { type: 'text/markdown' }),
        `labor-handover-${formatTimeOfDay(now).replace(':', '')}.md`,
      );
      notify('已下载交接战报（.md）');
    }
  };

  const handleDownloadJson = () => {
    const json = exportStateJson(state);
    downloadFile(
      new Blob([json], { type: 'application/json' }),
      `labor-backup-${formatTimeOfDay(now).replace(':', '')}.json`,
    );
    notify('已导出本地 JSON 备份');
  };

  const handleDownloadKeepsakePng = async () => {
    setSavingPng(true);
    try {
      const blob = await renderBirthKeepsakePng(keepsake);
      if (blob) {
        downloadFile(
          blob,
          `labor-keepsake-${formatTimeOfDay(now).replace(':', '')}.png`,
        );
        notify('已生成迎新时间轴纪念长图 (.png)');
      } else {
        notify('当前环境不支持长图导出，请改用 Markdown 导出');
      }
    } finally {
      setSavingPng(false);
    }
  };

  return (
    <div className="view-wrap">
      <section className="card" aria-labelledby="quick-log-heading">
        <div className="eyebrow" id="quick-log-heading">
          <span>关键时刻 1 秒打点（自动驱动阶段与交接卡）</span>
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
            className="quick-log-btn accent-log"
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
            + 记备注
          </button>
        </div>
      </section>

      <section
        className={`handover-sheet${nurseBright ? ' nurse-bright' : ''}`}
        aria-labelledby="handover-card-title"
      >
        <div className="eyebrow">
          <span id="handover-card-title" style={{ color: 'var(--blue)' }}>
            医护交接快报（分诊大字摘要）
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="mini-del-btn"
              onClick={() => setNurseBright((v) => !v)}
            >
              {nurseBright ? '护眼' : '亮底'}
            </button>
            <button
              type="button"
              className="mini-del-btn"
              style={{ borderColor: 'var(--blue-border)', color: 'var(--blue)', fontWeight: 800 }}
              onClick={() => setFullscreenPlacardOpen(true)}
            >
              全屏递给护士
            </button>
          </div>
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

        <div className="triage-tier1-grid">
          <div className="triage-kv primary">
            <div className="handover-k">破水与羊水</div>
            <div className={`triage-big-val${summary.waterStatus.warningFlag ? ' warn' : ''}`}>
              {summary.waterStatus.broken && summary.waterStatus.at
                ? `${formatTimeOfDay(summary.waterStatus.at)}`
                : '未破水'}
            </div>
            <div className="triage-sub">
              {summary.waterStatus.broken
                ? `${summary.waterStatus.elapsedText} · ${
                    AMNIOTIC_FLUID_LABELS[summary.waterStatus.fluidStatus ?? 'unknown']
                  }`
                : '有温热流水请立刻记录'}
            </div>
          </div>

          <div className="triage-kv primary">
            <div className="handover-k">近 1 小时宫缩</div>
            <div className="triage-big-val">
              {summary.contractionStats.recent1hCount > 0
                ? `${summary.contractionStats.recent1hCount} 次`
                : '暂无记录'}
            </div>
            <div className="triage-sub">
              {summary.contractionStats.recent1hCount > 0
                ? `均隔 ${summary.contractionStats.recent1hAvgIntervalMin ?? '—'}分 · 均长 ${formatSecondsCompact(
                    summary.contractionStats.recent1hAvgDurationSec,
                  )}`
                : '用底部计时条随手点即可'}
            </div>
          </div>

          <div className="triage-kv">
            <div className="handover-k">最近内检开指</div>
            <div className="handover-v">
              {summary.cervixStatus.at
                ? `${summary.cervixStatus.dilationCm ?? '—'} 公分`
                : '暂未记录'}
            </div>
            {summary.cervixStatus.at ? (
              <div className="triage-sub">{formatTimeOfDay(summary.cervixStatus.at)}</div>
            ) : null}
          </div>

          <div className="triage-kv">
            <div className="handover-k">无痛镇痛</div>
            <div className="handover-v">
              {summary.epiduralStatus.placed && summary.epiduralStatus.at
                ? `已打 (${formatTimeOfDay(summary.epiduralStatus.at)})`
                : summary.epiduralStatus.intentLabel}
            </div>
          </div>
        </div>
      </section>

      <section className="card keepsake-card" aria-labelledby="keepsake-title">
        <div className="eyebrow">
          <span id="keepsake-title">宝宝迎新时间轴 & 战报留档</span>
          <span>共 {state.events.length} 节点</span>
        </div>

        {summary.recentEvents.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--fg-muted)' }}>
            陪产途中点击上方按钮记录入院、破水、无痛、内检与宝宝出生，即自动串成时间轴并可保存为长图或 Markdown。
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

        <div className="btn-row" style={{ marginTop: 14, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn primary"
            disabled={savingPng}
            onClick={handleDownloadKeepsakePng}
          >
            {savingPng ? '生成中...' : '保存纪念长图 (.png)'}
          </button>
          <button type="button" className="btn" onClick={handleCopyMarkdown}>
            复制战报 (.md)
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

      {/* Fullscreen High-Contrast Nurse Handover Placard */}
      <dialog
        ref={placardRef}
        className="copilot-dialog nurse-placard-dialog"
        aria-labelledby="nurse-placard-title"
        {...({ closedby: 'any' } as Record<string, string>)}
      >
        <div className="nurse-placard-sheet">
          <div className="nurse-placard-header">
            <div>
              <div className="nurse-placard-tag">产房交接速览 · 本地实时记录</div>
              <h2 id="nurse-placard-title" className="nurse-placard-title">
                {summary.profileSummary} · {summary.currentStageName}
              </h2>
            </div>
            <button
              type="button"
              className="dialog-close"
              aria-label="退出全屏交接卡"
              onClick={() => setFullscreenPlacardOpen(false)}
            >
              ✕
            </button>
          </div>

          {summary.riskAlerts.length > 0 ? (
            <div className="nurse-placard-alerts">
              {summary.riskAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`nurse-alert-chip${alert.urgent ? ' urgent' : ''}`}
                >
                  <strong>{alert.label}：</strong>
                  {alert.note}
                </div>
              ))}
            </div>
          ) : null}

          <div className="nurse-placard-grid">
            <div className="nurse-metric-card">
              <div className="nurse-metric-k">破水状态</div>
              <div className={`nurse-metric-v${summary.waterStatus.warningFlag ? ' warn' : ''}`}>
                {summary.waterStatus.broken && summary.waterStatus.at
                  ? `${formatTimeOfDay(summary.waterStatus.at)}（已 ${summary.waterStatus.elapsedText}）`
                  : '暂未破水'}
              </div>
              {summary.waterStatus.broken ? (
                <div className="nurse-metric-sub">
                  羊水：{AMNIOTIC_FLUID_LABELS[summary.waterStatus.fluidStatus ?? 'unknown']}
                </div>
              ) : null}
            </div>

            <div className="nurse-metric-card">
              <div className="nurse-metric-k">近 1 小时宫缩</div>
              <div className="nurse-metric-v">
                {summary.contractionStats.recent1hCount > 0
                  ? `${summary.contractionStats.recent1hCount} 次 · 约 ${
                      summary.contractionStats.recent1hAvgIntervalMin ?? '—'
                    } 分一次`
                  : '暂无规律记录'}
              </div>
              <div className="nurse-metric-sub">
                平均持续 {formatSecondsCompact(summary.contractionStats.recent1hAvgDurationSec)}
              </div>
            </div>

            <div className="nurse-metric-card">
              <div className="nurse-metric-k">最近内检开指</div>
              <div className="nurse-metric-v">
                {summary.cervixStatus.at
                  ? `${summary.cervixStatus.dilationCm ?? '—'} 公分（${formatTimeOfDay(
                      summary.cervixStatus.at,
                    )}）`
                  : '暂未记录'}
              </div>
            </div>

            <div className="nurse-metric-card">
              <div className="nurse-metric-k">无痛镇痛</div>
              <div className="nurse-metric-v">
                {summary.epiduralStatus.placed && summary.epiduralStatus.at
                  ? `已实施（${formatTimeOfDay(summary.epiduralStatus.at)}）`
                  : summary.epiduralStatus.intentLabel}
              </div>
            </div>
          </div>

          <p className="nurse-placard-foot">
            时间核对：{formatTimeOfDay(now)} · 仅供医护分诊参考，临床处理以院内体征检查为准
          </p>
        </div>
      </dialog>

      {/* Quick Event Logging Dialog */}
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
                简短记录（例如：胎监良好、已换球囊、进待产室）
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

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

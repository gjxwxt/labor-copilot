import { useRef } from 'react';
import type { UrgentAlertPayload } from '../../domain/autoAdvance';
import { useDialogControl } from '../common/useDialogControl';

interface UrgentAlertModalProps {
  alert: UrgentAlertPayload | null;
  onOpenHandover: () => void;
  onDismiss: () => void;
}

export function UrgentAlertModal({
  alert,
  onOpenHandover,
  onDismiss,
}: UrgentAlertModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useDialogControl(dialogRef, Boolean(alert), onDismiss, false);

  return (
    <dialog
      ref={dialogRef}
      className="copilot-dialog urgent-takeover-dialog"
      aria-labelledby="urgent-takeover-title"
    >
      {alert ? (
        <div className="urgent-takeover-inner">
          <div className="urgent-takeover-badge">
            <span className="pulse-dot" aria-hidden="true" />
            高优先级安全提醒
          </div>
          <h2 id="urgent-takeover-title" className="urgent-takeover-title">
            {alert.title}
          </h2>
          <p className="urgent-takeover-detail">{alert.detail}</p>

          <div className="urgent-takeover-actions">
            <button
              type="button"
              className="btn urgent-cta-primary"
              onClick={onOpenHandover}
            >
              {alert.primaryActionLabel}
            </button>
            <button
              type="button"
              className="btn urgent-cta-secondary"
              onClick={onDismiss}
            >
              {alert.secondaryActionLabel}
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}

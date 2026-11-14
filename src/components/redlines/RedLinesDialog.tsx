import { useRef } from 'react';
import type { BirthProfile, StageKey } from '../../domain/types';
import { RedLinesView } from './RedLinesView';
import { useDialogControl } from '../common/useDialogControl';

interface RedLinesDialogProps {
  open: boolean;
  profile: BirthProfile;
  currentStageKey: StageKey;
  onClose: () => void;
  onGoHandover: () => void;
}

export function RedLinesDialog({
  open,
  profile,
  currentStageKey,
  onClose,
  onGoHandover,
}: RedLinesDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useDialogControl(dialogRef, open, onClose, true);

  return (
    <dialog
      ref={dialogRef}
      className="copilot-dialog"
      aria-labelledby="redlines-dialog-title"
      {...({ closedby: 'any' } as Record<string, string>)}
    >
      <div className="dialog-header">
        <h2 id="redlines-dialog-title" className="dialog-title" style={{ color: 'var(--red)' }}>
          急诊红线 · 立刻按铃指征
        </h2>
        <button
          type="button"
          className="dialog-close"
          aria-label="关闭红线指南"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      <div style={{ paddingBottom: 18 }}>
        <RedLinesView
          profile={profile}
          currentStageKey={currentStageKey}
          onGoHandover={() => {
            onClose();
            onGoHandover();
          }}
        />
      </div>
    </dialog>
  );
}

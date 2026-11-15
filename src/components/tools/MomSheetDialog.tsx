import { useRef } from 'react';
import type { BreathingPresetId, ResolvedStage } from '../../domain/types';
import { useDialogControl } from '../common/useDialogControl';
import { MomView } from '../mom/MomView';

interface MomSheetDialogProps {
  open: boolean;
  currentStage: ResolvedStage;
  breathingPreset: BreathingPresetId;
  onClose: () => void;
  onChangeBreathingPreset: (preset: BreathingPresetId) => void;
}

export function MomSheetDialog({
  open,
  currentStage,
  breathingPreset,
  onClose,
  onChangeBreathingPreset,
}: MomSheetDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useDialogControl(dialogRef, open, onClose, true);

  return (
    <dialog
      ref={dialogRef}
      className="copilot-dialog sheet-dialog mom-sheet-dialog"
      aria-labelledby="mom-sheet-title"
    >
      <div className="dialog-header">
        <div>
          <h2 id="mom-sheet-title" className="dialog-title">
            给她看 · 产房呼吸节拍全屏
          </h2>
        </div>
        <button
          type="button"
          className="icon-close-btn"
          onClick={onClose}
          aria-label="退出全屏呼吸光环"
        >
          ✕
        </button>
      </div>
      <MomView
        currentStage={currentStage}
        breathingPreset={breathingPreset}
        onChangeBreathingPreset={onChangeBreathingPreset}
      />
    </dialog>
  );
}

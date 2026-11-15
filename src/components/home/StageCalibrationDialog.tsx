import { useRef } from 'react';
import type { FocusTag, LifeStageId } from '../../domain/types';
import { useDialogControl } from '../common/useDialogControl';
import { StageCalibrationCard } from './StageCalibrationCard';

interface StageCalibrationDialogProps {
  open: boolean;
  initialStage: LifeStageId;
  initialFocusTags: FocusTag[];
  onClose: () => void;
  onConfirm: (stage: LifeStageId, focusTags: FocusTag[]) => void;
}

export function StageCalibrationDialog({
  open,
  initialStage,
  initialFocusTags,
  onClose,
  onConfirm,
}: StageCalibrationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useDialogControl(dialogRef, open, onClose, true);

  return (
    <dialog
      ref={dialogRef}
      className="copilot-dialog sheet-dialog calibration-dialog"
      aria-label="重新校准当前阶段"
    >
      <StageCalibrationCard
        initialStage={initialStage}
        initialFocusTags={initialFocusTags}
        mode="modal"
        onConfirm={(stage, tags) => {
          onConfirm(stage, tags);
          onClose();
        }}
        onCancel={onClose}
      />
    </dialog>
  );
}

import { useRef } from 'react';
import type {
  BirthProfile,
  ContractionIntensity,
  ContractionRecord,
} from '../../domain/types';
import { ContractionsView } from './ContractionsView';
import { useDialogControl } from '../common/useDialogControl';

interface ContractionsDrawerProps {
  open: boolean;
  profile: BirthProfile;
  records: ContractionRecord[];
  now: number;
  onClose: () => void;
  onStart: () => void;
  onStop: () => void;
  onSetIntensity: (id: string, intensity: ContractionIntensity) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

export function ContractionsDrawer({
  open,
  profile,
  records,
  now,
  onClose,
  onStart,
  onStop,
  onSetIntensity,
  onRemove,
  onClearAll,
}: ContractionsDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useDialogControl(dialogRef, open, onClose, true);

  return (
    <dialog
      ref={dialogRef}
      className="copilot-dialog"
      aria-labelledby="ct-drawer-title"
      {...({ closedby: 'any' } as Record<string, string>)}
    >
      <div className="dialog-header">
        <h2 id="ct-drawer-title" className="dialog-title">
          宫缩趋势与完整记录
        </h2>
        <button
          type="button"
          className="dialog-close"
          aria-label="关闭宫缩详情"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      <div style={{ padding: '4px 0 18px' }}>
        <ContractionsView
          profile={profile}
          records={records}
          now={now}
          onStart={onStart}
          onStop={onStop}
          onSetIntensity={onSetIntensity}
          onRemove={onRemove}
          onClearAll={onClearAll}
        />
      </div>
    </dialog>
  );
}

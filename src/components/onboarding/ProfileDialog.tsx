import { useEffect, useRef, useState } from 'react';
import type {
  BirthMode,
  BirthProfile,
  EpiduralIntent,
  Parity,
  PartnerAccess,
  RiskTag,
  ThemePreference,
} from '../../domain/types';
import {
  ALL_RISK_TAGS,
  BIRTH_MODE_LABELS,
  EPIDURAL_LABELS,
  PARITY_LABELS,
  PARTNER_ACCESS_LABELS,
  PROFILE_PRESETS,
  RISK_TAG_META,
} from '../../domain/profile';

interface ProfileDialogProps {
  open: boolean;
  profile: BirthProfile;
  theme: ThemePreference;
  wakeLockEnabled: boolean;
  onClose: () => void;
  onSaveProfile: (nextProfile: BirthProfile) => void;
  onChangeTheme: (theme: ThemePreference) => void;
  onToggleWakeLock: (enabled: boolean) => void;
  onResetAllData: () => void;
}

export function ProfileDialog({
  open,
  profile,
  theme,
  wakeLockEnabled,
  onClose,
  onSaveProfile,
  onChangeTheme,
  onToggleWakeLock,
  onResetAllData,
}: ProfileDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<BirthProfile>(profile);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(profile);
      setConfirmReset(false);
    }
  }, [open, profile]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Fallback light dismiss for browsers without closedby="any" (e.g., Safari)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = '';
      onClose();
    };

    const outside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      );
    };

    let pressedOutside = false;
    const onPointerDown = (e: PointerEvent) => {
      pressedOutside = outside(e);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!('closedBy' in HTMLDialogElement.prototype) && pressedOutside && outside(e)) {
        dialog.close();
      }
      pressedOutside = false;
    };

    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('pointerdown', onPointerDown);
    dialog.addEventListener('pointerup', onPointerUp);
    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('pointerdown', onPointerDown);
      dialog.removeEventListener('pointerup', onPointerUp);
    };
  }, [onClose]);

  const applyPreset = (preset: BirthProfile) => {
    setDraft({
      ...preset,
      riskTags: [...draft.riskTags],
    });
  };

  const toggleRiskTag = (tag: RiskTag) => {
    setDraft((prev) => {
      const exists = prev.riskTags.includes(tag);
      return {
        ...prev,
        id: 'custom',
        label: `${BIRTH_MODE_LABELS[prev.birthMode]} · ${
          prev.parity === 'nulliparous' ? '初产' : '经产'
        }`,
        riskTags: exists
          ? prev.riskTags.filter((t) => t !== tag)
          : [...prev.riskTags, tag],
      };
    });
  };

  const updateField = <K extends keyof BirthProfile>(key: K, value: BirthProfile[K]) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      return {
        ...next,
        id: 'custom',
        label: `${BIRTH_MODE_LABELS[next.birthMode]} · ${
          next.parity === 'nulliparous' ? '初产' : '经产'
        }`,
      };
    });
  };

  return (
    <dialog
      ref={dialogRef}
      className="copilot-dialog"
      aria-labelledby="profile-dialog-title"
      {...({ closedby: 'any' } as Record<string, string>)}
    >
      <div className="dialog-header">
        <h2 id="profile-dialog-title" className="dialog-title">
          30 秒孕产画像与偏好设置
        </h2>
        <button
          type="button"
          className="dialog-close"
          aria-label="关闭设置窗口"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <div className="dialog-body">
        <div className="field-group">
          <span className="field-label">1. 一键套用常见场景预设</span>
          <div className="option-grid">
            {PROFILE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`option-btn${
                  draft.birthMode === preset.birthMode && draft.parity === preset.parity
                    ? ' selected'
                    : ''
                }`}
                onClick={() => applyPreset(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field-group">
          <span className="field-label">2. 胎次</span>
          <div className="option-grid">
            {(['nulliparous', 'multiparous'] as Parity[]).map((p) => (
              <button
                key={p}
                type="button"
                className={`option-btn${draft.parity === p ? ' selected' : ''}`}
                onClick={() => updateField('parity', p)}
              >
                {PARITY_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="field-group">
          <span className="field-label">3. 计划分娩 / 发动方式</span>
          <div className="option-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {(['spontaneous', 'induction', 'planned_csection'] as BirthMode[]).map((m) => (
              <button
                key={m}
                type="button"
                className={`option-btn${draft.birthMode === m ? ' selected' : ''}`}
                onClick={() => updateField('birthMode', m)}
              >
                {BIRTH_MODE_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        <div className="field-group">
          <span className="field-label">
            4. 医学重点关注标签（可多选，自动挂载对应提问卡与红线）
          </span>
          <div className="risk-chip-grid">
            {ALL_RISK_TAGS.map((tag) => {
              const selected = draft.riskTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  className={`risk-chip${selected ? ' selected' : ''}`}
                  aria-pressed={selected}
                  onClick={() => toggleRiskTag(tag)}
                >
                  {selected ? '✓ ' : '+ '}
                  {RISK_TAG_META[tag].label}
                </button>
              );
            })}
          </div>
        </div>

        {draft.birthMode !== 'planned_csection' ? (
          <>
            <div className="field-group">
              <span className="field-label">5. 无痛分娩意愿</span>
              <div className="option-grid">
                {(['wanted', 'open', 'no', 'unknown'] as EpiduralIntent[]).map((ei) => (
                  <button
                    key={ei}
                    type="button"
                    className={`option-btn${draft.epiduralIntent === ei ? ' selected' : ''}`}
                    onClick={() => updateField('epiduralIntent', ei)}
                  >
                    {EPIDURAL_LABELS[ei]}
                  </button>
                ))}
              </div>
            </div>

            <div className="field-group">
              <span className="field-label">6. 医院是否允许家属进产房陪产</span>
              <div className="option-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {(['yes', 'no', 'unknown'] as PartnerAccess[]).map((pa) => (
                  <button
                    key={pa}
                    type="button"
                    className={`option-btn${
                      draft.partnerAllowedInDelivery === pa ? ' selected' : ''
                    }`}
                    onClick={() => updateField('partnerAllowedInDelivery', pa)}
                  >
                    {pa === 'yes' ? '允许进产房' : pa === 'no' ? '仅门外等' : '暂不确定'}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>
                当前选择：{PARTNER_ACCESS_LABELS[draft.partnerAllowedInDelivery]}
              </span>
            </div>
          </>
        ) : null}

        <div className="btn-row">
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              onSaveProfile(draft);
              onClose();
            }}
          >
            保存配置并生成我的路线图
          </button>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

        <div className="field-group">
          <span className="field-label">界面外观与产房实用开关</span>
          <div className="option-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {(
              [
                ['system', '跟随系统'],
                ['dark', '夜间护眼暗色'],
                ['light', '日间高对比'],
              ] as Array<[ThemePreference, string]>
            ).map(([val, text]) => (
              <button
                key={val}
                type="button"
                className={`option-btn${theme === val ? ' selected' : ''}`}
                onClick={() => onChangeTheme(val)}
              >
                {text}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={`option-btn${wakeLockEnabled ? ' selected' : ''}`}
            onClick={() => onToggleWakeLock(!wakeLockEnabled)}
          >
            屏幕常亮保护（Wake Lock）：{wakeLockEnabled ? '已开启（推荐）' : '已关闭'}
          </button>
        </div>

        <div className="field-group">
          <span className="field-label">隐私与本地数据清理（所有数据仅存本机浏览器）</span>
          {!confirmReset ? (
            <button
              type="button"
              className="btn danger"
              onClick={() => setConfirmReset(true)}
            >
              清空全部本地记录与重置配置
            </button>
          ) : (
            <div className="btn-row">
              <button
                type="button"
                className="btn ghost"
                onClick={() => setConfirmReset(false)}
              >
                再想想
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={() => {
                  onResetAllData();
                  onClose();
                }}
              >
                确认彻底清空本地数据
              </button>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}

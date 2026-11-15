import { useState } from 'react';
import type {
  AuthUser,
  BirthProfile,
  FocusTag,
  KnowledgeCard,
  LifeStageId,
  ThemePreference,
} from '../../domain/types';
import {
  FOCUS_TAG_META,
  KNOWLEDGE_CATEGORY_LABELS,
  LIFE_STAGE_META,
} from '../../domain/recommendations';
import { formatProfileShortLabel } from '../../domain/profile';

interface MeViewProps {
  authUser: AuthUser | null;
  lifeStage: LifeStageId;
  focusTags: FocusTag[];
  profile: BirthProfile;
  favoriteCards: KnowledgeCard[];
  theme: ThemePreference;
  wakeLockEnabled: boolean;
  wakeLockSupported: boolean;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
  onOpenCalibration: () => void;
  onOpenProfile: () => void;
  onOpenCard: (cardId: string) => void;
  onToggleFavorite: (cardId: string) => void;
  onChangeTheme: (theme: ThemePreference) => void;
  onToggleWakeLock: (enabled: boolean) => void;
  onResetAllData: () => void;
}

export function MeView({
  authUser,
  lifeStage,
  focusTags,
  profile,
  favoriteCards,
  theme,
  wakeLockEnabled,
  wakeLockSupported,
  onOpenAuth,
  onLogout,
  onOpenCalibration,
  onOpenProfile,
  onOpenCard,
  onToggleFavorite,
  onChangeTheme,
  onToggleWakeLock,
  onResetAllData,
}: MeViewProps) {
  const [confirmReset, setConfirmReset] = useState(false);
  const stageMeta = LIFE_STAGE_META[lifeStage];

  return (
    <div className="view-wrap me-view">
      <section className="me-account-card">
        {authUser ? (
          <div className="account-signed-row">
            <div className="avatar-circle" aria-hidden="true">
              {authUser.nickname.slice(0, 1)}
            </div>
            <div className="account-info">
              <h2 className="account-name">{authUser.nickname}</h2>
              <div className="account-sub">
                @{authUser.username} · 云端同步已开启
              </div>
            </div>
            <button type="button" className="pill-btn compact" onClick={onLogout}>
              退出登录
            </button>
          </div>
        ) : (
          <div className="account-guest-box">
            <div>
              <div className="calibration-eyebrow">本地免登录已全部可用</div>
              <h2 className="account-name">登录 / 注册护航账号</h2>
              <p className="account-sub">
                登录后可永久保留个人收藏夹、为科普点赞、并在知识库发表纯文字评论。
              </p>
            </div>
            <div className="guest-cta-row">
              <button
                type="button"
                className="btn btn-primary btn-compact"
                onClick={() => onOpenAuth('login')}
              >
                立即登录
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-compact"
                onClick={() => onOpenAuth('register')}
              >
                新用户注册
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="me-stage-card">
        <div className="section-row-head">
          <div>
            <div className="section-kicker">个性化档案（Keep 模式）</div>
            <h3 className="me-card-title">{stageMeta.label}</h3>
          </div>
          <button type="button" className="pill-btn active compact" onClick={onOpenCalibration}>
            校准阶段
          </button>
        </div>
        <div className="stage-hero-tags">
          {focusTags.map((tag) => (
            <span key={tag} className="tag-chip-static">
              {FOCUS_TAG_META[tag].label}
            </span>
          ))}
        </div>
        <div className="me-profile-row">
          <span>孕产/陪产配置：{formatProfileShortLabel(profile)}</span>
          <button type="button" className="link-more-btn" onClick={onOpenProfile}>
            修改分娩设定 ›
          </button>
        </div>
      </section>

      <section className="me-favorites-card" aria-label="我的收藏夹">
        <div className="section-row-head">
          <div>
            <div className="section-kicker">高频复看与应急备查</div>
            <h3 className="me-card-title">★ 我的收藏夹 ({favoriteCards.length})</h3>
          </div>
        </div>

        {favoriteCards.length === 0 ? (
          <div className="fav-empty-box">
            还没有收藏卡片。在首页或知识库点击任意卡片右上角「☆ 收藏」，重要急救和拍嗝手法就能一秒找回。
          </div>
        ) : (
          <div className="fav-list">
            {favoriteCards.map((card) => (
              <div key={card.id} className="fav-row-item">
                <button
                  type="button"
                  className="fav-row-main"
                  onClick={() => onOpenCard(card.id)}
                >
                  <span className="fav-row-cat">
                    {KNOWLEDGE_CATEGORY_LABELS[card.category]}
                  </span>
                  <strong>{card.title}</strong>
                  <small>{card.keyWindow} · {card.subtitle}</small>
                </button>
                <button
                  type="button"
                  className="pill-btn compact"
                  onClick={() => onToggleFavorite(card.id)}
                  aria-label={`移出收藏 ${card.title}`}
                >
                  移出
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="me-settings-card" aria-label="外观与设备设置">
        <h3 className="me-card-title">外观与设备偏好</h3>

        <div className="setting-row">
          <span>显示主题</span>
          <div className="theme-seg">
            {(
              [
                ['system', '自动'],
                ['dark', '夜护'],
                ['light', '日间'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`seg-btn${theme === val ? ' active' : ''}`}
                onClick={() => onChangeTheme(val)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {wakeLockSupported ? (
          <label className="setting-row checkbox-row">
            <span>防锁屏常亮（产房计时建议开启）</span>
            <input
              type="checkbox"
              checked={wakeLockEnabled}
              onChange={(e) => onToggleWakeLock(e.target.checked)}
            />
          </label>
        ) : null}

        <div className="setting-reset-row">
          {!confirmReset ? (
            <button
              type="button"
              className="btn btn-ghost btn-compact"
              onClick={() => setConfirmReset(true)}
            >
              清空本地记录与重置向导
            </button>
          ) : (
            <div className="reset-confirm-box">
              <span>确定清空宫缩、事件与勾选？（账号内云端收藏不受影响）</span>
              <div className="guest-cta-row">
                <button
                  type="button"
                  className="btn btn-danger btn-compact"
                  onClick={() => {
                    onResetAllData();
                    setConfirmReset(false);
                  }}
                >
                  确认清空
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-compact"
                  onClick={() => setConfirmReset(false)}
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import type { AuthUser, CommentItem, KnowledgeCard } from '../../domain/types';
import { KNOWLEDGE_CATEGORY_LABELS } from '../../domain/recommendations';
import {
  ApiClientError,
  deleteCardComment,
  fetchCardCommunity,
  postCardComment,
  toggleCardLike,
} from '../../api/client';
import { useDialogControl } from '../common/useDialogControl';
import { PostureDiagram } from './PostureDiagram';
import { EmergencyWidgets } from './EmergencyWidgets';

interface KnowledgeDetailDialogProps {
  card: KnowledgeCard | null;
  authUser: AuthUser | null;
  authToken: string | null;
  isFavorite: boolean;
  isLikedLocal: boolean;
  onClose: () => void;
  onToggleFavorite: (cardId: string) => void;
  onToggleLikeLocal: (cardId: string, liked: boolean) => void;
  onRequestAuth: () => void;
}

function formatCommentTime(ts: number): string {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${mm}-${dd} ${hh}:${min}`;
}

export function KnowledgeDetailDialog({
  card,
  authUser,
  authToken,
  isFavorite,
  isLikedLocal,
  onClose,
  onToggleFavorite,
  onToggleLikeLocal,
  onRequestAuth,
}: KnowledgeDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [serverLikeDelta, setServerLikeDelta] = useState(0);
  const [likedByServer, setLikedByServer] = useState<boolean | null>(null);
  const [loadingCommunity, setLoadingCommunity] = useState(false);
  const [communityStatus, setCommunityStatus] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [previewJumped, setPreviewJumped] = useState(false);

  useDialogControl(dialogRef, Boolean(card), onClose, true);

  useEffect(() => {
    if (!card) return;
    setCommentText('');
    setCommunityStatus(null);
    setShareNote(null);
    setPreviewJumped(false);
    setLikedByServer(null);
    setServerLikeDelta(0);
    setComments([]);

    let cancelled = false;
    setLoadingCommunity(true);
    fetchCardCommunity(card.id, authToken)
      .then((res) => {
        if (cancelled) return;
        setServerLikeDelta(res.likeCount);
        setLikedByServer(res.likedByMe);
        setComments(res.comments);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiClientError && err.offline) {
          setCommunityStatus('离线或暂未连上评论服务，以下全部急救步骤与图文仍可完整使用');
        } else {
          setCommunityStatus('评论暂未加载，核心急救与操作指引不受影响');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCommunity(false);
      });

    return () => {
      cancelled = true;
    };
  }, [card, authToken]);

  if (!card) {
    return <dialog ref={dialogRef} className="sheet-dialog detail-dialog" />;
  }

  const liked = likedByServer !== null ? likedByServer : isLikedLocal;
  const displayLikeCount =
    card.baseLikes + serverLikeDelta + (likedByServer === null && isLikedLocal ? 1 : 0);

  const handleToggleLike = async () => {
    if (!authToken) {
      onToggleLikeLocal(card.id, !isLikedLocal);
      return;
    }
    try {
      const res = await toggleCardLike(card.id, authToken);
      setLikedByServer(res.likedByMe);
      setServerLikeDelta(res.likeCount);
      onToggleLikeLocal(card.id, res.likedByMe);
    } catch {
      onToggleLikeLocal(card.id, !liked);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) {
      onRequestAuth();
      return;
    }
    const clean = commentText.trim();
    if (clean.length < 2) {
      setCommunityStatus('请至少输入 2 个字后再发布');
      return;
    }
    setSubmittingComment(true);
    setCommunityStatus(null);
    try {
      const res = await postCardComment(card.id, clean, authToken);
      setComments((prev) => [res.comment, ...prev]);
      setCommentText('');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setCommunityStatus(err.message);
      } else {
        setCommunityStatus('发送评论失败，请稍后重试');
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number | string) => {
    if (!authToken) return;
    try {
      await deleteCardComment(commentId, authToken);
      setComments((prev) => prev.filter((c) => String(c.id) !== String(commentId)));
    } catch (err) {
      if (err instanceof ApiClientError) {
        setCommunityStatus(err.message);
      }
    }
  };

  const handleCopyShare = async () => {
    const text = [
      `【${card.title}】`,
      card.subtitle,
      ...card.steps.map((s, idx) => `${idx + 1}. ${s.title}：${s.detail}`),
      `⚠ 注意：${card.caution}`,
      `出处参考：${card.sourceName} (${card.sourceUrl})`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setShareNote('已复制完整文字要点，可直接粘到微信发给家人');
    } catch {
      setShareNote('当前浏览器限制自动复制，可直接截图转发');
    }
    window.setTimeout(() => setShareNote(null), 2600);
  };

  return (
    <dialog
      ref={dialogRef}
      className="sheet-dialog detail-dialog"
      aria-labelledby="detail-dialog-title"
    >
      <div className="dialog-header detail-header">
        <div className="detail-header-text">
          <div className="detail-eyebrow-row">
            <span className={`kc-tone-badge tone-${card.coverTone}`}>
              {card.isEmergency ? '紧急处置' : KNOWLEDGE_CATEGORY_LABELS[card.category]}
            </span>
            <span className="detail-duration">视频示范 · {card.durationText}</span>
          </div>
          <h2 id="detail-dialog-title" className="dialog-title">
            {card.title}
          </h2>
          <p className="dialog-sub">{card.subtitle}</p>
        </div>

        <div className="detail-head-actions">
          <button
            type="button"
            className={`fav-icon-btn large${isFavorite ? ' saved' : ''}`}
            onClick={() => onToggleFavorite(card.id)}
            aria-pressed={isFavorite}
          >
            {isFavorite ? '★ 已收藏' : '☆ 收藏'}
          </button>
          <button type="button" className="icon-close-btn" onClick={onClose} aria-label="关闭详情">
            ✕
          </button>
        </div>
      </div>

      <div className="dialog-body detail-body">
        {card.widgetType ? <EmergencyWidgets widgetType={card.widgetType} /> : null}

        <div className="video-stage-card">
          {card.mediaUrl ? (
            <video
              controls
              playsInline
              preload="metadata"
              src={card.mediaUrl}
              className="detail-video-player"
            />
          ) : (
            <div className={`video-curated-box tone-${card.coverTone}`}>
              <div className="video-curated-top">
                <span className="video-badge">站主严选教学位 · 免四处比对</span>
                <span className="video-duration-pill">{card.durationText}</span>
              </div>
              <div className="video-curated-title">
                {previewJumped
                  ? `已锚定核心实操片段：${card.keyWindow}`
                  : `关键示范直达：${card.keyWindow}`}
              </div>
              <p className="video-curated-note">
                参考出处：{card.sourceName}。下方已浓缩全部离线图文与动作红线，无网环境也可直接照做。
              </p>
              <div className="video-curated-actions">
                <button
                  type="button"
                  className="pill-btn active compact"
                  onClick={() => setPreviewJumped((v) => !v)}
                >
                  {previewJumped ? '✓ 已展开关键提示' : `⚡ 标记重点 (${card.keyWindow})`}
                </button>
                <a
                  href={card.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pill-btn compact link-pill"
                >
                  查阅权威来源出处 ↗
                </a>
              </div>
            </div>
          )}
        </div>

        {card.diagramId ? <PostureDiagram diagramId={card.diagramId} /> : null}

        <div className="detail-summary-box">{card.summary}</div>

        <section className="detail-steps-section" aria-label="分步骤操作指引">
          <h3 className="detail-section-title">分步骤做法</h3>
          <ol className="detail-step-list">
            {card.steps.map((step, index) => (
              <li key={index} className="detail-step-item">
                <div className="detail-step-num">{index + 1}</div>
                <div className="detail-step-content">
                  <div className="detail-step-title">{step.title}</div>
                  {step.highlight ? (
                    <div className="detail-step-highlight">{step.highlight}</div>
                  ) : null}
                  <p className="detail-step-desc">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="caution-banner" role="alert">
          <strong>千万别这么做（避坑红线）：</strong>
          <span>{card.caution}</span>
        </div>

        <div className="pinned-tip-box">
          <div>{card.pinnedTip}</div>
          <div className="evidence-line">循证依据：{card.evidenceRef}</div>
        </div>

        <div className="detail-feedback-bar">
          <button
            type="button"
            className={`pill-btn compact${liked ? ' active' : ''}`}
            onClick={handleToggleLike}
            aria-pressed={liked}
          >
            👍 有用 ({displayLikeCount})
          </button>
          <button
            type="button"
            className={`pill-btn compact${isFavorite ? ' active' : ''}`}
            onClick={() => onToggleFavorite(card.id)}
            aria-pressed={isFavorite}
          >
            {isFavorite ? '★ 已存收藏夹' : '☆ 加入收藏夹'}
          </button>
          <button type="button" className="pill-btn compact" onClick={handleCopyShare}>
            📋 复制转发家人
          </button>
        </div>

        {shareNote ? <div className="inline-toast">{shareNote}</div> : null}

        <section className="comments-section" aria-label="家长文字交流区">
          <div className="comments-head">
            <h3 className="detail-section-title">家长文字交流 ({comments.length})</h3>
            <span className="comments-rule">MVP 阶段仅限纯文字 · 禁发图与外链</span>
          </div>

          {authUser ? (
            <form className="comment-composer" onSubmit={handleSubmitComment}>
              <textarea
                className="text-input comment-textarea"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder={`以「${authUser.nickname}」身份分享一条避坑经验或疑问（2–300字）...`}
              />
              <div className="comment-composer-foot">
                <span className="char-count">{commentText.trim().length}/300</span>
                <button
                  type="submit"
                  className="btn btn-primary btn-compact"
                  disabled={submittingComment}
                >
                  {submittingComment ? '发送中...' : '发送评论'}
                </button>
              </div>
            </form>
          ) : (
            <div className="comment-login-prompt">
              <span>登录后即可发表纯文字交流与同步收藏夹</span>
              <button
                type="button"
                className="btn btn-primary btn-compact"
                onClick={onRequestAuth}
              >
                登录 / 注册
              </button>
            </div>
          )}

          {communityStatus ? (
            <div className="community-status-note">{communityStatus}</div>
          ) : null}

          {loadingCommunity ? (
            <p className="loading-note">正在同步评论...</p>
          ) : comments.length === 0 ? (
            <p className="empty-comment-note">暂无文字评论，欢迎分享你的实操经验。</p>
          ) : (
            <ul className="comment-list">
              {comments.map((item) => (
                <li key={item.id} className="comment-item">
                  <div className="comment-item-top">
                    <span className="comment-author">{item.nickname}</span>
                    <span className="comment-time">
                      {formatCommentTime(item.createdAt)}
                      {authUser && String(authUser.id) === String(item.userId) ? (
                        <button
                          type="button"
                          className="comment-del-btn"
                          onClick={() => handleDeleteComment(item.id)}
                        >
                          删除
                        </button>
                      ) : null}
                    </span>
                  </div>
                  <p className="comment-content">{item.content}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </dialog>
  );
}

import { useEffect, useRef, useState } from 'react';
import type { AuthUser } from '../../domain/types';
import { ApiClientError, loginAccount, registerAccount } from '../../api/client';
import { useDialogControl } from '../common/useDialogControl';

interface AuthDialogProps {
  open: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: (payload: {
    token: string;
    user: AuthUser;
    favoriteIds: string[];
  }) => void;
}

export function AuthDialog({
  open,
  initialMode = 'login',
  onClose,
  onSuccess,
}: AuthDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useDialogControl(dialogRef, open, onClose, true);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setErrorMsg(null);
    }
  }, [open, initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const cleanUser = username.trim().toLowerCase();
      if (mode === 'register') {
        const res = await registerAccount({
          username: cleanUser,
          nickname: nickname.trim() || cleanUser,
          password,
        });
        onSuccess(res);
      } else {
        const res = await loginAccount({
          username: cleanUser,
          password,
        });
        onSuccess(res);
      }
      setPassword('');
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('操作失败，请稍后重试');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog ref={dialogRef} className="sheet-dialog" aria-labelledby="auth-dialog-title">
      <div className="dialog-header">
        <div>
          <h2 id="auth-dialog-title" className="dialog-title">
            {mode === 'login' ? '登录护航账号' : '注册护航账号'}
          </h2>
          <p className="dialog-sub">
            浏览全部知识库与急救工具免登录；登录后可云端同步收藏夹、点赞和发表文字评论。
          </p>
        </div>
        <button type="button" className="icon-close-btn" onClick={onClose} aria-label="关闭登录弹窗">
          ✕
        </button>
      </div>

      <div className="dialog-body">
        <div className="auth-mode-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={`auth-mode-tab${mode === 'login' ? ' active' : ''}`}
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
          >
            账号登录
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={`auth-mode-tab${mode === 'register' ? ' active' : ''}`}
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
          >
            快速注册
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field-block">
            <span className="field-label">用户名（3–24 位字母、数字或下划线）</span>
            <input
              type="text"
              className="text-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="例如：mama2026"
              autoComplete="username"
              required
            />
          </label>

          {mode === 'register' ? (
            <label className="field-block">
              <span className="field-label">社区昵称（评论区展示名）</span>
              <input
                type="text"
                className="text-input"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="例如：糖糖爸爸"
                maxLength={24}
                required
              />
            </label>
          ) : null}

          <label className="field-block">
            <span className="field-label">密码（至少 6 位）</span>
            <input
              type="password"
              className="text-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入登录密码"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </label>

          {errorMsg ? (
            <div className="form-error-banner" role="alert">
              {errorMsg}
            </div>
          ) : null}

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={submitting}
          >
            {submitting
              ? '提交中...'
              : mode === 'login'
                ? '登录并同步收藏'
                : '注册并进入'}
          </button>
        </form>
      </div>
    </dialog>
  );
}

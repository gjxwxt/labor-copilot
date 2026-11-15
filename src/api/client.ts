import type { AuthUser, CommentItem } from '../domain/types';

const AUTH_STORAGE_KEY = 'labor_copilot_auth_v1';

export interface StoredAuthSession {
  token: string;
  user: AuthUser;
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly offline: boolean;

  constructor(message: string, status: number = 0, offline: boolean = false) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.offline = offline;
  }
}

export function getStoredAuth(): StoredAuthSession | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (
      typeof parsed.token === 'string' &&
      parsed.token &&
      parsed.user &&
      typeof parsed.user === 'object'
    ) {
      const user = parsed.user as AuthUser;
      if (
        (typeof user.id === 'string' || typeof user.id === 'number') &&
        typeof user.username === 'string'
      ) {
        return { token: parsed.token, user };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function saveStoredAuth(session: StoredAuthSession): void {
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage errors
  }
}

export function clearStoredAuth(): void {
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

async function requestJson<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string | null;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let response: Response;
  try {
    response = await fetch(`./api${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiClientError('当前离线或服务暂未连接，本地知识库与计时功能不受影响', 0, true);
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    // Non-JSON error response
  }

  if (!response.ok) {
    const msg =
      typeof payload.error === 'string' && payload.error
        ? payload.error
        : `请求失败 (${response.status})`;
    throw new ApiClientError(msg, response.status, false);
  }

  return payload as T;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  favoriteIds: string[];
}

export async function registerAccount(input: {
  username: string;
  nickname: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await requestJson<AuthResponse>('/auth/register', {
    method: 'POST',
    body: input,
  });
  saveStoredAuth({ token: res.token, user: res.user });
  return res;
}

export async function loginAccount(input: {
  username: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await requestJson<AuthResponse>('/auth/login', {
    method: 'POST',
    body: input,
  });
  saveStoredAuth({ token: res.token, user: res.user });
  return res;
}

export async function fetchMe(token: string): Promise<{
  user: AuthUser;
  favoriteIds: string[];
}> {
  return requestJson('/auth/me', { token });
}

export interface CardCommunityPayload {
  cardId: string;
  likeCount: number;
  likedByMe: boolean;
  comments: CommentItem[];
}

export async function fetchCardCommunity(
  cardId: string,
  token?: string | null,
): Promise<CardCommunityPayload> {
  return requestJson(`/cards/${encodeURIComponent(cardId)}`, { token });
}

export async function toggleCardFavorite(
  cardId: string,
  token: string,
): Promise<{ favorited: boolean; favoriteIds: string[] }> {
  return requestJson(`/cards/${encodeURIComponent(cardId)}/favorite`, {
    method: 'POST',
    token,
  });
}

export async function toggleCardLike(
  cardId: string,
  token: string,
): Promise<{ likedByMe: boolean; likeCount: number }> {
  return requestJson(`/cards/${encodeURIComponent(cardId)}/like`, {
    method: 'POST',
    token,
  });
}

export async function postCardComment(
  cardId: string,
  content: string,
  token: string,
): Promise<{ comment: CommentItem }> {
  return requestJson(`/cards/${encodeURIComponent(cardId)}/comments`, {
    method: 'POST',
    body: { content },
    token,
  });
}

export async function deleteCardComment(
  commentId: number | string,
  token: string,
): Promise<{ deleted: boolean }> {
  return requestJson(`/comments/${encodeURIComponent(String(commentId))}`, {
    method: 'DELETE',
    token,
  });
}

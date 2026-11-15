#!/usr/bin/env python3
"""
护航 (Labor Copilot) V3 轻量化后端服务（纯 Python 3.9+ 标准库 + SQLite WAL）
职责：
1. 轻账号注册/登录（PBKDF2-HMAC-SHA256 密码哈希 + HMAC-SHA256 无状态签名 Token）
2. 知识/视频卡片收藏夹同步 & 有用点赞计数
3. 纯文字家长评论区（内置长度校验、文本清洗、仅本人可删、不接收任何图片/视频文件上传）
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import time
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Optional
from urllib.parse import urlparse

MAX_BODY_BYTES = 16 * 1024
TOKEN_TTL_SECONDS = 30 * 24 * 3600
USERNAME_RE = re.compile(r"^[a-zA-Z0-9_\u4e00-\u9fa5.@+-]{2,40}$")


def now_ms() -> int:
    return int(time.time() * 1000)


def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    actual_salt = salt or secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        actual_salt.encode("utf-8"),
        120_000,
    )
    return base64.b64encode(dk).decode("ascii"), actual_salt


def verify_password(password: str, expected_hash: str, salt: str) -> bool:
    computed, _ = hash_password(password, salt)
    return hmac.compare_digest(computed, expected_hash)


def sign_token(user_id: int, username: str, secret: str, exp_sec: Optional[int] = None) -> str:
    exp = exp_sec or (int(time.time()) + TOKEN_TTL_SECONDS)
    payload = json.dumps({"uid": user_id, "u": username, "exp": exp}, separators=(",", ":")).encode("utf-8")
    b64 = base64.urlsafe_b64encode(payload).decode("ascii").rstrip("=")
    sig = hmac.new(secret.encode("utf-8"), b64.encode("ascii"), hashlib.sha256).hexdigest()
    return f"{b64}.{sig}"


def verify_token(token: str, secret: str) -> Optional[dict[str, Any]]:
    try:
        b64, sig = token.split(".", 1)
        expected_sig = hmac.new(secret.encode("utf-8"), b64.encode("ascii"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        padded = b64 + "=" * (-len(b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded.encode("ascii")).decode("utf-8"))
        if int(payload.get("exp", 0)) < int(time.time()):
            return None
        return payload
    except Exception:
        return None


def sanitize_text(raw: str, max_len: int) -> str:
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", raw).strip()
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned[:max_len]


class LaborStore:
    def __init__(self, db_path: str) -> None:
        self.db_path = db_path
        parent = os.path.dirname(os.path.abspath(db_path))
        if parent:
            os.makedirs(parent, exist_ok=True)
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=10.0)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA foreign_keys=ON;")
        return conn

    def _init_db(self) -> None:
        with self._connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE,
                    nickname TEXT NOT NULL,
                    password_hash TEXT NOT NULL,
                    salt TEXT NOT NULL,
                    created_at INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS favorites (
                    user_id INTEGER NOT NULL,
                    card_id TEXT NOT NULL,
                    created_at INTEGER NOT NULL,
                    PRIMARY KEY (user_id, card_id),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                CREATE TABLE IF NOT EXISTS likes (
                    user_id INTEGER NOT NULL,
                    card_id TEXT NOT NULL,
                    created_at INTEGER NOT NULL,
                    PRIMARY KEY (user_id, card_id),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                CREATE TABLE IF NOT EXISTS comments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    card_id TEXT NOT NULL,
                    user_id INTEGER NOT NULL,
                    nickname TEXT NOT NULL,
                    content TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'visible',
                    created_at INTEGER NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS idx_comments_card_time ON comments(card_id, created_at DESC);
                """
            )

    def register_user(self, username: str, nickname: str, password: str) -> dict[str, Any]:
        uname = username.strip().lower()
        if not USERNAME_RE.match(uname):
            raise ValueError("账号仅支持 2-40 位字母、数字、中文、邮箱或常见符号")
        if len(password) < 6 or len(password) > 72:
            raise ValueError("密码长度需在 6–72 位之间")
        nick = sanitize_text(nickname or uname.split("@")[0], 24) or "新手家长"
        pw_hash, salt = hash_password(password)
        ts = now_ms()
        try:
            with self._connect() as conn:
                cur = conn.execute(
                    "INSERT INTO users (username, nickname, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)",
                    (uname, nick, pw_hash, salt, ts),
                )
                uid = int(cur.lastrowid)
        except sqlite3.IntegrityError:
            raise LookupError("该账号已被注册，请直接登录")
        return {"id": uid, "username": uname, "nickname": nick, "createdAt": ts}

    def authenticate_user(self, username: str, password: str) -> Optional[dict[str, Any]]:
        uname = username.strip().lower()
        with self._connect() as conn:
            row = conn.execute(
                "SELECT id, username, nickname, password_hash, salt, created_at FROM users WHERE username = ?",
                (uname,),
            ).fetchone()
            if not row:
                return None
            if not verify_password(password, row["password_hash"], row["salt"]):
                return None
            return {
                "id": int(row["id"]),
                "username": row["username"],
                "nickname": row["nickname"],
                "createdAt": int(row["created_at"]),
            }

    def get_user(self, user_id: int) -> Optional[dict[str, Any]]:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT id, username, nickname, created_at FROM users WHERE id = ?",
                (user_id,),
            ).fetchone()
            if not row:
                return None
            return {
                "id": int(row["id"]),
                "username": row["username"],
                "nickname": row["nickname"],
                "createdAt": int(row["created_at"]),
            }

    def get_user_favorites(self, user_id: int) -> list[str]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT card_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC",
                (user_id,),
            ).fetchall()
            return [str(r["card_id"]) for r in rows]

    def toggle_favorite(self, user_id: int, card_id: str) -> tuple[bool, list[str]]:
        clean_card = sanitize_text(card_id, 64)
        with self._connect() as conn:
            existing = conn.execute(
                "SELECT 1 FROM favorites WHERE user_id = ? AND card_id = ?",
                (user_id, clean_card),
            ).fetchone()
            if existing:
                conn.execute(
                    "DELETE FROM favorites WHERE user_id = ? AND card_id = ?",
                    (user_id, clean_card),
                )
                favorited = False
            else:
                conn.execute(
                    "INSERT INTO favorites (user_id, card_id, created_at) VALUES (?, ?, ?)",
                    (user_id, clean_card, now_ms()),
                )
                favorited = True
        return favorited, self.get_user_favorites(user_id)

    def toggle_like(self, user_id: int, card_id: str) -> tuple[bool, int]:
        clean_card = sanitize_text(card_id, 64)
        with self._connect() as conn:
            existing = conn.execute(
                "SELECT 1 FROM likes WHERE user_id = ? AND card_id = ?",
                (user_id, clean_card),
            ).fetchone()
            if existing:
                conn.execute(
                    "DELETE FROM likes WHERE user_id = ? AND card_id = ?",
                    (user_id, clean_card),
                )
                liked = False
            else:
                conn.execute(
                    "INSERT INTO likes (user_id, card_id, created_at) VALUES (?, ?, ?)",
                    (user_id, clean_card, now_ms()),
                )
                liked = True
            count_row = conn.execute(
                "SELECT COUNT(*) AS cnt FROM likes WHERE card_id = ?",
                (clean_card,),
            ).fetchone()
            return liked, int(count_row["cnt"])

    def get_card_social(self, card_id: str, viewer_user_id: Optional[int]) -> dict[str, Any]:
        clean_card = sanitize_text(card_id, 64)
        with self._connect() as conn:
            like_row = conn.execute(
                "SELECT COUNT(*) AS cnt FROM likes WHERE card_id = ?",
                (clean_card,),
            ).fetchone()
            liked_by_me = False
            if viewer_user_id is not None:
                liked_by_me = (
                    conn.execute(
                        "SELECT 1 FROM likes WHERE user_id = ? AND card_id = ?",
                        (viewer_user_id, clean_card),
                    ).fetchone()
                    is not None
                )
            rows = conn.execute(
                """
                SELECT id, card_id, user_id, nickname, content, created_at
                FROM comments
                WHERE card_id = ? AND status = 'visible'
                ORDER BY created_at DESC
                LIMIT 50
                """,
                (clean_card,),
            ).fetchall()
            comments = [
                {
                    "id": int(r["id"]),
                    "cardId": r["card_id"],
                    "userId": int(r["user_id"]),
                    "nickname": r["nickname"],
                    "content": r["content"],
                    "createdAt": int(r["created_at"]),
                }
                for r in rows
            ]
            return {
                "cardId": clean_card,
                "likeCount": int(like_row["cnt"]),
                "likedByMe": liked_by_me,
                "comments": comments,
            }

    def add_comment(self, user_id: int, nickname: str, card_id: str, raw_content: str) -> dict[str, Any]:
        clean_card = sanitize_text(card_id, 64)
        content = sanitize_text(raw_content, 300)
        if len(content) < 2:
            raise ValueError("评论内容至少 2 个字")
        ts = now_ms()
        with self._connect() as conn:
            cur = conn.execute(
                "INSERT INTO comments (card_id, user_id, nickname, content, created_at) VALUES (?, ?, ?, ?, ?)",
                (clean_card, user_id, nickname, content, ts),
            )
            cid = int(cur.lastrowid)
        return {
            "id": cid,
            "cardId": clean_card,
            "userId": user_id,
            "nickname": nickname,
            "content": content,
            "createdAt": ts,
        }

    def delete_comment(self, user_id: int, comment_id: int) -> bool:
        with self._connect() as conn:
            cur = conn.execute(
                "DELETE FROM comments WHERE id = ? AND user_id = ?",
                (comment_id, user_id),
            )
            return cur.rowcount > 0


def make_handler(store: LaborStore, secret: str) -> type[BaseHTTPRequestHandler]:
    class Handler(BaseHTTPRequestHandler):
        server_version = "LaborCopilotAPI/3.0"

        def address_string(self) -> str:
            return str(self.client_address[0])

        def log_message(self, format: str, *args: Any) -> None:
            return  # keep systemd journal concise

        def _send_json(self, status: int, data: dict[str, Any]) -> None:
            raw = json.dumps(data, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(raw)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(raw)

        def _read_json(self) -> dict[str, Any]:
            length_str = self.headers.get("Content-Length", "0")
            try:
                length = int(length_str)
            except ValueError:
                raise ValueError("无效的请求长度")
            if length <= 0 or length > MAX_BODY_BYTES:
                raise ValueError("请求体为空或超过大小限制")
            raw = self.rfile.read(length)
            try:
                obj = json.loads(raw.decode("utf-8"))
            except Exception:
                raise ValueError("JSON 格式无效")
            if not isinstance(obj, dict):
                raise ValueError("请求体必须为 JSON 对象")
            return obj

        def _current_user(self) -> Optional[dict[str, Any]]:
            auth = self.headers.get("Authorization", "")
            if not auth.startswith("Bearer "):
                return None
            token = auth[7:].strip()
            payload = verify_token(token, secret)
            if not payload:
                return None
            return store.get_user(int(payload["uid"]))

        def _require_user(self) -> Optional[dict[str, Any]]:
            user = self._current_user()
            if not user:
                self._send_json(HTTPStatus.UNAUTHORIZED, {"error": "请先登录账号"})
                return None
            return user

        def do_GET(self) -> None:
            path = urlparse(self.path).path.rstrip("/") or "/"
            if path == "/health":
                self._send_json(HTTPStatus.OK, {"ok": True, "service": "labor-api"})
                return

            if path == "/auth/me":
                user = self._require_user()
                if not user:
                    return
                favs = store.get_user_favorites(user["id"])
                self._send_json(HTTPStatus.OK, {"user": user, "favoriteIds": favs})
                return

            if path.startswith("/cards/"):
                card_id = path[len("/cards/") :]
                if not card_id or "/" in card_id:
                    self._send_json(HTTPStatus.NOT_FOUND, {"error": "未找到卡片"})
                    return
                viewer = self._current_user()
                social = store.get_card_social(card_id, viewer["id"] if viewer else None)
                self._send_json(HTTPStatus.OK, social)
                return

            self._send_json(HTTPStatus.NOT_FOUND, {"error": "接口不存在"})

        def do_POST(self) -> None:
            path = urlparse(self.path).path.rstrip("/") or "/"
            try:
                if path == "/auth/register":
                    body = self._read_json()
                    user = store.register_user(
                        str(body.get("username", "")),
                        str(body.get("nickname", "")),
                        str(body.get("password", "")),
                    )
                    token = sign_token(user["id"], user["username"], secret)
                    self._send_json(
                        HTTPStatus.CREATED,
                        {"token": token, "user": user, "favoriteIds": []},
                    )
                    return

                if path == "/auth/login":
                    body = self._read_json()
                    user = store.authenticate_user(
                        str(body.get("username", "")),
                        str(body.get("password", "")),
                    )
                    if not user:
                        self._send_json(HTTPStatus.UNAUTHORIZED, {"error": "账号或密码不正确"})
                        return
                    token = sign_token(user["id"], user["username"], secret)
                    favs = store.get_user_favorites(user["id"])
                    self._send_json(
                        HTTPStatus.OK,
                        {"token": token, "user": user, "favoriteIds": favs},
                    )
                    return

                if path.startswith("/cards/") and path.endswith("/favorite"):
                    user = self._require_user()
                    if not user:
                        return
                    card_id = path[len("/cards/") : -len("/favorite")].strip("/")
                    favorited, favs = store.toggle_favorite(user["id"], card_id)
                    self._send_json(
                        HTTPStatus.OK,
                        {"favorited": favorited, "favoriteIds": favs},
                    )
                    return

                if path.startswith("/cards/") and path.endswith("/like"):
                    user = self._require_user()
                    if not user:
                        return
                    card_id = path[len("/cards/") : -len("/like")].strip("/")
                    liked, count = store.toggle_like(user["id"], card_id)
                    self._send_json(HTTPStatus.OK, {"likedByMe": liked, "likeCount": count})
                    return

                if path.startswith("/cards/") and path.endswith("/comments"):
                    user = self._require_user()
                    if not user:
                        return
                    card_id = path[len("/cards/") : -len("/comments")].strip("/")
                    body = self._read_json()
                    comment = store.add_comment(
                        user["id"],
                        user["nickname"],
                        card_id,
                        str(body.get("content", "")),
                    )
                    self._send_json(HTTPStatus.CREATED, {"comment": comment})
                    return

                self._send_json(HTTPStatus.NOT_FOUND, {"error": "接口不存在"})
            except ValueError as err:
                self._send_json(HTTPStatus.BAD_REQUEST, {"error": str(err)})
            except LookupError as err:
                self._send_json(HTTPStatus.CONFLICT, {"error": str(err)})

        def do_DELETE(self) -> None:
            path = urlparse(self.path).path.rstrip("/") or "/"
            if path.startswith("/comments/"):
                user = self._require_user()
                if not user:
                    return
                raw_id = path[len("/comments/") :]
                try:
                    cid = int(raw_id)
                except ValueError:
                    self._send_json(HTTPStatus.BAD_REQUEST, {"error": "无效评论 ID"})
                    return
                deleted = store.delete_comment(user["id"], cid)
                if not deleted:
                    self._send_json(HTTPStatus.NOT_FOUND, {"error": "评论不存在或无权删除"})
                    return
                self._send_json(HTTPStatus.OK, {"deleted": True})
                return
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "接口不存在"})

    return Handler


class FastHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = True

    def server_bind(self) -> None:
        # Skip reverse DNS lookup (socket.getfqdn) that stalls in restricted/offline envs
        self.socket.bind(self.server_address)
        self.server_address = self.socket.getsockname()
        host, port = self.server_address[:2]
        self.server_name = str(host)
        self.server_port = int(port)


def main() -> None:
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "3301"))
    db_path = os.environ.get("LABOR_DB_PATH", "./data/labor.db")
    secret = os.environ.get("LABOR_API_SECRET")
    if not secret:
        raise RuntimeError("LABOR_API_SECRET environment variable must be set")

    store = LaborStore(db_path)
    server = FastHTTPServer((host, port), make_handler(store, secret))
    print(f"labor-api listening on http://{host}:{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()

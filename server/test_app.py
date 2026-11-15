import json
import os
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from app import LaborStore, make_handler


class LaborApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp_dir = tempfile.TemporaryDirectory()
        db_path = os.path.join(self.tmp_dir.name, "test.db")
        self.store = LaborStore(db_path)
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(self.store, "test-secret-xyz"))
        self.port = self.server.server_address[1]
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.tmp_dir.cleanup()

    def _req(self, method: str, path: str, body: dict | None = None, token: str | None = None):
        url = f"http://127.0.0.1:{self.port}{path}"
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        data = json.dumps(body).encode("utf-8") if body is not None else None
        req = Request(url, data=data, headers=headers, method=method)
        try:
            with urlopen(req, timeout=5) as resp:
                return resp.status, json.loads(resp.read().decode("utf-8"))
        except HTTPError as err:
            return err.code, json.loads(err.read().decode("utf-8"))

    def test_auth_favorites_and_text_comments_lifecycle(self) -> None:
        status, health = self._req("GET", "/health")
        self.assertEqual(status, 200)
        self.assertTrue(health["ok"])

        # Register user
        status, reg = self._req(
            "POST",
            "/auth/register",
            {"username": "dad_test", "nickname": "阿翔", "password": "secret123"},
        )
        self.assertEqual(status, 201)
        token = reg["token"]
        self.assertEqual(reg["user"]["nickname"], "阿翔")

        # Duplicate registration fails with 409
        status, _ = self._req(
            "POST",
            "/auth/register",
            {"username": "dad_test", "nickname": "阿翔2", "password": "secret123"},
        )
        self.assertEqual(status, 409)

        # Toggle favorite & like
        status, fav_res = self._req("POST", "/cards/choking_infant/favorite", {}, token=token)
        self.assertEqual(status, 200)
        self.assertTrue(fav_res["favorited"])
        self.assertEqual(fav_res["favoriteIds"], ["choking_infant"])

        status, like_res = self._req("POST", "/cards/choking_infant/like", {}, token=token)
        self.assertEqual(status, 200)
        self.assertEqual(like_res["likeCount"], 1)

        # Unauthenticated comment fails cleanly with 401
        status, _ = self._req("POST", "/cards/choking_infant/comments", {"content": "未登录测试"})
        self.assertEqual(status, 401)

        # Post text-only comment
        status, cm_res = self._req(
            "POST",
            "/cards/choking_infant/comments",
            {"content": "  托下颌的手势非常清晰，半夜看一遍很安心！ "},
            token=token,
        )
        self.assertEqual(status, 201)
        cid = cm_res["comment"]["id"]

        # Read social card state
        status, card = self._req("GET", "/cards/choking_infant", token=token)
        self.assertEqual(status, 200)
        self.assertEqual(card["likeCount"], 1)
        self.assertTrue(card["likedByMe"])
        self.assertEqual(len(card["comments"]), 1)
        self.assertEqual(card["comments"][0]["nickname"], "阿翔")

        # Delete own comment
        status, del_res = self._req("DELETE", f"/comments/{cid}", token=token)
        self.assertEqual(status, 200)
        self.assertTrue(del_res["deleted"])


if __name__ == "__main__":
    unittest.main()

import glob
import os
import sqlite3
from pathlib import Path
from typing import Optional, Any, Dict, List

import httpx

from app.initializers import env


def _find_local_sqlite(database_id: Optional[str] = None) -> Path:
    """Locate wrangler local D1 sqlite (miniflare) under nearby project dirs."""
    explicit = (env.CLOUDFLARE_D1_SQLITE_PATH or "").strip()
    if explicit:
        path = Path(explicit).expanduser().resolve()
        if not path.is_file():
            raise FileNotFoundError(f"CLOUDFLARE_D1_SQLITE_PATH not found: {path}")
        return path

    search_roots = [
        Path.cwd(),
        Path(__file__).resolve().parents[2],  # library-be-scraper-fastapi
        Path(__file__).resolve().parents[3] / "library-be-main-hono",
        Path(__file__).resolve().parents[3] / "library-database",
    ]

    candidates: List[Path] = []
    for root in search_roots:
        pattern = str(root / ".wrangler" / "state" / "v3" / "d1" / "miniflare-D1DatabaseObject" / "*.sqlite")
        for match in glob.glob(pattern):
            p = Path(match)
            if p.name == "metadata.sqlite":
                continue
            candidates.append(p)

    if not candidates:
        raise FileNotFoundError(
            "No local D1 sqlite found. Run `npm run dev:offline` in library-be-main-hono once, "
            "or set CLOUDFLARE_D1_SQLITE_PATH."
        )

    # Prefer newest; if database_id provided, still fine — wrangler hashes uuid into filename
    candidates.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return candidates[0]


class D1Client:
    """Cloudflare D1 client — remote HTTP API or local wrangler sqlite."""

    def __init__(self) -> None:
        self.mode = (env.CLOUDFLARE_D1_MODE or "remote").strip().lower()
        if self.mode in {"local", "sqlite", "offline"}:
            self.mode = "local"
        else:
            self.mode = "remote"

        self.account_id = env.CLOUDFLARE_ACCOUNT_ID
        self.database_id = env.CLOUDFLARE_D1_DATABASE_ID
        self.api_token = env.CLOUDFLARE_API_TOKEN
        self._sqlite_path: Optional[Path] = None

        if self.mode == "local":
            self._sqlite_path = _find_local_sqlite(self.database_id)
            print(f"[D1] local mode → {self._sqlite_path}")
            return

        self.base_url = (
            f"https://api.cloudflare.com/client/v4/accounts/{self.account_id}"
            f"/d1/database/{self.database_id}"
        )
        if not all([self.account_id, self.database_id, self.api_token]):
            raise ValueError(
                "Missing Cloudflare D1 configuration. Set CLOUDFLARE_ACCOUNT_ID, "
                "CLOUDFLARE_D1_DATABASE_ID, and CLOUDFLARE_API_TOKEN — or CLOUDFLARE_D1_MODE=local."
            )
        print(f"[D1] remote mode → database {self.database_id}")

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }

    def _connect_local(self) -> sqlite3.Connection:
        assert self._sqlite_path is not None
        conn = sqlite3.connect(str(self._sqlite_path))
        conn.row_factory = sqlite3.Row
        return conn

    @staticmethod
    def _local_result(cursor: sqlite3.Cursor) -> Dict[str, Any]:
        rows = cursor.fetchall()
        return {
            "results": [dict(row) for row in rows],
            "success": True,
            "meta": {"changes": cursor.rowcount, "rows_read": len(rows)},
        }

    def execute(self, sql: str, params: Optional[List[Any]] = None) -> Dict[str, Any]:
        """Execute a SQL query against D1 (local sqlite or remote API)."""
        params = list(params) if params is not None else []

        if self.mode == "local":
            with self._connect_local() as conn:
                cursor = conn.execute(sql, params)
                result = self._local_result(cursor)
                conn.commit()
                return result

        url = f"{self.base_url}/query"
        payload: Dict[str, Any] = {"sql": sql}
        if params:
            payload["params"] = params

        with httpx.Client(timeout=30.0) as client:
            response = client.post(url, headers=self._get_headers(), json=payload)

            if response.status_code != 200:
                raise Exception(f"D1 API Error: {response.status_code} - {response.text}")

            result = response.json()

            if not result.get("success", False):
                errors = result.get("errors", [])
                raise Exception(f"D1 Query Failed: {errors}")

            return result.get("result", [{}])[0] if result.get("result") else {}

    def execute_batch(self, queries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Execute multiple SQL queries in a batch."""
        if self.mode == "local":
            results: List[Dict[str, Any]] = []
            with self._connect_local() as conn:
                try:
                    for item in queries:
                        sql = item.get("sql") or item.get("query")
                        params = item.get("params") or []
                        cursor = conn.execute(sql, params)
                        results.append(self._local_result(cursor))
                    conn.commit()
                except Exception:
                    conn.rollback()
                    raise
            return results

        url = f"{self.base_url}/query"
        with httpx.Client(timeout=30.0) as client:
            response = client.post(url, headers=self._get_headers(), json=queries)

            if response.status_code != 200:
                raise Exception(f"D1 API Error: {response.status_code} - {response.text}")

            result = response.json()

            if not result.get("success", False):
                errors = result.get("errors", [])
                raise Exception(f"D1 Batch Query Failed: {errors}")

            return result.get("result", [])


# Global D1 client instance — picks local vs remote from env
d1_client = D1Client()

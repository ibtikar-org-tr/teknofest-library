#!/usr/bin/env python3
"""
Seed Ön Tasarım + Kritik Tasarım şablon files into R2 + local D1.

- Writes under library-be-scraper-fastapi/downloads/competitions/...
- Uploads to Cloudflare R2 (libary-filesync credentials)
- Stores public bucket URLs on report_files (never Vite public/)

Usage (from library-be-main-hono):
  python3 scripts/seed-sablon-templates.py
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
import uuid
import zipfile
from io import BytesIO
from pathlib import Path
from urllib.parse import unquote
from urllib.request import urlopen

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from dotenv import load_dotenv
import os

HERE = Path(__file__).resolve().parent
BE_ROOT = HERE.parent
TEKNOFEST = BE_ROOT.parent
DOWNLOADS = TEKNOFEST / "library-be-scraper-fastapi" / "downloads" / "competitions"
FILESYNC_ENV = TEKNOFEST / "libary-filesync" / ".env"
SCRAPER_ENV = TEKNOFEST / "library-be-scraper-fastapi" / ".env"
YEAR = "2026"
API = os.getenv("LIBRARY_API", "http://127.0.0.1:9671")

MANUAL_SLUG = {
    22: "electronic-warfare-competition",
    88: "satcom-on-the-move-terminal-competition",
    150150: "vertical-landing-rocket-competition",
}

PRIMARY_RE = re.compile(
    r"on[_\s-]*tasarim|ön[_\s-]*tasarım|\botr\b|on[_\s-]*degerlendirme|"
    r"ön[_\s-]*değerlendirme|\bodr\b|preliminary|kavramsal|on-tasarim",
    re.I,
)
FINAL_RE = re.compile(
    r"kritik|\bktr\b|final[_\s-]*tasarim|\bftr\b|critical|\bcdr\b|"
    r"detay[_\s-]*rapor|\bpdr\b|yari[_\s-]*final|\bfdr\b|kritik-tasarim",
    re.I,
)
TEMPLATE_RE = re.compile(
    r"sablon|şablon|template|\bsabl(?:onu?)?\b|_sabl(?:on)?(?=[_.\s-]|$)",
    re.I,
)


def sql_string(value: str) -> str:
    return "'" + str(value).replace("'", "''") + "'"


def safe_segment(value: str) -> str:
    text = re.sub(r"[^a-zA-Z0-9._-]+", "_", value or "competition")
    text = re.sub(r"_+", "_", text).strip("_")
    return (text[:80] or "competition")


def classify_stage(text: str) -> str | None:
    if FINAL_RE.search(text):
        return "final"
    if PRIMARY_RE.search(text):
        return "primary"
    return None


def is_template(text: str) -> bool:
    return bool(TEMPLATE_RE.search(text))


def link_slug(comp: dict) -> str | None:
    for key in ("en_link", "tr_link"):
        m = re.search(r"/competitions/([^/?#]+)", comp.get(key) or "")
        if m:
            return m.group(1)
    return None


def resolve_slug(comp: dict, local_slugs: set[str]) -> str:
    manual = MANUAL_SLUG.get(comp["id"])
    if manual and manual in local_slugs:
        return manual
    from_link = link_slug(comp)
    if from_link and from_link in local_slugs:
        return from_link
    return manual or from_link or f"competition-{comp['id']}"


def walk_files(root: Path) -> list[Path]:
    if not root.is_dir():
        return []
    return [p for p in root.rglob("*") if p.is_file()]


def pick_local_template(slug: str, stage: str) -> Path | None:
    reports = DOWNLOADS / slug / "reports"
    files = [p for p in walk_files(reports) if is_template(str(p))]
    staged = [p for p in files if classify_stage(str(p)) == stage]
    pool = staged or files

    def rank(p: Path) -> int:
        name = p.name.lower()
        if name.endswith(".docx"):
            return 0
        if name.endswith(".pptx"):
            return 1
        if name.endswith(".pdf"):
            return 2
        return 3

    pool.sort(key=rank)
    return pool[0] if pool else None


def build_docx(title: str, body: str) -> bytes:
    buf = BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(
            "[Content_Types].xml",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>""",
        )
        zf.writestr(
            "_rels/.rels",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>""",
        )

        def esc(s: str) -> str:
            return (
                s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace('"', "&quot;")
            )

        zf.writestr(
            "word/document.xml",
            f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>{esc(title)}</w:t></w:r></w:p>
    <w:p><w:r><w:t>{esc(body)}</w:t></w:r></w:p>
  </w:body>
</w:document>""",
        )
    return buf.getvalue()


def load_r2():
    load_dotenv(FILESYNC_ENV)
    load_dotenv(SCRAPER_ENV, override=False)

    bucket = os.getenv("FILESYNC_R2_BUCKET")
    access = os.getenv("FILESYNC_R2_ACCESS_KEY_ID")
    secret = os.getenv("FILESYNC_R2_SECRET_ACCESS_KEY")
    account = os.getenv("CLOUDFLARE_ACCOUNT_ID")
    prefix = (os.getenv("FILESYNC_R2_PREFIX") or "").strip("/")
    endpoint = (os.getenv("FILESYNC_R2_ENDPOINT") or "").strip() or (
        f"https://{account}.r2.cloudflarestorage.com" if account else ""
    )
    # Public CDN must match the R2 prefix/custom domain — not Vite.
    public_base = (os.getenv("FILESYNC_PUBLIC_BASE") or "").rstrip("/")
    if not public_base:
        if prefix == "teknofest-library":
            public_base = "https://files.ibtikar.tr/teknofest-library"
        else:
            public_base = (
                os.getenv("BUCKET_LINK") or "https://tal-files.ctf.web.tr/downloads"
            ).rstrip("/")

    missing = [n for n, v in [
        ("FILESYNC_R2_BUCKET", bucket),
        ("FILESYNC_R2_ACCESS_KEY_ID", access),
        ("FILESYNC_R2_SECRET_ACCESS_KEY", secret),
        ("CLOUDFLARE_ACCOUNT_ID", account),
    ] if not v]
    if missing:
        raise SystemExit(f"Missing R2 env in {FILESYNC_ENV}: {', '.join(missing)}")

    client = boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=access,
        aws_secret_access_key=secret,
        config=Config(signature_version="s3v4"),
    )
    return client, bucket, prefix, public_base


def upload_file(client, bucket: str, key: str, path: Path) -> None:
    extra = {}
    suffix = path.suffix.lower()
    if suffix == ".docx":
        extra["ContentType"] = (
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    elif suffix == ".pptx":
        extra["ContentType"] = (
            "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        )
    elif suffix == ".pdf":
        extra["ContentType"] = "application/pdf"
    client.upload_file(str(path), bucket, key, ExtraArgs=extra or None)
    print(f"  r2://{bucket}/{key}")


def object_key(prefix: str, relative: str) -> str:
    relative = relative.lstrip("/")
    return f"{prefix}/{relative}" if prefix else relative


def public_url(public_base: str, relative: str) -> str:
    return f"{public_base.rstrip('/')}/{relative.lstrip('/')}"


def wrangler_sql(sql_path: Path) -> None:
    cmd = [
        "npx",
        "wrangler",
        "d1",
        "execute",
        "teknofest-library",
        "--local",
        "--config",
        "wrangler.offline.jsonc",
        "--file",
        str(sql_path),
    ]
    subprocess.run(cmd, cwd=BE_ROOT, check=True)


def main() -> None:
    client, bucket, prefix, public_base = load_r2()
    competitions = json.load(urlopen(f"{API}/api/competitions"))
    report_files = json.load(urlopen(f"{API}/api/report-files"))

    local_slugs = {
        p.name for p in DOWNLOADS.iterdir() if p.is_dir()
    } if DOWNLOADS.is_dir() else set()

    by_comp: dict[int, list] = {}
    for row in report_files:
        by_comp.setdefault(row["competition_id"], []).append(row)

    # Drop previous mistaken Vite-public URLs
    cleanup = HERE / "seed-sablon-cleanup.sql"
    cleanup.write_text(
        """DELETE FROM report_files
WHERE file_path LIKE '%127.0.0.1:9670/templates/%'
   OR file_path LIKE '%localhost:9670/templates/%';
""",
        encoding="utf-8",
    )
    print("Cleaning localhost/templates rows…")
    wrangler_sql(cleanup)

    # Refresh after cleanup
    report_files = json.load(urlopen(f"{API}/api/report-files"))
    by_comp = {}
    for row in report_files:
        by_comp.setdefault(row["competition_id"], []).append(row)

    inserts: list[dict] = []
    uploaded = 0
    placeholders = 0
    skipped = 0

    for comp in competitions:
        existing = by_comp.get(comp["id"], [])
        has_primary = any(
            is_template(unquote(f.get("file_path") or ""))
            and classify_stage(unquote(f.get("file_path") or "") + " " + str(f.get("stage") or ""))
            == "primary"
            for f in existing
        )
        has_final = any(
            is_template(unquote(f.get("file_path") or ""))
            and classify_stage(unquote(f.get("file_path") or "") + " " + str(f.get("stage") or ""))
            == "final"
            for f in existing
        )

        name = comp.get("tr_name") or comp.get("en_name") or f"Competition {comp['id']}"
        slug = resolve_slug(comp, local_slugs)
        name_seg = safe_segment(name)[:48]

        for stage in ("primary", "final"):
            if stage == "primary" and has_primary:
                skipped += 1
                continue
            if stage == "final" and has_final:
                skipped += 1
                continue

            stage_label = (
                "On_Tasarim_Raporu_Sablonu"
                if stage == "primary"
                else "Kritik_Tasarim_Raporu_Sablonu"
            )
            stage_tr = (
                "Ön Tasarım Raporu Şablonu"
                if stage == "primary"
                else "Kritik Tasarım Raporu Şablonu"
            )
            folder = f"{YEAR}_{name_seg}_{stage_label}"
            dest_dir = DOWNLOADS / slug / "reports" / folder
            dest_dir.mkdir(parents=True, exist_ok=True)

            local_src = pick_local_template(slug, stage) if slug in local_slugs else None
            # Don't re-copy a file already living under the destination folder tree.
            if local_src and dest_dir in local_src.parents:
                local_src = None

            if local_src and local_src.exists():
                dest_path = dest_dir / local_src.name
                if local_src.resolve() != dest_path.resolve():
                    dest_path.write_bytes(local_src.read_bytes())
                source_note = "copied"
            else:
                file_name = (
                    f"{YEAR}_{name_seg}_{'OTR' if stage == 'primary' else 'KTR'}_Sablon_TR.docx"
                )
                dest_path = dest_dir / file_name
                dest_path.write_bytes(
                    build_docx(
                        f"{name} — {stage_tr}",
                        f"Bu dosya kütüphane için R2'ye yüklenen {stage_tr.lower()}dur. "
                        "Resmi TEKNOFEST şablonu yayınlandığında güncellenebilir.",
                    )
                )
                placeholders += 1
                source_note = "placeholder"

            relative = f"competitions/{slug}/reports/{folder}/{dest_path.name}"
            key = object_key(prefix, relative)
            upload_file(client, bucket, key, dest_path)
            uploaded += 1

            inserts.append(
                {
                    "id": str(uuid.uuid4()),
                    "competition_id": comp["id"],
                    "year": YEAR,
                    "file_path": public_url(public_base, relative),
                    "stage": "on-tasarim" if stage == "primary" else "kritik-tasarim",
                    "language": "tr",
                    "note": source_note,
                }
            )

    if not inserts:
        print("Nothing to insert.")
        return

    sql_path = HERE / "seed-sablon-templates.sql"
    lines = []
    for row in inserts:
        lines.append(
            f"""INSERT INTO report_files (
  id, competition_id, team_id, year, file_path, rank, stage, language
) VALUES (
  {sql_string(row['id'])},
  {row['competition_id']},
  NULL,
  {sql_string(row['year'])},
  {sql_string(row['file_path'])},
  NULL,
  {sql_string(row['stage'])},
  {sql_string(row['language'])}
);"""
        )
    sql_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Inserting {len(inserts)} report_files rows…")
    wrangler_sql(sql_path)

    print(
        json.dumps(
            {
                "inserted": len(inserts),
                "uploaded_to_r2": uploaded,
                "placeholders": placeholders,
                "already_had_stage": skipped,
                "bucket": bucket,
                "prefix": prefix,
                "public_base": public_base,
            },
            indent=2,
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    try:
        main()
    except ClientError as exc:
        print("R2 error:", exc, file=sys.stderr)
        sys.exit(1)

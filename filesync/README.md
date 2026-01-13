# FileSync (Cloudflare R2)

A small watcher that uploads new/modified files from a local folder to Cloudflare R2. It performs an initial bulk upload (unless skipped) and does not delete remote objects.

## Setup (local)
1. Install deps: `python -m pip install -r requirements.txt`
2. Copy env template: `cp .env.example .env` and fill values.
3. Run: `python sync_r2.py`
   - `--skip-initial` to skip the first bulk upload
   - `--initial-only` to bulk upload then exit

### Required env vars
- `FILESYNC_LOCAL_PATH` — folder to watch (e.g., `../be-scraper-fastapi/downloads`)
- `FILESYNC_R2_BUCKET` — target R2 bucket
- `CLOUDFLARE_ACCOUNT_ID` — account ID
- `FILESYNC_R2_ACCESS_KEY_ID` / `FILESYNC_R2_SECRET_ACCESS_KEY` — R2 keys
- `FILESYNC_R2_PREFIX` — optional key prefix (no leading slash)
- `FILESYNC_R2_ENDPOINT` — optional; defaults to `https://<account>.r2.cloudflarestorage.com`

## Docker
Build:
```
docker build -t filesync ./filesync
```
Run (example):
```
docker run --rm \
  -e FILESYNC_LOCAL_PATH=/host/downloads \
  -e FILESYNC_R2_BUCKET=your-bucket \
  -e CLOUDFLARE_ACCOUNT_ID=... \
  -e FILESYNC_R2_ACCESS_KEY_ID=... \
  -e FILESYNC_R2_SECRET_ACCESS_KEY=... \
  -v /absolute/path/to/be-scraper-fastapi/downloads:/host/downloads \
  filesync
```
Add `--skip-initial` or `--initial-only` to the container command if desired.

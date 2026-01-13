import argparse
import logging
import os
import sys
import time
from pathlib import Path

import boto3
from botocore.config import Config
from dotenv import load_dotenv
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer


class Settings:
    """Holds configuration derived from environment variables."""

    def __init__(self) -> None:
        load_dotenv()
        self.watch_path = self._require_path("FILESYNC_LOCAL_PATH")
        self.bucket = self._require("FILESYNC_R2_BUCKET")
        self.prefix = os.getenv("FILESYNC_R2_PREFIX", "").strip("/")
        self.account_id = self._require("CLOUDFLARE_ACCOUNT_ID")
        self.access_key = self._require("FILESYNC_R2_ACCESS_KEY_ID")
        self.secret_key = self._require("FILESYNC_R2_SECRET_ACCESS_KEY")
        raw_endpoint = os.getenv("FILESYNC_R2_ENDPOINT", "").strip()
        # Fallback to standard R2 endpoint when empty to avoid botocore ValueError
        self.endpoint = (
            raw_endpoint
            if raw_endpoint
            else f"https://{self.account_id}.r2.cloudflarestorage.com"
        )

    @staticmethod
    def _require(name: str) -> str:
        value = os.getenv(name)
        if not value:
            raise ValueError(f"Missing required environment variable: {name}")
        return value

    @staticmethod
    def _require_path(name: str) -> Path:
        raw = os.getenv(name)
        if not raw:
            raise ValueError(f"Missing required environment variable: {name}")
        return Path(raw).expanduser().resolve()


def build_s3_client(settings: Settings):
    return boto3.client(
        "s3",
        endpoint_url=settings.endpoint,
        aws_access_key_id=settings.access_key,
        aws_secret_access_key=settings.secret_key,
        config=Config(signature_version="s3v4"),
    )


def object_key(settings: Settings, path: Path) -> str:
    relative = path.relative_to(settings.watch_path).as_posix()
    return f"{settings.prefix}/{relative}" if settings.prefix else relative


def upload_file(client, settings: Settings, path: Path) -> None:
    key = object_key(settings, path)
    try:
        client.upload_file(str(path), settings.bucket, key)
        logging.info("Uploaded %s -> r2://%s/%s", path, settings.bucket, key)
    except FileNotFoundError:
        logging.warning("Skipped missing file (likely deleted before upload): %s", path)
    except Exception as exc:  # noqa: BLE001
        logging.error("Failed to upload %s: %s", path, exc)


def initial_sync(client, settings: Settings) -> None:
    logging.info("Starting initial sync from %s", settings.watch_path)
    for file_path in settings.watch_path.rglob("*"):
        if file_path.is_file():
            upload_file(client, settings, file_path)
    logging.info("Initial sync complete")


class SyncHandler(FileSystemEventHandler):
    def __init__(self, client, settings: Settings) -> None:
        self.client = client
        self.settings = settings

    def on_created(self, event) -> None:  # noqa: N802
        self._handle(event)

    def on_modified(self, event) -> None:  # noqa: N802
        self._handle(event)

    def _handle(self, event) -> None:
        if event.is_directory:
            return
        path = Path(event.src_path)
        if path.exists() and path.is_file():
            upload_file(self.client, self.settings, path)


def watch(client, settings: Settings) -> None:
    observer = Observer()
    handler = SyncHandler(client, settings)
    observer.schedule(handler, str(settings.watch_path), recursive=True)
    observer.start()
    logging.info("Watching %s for changes", settings.watch_path)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logging.info("Stopping watcher")
        observer.stop()
    observer.join()


def parse_args():
    parser = argparse.ArgumentParser(description="Sync a local folder to Cloudflare R2")
    parser.add_argument(
        "--skip-initial",
        action="store_true",
        help="Skip the initial full sync and only watch for new changes.",
    )
    parser.add_argument(
        "--initial-only",
        action="store_true",
        help="Run the initial sync and exit without watching for changes.",
    )
    return parser.parse_args()


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    try:
        settings = Settings()
    except ValueError as exc:
        logging.error(exc)
        sys.exit(1)

    if not settings.watch_path.exists():
        logging.error("Watch path does not exist: %s", settings.watch_path)
        sys.exit(1)

    client = build_s3_client(settings)
    args = parse_args()

    if not args.skip_initial:
        initial_sync(client, settings)

    if args.initial_only:
        return

    watch(client, settings)


if __name__ == "__main__":
    main()

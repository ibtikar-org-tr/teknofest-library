#!/usr/bin/env bash
# Seed Wrangler local R2 (files-main) with curated TAC archive photos.
# Keys match Worker routes: /events/tac/tac-YYYY/<file>
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
FE="$(cd "$(dirname "$0")/.." && pwd)"
SRC23="$ROOT/files/events/مؤتمر تكنوفست 2023 إسطنبول/صور المؤتمر/1/0"
SRC24="$ROOT/files/events/مؤتمر تكنوفست 2024 إسطنبول/صور المؤتمر"
BUCKET=files-main
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

cd "$FE"

put() {
  local key="$1"
  local file="$2"
  echo "→ $key"
  npx wrangler r2 object put "$BUCKET/$key" --file="$file" --content-type=image/jpeg --local
}

# --- TAC 2023 ---
cp "$SRC23/Slide5.JPG" "$TMP/hero.jpg"
cp "$SRC23/Slide1.JPG" "$TMP/gallery-01.jpg"
cp "$SRC23/Slide3.JPG" "$TMP/gallery-02.jpg"
cp "$SRC23/Slide7.JPG" "$TMP/gallery-03.jpg"
cp "$SRC23/Slide9.JPG" "$TMP/gallery-04.jpg"
cp "$SRC23/Slide11.JPG" "$TMP/gallery-05.jpg"
cp "$SRC23/Slide14.JPG" "$TMP/gallery-06.jpg"
cp "$SRC23/Slide17.JPG" "$TMP/gallery-07.jpg"
cp "$SRC23/Slide20.JPG" "$TMP/gallery-08.jpg"

for f in hero.jpg gallery-0{1..8}.jpg; do
  put "events/tac/tac-2023/$f" "$TMP/$f"
done

# --- TAC 2024 ---
mapfile -t imgs24 < <(ls -1 "$SRC24"/*.jpg | sort)
cp "${imgs24[0]}" "$TMP/24-hero.jpg"
put "events/tac/tac-2024/hero.jpg" "$TMP/24-hero.jpg"
i=1
for f in "${imgs24[@]:1:10}"; do
  name=$(printf 'gallery-%02d.jpg' "$i")
  cp "$f" "$TMP/24-$name"
  put "events/tac/tac-2024/$name" "$TMP/24-$name"
  i=$((i + 1))
done

echo "Local R2 seed complete for bucket $BUCKET"

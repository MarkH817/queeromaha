#!/usr/bin/env bash
# Lints .github/workflows/*.yml with actionlint, downloaded straight from
# GitHub Releases (same approach as taraxvoid/voidflow's ci.yml / site-ci.yml)
# instead of going through an npm-wrapped binary downloader.
set -euo pipefail

VERSION=1.7.12
CACHE_DIR="${TMPDIR:-/tmp}/actionlint-cache/$VERSION"
mkdir -p "$CACHE_DIR"

if [[ ! -x "$CACHE_DIR/actionlint" ]]; then
  curl -fsSL https://raw.githubusercontent.com/rhysd/actionlint/011a6d15e749bb3f2d771eed9c7aa0e7e3e10ee7/scripts/download-actionlint.bash \
    | bash -s -- "$VERSION" "$CACHE_DIR"
fi

"$CACHE_DIR/actionlint" -color

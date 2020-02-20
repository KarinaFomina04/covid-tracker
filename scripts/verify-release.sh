#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

(
  cd "$ROOT_DIR/server"
  npm install --no-audit --no-fund
  npm run test:coverage
  npm run test:e2e
  npm run build
)

(
  cd "$ROOT_DIR/client"
  npm install --no-audit --no-fund
  CI=true npm run test:coverage
  CI=true npm run build
)

cd "$ROOT_DIR"
docker-compose config --quiet
docker-compose build

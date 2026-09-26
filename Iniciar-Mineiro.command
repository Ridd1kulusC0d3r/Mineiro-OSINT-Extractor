#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "[ERRO] Node.js não foi encontrado. Instale Node.js 22 LTS."
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "[ERRO] npm não foi encontrado."
  exit 1
fi
if [[ "${1:-}" == "--check" ]]; then
  echo "[OK] Node: $(node --version)"
  echo "[OK] npm: $(npm --version)"
  exit 0
fi
if [[ ! -d node_modules ]]; then npm install; fi
if [[ "${MINEIRO_NO_BROWSER:-0}" != "1" ]]; then (sleep 5; open "http://localhost:3000" >/dev/null 2>&1 || true) & fi
npm run dev

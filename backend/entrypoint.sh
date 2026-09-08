#!/bin/sh
set -e

# Dynamically resolve PORT assigned by Railway or Render
PORT="${PORT:-8000}"

echo "================================================="
echo " Starting SMRITI+ FastAPI on 0.0.0.0:$PORT"
echo "================================================="

exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT"

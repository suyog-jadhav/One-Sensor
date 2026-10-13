#!/usr/bin/env bash
set -e

# OneSensor startup script
# Starts backend (port 8000), desktop frontend (port 3000), and optionally 3D studio (port 3005)

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/desktop/backend"
FRONTEND_DIR="$PROJECT_ROOT/desktop/frontend"
STUDIO_DIR="$PROJECT_ROOT/frontend-redesign/app"

echo "==========================================="
echo "       Starting OneSensor Services         "
echo "==========================================="

cleanup() {
    echo ""
    echo "[OneSensor] Shutting down all processes..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 1. Start Python Backend Sidecar
echo "[1/3] Starting Backend Sidecar on http://127.0.0.1:8000 ..."
cd "$BACKEND_DIR"
if [ -d "venv" ]; then
    venv/bin/python3 app.py &
elif [ -d ".venv" ]; then
    .venv/bin/python3 app.py &
else
    python3 app.py &
fi
BACKEND_PID=$!

# 2. Start Desktop Frontend
echo "[2/3] Starting Desktop Frontend on http://localhost:3000 ..."
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

# 3. Optional: Start 3D Studio Redesign (uncomment if desired)
if [ "$1" == "--studio" ] || [ "$1" == "--all" ]; then
    echo "[3/3] Starting 3D Studio on http://localhost:3005 ..."
    cd "$STUDIO_DIR"
    npm run dev &
fi

echo ""
echo "OneSensor is running!"
echo " - Desktop App UI : http://localhost:3000"
echo " - Backend API/WS : http://127.0.0.1:8000"
if [ "$1" == "--studio" ] || [ "$1" == "--all" ]; then
    echo " - 3D Studio UI   : http://localhost:3005"
fi
echo ""
echo "Press Ctrl+C to stop all services."

# Wait for background processes
wait

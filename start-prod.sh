#!/bin/bash
# ======================================================================
# Smart College Event Management System (Smart CEMS) - Production Runner
# RGUKT IIIT RK Valley, Andhra Pradesh
# ======================================================================

set -e
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Ensure frontend is built
if [ ! -d "$DIR/frontend/dist" ] || [ ! -f "$DIR/frontend/dist/index.html" ]; then
  echo "📦 Compiling React 18 production bundle with Vite..."
  (cd "$DIR/frontend" && npm run build)
fi

# Start Python AI Microservice in background
echo "🧠 Starting Python AI Microservice (Port 5001)..."
(cd "$DIR/python-service" && python3 app.py) &
PID_PY=$!

# Trap signals for graceful shutdown
trap "kill $PID_PY 2>/dev/null || true; exit 0" SIGINT SIGTERM EXIT

# Start Node.js backend in foreground (serves REST API + frontend static bundle)
echo "🚀 Starting Node.js Backend Server on Port ${PORT:-5000}..."
cd "$DIR/backend"
exec node server.js

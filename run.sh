#!/bin/bash
# ======================================================================
# Smart College Event Management System (Smart CEMS) - Startup Launcher
# RGUKT IIIT RK Valley, Andhra Pradesh
# ======================================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=================================================================="
echo " 🏛️ RGUKT IIIT RK VALLEY - SMART COLLEGE EVENT MANAGEMENT SYSTEM"
echo " Tech Stack: React + Node.js + SQL/Supabase + Python AI Service"
echo "=================================================================="

# Free ports if previously occupied
fuser -k 5000/tcp 2>/dev/null || true
fuser -k 5001/tcp 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true

# 1. Start Python AI Microservice (Port 5001)
echo "Starting Python AI Microservice (Port 5001)..."
(cd "$DIR/python-service" && python3 app.py) &
PID_PY=$!

# 2. Start Node.js Backend API Server (Port 5000)
echo "Starting Node.js Backend REST API (Port 5000)..."
(cd "$DIR/backend" && node server.js) &
PID_NODE=$!

# 3. Start React Frontend (Port 3000)
echo "Starting React Frontend on Vite (Port 3000)..."
(cd "$DIR/frontend" && npm run dev) &
PID_REACT=$!

echo ""
echo "✅ All Smart CEMS services are launched:"
echo "   👉 React Frontend:    http://localhost:3000"
echo "   👉 Node.js API:       http://localhost:5000"
echo "   👉 Python AI Service: http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop all services."

trap "kill $PID_PY $PID_NODE $PID_REACT 2>/dev/null; exit 0" SIGINT SIGTERM
wait

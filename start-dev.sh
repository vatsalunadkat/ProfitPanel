#!/usr/bin/env bash
set -e

echo ""
echo "  ========================================"
echo "   ProfitPanel - Starting Dev Servers"
echo "  ========================================"
echo ""

# Kill any existing processes on common dev ports
echo "  Cleaning up stale processes..."
for port in 8000 5173 5174 5175; do
  pid=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pid" ]; then
    kill -9 $pid 2>/dev/null || true
  fi
done
sleep 1

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Start Django backend
echo "  [1/2] Starting Django backend on http://localhost:8000 ..."
cd "$SCRIPT_DIR/backend"
if [ ! -d "venv" ]; then
  echo "  Creating Python virtual environment..."
  python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt
python manage.py migrate --run-syncdb > /dev/null 2>&1
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!

# Start Vite frontend
echo "  [2/2] Starting Vite frontend on http://localhost:5173 ..."
cd "$SCRIPT_DIR/frontend"
if [ ! -d "node_modules" ]; then
  echo "  Installing npm dependencies..."
  npm install
fi
npx vite --port 5173 --strictPort &
FRONTEND_PID=$!

sleep 3

echo ""
echo "  ----------------------------------------"
echo "   Both servers are running!"
echo ""
echo "   Frontend:  http://localhost:5173/ProfitPanel/"
echo "   Backend:   http://localhost:8000/api/quotes/"
echo "  ----------------------------------------"
echo ""

# Open browser (macOS)
if command -v open &> /dev/null; then
  open "http://localhost:5173/ProfitPanel/"
# Open browser (Linux)
elif command -v xdg-open &> /dev/null; then
  xdg-open "http://localhost:5173/ProfitPanel/"
fi

echo "  Press Ctrl+C to stop both servers."

# Trap Ctrl+C to kill both processes
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait

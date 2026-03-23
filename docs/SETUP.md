# How to Run ProfitPanel

## Quick Start (one command)

**Windows:** Double-click `start-dev.bat` at the project root.

**macOS / Linux:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

Both scripts kill stale processes, start both servers, and open the app in your browser automatically.

---

## Manual Start

### 1. Backend — Django API

Open a terminal in the `backend/` folder:

```bash
cd backend
venv\Scripts\activate          # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Frontend — React App

Open a **second** terminal in the `frontend/` folder:

```bash
cd frontend
cp .env.example .env.local     # only needed the first time
npm install                    # only needed the first time
npm run dev
```

> Both servers must be running at the same time for the app to work.

---

## Links

| What | URL | Notes |
|---|---|---|
| **App (Frontend)** | http://localhost:5173/ProfitPanel/ | The main UI — calculator, form, and dashboard |
| **API Endpoint** | http://localhost:8000/api/quotes/ | DRF browsable API — try GET/POST in the browser |
| **Swagger UI** | http://localhost:8000/api/docs/ | Interactive API docs — click "Try it out" to test |
| **ReDoc** | http://localhost:8000/api/redoc/ | Clean, read-only API reference |
| **OpenAPI Schema** | http://localhost:8000/api/schema/ | Raw OpenAPI 3.0 YAML |
| **Django Admin** | http://localhost:8000/admin/ | Admin panel (requires a superuser account) |

---

## Django Admin Panel

The admin panel lets you view, edit, and delete submitted quotes directly.

1. Create a superuser (one-time):
   ```bash
   cd backend
   python manage.py createsuperuser
   ```
2. Follow the prompts to set a username, email, and password.
3. Start the backend server and visit http://localhost:8000/admin/.
4. Log in with the credentials you just created.

---

## When do I need to restart?

| Change | Restart needed? |
|---|---|
| Edit a React component (`.tsx`, `.css`) | **No** — Vite hot-reloads automatically |
| Edit `tailwind.config.js` | **Yes** — restart the frontend (`npm run dev`) |
| Edit a Django view or serializer (`.py`) | **No** — Django auto-reloads on file save |
| Edit `settings.py` | **No** — Django auto-reloads, but restart if it crashes |
| Install a new pip/npm package | **Yes** — restart the respective server |
| Run a new migration | Run `python manage.py migrate`, no restart needed |

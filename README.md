# AI Poster (Local Run)

This repo contains:
- `backend/`: Django REST API + scheduler (Telegram posting)
- `frontend/`: React dashboard (Vite)

## Backend

1. Create venv + install deps:
```bash
cd backend
python -m venv venv
venv/bin/pip install -r requirements.txt
```

Note:
- If you previously installed non-official packages like `rest-framework-simplejwt` or `django-rest-framework-nested`, uninstall them and install the official ones from `requirements.txt`.

2. Configure env vars:
- Copy `backend/.env.example` to `backend/.env`
- Fill:
  - `TELEGRAM_BOT_TOKEN=...` (required)
  - `GEMINI_API_KEY=...` (optional)
  - `OPENAI_API_KEY=...` (optional)

3. Migrate + seed AI models:
```bash
cd backend
venv/bin/python manage.py migrate
venv/bin/python manage.py seed_ai_models
```

4. Start API server:
```bash
cd backend
venv/bin/python manage.py runserver 0.0.0.0:8000
```

5. Start scheduler in another terminal (required for auto-posting):
```bash
cd backend
venv/bin/python manage.py run_scheduler
```

API root:
- `http://localhost:8000/api/`

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard:
- `http://localhost:5173`

## Monitoring Posts

Use Dashboard:
- `Dashboard -> Automation`: schedules + `Run now` + post history (success/failed)
- `Dashboard -> Analytics`: posts/tokens/last post time


## Production-like Scheduler (Celery + Redis)

1. Run Redis (required):
- Install Redis locally, or run it via Docker on another machine.
- Configure `CELERY_BROKER_URL` in `backend/.env`.

2. Start worker:
```bash
cd backend
venv/bin/celery -A config worker -l info
```

3. Start beat (scheduler):
```bash
cd backend
venv/bin/celery -A config beat -l info
```

Notes:
- Beat runs `channels.tasks.process_due_cron_jobs` every 30 seconds.
- `manage.py run_scheduler` is now considered a dev fallback.

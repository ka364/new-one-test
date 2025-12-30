# HaderOS Platform — Copilot Instructions

Concise, code-oriented guidance for AI coding agents working in this repo. Focus on concrete patterns and commands used here.

## Big Picture
- Backend is a FastAPI service with modular domains: `core`, `api/v1`, `kernel/theology`, `ledger` (blockchain), `kinetic` (ML), `sentinel` (ops). Entrypoints: [backend/main.py](../backend/main.py) and dev stub [backend/api/v1/main.py](../backend/api/v1/main.py).
- API surface is assembled via a central router: [backend/api/v1/router.py](../backend/api/v1/router.py), which mounts endpoint modules in [backend/api/v1/endpoints/](../backend/api/v1/endpoints).
- Persistence uses SQLAlchemy via [backend/core/database.py](../backend/core/database.py) with `Base`, `engine`, and `SessionLocal`.
- Configuration comes from [backend/core/config.py](../backend/core/config.py), reading `.env` for DB, Kafka, Redis, and blockchain endpoints.
- Observability: Prometheus `/metrics` is mounted in [backend/main.py](../backend/main.py); request timing and structured logging are enabled.

## Run & Develop
- Quick dev server (venv + auto-reload): `./run_backend.sh` (starts `uvicorn backend.api.v1.main:app` on 8080).
- Full app entrypoint (preferred once endpoints are wired): `python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload`.
- Endpoints available under `/api/v1`; docs at `/api/docs`, health at `/health`, metrics at `/metrics`.
- Project tasks: `make` targets in [Makefile](../Makefile): `make test`, `make test-unit`, `make lint`, `make format`, `make docker-up`.

## API Patterns
- Add an endpoint by creating a module in [backend/api/v1/endpoints/](../backend/api/v1/endpoints) that exposes `router = APIRouter()` with route handlers.
- Register it in [backend/api/v1/router.py](../backend/api/v1/router.py) via `api_router.include_router(<module>.router, prefix="/<segment>", tags=["<tag>"])`.
- Keep handlers async where I/O is involved; use DI for DB sessions via `from backend.core.database import get_db`.

Example endpoint module:
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.core.database import get_db

router = APIRouter()

@router.get("/items")
async def list_items(db: Session = Depends(get_db)):
    # query SQLAlchemy models inheriting from Base
    return []
```

## Data & Models
- Define ORM models inheriting `Base` from [backend/core/database.py](../backend/core/database.py). Tables are created on startup in [backend/main.py](../backend/main.py) via `Base.metadata.create_all(engine)`.
- Use migrations with Alembic if needed; package exists in `requirements.txt` but migration scripts are not in repo—create under `backend/migrations/` when required.

## Configuration & Integrations
- Env-driven settings in [backend/core/config.py](../backend/core/config.py):
  - `DATABASE_URL`, `REDIS_URL`, `KAFKA_BOOTSTRAP_SERVERS`
  - `ETH_RPC_URL`, `POLYGON_RPC_URL`, ERC-3643 addresses
  - KAIA service `KAIA_SERVICE_URL`, keys, and `THEOLOGY_FIREWALL_ENABLED`
- Put secrets in `.env` at repo root; the `Settings` class loads it automatically.

## Testing & Quality
- Python tests via `pytest` under `tests/` as invoked by `make test` (coverage for `backend`).
- Linters/formatters: `pylint` and `black` for backend; `eslint`/`prettier` for frontend.

## Frontend
- Frontend uses Vite + React/TS; scripts in [package.json](../package.json): `npm run dev`, `npm run build`, `npm run preview`. Tailwind CSS is configured.
- Frontend typically consumes the backend at `http://localhost:8000/api/v1` or `http://127.0.0.1:8080/api/v1` depending on which entrypoint you run.

## Observability & Health
- Request timing middleware adds `X-Process-Time` header (see [backend/main.py](../backend/main.py)).
- Prometheus metrics mounted at `/metrics`; helpful for integration tests and monitoring.

## Practical Tips
- Prefer `backend/main.py` app for full system run; the `backend/api/v1/main.py` app is a minimal stub used by `run_backend.sh`.
- When adding new modules, keep imports under `backend.*` to preserve packaging consistency.
- Use `settings.DEBUG` to toggle `uvicorn` reload and SQLAlchemy echo.

## Safety & Scope
- Do not commit secrets; rely on `.env`.
- Be cautious with `drop_db()` in [backend/core/database.py](../backend/core/database.py)—only use in tests.
- If Docker workflows are needed, use `docker-compose.dev.yml` targets from `make docker-*` (compose file must exist in repo).
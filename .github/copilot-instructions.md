# HaderOS Platform — Copilot Instructions

Concise, code-oriented guidance for AI coding agents working in this repo. Focus on concrete patterns and commands used here.

## Big Picture
- **Backend (FastAPI):** Entry point is [services/api-gateway/main.py](services/api-gateway/main.py). Modular domains: `kernel` (theology engine, database schemas, security rules), `kinetic` (ML models), `ledger` (blockchain), `sentinel` (ops/agents/MCP/events). Configuration in [services/api-gateway/core/config.py](services/api-gateway/core/config.py).
- **API Router:** Centralized at [services/api-gateway/api/v1/router.py](services/api-gateway/api/v1/router.py); endpoints in [services/api-gateway/api/v1/endpoints/](services/api-gateway/api/v1/endpoints). Routes mounted under `/api/v1`.
- **Database:** SQLAlchemy ORM models in [services/api-gateway/core/models/](services/api-gateway/core/models). Session management via [services/api-gateway/core/database.py](services/api-gateway/core/database.py). Tables auto-created on startup via `Base.metadata.create_all(engine)` in main.py.
- **Frontend (Node.js/React):** Entry in [apps/haderos-web/server/_core/index.ts](apps/haderos-web/server/_core/index.ts). Uses Express, React 19, tRPC, Drizzle ORM, Radix UI. Build output to `dist/`.
- **Observability:** Prometheus metrics at `/metrics`, health check at `/health`, API docs at `/api/docs`. Request timing via `X-Process-Time` middleware.

## Run & Develop
- **Backend:** `python -m uvicorn services.api_gateway.main:app --host 0.0.0.0 --port 8000 --reload` (or use Python virtual env: `source .venv/bin/activate` first).
- **Frontend:** `cd apps/haderos-web && pnpm install && pnpm dev` (runs on port 3000 by default with Express dev server).
- **Database:** PostgreSQL required; connection string via `DATABASE_URL` in `.env`. Run migrations with Alembic if schema files exist under `services/api-gateway/migrations/`.
- **Make targets** in [Makefile](Makefile): `make test` (pytest), `make lint` (pylint + eslint), `make format` (black + prettier), `make docker-up`.
- **Environment:** Copy `.env.example` to `.env`; set `DEBUG=True` for auto-reload and SQL echo. Essential vars: `DATABASE_URL`, `REDIS_URL`, `KAFKA_BOOTSTRAP_SERVERS`, `KAIA_SERVICE_URL`.

## API Patterns
- **Add endpoints:** Create module in [services/api-gateway/api/v1/endpoints/](services/api-gateway/api/v1/endpoints) exporting `router = APIRouter()`. Example:
  ```python
  from fastapi import APIRouter, Depends
  from sqlalchemy.orm import Session
  from services.api_gateway.core.database import get_db
  
  router = APIRouter()
  
  @router.get("/items")
  async def list_items(db: Session = Depends(get_db)):
      return db.query(Item).all()
  ```
- **Register:** In [services/api-gateway/api/v1/router.py](services/api-gateway/api/v1/router.py), call `api_router.include_router(items.router, prefix="/items", tags=["items"])`.
- **DI:** Use `Depends(get_db)` for DB sessions; `Depends(get_current_user)` for auth from [services/api-gateway/core/jwt_utils.py](services/api-gateway/core/jwt_utils.py).

## Data & Models
- **ORM:** Models inherit `Base` from [services/api-gateway/core/database.py](services/api-gateway/core/database.py); store in [services/api-gateway/core/models/](services/api-gateway/core/models).
- **Migrations:** If needed, generate with Alembic under `services/api-gateway/migrations/versions/`. Use `alembic upgrade head` to apply.

## Configuration & Integrations
- **Settings** (Pydantic): [services/api-gateway/core/config.py](services/api-gateway/core/config.py). Access via `from services.api_gateway.core.config import settings`.
- **Key env vars:** `DATABASE_URL`, `REDIS_URL`, `KAFKA_BOOTSTRAP_SERVERS`, `ETH_RPC_URL`, `POLYGON_RPC_URL`, `ERC3643_REGISTRY_ADDRESS`, `KAIA_SERVICE_URL`, `THEOLOGY_FIREWALL_ENABLED`.
- **Secrets:** Only in `.env` (never commit). Use `os.getenv()` fallbacks for optional keys.

## Testing & Quality
- **Python:** `pytest` tests under [tests/](tests). Run via `make test` (coverage for `services.api_gateway`).
- **Frontend:** Vitest config in [apps/haderos-web/vitest.config.ts](apps/haderos-web/vitest.config.ts); run via `pnpm test`.
- **Linters:** Backend: `pylint services/api_gateway/`; Frontend: `eslint . --ext .ts,.tsx`.
- **Formatters:** Backend: `black`; Frontend: `prettier`. Both run via `make format`.

## Frontend Stack Details
- **Framework:** Express server + React 19 client, tRPC for RPC calls, TanStack Query for state.
- **Styling:** Tailwind CSS, Radix UI components (Dialog, Select, Tabs, etc.), Framer Motion for animations.
- **Database layer:** Drizzle ORM with PostgreSQL (`pg` driver), Zod for schemas.
- **Build:** Vite for client, esbuild for Node server bundle. Output: `dist/index.js`.
- **Environment:** `NODE_ENV=development` for dev mode with tsx watch; `NODE_ENV=production` for built server.

## Practical Tips
- **Imports:** Use absolute paths `from services.api_gateway.*` (not relative) for consistency.
- **Async:** Keep handlers async; use `await` for DB/external calls.
- **Error handling:** [services/api-gateway/core/error_handler.py](services/api-gateway/core/error_handler.py) for HTTP exceptions.
- **Cleanup:** Check for duplicate files ending in "2" (e.g., `main 2.py`, `config 2.py`)—these are iterations; delete if not needed to reduce confusion.
- **Seeding:** [services/api-gateway/core/seeder.py](services/api-gateway/core/seeder.py) initializes data on startup; edit to populate test fixtures.

## Safety & Scope
- **Secrets:** Never commit `.env` or private keys; use environment variables only.
- **Database:** Be cautious with `Base.metadata.drop_all(engine)`—only in tests or explicit recovery scripts.
- **Docker:** Use `docker-compose.yml` or `docker-compose.dev.yml` for full stack setup (PostgreSQL, Redis, Kafka may be defined there).
- **Blockchain:** ERC-3643 compliance addresses and private keys must be env-var only; no hardcoded values.

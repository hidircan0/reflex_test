from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, init_engine
from app.migrations import ensure_unique_nicknames
from app.routers.scores import router as scores_router
from app.schemas import HealthRead


@asynccontextmanager
async def lifespan(_app: FastAPI):
    db_engine = init_engine(settings.database_url)
    async with db_engine.begin() as connection:
        # Volume already initialized? create_all is a no-op for existing tables.
        await connection.run_sync(Base.metadata.create_all)
        await ensure_unique_nicknames(connection)
    yield
    await db_engine.dispose()


app = FastAPI(title="Refleks Testi API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(scores_router)


@app.get("/api/health", response_model=HealthRead)
async def health() -> dict[str, str]:
    return {"status": "ok"}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import create_db_and_tables
from app.api.routes import projects, deliverables


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_db_and_tables()
    yield


app = FastAPI(
    title="HERMES Portal API",
    version="1.0.0",
    description="API de gestion de projet selon la méthodologie HERMES 5.1",
    lifespan=lifespan,
    redirect_slashes=False,   # évite les 307 qui cassent le routing nginx
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix="/v1")
app.include_router(deliverables.router, prefix="/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}

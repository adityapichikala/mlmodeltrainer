from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import settings
from database import create_tables
from routes import upload, train, results, ws


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables on startup
    create_tables()
    yield


app = FastAPI(
    title="AutoML Platform API",
    description="No-Code Machine Learning platform - upload CSV, train models, view results.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(upload.router, tags=["Data Ingestion"])
app.include_router(train.router, tags=["Training"])
app.include_router(results.router, tags=["Results"])
app.include_router(ws.router, tags=["WebSocket"])


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "version": "1.0.0"}

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import get_settings
from app.core.database import init_db
from app.core.security import decode_token
from app.websocket.manager import manager
from app.api.v1 import auth, patients, ai, admin, hospitals, analytics, sync

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    try:
        init_db()
        from app.seed import seed_database
        seed_database()
    except Exception as e:
        print(f"DB init warning: {e}")
    yield


app = FastAPI(
    title="ArogyaSakhi AI",
    description="AI-powered intelligent rural healthcare and emergency assistance platform",
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(ai.router)
app.include_router(admin.router)
app.include_router(hospitals.router)
app.include_router(analytics.router)
app.include_router(sync.router)

if os.path.isdir(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/health")
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "ArogyaSakhi AI", "version": "3.0.0"}


@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket, token: str = Query(...)):
    try:
        payload = decode_token(token)
        role = payload.get("role", "PCW")
    except Exception:
        await websocket.close(code=4001)
        return
    await manager.connect(websocket, role)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text('{"type":"pong"}')
    except WebSocketDisconnect:
        manager.disconnect(websocket, role)

"""
SMRITI+ Backend — FastAPI Application

"Remember. Engage. Connect."

SMRITI+ supports cognitive engagement and daily assistance;
it does not diagnose or treat dementia.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.api import auth, games, reminders, elders, caregiver, health_worker, sync, family, memories, voice_messages, personalization, voice

settings = get_settings()

app = FastAPI(
    title="SMRITI+ API",
    description=(
        "AI-Based Cognitive Gaming and Memory Assistance Platform. "
        "SMRITI+ supports cognitive engagement and daily assistance; "
        "it does not diagnose or treat dementia."
    ),
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow mobile app and web dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Include all routers ──
app.include_router(auth.router)
app.include_router(games.router)
app.include_router(reminders.router)
app.include_router(elders.router)
app.include_router(caregiver.router)
app.include_router(health_worker.router)
app.include_router(sync.router)
app.include_router(family.router)
app.include_router(memories.router)
app.include_router(voice_messages.router)
app.include_router(personalization.router)
app.include_router(voice.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "app": "SMRITI+",
        "tagline": "Remember. Engage. Connect.",
        "version": settings.app_version,
        "status": "running",
        "disclaimer": (
            "SMRITI+ supports cognitive engagement and daily assistance; "
            "it does not diagnose or treat dementia."
        ),
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}

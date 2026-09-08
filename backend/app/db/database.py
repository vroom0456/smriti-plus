"""SMRITI+ Backend — Database connection and session management"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import get_settings


db_url = get_settings().database_url
connect_args = {}
engine_kwargs = {"pool_pre_ping": True}

if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
else:
    engine_kwargs.update({"pool_size": 10, "max_overflow": 20})

engine = create_engine(
    db_url,
    connect_args=connect_args,
    **engine_kwargs,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency — yields a DB session, auto-closes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

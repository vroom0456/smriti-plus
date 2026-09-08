"""Pytest configuration and test database fixtures for SMRITI+"""

import uuid
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import app
from app.db.database import Base, get_db
from app.db.models import User, ElderlyProfile, Game

# SQLite In-Memory Engine for lightning fast isolated tests
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(autouse=True)
def setup_test_database():
    """Create all tables and seed required test entities before each test."""
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()

    # Seed required entities for test cases
    try:
        # 1. Users
        elder = User(
            id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
            role="elderly",
            name="Amit Borah",
            email="elder.demo@smriti.local",
            language="en",
        )
        worker = User(
            id=uuid.UUID("66666666-6666-6666-6666-666666666666"),
            role="health_worker",
            name="Dr. Anjali Saikia",
            email="worker.demo@smriti.local",
            language="en",
        )
        caregiver = User(
            id=uuid.UUID("44444444-4444-4444-4444-444444444444"),
            role="caregiver",
            name="Priya Borah",
            email="caregiver.demo@smriti.local",
            language="en",
        )
        db.add_all([elder, worker, caregiver])
        db.flush()

        # 2. Elderly Profile
        profile = ElderlyProfile(
            user_id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
            caregiver_id=uuid.UUID("44444444-4444-4444-4444-444444444444"),
            health_worker_group_id=uuid.UUID("66666666-6666-6666-6666-666666666666"),
            care_stage=1,
            current_assistance_level=1,
        )
        db.add(profile)

        # 3. Game
        game = Game(
            id=uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            name="Card Flip Matching",
            category="memory_matching",
            base_difficulty=1,
            min_difficulty=1,
            max_difficulty=5,
            is_active=True,
        )
        db.add(game)
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()

    # Override get_db dependency in FastAPI app
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)

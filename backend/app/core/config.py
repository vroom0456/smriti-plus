import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    app_name: str = "SMRITI+"
    app_version: str = "1.0.0"
    debug: bool = False

    # Database — reads DATABASE_URL (standard Railway/Render/Supabase) or SMRITI_DATABASE_URL
    database_url: str = (
        os.getenv("DATABASE_URL")
        or os.getenv("SMRITI_DATABASE_URL")
        or "postgresql://postgres:postgres@localhost:5432/smriti_plus"
    )

    # JWT Auth — reads SECRET_KEY or JWT_SECRET
    secret_key: str = (
        os.getenv("SECRET_KEY")
        or os.getenv("JWT_SECRET")
        or os.getenv("SMRITI_SECRET_KEY")
        or "smriti-plus-dev-secret-key-change-in-production"
    )
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours for demo convenience

    # Demo
    demo_otp: str = os.getenv("DEMO_OTP") or "123456"

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()

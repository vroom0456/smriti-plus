"""SMRITI+ Backend — Core Configuration"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    app_name: str = "SMRITI+"
    app_version: str = "1.0.0"
    debug: bool = True

    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/smriti_plus"

    # JWT Auth
    secret_key: str = "smriti-plus-dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours for demo convenience

    # Demo
    demo_otp: str = "123456"  # Fixed OTP for demo/development mode

    model_config = {"env_file": ".env", "env_prefix": "SMRITI_"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()

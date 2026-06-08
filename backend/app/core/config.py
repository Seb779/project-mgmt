from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "HERMES Portal"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-this"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8h

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://hermes:changeme@localhost:5432/hermes"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    # Anthropic
    ANTHROPIC_API_KEY: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

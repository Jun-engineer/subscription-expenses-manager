from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60 * 24
    jwt_algorithm: str = "HS256"
    cors_origins: Optional[str] = None  # comma-separated list (CORS_ORIGINS)

    # Optional envs, used by other modules but defined here to avoid extras errors
    database_url: Optional[str] = None
    redis_url: Optional[str] = None

    # pydantic-settings v2 config
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # ignore unexpected env vars
    )


settings = Settings()

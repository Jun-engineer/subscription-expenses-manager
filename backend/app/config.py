from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60 * 24
    jwt_algorithm: str = "HS256"
    cors_origins: Optional[str] = None  # comma-separated list (CORS_ORIGINS)

    # Cookie settings for production deployments
    cookie_secure: bool = False  # set True in production (requires HTTPS)
    cookie_samesite: str = "lax"  # "lax" (dev) or "none" (cross-site) or "strict"
    cookie_domain: Optional[str] = None  # e.g., .yourdomain.com if using subdomains

    # Feature flags / ops
    enable_celery: bool = True  # disable in Cloud Run if using scheduler + HTTP endpoint
    maintenance_key: Optional[str] = None  # if set, required in X-Maintenance-Key header for maintenance endpoints
    vault_key: Optional[str] = None  # Fernet key for vault encryption; auto-derived from secret_key if not set

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

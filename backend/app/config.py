"""Application configuration, loaded once from the environment."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolved from this file, not the working directory. Otherwise
# `python backend/scripts/...` from the repo root silently starts up with no
# credentials, which looks like a broken script rather than a missing env file.
BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    require_auth_on_reads: bool = True
    submissions_per_hour: int = 30

    @property
    def is_supabase_configured(self) -> bool:
        return self.supabase_url.startswith("https://") and bool(self.supabase_anon_key)

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def missing(self) -> list[str]:
        absent = []
        if not self.supabase_url.startswith("https://"):
            absent.append("SUPABASE_URL")
        if not self.supabase_anon_key:
            absent.append("SUPABASE_ANON_KEY")
        return absent


@lru_cache
def get_settings() -> Settings:
    return Settings()

from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DB_HOST: str = Field("localhost", env=["DB_HOST", "MYSQL_HOST"])
    DB_PORT: int = Field(3306, env=["DB_PORT", "MYSQL_PORT"])
    DB_NAME: str = Field("arogya_sakhi_ai", env=["DB_NAME", "MYSQL_DATABASE"])
    DB_USER: str = Field("root", env=["DB_USER", "MYSQL_USER"])
    DB_PASSWORD: str = Field("root", env=["DB_PASSWORD", "MYSQL_PASSWORD"])
    JWT_SECRET: str = Field("change_me", env=["JWT_SECRET"])
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: str = "http://localhost:5173"
    NODE_AI_ENGINE_URL: str = "http://localhost:5000"
    UPLOAD_DIR: str = "uploads"
    RESET_DB: bool = False

    # AI provider configuration — set in .env or environment.
    # AI_PROVIDER: "openai" (default) or "anthropic" or "google"
    # AI_API_KEY: your provider API key
    # AI_MODEL: override the model name (e.g. "gpt-4o", "claude-3-haiku-20240307")
    AI_PROVIDER: str = Field("openai", env="AI_PROVIDER")
    AI_API_KEY: str = Field("", env=["AI_API_KEY", "OPENAI_API_KEY"])
    AI_MODEL: str = Field("", env="AI_MODEL")  # empty = use provider default

    @property
    def resolved_ai_model(self) -> str:
        if self.AI_MODEL:
            return self.AI_MODEL
        defaults = {
            "openai": "gpt-4o-mini",
            "anthropic": "claude-3-haiku-20240307",
            "google": "gemini-1.5-flash",
        }
        return defaults.get(self.AI_PROVIDER.lower(), "gpt-4o-mini")

    @property
    def database_url(self) -> str:
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str

    CORS_ORIGINS: str = (
        "https://khushi-0406.github.io,"
        "http://localhost:5173,"
        "http://127.0.0.1:5173"
    )

    @property
    def sqlalchemy_database_url(self) -> str:
        if self.DATABASE_URL.startswith("postgres://"):
            return self.DATABASE_URL.replace("postgres://", "postgresql://", 1)
        return self.DATABASE_URL

    class Config:
        env_file = ".env"


settings = Settings()
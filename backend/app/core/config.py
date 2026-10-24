from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str

    CORS_ORIGINS: str = (
        "http://localhost:5173,"
        "http://127.0.0.1:5173"
    )

    class Config:
        env_file = ".env"


settings = Settings()
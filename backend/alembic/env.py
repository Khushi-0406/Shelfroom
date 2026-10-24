from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

from app.core.config import settings
from app.core.database import Base

# Import all models so Alembic can detect them
from app.schemas.book import Book
from app.schemas.characters import Character
from app.schemas.notes import BookNote, FavoriteQuote
from app.schemas.reading import ReadingProgress
from app.schemas.shelves import Shelf
from app.schemas.tag import Tag
from app.schemas.bookshelf import BookshelfItem


# Alembic Config object
config = context.config


# Logging configuration
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# Use SQLAlchemy models for autogenerate
target_metadata = Base.metadata


def run_migrations_offline() -> None:

    url = settings.DATABASE_URL

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={
            "paramstyle": "named"
        },
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:

    configuration = config.get_section(
        config.config_ini_section
    )

    configuration["sqlalchemy.url"] = settings.DATABASE_URL

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
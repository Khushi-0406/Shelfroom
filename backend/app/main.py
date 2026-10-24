from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, engine

from app.api.books import router as books_router
from app.api.characters import router as characters_router
from app.api.notes import router as notes_router
from app.api.reading import router as reading_router
from app.api.shelves import router as shelves_router
from app.api.tag import router as tags_router
from app.api.dashboard import router as dashboard_router
from app.api.bookshelf import router as bookshelf_router

from app.schemas.book import Book
from app.schemas.characters import Character
from app.schemas.notes import BookNote
from app.schemas.reading import ReadingProgress
from app.schemas.shelves import Shelf
from app.schemas.tag import Tag
from app.schemas.bookshelf import BookshelfItem

from app.utils.error_handler import internal_error_handler

import logging

app = FastAPI(
    title="Shelfroom API",
    description="Personal Book Library Backend",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in settings.CORS_ORIGINS.split(",")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.add_exception_handler(
    Exception,
    internal_error_handler
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)

BASE_DIR = Path(__file__).resolve().parent

app.mount(
    "/media",
    StaticFiles(
        directory=BASE_DIR / "media"
    ),
    name="media"
)


app.include_router(books_router)
app.include_router(characters_router)
app.include_router(notes_router)
app.include_router(reading_router)
app.include_router(shelves_router)
app.include_router(tags_router)
app.include_router(dashboard_router)
app.include_router(bookshelf_router)


@app.get("/")
def root():
    return {
        "message": "Shelfroom API is running"
    }
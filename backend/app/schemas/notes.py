from datetime import datetime

from pydantic import BaseModel, ConfigDict
from sqlalchemy import DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class BookNote(Base):
    __tablename__ = "book_notes"

    note_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    book_id: Mapped[int] = mapped_column(
        ForeignKey("books.book_id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )

    review: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    personal_thoughts: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    favorite_character: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    # Kept so existing data is not lost
    favorite_quote: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )


class FavoriteQuote(Base):
    __tablename__ = "favorite_quotes"

    quote_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    book_id: Mapped[int] = mapped_column(
        ForeignKey("books.book_id", ondelete="CASCADE"),
        nullable=False
    )

    quote: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )


class NoteCreate(BaseModel):
    book_id: int
    review: str | None = None
    personal_thoughts: str | None = None
    favorite_character: str | None = None
    favorite_quote: str | None = None


class NoteUpdate(BaseModel):
    review: str | None = None
    personal_thoughts: str | None = None
    favorite_character: str | None = None
    favorite_quote: str | None = None


class NoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    note_id: int
    book_id: int
    review: str | None
    personal_thoughts: str | None
    favorite_character: str | None
    favorite_quote: str | None
    created_at: datetime
    updated_at: datetime


class QuoteCreate(BaseModel):
    book_id: int
    quote: str


class QuoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    quote_id: int
    book_id: int
    quote: str
    created_at: datetime
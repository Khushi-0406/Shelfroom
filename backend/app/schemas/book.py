from datetime import datetime
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class BookStatus(str, Enum):
    WANT_TO_READ = "WANT_TO_READ"
    READING = "READING"
    FINISHED = "FINISHED"
    DNF = "DNF"

class Book(Base):
    __tablename__ = "books"

    book_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    author: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    genre: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default=BookStatus.WANT_TO_READ.value
    )

    rating: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    cover_image: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    pdf_path: Mapped[str | None] = mapped_column(
        String(500),
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


class BookCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    author: str = Field(min_length=1, max_length=255)
    genre: str | None = Field(default=None, max_length=100)
    status: BookStatus | None = None
    rating: int | None = Field(default=None, ge=1, le=5)


class BookUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    author: str | None = Field(default=None, min_length=1, max_length=255)
    genre: str | None = Field(default=None, max_length=100)
    status: str | None = None
    rating: int | None = Field(default=None, ge=1, le=5)


class BookResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    book_id: int
    title: str
    author: str
    genre: str | None
    status: str
    rating: int | None
    cover_image: str | None
    pdf_path: str | None
    created_at: datetime
    updated_at: datetime
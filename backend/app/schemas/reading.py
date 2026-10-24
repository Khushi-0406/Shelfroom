from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ReadingProgress(Base):
    __tablename__ = "reading_progress"

    progress_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    book_id: Mapped[int] = mapped_column(
        ForeignKey("books.book_id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )

    current_page: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )

    total_pages: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    started_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )


class ReadingProgressCreate(BaseModel):
    book_id: int
    current_page: int = Field(default=0, ge=0)
    total_pages: int = Field(gt=0)
    started_at: datetime | None = None
    finished_at: datetime | None = None


class ReadingProgressUpdate(BaseModel):
    current_page: int | None = Field(default=None, ge=0)
    total_pages: int | None = Field(default=None, gt=0)
    started_at: datetime | None = None
    finished_at: datetime | None = None


class ReadingProgressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    progress_id: int
    book_id: int
    current_page: int
    total_pages: int
    progress_percentage: float
    started_at: datetime | None
    finished_at: datetime | None
    updated_at: datetime
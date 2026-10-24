from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import DateTime, ForeignKey, Integer, String, Table, Column
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


book_shelves = Table(
    "book_shelves",
    Base.metadata,

    Column(
        "book_id",
        Integer,
        ForeignKey("books.book_id", ondelete="CASCADE"),
        primary_key=True
    ),

    Column(
        "shelf_id",
        Integer,
        ForeignKey("shelves.shelf_id", ondelete="CASCADE"),
        primary_key=True
    )
)


class Shelf(Base):
    __tablename__ = "shelves"

    shelf_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True
    )

    description: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )


class ShelfCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None


class ShelfUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100
    )
    description: str | None = None


class ShelfResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    shelf_id: int
    name: str
    description: str | None
    created_at: datetime
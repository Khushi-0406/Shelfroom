from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.schemas.book import Book


class BookshelfItem(Base):
    __tablename__ = "bookshelf_arrangements"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    book_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("books.book_id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )

    shelf_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1
    )

    position: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
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

    book = relationship("Book", lazy="joined")


# =========================================================
# PYDANTIC SCHEMAS
# =========================================================

class BookPlacementInput(BaseModel):
    book_id: int
    shelf_number: int = Field(ge=1)
    position: int = Field(ge=0)


class SingleMovePayload(BaseModel):
    shelf_number: int = Field(ge=1)
    position: int = Field(ge=0)


class BookshelfBookInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    book_id: int
    title: str
    author: str
    genre: str | None = None
    status: str
    rating: int | None = None
    cover_image: str | None = None
    shelf_number: int
    position: int


class ShelfColumn(BaseModel):
    shelf_number: int
    books: list[BookshelfBookInfo]


class BookshelfLayoutResponse(BaseModel):
    total_shelves: int
    shelves: list[ShelfColumn]


class SaveArrangementPayload(BaseModel):
    total_shelves: int = Field(default=5, ge=1, le=20)
    items: list[BookPlacementInput]

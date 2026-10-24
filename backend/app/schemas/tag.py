from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Table
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


book_tags = Table(
    "book_tags",
    Base.metadata,

    Column(
        "book_id",
        Integer,
        ForeignKey("books.book_id", ondelete="CASCADE"),
        primary_key=True
    ),

    Column(
        "tag_id",
        Integer,
        ForeignKey("tags.tag_id", ondelete="CASCADE"),
        primary_key=True
    )
)


class Tag(Base):
    __tablename__ = "tags"

    tag_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )


class TagCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100
    )


class TagUpdate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100
    )


class TagResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tag_id: int
    name: str
    created_at: datetime
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Character(Base):
    __tablename__ = "characters"

    character_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    book_id: Mapped[int] = mapped_column(
        ForeignKey("books.book_id", ondelete="CASCADE"),
        nullable=False
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )


class CharacterCreate(BaseModel):
    book_id: int
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None


class CharacterUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=255
    )
    description: str | None = None


class CharacterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    character_id: int
    book_id: int
    name: str
    description: str | None
    created_at: datetime
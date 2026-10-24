from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.book import Book
from app.schemas.characters import (
    Character,
    CharacterCreate,
    CharacterResponse,
    CharacterUpdate
)


router = APIRouter(
    prefix="/characters",
    tags=["Characters"]
)


@router.post("/", response_model=CharacterResponse)
def create_character(
    character_data: CharacterCreate,
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(
        Book.book_id == character_data.book_id
    ).first()

    if not book:
        raise HTTPException(
            status_code=404,
            detail="Book not found"
        )

    character = Character(
        book_id=character_data.book_id,
        name=character_data.name,
        description=character_data.description
    )

    db.add(character)
    db.commit()
    db.refresh(character)

    return character


@router.get("/", response_model=list[CharacterResponse])
def get_characters(
    book_id: int | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Character)

    if book_id:
        query = query.filter(
            Character.book_id == book_id
        )

    return query.all()


@router.get("/{character_id}", response_model=CharacterResponse)
def get_character(
    character_id: int,
    db: Session = Depends(get_db)
):
    character = db.query(Character).filter(
        Character.character_id == character_id
    ).first()

    if not character:
        raise HTTPException(
            status_code=404,
            detail="Character not found"
        )

    return character


@router.put("/{character_id}", response_model=CharacterResponse)
def update_character(
    character_id: int,
    character_data: CharacterUpdate,
    db: Session = Depends(get_db)
):
    character = db.query(Character).filter(
        Character.character_id == character_id
    ).first()

    if not character:
        raise HTTPException(
            status_code=404,
            detail="Character not found"
        )

    update_data = character_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(character, field, value)

    db.commit()
    db.refresh(character)

    return character


@router.delete("/{character_id}")
def delete_character(
    character_id: int,
    db: Session = Depends(get_db)
):
    character = db.query(Character).filter(
        Character.character_id == character_id
    ).first()

    if not character:
        raise HTTPException(
            status_code=404,
            detail="Character not found"
        )

    db.delete(character)
    db.commit()

    return {
        "message": "Character deleted successfully"
    }
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.book import Book
from app.schemas.notes import (
    BookNote,
    NoteCreate,
    NoteResponse,
    NoteUpdate,
    FavoriteQuote,
    QuoteCreate,
    QuoteResponse
)


router = APIRouter(
    prefix="/notes",
    tags=["Notes"]
)


@router.post("/", response_model=NoteResponse)
def create_note(
    note_data: NoteCreate,
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(
        Book.book_id == note_data.book_id
    ).first()

    if not book:
        raise HTTPException(
            status_code=404,
            detail="Book not found"
        )

    existing_note = db.query(BookNote).filter(
        BookNote.book_id == note_data.book_id
    ).first()

    if existing_note:
        raise HTTPException(
            status_code=400,
            detail="Notes already exist for this book"
        )

    note = BookNote(
        book_id=note_data.book_id,
        review=note_data.review,
        personal_thoughts=note_data.personal_thoughts,
        favorite_character=note_data.favorite_character,
        favorite_quote=note_data.favorite_quote
    )

    db.add(note)
    db.commit()
    db.refresh(note)

    return note


@router.get("/", response_model=list[NoteResponse])
def get_notes(
    book_id: int | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(BookNote)

    if book_id:
        query = query.filter(
            BookNote.book_id == book_id
        )

    return query.all()


# ==============================
# FAVORITE QUOTES
# ==============================

@router.post("/quotes/", response_model=QuoteResponse)
def create_quote(
    quote_data: QuoteCreate,
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(
        Book.book_id == quote_data.book_id
    ).first()

    if not book:
        raise HTTPException(
            status_code=404,
            detail="Book not found"
        )

    quote = FavoriteQuote(
        book_id=quote_data.book_id,
        quote=quote_data.quote
    )

    db.add(quote)
    db.commit()
    db.refresh(quote)

    return quote


@router.get(
    "/quotes/book/{book_id}",
    response_model=list[QuoteResponse]
)
def get_book_quotes(
    book_id: int,
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(
        Book.book_id == book_id
    ).first()

    if not book:
        raise HTTPException(
            status_code=404,
            detail="Book not found"
        )

    return db.query(FavoriteQuote).filter(
        FavoriteQuote.book_id == book_id
    ).all()


@router.delete("/quotes/{quote_id}")
def delete_quote(
    quote_id: int,
    db: Session = Depends(get_db)
):
    quote = db.query(FavoriteQuote).filter(
        FavoriteQuote.quote_id == quote_id
    ).first()

    if not quote:
        raise HTTPException(
            status_code=404,
            detail="Quote not found"
        )

    db.delete(quote)
    db.commit()

    return {
        "message": "Quote deleted successfully"
    }


# ==============================
# SINGLE NOTE
# ==============================

@router.get("/{note_id}", response_model=NoteResponse)
def get_note(
    note_id: int,
    db: Session = Depends(get_db)
):
    note = db.query(BookNote).filter(
        BookNote.note_id == note_id
    ).first()

    if not note:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )

    return note


@router.put("/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: int,
    note_data: NoteUpdate,
    db: Session = Depends(get_db)
):
    note = db.query(BookNote).filter(
        BookNote.note_id == note_id
    ).first()

    if not note:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )

    update_data = note_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(note, field, value)

    db.commit()
    db.refresh(note)

    return note


@router.delete("/{note_id}")
def delete_note(
    note_id: int,
    db: Session = Depends(get_db)
):
    note = db.query(BookNote).filter(
        BookNote.note_id == note_id
    ).first()

    if not note:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )

    db.delete(note)
    db.commit()

    return {
        "message": "Note deleted successfully"
    }
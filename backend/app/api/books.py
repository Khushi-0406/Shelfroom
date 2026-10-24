from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.book import Book, BookCreate, BookResponse, BookUpdate
from app.utils.file_handler import (
    delete_cover,
    delete_pdf,
    save_cover,
    save_pdf,
)


router = APIRouter(
    prefix="/books",
    tags=["Books"]
)


@router.post("/", response_model=BookResponse)
def create_book(
    book_data: BookCreate,
    db: Session = Depends(get_db)
):
    book = Book(
        title=book_data.title,
        author=book_data.author,
        genre=book_data.genre,
        status=book_data.status,
        rating=book_data.rating
    )

    db.add(book)
    db.commit()
    db.refresh(book)

    return book


@router.get("/", response_model=list[BookResponse])
def get_books(
    search: str | None = None,
    status: str | None = None,
    genre: str | None = None,
    rating: int | None = None,
    skip: int = 0,
    limit: int | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Book)

    if search:
        query = query.filter(
            (Book.title.ilike(f"%{search}%")) |
            (Book.author.ilike(f"%{search}%"))
        )

    if status:
        query = query.filter(Book.status == status)

    if genre:
        query = query.filter(
            Book.genre.ilike(f"%{genre}%")
        )

    if rating:
        query = query.filter(
            Book.rating == rating
        )

    query = query.offset(skip)
    if limit is not None:
        query = query.limit(limit)

    return query.all()


@router.get("/{book_id}", response_model=BookResponse)
def get_book(
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

    return book


@router.put("/{book_id}", response_model=BookResponse)
def update_book(
    book_id: int,
    book_data: BookUpdate,
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

    update_data = book_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(book, field, value)

    db.commit()
    db.refresh(book)

    return book


@router.delete("/{book_id}")
def delete_book(
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

    # Save file paths before deleting database record
    cover_path = book.cover_image
    pdf_path = book.pdf_path

    # Delete database record
    db.delete(book)
    db.commit()

    # Delete associated files
    delete_cover(cover_path)
    delete_pdf(pdf_path)

    return {
        "message": "Book deleted successfully"
    }


@router.post("/{book_id}/cover")
async def upload_book_cover(
    book_id: int,
    file: UploadFile = File(...),
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

    # Save old cover path
    old_cover_path = book.cover_image

    # Save new cover
    cover_path = await save_cover(file)

    book.cover_image = cover_path

    db.commit()
    db.refresh(book)

    # Delete old cover after successful database update
    if old_cover_path:
        delete_cover(old_cover_path)

    return {
        "message": "Book cover uploaded successfully",
        "book_id": book.book_id,
        "cover_image": book.cover_image
    }


@router.post("/{book_id}/pdf")
async def upload_book_pdf(
    book_id: int,
    file: UploadFile = File(...),
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

    # Save old PDF path
    old_pdf_path = book.pdf_path

    # Save new PDF
    pdf_path = await save_pdf(file)

    book.pdf_path = pdf_path

    db.commit()
    db.refresh(book)

    # Delete old PDF after successful database update
    if old_pdf_path:
        delete_pdf(old_pdf_path)

    return {
        "message": "Book PDF uploaded successfully",
        "book_id": book.book_id,
        "pdf_path": book.pdf_path
    }


@router.get("/{book_id}/pdf")
def get_book_pdf(
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

    if not book.pdf_path:
        raise HTTPException(
            status_code=404,
            detail="PDF not found for this book"
        )

    file_path = (
        Path(__file__).resolve().parent.parent
        / book.pdf_path
    )

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="PDF file does not exist"
        )

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=f"{book.title}.pdf"
    )
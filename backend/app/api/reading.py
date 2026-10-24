from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.book import Book
from app.schemas.reading import (
    ReadingProgress,
    ReadingProgressCreate,
    ReadingProgressResponse,
    ReadingProgressUpdate
)


router = APIRouter(
    prefix="/reading",
    tags=["Reading Progress"]
)


def progress_response(progress: ReadingProgress):
    percentage = (
        progress.current_page / progress.total_pages
    ) * 100

    return {
        "progress_id": progress.progress_id,
        "book_id": progress.book_id,
        "current_page": progress.current_page,
        "total_pages": progress.total_pages,
        "progress_percentage": round(percentage, 2),
        "started_at": progress.started_at,
        "finished_at": progress.finished_at,
        "updated_at": progress.updated_at
    }


@router.post("/", response_model=ReadingProgressResponse)
def create_reading_progress(
    progress_data: ReadingProgressCreate,
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(
        Book.book_id == progress_data.book_id
    ).first()

    if not book:
        raise HTTPException(
            status_code=404,
            detail="Book not found"
        )

    existing_progress = db.query(ReadingProgress).filter(
        ReadingProgress.book_id == progress_data.book_id
    ).first()

    if existing_progress:
        raise HTTPException(
            status_code=400,
            detail="Reading progress already exists for this book"
        )

    if progress_data.current_page > progress_data.total_pages:
        raise HTTPException(
            status_code=400,
            detail="Current page cannot exceed total pages"
        )

    progress = ReadingProgress(
        book_id=progress_data.book_id,
        current_page=progress_data.current_page,
        total_pages=progress_data.total_pages,
        started_at=progress_data.started_at,
        finished_at=progress_data.finished_at
    )

    db.add(progress)
    db.commit()
    db.refresh(progress)

    return progress_response(progress)


@router.get("/", response_model=list[ReadingProgressResponse])
def get_reading_progress(
    book_id: int | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(ReadingProgress)

    if book_id:
        query = query.filter(
            ReadingProgress.book_id == book_id
        )

    progress_list = query.all()

    return [
        progress_response(progress)
        for progress in progress_list
    ]


@router.get("/{progress_id}", response_model=ReadingProgressResponse)
def get_progress(
    progress_id: int,
    db: Session = Depends(get_db)
):
    progress = db.query(ReadingProgress).filter(
        ReadingProgress.progress_id == progress_id
    ).first()

    if not progress:
        raise HTTPException(
            status_code=404,
            detail="Reading progress not found"
        )

    return progress_response(progress)


@router.put("/{progress_id}", response_model=ReadingProgressResponse)
def update_progress(
    progress_id: int,
    progress_data: ReadingProgressUpdate,
    db: Session = Depends(get_db)
):
    progress = db.query(ReadingProgress).filter(
        ReadingProgress.progress_id == progress_id
    ).first()

    if not progress:
        raise HTTPException(
            status_code=404,
            detail="Reading progress not found"
        )

    update_data = progress_data.model_dump(
        exclude_unset=True
    )

    new_current_page = update_data.get(
        "current_page",
        progress.current_page
    )

    new_total_pages = update_data.get(
        "total_pages",
        progress.total_pages
    )

    if new_current_page > new_total_pages:
        raise HTTPException(
            status_code=400,
            detail="Current page cannot exceed total pages"
        )

    for field, value in update_data.items():
        setattr(progress, field, value)

    db.commit()
    db.refresh(progress)

    return progress_response(progress)


@router.delete("/{progress_id}")
def delete_progress(
    progress_id: int,
    db: Session = Depends(get_db)
):
    progress = db.query(ReadingProgress).filter(
        ReadingProgress.progress_id == progress_id
    ).first()

    if not progress:
        raise HTTPException(
            status_code=404,
            detail="Reading progress not found"
        )

    db.delete(progress)
    db.commit()

    return {
        "message": "Reading progress deleted successfully"
    }
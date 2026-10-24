from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.book import Book
from app.schemas.tag import (
    Tag,
    TagCreate,
    TagResponse,
    TagUpdate,
    book_tags
)


router = APIRouter(
    prefix="/tags",
    tags=["Tags"]
)


@router.post("/", response_model=TagResponse)
def create_tag(
    tag_data: TagCreate,
    db: Session = Depends(get_db)
):
    existing_tag = db.query(Tag).filter(
        Tag.name == tag_data.name
    ).first()

    if existing_tag:
        raise HTTPException(
            status_code=400,
            detail="Tag already exists"
        )

    tag = Tag(
        name=tag_data.name
    )

    db.add(tag)
    db.commit()
    db.refresh(tag)

    return tag


@router.get("/", response_model=list[TagResponse])
def get_tags(
    db: Session = Depends(get_db)
):
    return db.query(Tag).all()


# Get all tags assigned to a specific book
@router.get("/book/{book_id}", response_model=list[TagResponse])
def get_book_tags(
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

    tags = (
        db.query(Tag)
        .join(
            book_tags,
            Tag.tag_id == book_tags.c.tag_id
        )
        .filter(
            book_tags.c.book_id == book_id
        )
        .all()
    )

    return tags


@router.get("/{tag_id}", response_model=TagResponse)
def get_tag(
    tag_id: int,
    db: Session = Depends(get_db)
):
    tag = db.query(Tag).filter(
        Tag.tag_id == tag_id
    ).first()

    if not tag:
        raise HTTPException(
            status_code=404,
            detail="Tag not found"
        )

    return tag


@router.put("/{tag_id}", response_model=TagResponse)
def update_tag(
    tag_id: int,
    tag_data: TagUpdate,
    db: Session = Depends(get_db)
):
    tag = db.query(Tag).filter(
        Tag.tag_id == tag_id
    ).first()

    if not tag:
        raise HTTPException(
            status_code=404,
            detail="Tag not found"
        )

    existing_tag = db.query(Tag).filter(
        Tag.name == tag_data.name,
        Tag.tag_id != tag_id
    ).first()

    if existing_tag:
        raise HTTPException(
            status_code=400,
            detail="Tag already exists"
        )

    tag.name = tag_data.name

    db.commit()
    db.refresh(tag)

    return tag


@router.delete("/{tag_id}")
def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db)
):
    tag = db.query(Tag).filter(
        Tag.tag_id == tag_id
    ).first()

    if not tag:
        raise HTTPException(
            status_code=404,
            detail="Tag not found"
        )

    db.execute(
        book_tags.delete().where(
            book_tags.c.tag_id == tag_id
        )
    )

    db.delete(tag)
    db.commit()

    return {
        "message": "Tag deleted successfully"
    }


@router.post("/{tag_id}/books/{book_id}")
def add_tag_to_book(
    tag_id: int,
    book_id: int,
    db: Session = Depends(get_db)
):
    tag = db.query(Tag).filter(
        Tag.tag_id == tag_id
    ).first()

    if not tag:
        raise HTTPException(
            status_code=404,
            detail="Tag not found"
        )

    book = db.query(Book).filter(
        Book.book_id == book_id
    ).first()

    if not book:
        raise HTTPException(
            status_code=404,
            detail="Book not found"
        )

    existing = db.execute(
        book_tags.select().where(
            (book_tags.c.tag_id == tag_id) &
            (book_tags.c.book_id == book_id)
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Tag already assigned to this book"
        )

    db.execute(
        book_tags.insert().values(
            tag_id=tag_id,
            book_id=book_id
        )
    )

    db.commit()

    return {
        "message": "Tag added to book successfully"
    }


@router.delete("/{tag_id}/books/{book_id}")
def remove_tag_from_book(
    tag_id: int,
    book_id: int,
    db: Session = Depends(get_db)
):
    result = db.execute(
        book_tags.delete().where(
            (book_tags.c.tag_id == tag_id) &
            (book_tags.c.book_id == book_id)
        )
    )

    if result.rowcount == 0:
        raise HTTPException(
            status_code=404,
            detail="Tag not assigned to this book"
        )

    db.commit()

    return {
        "message": "Tag removed from book successfully"
    }
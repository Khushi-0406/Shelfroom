from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.book import Book
from app.schemas.shelves import (
    Shelf,
    ShelfCreate,
    ShelfResponse,
    ShelfUpdate,
    book_shelves
)


router = APIRouter(
    prefix="/shelves",
    tags=["Shelves"]
)


# ---------------------------------------------------------
# CREATE SHELF
# ---------------------------------------------------------

@router.post("/", response_model=ShelfResponse)
def create_shelf(
    shelf_data: ShelfCreate,
    db: Session = Depends(get_db)
):
    name = shelf_data.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Shelf name cannot be empty"
        )

    existing_shelf = db.query(Shelf).filter(
        Shelf.name.ilike(name)
    ).first()

    if existing_shelf:
        raise HTTPException(
            status_code=400,
            detail="Shelf already exists"
        )

    shelf = Shelf(
        name=name,
        description=shelf_data.description
    )

    db.add(shelf)
    db.commit()
    db.refresh(shelf)

    return shelf


# ---------------------------------------------------------
# GET ALL SHELVES
# ---------------------------------------------------------

@router.get("/", response_model=list[ShelfResponse])
def get_shelves(
    db: Session = Depends(get_db)
):
    return (
        db.query(Shelf)
        .order_by(Shelf.name.asc())
        .all()
    )


# ---------------------------------------------------------
# GET SHELF
# ---------------------------------------------------------

@router.get("/{shelf_id}", response_model=ShelfResponse)
def get_shelf(
    shelf_id: int,
    db: Session = Depends(get_db)
):
    shelf = db.query(Shelf).filter(
        Shelf.shelf_id == shelf_id
    ).first()

    if not shelf:
        raise HTTPException(
            status_code=404,
            detail="Shelf not found"
        )

    return shelf


# ---------------------------------------------------------
# GET SHELVES FOR A BOOK
# IMPORTANT: This route must be before /{shelf_id}
# ---------------------------------------------------------

@router.get(
    "/book/{book_id}",
    response_model=list[ShelfResponse]
)
def get_book_shelves(
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

    shelves = (
        db.query(Shelf)
        .join(
            book_shelves,
            book_shelves.c.shelf_id == Shelf.shelf_id
        )
        .filter(
            book_shelves.c.book_id == book_id
        )
        .order_by(Shelf.name.asc())
        .all()
    )

    return shelves


# ---------------------------------------------------------
# UPDATE SHELF
# ---------------------------------------------------------

@router.put("/{shelf_id}", response_model=ShelfResponse)
def update_shelf(
    shelf_id: int,
    shelf_data: ShelfUpdate,
    db: Session = Depends(get_db)
):
    shelf = db.query(Shelf).filter(
        Shelf.shelf_id == shelf_id
    ).first()

    if not shelf:
        raise HTTPException(
            status_code=404,
            detail="Shelf not found"
        )

    update_data = shelf_data.model_dump(
        exclude_unset=True
    )

    if "name" in update_data:
        name = update_data["name"].strip()

        if not name:
            raise HTTPException(
                status_code=400,
                detail="Shelf name cannot be empty"
            )

        duplicate = db.query(Shelf).filter(
            Shelf.name.ilike(name),
            Shelf.shelf_id != shelf_id
        ).first()

        if duplicate:
            raise HTTPException(
                status_code=400,
                detail="Shelf already exists"
            )

        update_data["name"] = name

    for field, value in update_data.items():
        setattr(shelf, field, value)

    db.commit()
    db.refresh(shelf)

    return shelf


# ---------------------------------------------------------
# DELETE SHELF
# ---------------------------------------------------------

@router.delete("/{shelf_id}")
def delete_shelf(
    shelf_id: int,
    db: Session = Depends(get_db)
):
    shelf = db.query(Shelf).filter(
        Shelf.shelf_id == shelf_id
    ).first()

    if not shelf:
        raise HTTPException(
            status_code=404,
            detail="Shelf not found"
        )

    db.execute(
        book_shelves.delete().where(
            book_shelves.c.shelf_id == shelf_id
        )
    )

    db.delete(shelf)
    db.commit()

    return {
        "message": "Shelf deleted successfully"
    }


# ---------------------------------------------------------
# ADD BOOK TO SHELF
# ---------------------------------------------------------

@router.post("/{shelf_id}/books/{book_id}")
def add_book_to_shelf(
    shelf_id: int,
    book_id: int,
    db: Session = Depends(get_db)
):
    shelf = db.query(Shelf).filter(
        Shelf.shelf_id == shelf_id
    ).first()

    if not shelf:
        raise HTTPException(
            status_code=404,
            detail="Shelf not found"
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
        book_shelves.select().where(
            (book_shelves.c.shelf_id == shelf_id) &
            (book_shelves.c.book_id == book_id)
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Book already exists in this shelf"
        )

    db.execute(
        book_shelves.insert().values(
            shelf_id=shelf_id,
            book_id=book_id
        )
    )

    db.commit()

    return {
        "message": "Book added to shelf successfully"
    }


# ---------------------------------------------------------
# REMOVE BOOK FROM SHELF
# ---------------------------------------------------------

@router.delete("/{shelf_id}/books/{book_id}")
def remove_book_from_shelf(
    shelf_id: int,
    book_id: int,
    db: Session = Depends(get_db)
):
    result = db.execute(
        book_shelves.delete().where(
            (book_shelves.c.shelf_id == shelf_id) &
            (book_shelves.c.book_id == book_id)
        )
    )

    if result.rowcount == 0:
        raise HTTPException(
            status_code=404,
            detail="Book not found in this shelf"
        )

    db.commit()

    return {
        "message": "Book removed from shelf successfully"
    }
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.book import Book
from app.schemas.bookshelf import (
    BookPlacementInput,
    BookshelfBookInfo,
    BookshelfItem,
    BookshelfLayoutResponse,
    SaveArrangementPayload,
    ShelfColumn,
    SingleMovePayload,
)

router = APIRouter(
    prefix="/bookshelf",
    tags=["Bookshelf Arrangement"]
)


def _build_layout(db: Session, total_shelves: int = 5) -> BookshelfLayoutResponse:
    """
    Ensures every book has a BookshelfItem record,
    normalizes positions, and constructs the ShelfColumn list.
    """
    all_books = db.query(Book).all()
    book_map = {b.book_id: b for b in all_books}

    # Fetch all arrangement records
    arrangements = db.query(BookshelfItem).all()
    arranged_book_ids = set()

    # Clean up orphans if any
    for arr in arrangements:
        if arr.book_id not in book_map:
            db.delete(arr)
        else:
            arranged_book_ids.add(arr.book_id)

    # Determine max shelf number currently used
    max_shelf = total_shelves
    for arr in arrangements:
        if arr.shelf_number > max_shelf:
            max_shelf = arr.shelf_number

    # For any book that doesn't have an arrangement record yet, assign it
    unarranged = [b for b in all_books if b.book_id not in arranged_book_ids]
    if unarranged:
        # Count existing books on each shelf to distribute neatly
        shelf_counts = {s: 0 for s in range(1, max_shelf + 1)}
        for arr in arrangements:
            if arr.book_id in book_map:
                shelf_counts[arr.shelf_number] = shelf_counts.get(arr.shelf_number, 0) + 1

        for book in unarranged:
            # Find shelf with fewest books among 1..max_shelf
            target_shelf = min(shelf_counts, key=shelf_counts.get)
            pos = shelf_counts[target_shelf]
            new_item = BookshelfItem(
                book_id=book.book_id,
                shelf_number=target_shelf,
                position=pos
            )
            db.add(new_item)
            shelf_counts[target_shelf] += 1

        db.commit()
        # Refresh arrangements
        arrangements = db.query(BookshelfItem).all()

    # Determine final shelf count
    final_total_shelves = max(total_shelves, max((arr.shelf_number for arr in arrangements), default=5))

    # Group books by shelf
    shelf_dict: dict[int, list[BookshelfBookInfo]] = {
        s: [] for s in range(1, final_total_shelves + 1)
    }

    for arr in arrangements:
        book = book_map.get(arr.book_id)
        if not book:
            continue
        shelf_num = arr.shelf_number
        if shelf_num not in shelf_dict:
            shelf_dict[shelf_num] = []

        shelf_dict[shelf_num].append(
            BookshelfBookInfo(
                book_id=book.book_id,
                title=book.title,
                author=book.author,
                genre=book.genre,
                status=book.status,
                rating=book.rating,
                cover_image=book.cover_image,
                shelf_number=arr.shelf_number,
                position=arr.position
            )
        )

    # Sort each shelf by position and normalize positions
    result_shelves: list[ShelfColumn] = []
    has_pos_updates = False

    for s in range(1, final_total_shelves + 1):
        shelf_books = shelf_dict.get(s, [])
        shelf_books.sort(key=lambda x: (x.position, x.book_id))

        # Re-index position cleanly: 0, 1, 2...
        normalized_books: list[BookshelfBookInfo] = []
        for idx, b_info in enumerate(shelf_books):
            if b_info.position != idx:
                b_info.position = idx
                has_pos_updates = True
                # also update DB record if needed
                item_rec = db.query(BookshelfItem).filter(BookshelfItem.book_id == b_info.book_id).first()
                if item_rec:
                    item_rec.position = idx
            normalized_books.append(b_info)

        result_shelves.append(ShelfColumn(shelf_number=s, books=normalized_books))

    if has_pos_updates:
        db.commit()

    return BookshelfLayoutResponse(
        total_shelves=final_total_shelves,
        shelves=result_shelves
    )


# ---------------------------------------------------------
# GET BOOKSHELF LAYOUT
# ---------------------------------------------------------

@router.get("/", response_model=BookshelfLayoutResponse)
def get_bookshelf_layout(
    shelves: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db)
):
    return _build_layout(db, total_shelves=shelves)


# ---------------------------------------------------------
# SAVE ENTIRE BOOKSHELF ARRANGEMENT (BULK)
# ---------------------------------------------------------

@router.put("/arrangement", response_model=BookshelfLayoutResponse)
def save_bookshelf_arrangement(
    payload: SaveArrangementPayload,
    db: Session = Depends(get_db)
):
    """
    Saves the user's customized arrangement of books across shelves.
    Updates shelf_number and position for every specified book.
    """
    now = datetime.utcnow()

    # Pre-verify that books exist
    book_ids = [item.book_id for item in payload.items]
    valid_books = db.query(Book.book_id).filter(Book.book_id.in_(book_ids)).all()
    valid_id_set = {b[0] for b in valid_books}

    for item in payload.items:
        if item.book_id not in valid_id_set:
            continue

        existing = db.query(BookshelfItem).filter(
            BookshelfItem.book_id == item.book_id
        ).first()

        if existing:
            existing.shelf_number = item.shelf_number
            existing.position = item.position
            existing.updated_at = now
        else:
            db.add(
                BookshelfItem(
                    book_id=item.book_id,
                    shelf_number=item.shelf_number,
                    position=item.position,
                    created_at=now,
                    updated_at=now
                )
            )

    db.commit()

    return _build_layout(db, total_shelves=payload.total_shelves)


# ---------------------------------------------------------
# UPDATE SINGLE BOOK POSITION
# ---------------------------------------------------------

@router.put("/books/{book_id}", response_model=BookshelfBookInfo)
def move_book(
    book_id: int,
    payload: SingleMovePayload,
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(Book.book_id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    item = db.query(BookshelfItem).filter(
        BookshelfItem.book_id == book_id
    ).first()

    now = datetime.utcnow()

    if not item:
        item = BookshelfItem(
            book_id=book_id,
            shelf_number=payload.shelf_number,
            position=payload.position,
            created_at=now,
            updated_at=now
        )
        db.add(item)
    else:
        item.shelf_number = payload.shelf_number
        item.position = payload.position
        item.updated_at = now

    db.commit()
    db.refresh(item)

    return BookshelfBookInfo(
        book_id=book.book_id,
        title=book.title,
        author=book.author,
        genre=book.genre,
        status=book.status,
        rating=book.rating,
        cover_image=book.cover_image,
        shelf_number=item.shelf_number,
        position=item.position
    )


# ---------------------------------------------------------
# AUTO-DISTRIBUTE / RESET ARRANGEMENT
# ---------------------------------------------------------

@router.post("/reset", response_model=BookshelfLayoutResponse)
def reset_bookshelf_arrangement(
    shelves: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """
    Distributes all books evenly across the shelves in alphabetical order.
    """
    # Delete existing arrangement
    db.query(BookshelfItem).delete()
    db.commit()

    # Query books sorted by title
    all_books = db.query(Book).order_by(Book.title.asc()).all()

    shelf_index = 1
    position_counters: dict[int, int] = {s: 0 for s in range(1, shelves + 1)}

    for book in all_books:
        pos = position_counters[shelf_index]
        db.add(
            BookshelfItem(
                book_id=book.book_id,
                shelf_number=shelf_index,
                position=pos
            )
        )
        position_counters[shelf_index] += 1
        shelf_index = (shelf_index % shelves) + 1

    db.commit()

    return _build_layout(db, total_shelves=shelves)

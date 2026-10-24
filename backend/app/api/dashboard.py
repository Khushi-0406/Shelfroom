from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.book import Book


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db)
):
    total_books = db.query(Book).count()

    want_to_read = db.query(Book).filter(
        Book.status == "WANT_TO_READ"
    ).count()

    currently_reading = db.query(Book).filter(
        Book.status == "READING"
    ).count()

    finished = db.query(Book).filter(
        Book.status == "FINISHED"
    ).count()

    dnf = db.query(Book).filter(
        Book.status == "DNF"
    ).count()

    average_rating = db.query(
        func.avg(Book.rating)
    ).filter(
        Book.rating.isnot(None)
    ).scalar()

    books_this_year = db.query(Book).filter(
        Book.status == "FINISHED",
        func.extract(
            "year",
            Book.updated_at
        ) == datetime.now().year
    ).count()

    return {
        "total_books": total_books,
        "want_to_read": want_to_read,
        "currently_reading": currently_reading,
        "finished": finished,
        "dnf": dnf,
        "average_rating": round(
            float(average_rating), 2
        ) if average_rating else 0,
        "books_read_this_year": books_this_year
    }


@router.get("/overview")
def get_dashboard_overview(
    db: Session = Depends(get_db)
):
    recent_books = (
        db.query(Book)
        .order_by(Book.created_at.desc())
        .limit(5)
        .all()
    )

    currently_reading = (
        db.query(Book)
        .filter(Book.status == "READING")
        .order_by(Book.updated_at.desc())
        .limit(5)
        .all()
    )

    recently_finished = (
        db.query(Book)
        .filter(Book.status == "FINISHED")
        .order_by(Book.updated_at.desc())
        .limit(5)
        .all()
    )

    genre_data = (
        db.query(
            Book.genre,
            func.count(Book.book_id)
        )
        .filter(Book.genre.isnot(None))
        .group_by(Book.genre)
        .order_by(
            func.count(Book.book_id).desc()
        )
        .limit(5)
        .all()
    )

    rating_data = (
        db.query(
            Book.rating,
            func.count(Book.book_id)
        )
        .filter(Book.rating.isnot(None))
        .group_by(Book.rating)
        .order_by(Book.rating)
        .all()
    )

    def book_data(book):
        return {
            "book_id": book.book_id,
            "title": book.title,
            "author": book.author,
            "genre": book.genre,
            "status": book.status,
            "rating": book.rating,
            "cover_image": book.cover_image
        }

    return {
        "recent_books": [
            book_data(book)
            for book in recent_books
        ],

        "currently_reading": [
            book_data(book)
            for book in currently_reading
        ],

        "recently_finished": [
            book_data(book)
            for book in recently_finished
        ],

        "top_genres": [
            {
                "genre": genre,
                "count": count
            }
            for genre, count in genre_data
        ],

        "rating_distribution": [
            {
                "rating": rating,
                "count": count
            }
            for rating, count in rating_data
        ]
    }
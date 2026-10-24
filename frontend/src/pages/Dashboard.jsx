import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getDashboardStats,
  getDashboardOverview,
} from "../api/dashboard";

import AddBook from "./AddBook";
import "./Dashboard.css";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [overview, setOverview] = useState(null);

  const [showAddBook, setShowAddBook] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsResponse, overviewResponse] =
        await Promise.all([
          getDashboardStats(),
          getDashboardOverview(),
        ]);

      setStats(statsResponse.data);
      setOverview(overviewResponse.data);
    } catch (err) {
      console.error("Dashboard error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBookAdded = () => {
    setShowAddBook(false);
    fetchDashboard();
  };

  const openBook = (bookId) => {
    navigate(`/books/${bookId}`);
  };

  const continueReading = (bookId) => {
    navigate(`/books/${bookId}/read`);
  };

  if (loading) {
    return (
      <main className="dashboard-page">
        <h2>Loading dashboard...</h2>
      </main>
    );
  }

  if (error) {
    return (
      <main className="dashboard-page">
        <h2>{error}</h2>
      </main>
    );
  }

  return (
    <main className="dashboard-page">

      {/* HEADER */}

      <div className="dashboard-header">
        <div>
          <span className="eyebrow">
            YOUR READING LIFE
          </span>

          <h1>Dashboard</h1>

          <p>
            A quick look at your reading journey.
          </p>
        </div>

        <button
          className="add-book-btn"
          onClick={() => setShowAddBook(true)}
        >
          + Add Book
        </button>
      </div>


      {/* STATS */}

      <div className="stats-grid">

        <div className="stat-card">
          <span>Total Books</span>
          <strong>{stats.total_books}</strong>
        </div>

        <div className="stat-card">
          <span>Currently Reading</span>
          <strong>{stats.currently_reading}</strong>
        </div>

        <div className="stat-card">
          <span>Finished</span>
          <strong>{stats.finished}</strong>
        </div>

        <div className="stat-card">
          <span>Average Rating</span>
          <strong>
            {stats.average_rating} / 5
          </strong>
        </div>

      </div>


      {/* STATUS + YEAR */}

      <div className="dashboard-grid">

        <div className="dashboard-card">

          <span className="eyebrow">
            READING STATUS
          </span>

          <div className="status-row">
            <span>Want to Read</span>
            <strong>{stats.want_to_read}</strong>
          </div>

          <div className="status-row">
            <span>Currently Reading</span>
            <strong>{stats.currently_reading}</strong>
          </div>

          <div className="status-row">
            <span>Finished</span>
            <strong>{stats.finished}</strong>
          </div>

          <div className="status-row">
            <span>DNF</span>
            <strong>{stats.dnf}</strong>
          </div>

        </div>


        <div className="dashboard-card yearly-card">

          <span className="eyebrow">
            THIS YEAR
          </span>

          <strong>
            {stats.books_read_this_year}
          </strong>

          <p>
            books finished this year
          </p>

        </div>

      </div>


      {/* RECENTLY ADDED + CURRENTLY READING */}

      <div className="dashboard-grid">

        {/* RECENTLY ADDED */}

        <div className="dashboard-card">

          <span className="eyebrow">
            RECENTLY ADDED
          </span>

          {overview.recent_books.length === 0 ? (
            <p className="dashboard-muted">
              No books added yet.
            </p>
          ) : (
            <div className="dashboard-book-list">

              {overview.recent_books.map((book) => (

                <div
                  className="dashboard-book clickable"
                  key={book.book_id}
                  onClick={() =>
                    openBook(book.book_id)
                  }
                >

                  <div>
                    <strong>{book.title}</strong>
                    <span>{book.author}</span>
                  </div>

                  {book.rating && (
                    <b>★ {book.rating}</b>
                  )}

                </div>

              ))}

            </div>
          )}

        </div>


        {/* CURRENTLY READING */}

        <div className="dashboard-card current-reading-card">

          <div className="card-heading-row">

            <span className="eyebrow">
              CURRENTLY READING
            </span>

            {overview.currently_reading.length > 0 && (
              <button
                className="view-library-btn"
                onClick={() =>
                  navigate("/library?status=READING")
                }
              >
                View all
              </button>
            )}

          </div>

          {overview.currently_reading.length === 0 ? (
            <p className="dashboard-muted">
              No books currently being read.
            </p>
          ) : (
            <div className="dashboard-book-list">

              {overview.currently_reading.map((book) => (

                <div
                  className="dashboard-current-book"
                  key={book.book_id}
                >

                  <div
                    className="current-book-info clickable"
                    onClick={() =>
                      openBook(book.book_id)
                    }
                  >
                    <strong>
                      {book.title}
                    </strong>

                    <span>
                      {book.author}
                    </span>

                    {book.rating && (
                      <b>
                        ★ {book.rating}
                      </b>
                    )}
                  </div>

                  <button
                    className="continue-reading-btn"
                    onClick={() =>
                      continueReading(
                        book.book_id
                      )
                    }
                  >
                    Continue Reading
                  </button>

                </div>

              ))}

            </div>
          )}

        </div>

      </div>


      {/* GENRES + FINISHED */}

      <div className="dashboard-grid">

        <div className="dashboard-card">

          <span className="eyebrow">
            TOP GENRES
          </span>

          {overview.top_genres.length === 0 ? (
            <p className="dashboard-muted">
              No genre data available.
            </p>
          ) : (
            overview.top_genres.map((item) => (

              <div
                className="status-row"
                key={item.genre}
              >
                <span>{item.genre}</span>
                <strong>{item.count}</strong>
              </div>

            ))
          )}

        </div>


        <div className="dashboard-card">

          <span className="eyebrow">
            RECENTLY FINISHED
          </span>

          {overview.recently_finished.length === 0 ? (
            <p className="dashboard-muted">
              No finished books yet.
            </p>
          ) : (
            overview.recently_finished.map((book) => (

              <div
                className="dashboard-book clickable"
                key={book.book_id}
                onClick={() =>
                  openBook(book.book_id)
                }
              >

                <div>
                  <strong>{book.title}</strong>
                  <span>{book.author}</span>
                </div>

                {book.rating && (
                  <b>★ {book.rating}</b>
                )}

              </div>

            ))
          )}

        </div>

      </div>


      {/* RATING DISTRIBUTION */}

      <div className="dashboard-card rating-card">

        <span className="eyebrow">
          RATING DISTRIBUTION
        </span>

        {overview.rating_distribution.length === 0 ? (
          <p className="dashboard-muted">
            No ratings available yet.
          </p>
        ) : (
          <div className="rating-list">

            {overview.rating_distribution.map(
              (item) => (

                <div
                  className="rating-row"
                  key={item.rating}
                >

                  <span>
                    {"★".repeat(item.rating)}
                  </span>

                  <div className="rating-bar">
                    <div
                      className="rating-fill"
                      style={{
                        width: `${item.count * 20}%`,
                      }}
                    />
                  </div>

                  <strong>
                    {item.count}
                  </strong>

                </div>

              )
            )}

          </div>
        )}

      </div>


      {/* ADD BOOK */}

      {showAddBook && (
        <AddBook
          onClose={() =>
            setShowAddBook(false)
          }
          onBookAdded={handleBookAdded}
        />
      )}

    </main>
  );
}

export default Dashboard;
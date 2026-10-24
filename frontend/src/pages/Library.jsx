import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getBooks } from "../api/books";
import "./Library.css";

function Library() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentStatus = searchParams.get("status") || "ALL";

  const [filter, setFilter] = useState(currentStatus);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("ALL");
  const [sort, setSort] = useState("RECENT");

  useEffect(() => {
    setFilter(currentStatus);
  }, [currentStatus]);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getBooks();
      setBooks(response.data);
    } catch (err) {
      console.error("Library error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load your books"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);

    if (newFilter === "ALL") {
      setSearchParams({});
    } else {
      setSearchParams({
        status: newFilter,
      });
    }
  };

  // Dynamic genres from books
  const genres = useMemo(() => {
    return [
      ...new Set(
        books
          .map((book) => book.genre)
          .filter(Boolean)
          .map((item) => item.trim())
      ),
    ].sort();
  }, [books]);

  // Search + status + genre + sort
  const filteredBooks = useMemo(() => {
    let result = [...books];

    // Status
    if (filter !== "ALL") {
      result = result.filter(
        (book) => book.status === filter
      );
    }

    // Search
    const searchValue = search.trim().toLowerCase();

    if (searchValue) {
      result = result.filter((book) =>
        `${book.title} ${book.author}`
          .toLowerCase()
          .includes(searchValue)
      );
    }

    // Genre
    if (genre !== "ALL") {
      result = result.filter(
        (book) => book.genre === genre
      );
    }

    // Sort
    if (sort === "TITLE") {
      result.sort((a, b) =>
        a.title.localeCompare(b.title)
      );
    }

    if (sort === "AUTHOR") {
      result.sort((a, b) =>
        a.author.localeCompare(b.author)
      );
    }

    if (sort === "RATING") {
      result.sort(
        (a, b) => (b.rating || 0) - (a.rating || 0)
      );
    }

    if (sort === "RECENT") {
      result.sort(
        (a, b) =>
          new Date(b.created_at) -
          new Date(a.created_at)
      );
    }

    return result;
  }, [books, filter, search, genre, sort]);

  if (loading) {
    return (
      <main className="library-page">
        <h2>Loading your library...</h2>
      </main>
    );
  }

  if (error) {
    return (
      <main className="library-page">
        <h2>{error}</h2>
      </main>
    );
  }

  return (
    <main className="library-page">

      {/* HEADER */}

      <div className="library-header">
        <div>
          <span className="eyebrow">
            YOUR COLLECTION
          </span>

          <h1>My Library</h1>

          <p>
            {filteredBooks.length}{" "}
            {filteredBooks.length === 1
              ? "book"
              : "books"}{" "}
            in your collection
          </p>
        </div>
      </div>


      {/* SEARCH */}

      <div className="library-search-row">

        <div className="library-search">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search by title or author..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <select
          value={genre}
          onChange={(e) =>
            setGenre(e.target.value)
          }
          className="library-select"
        >
          <option value="ALL">
            All Genres
          </option>

          {genres.map((item) => (
            <option
              value={item}
              key={item}
            >
              {item}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) =>
            setSort(e.target.value)
          }
          className="library-select"
        >
          <option value="RECENT">
            Recently Added
          </option>

          <option value="TITLE">
            Title A–Z
          </option>

          <option value="AUTHOR">
            Author A–Z
          </option>

          <option value="RATING">
            Highest Rated
          </option>
        </select>

      </div>


      {/* STATUS FILTERS */}

      <div className="library-filters">

        <button
          className={
            filter === "ALL" ? "active" : ""
          }
          onClick={() =>
            handleFilterChange("ALL")
          }
        >
          All Books
        </button>

        <button
          className={
            filter === "READING"
              ? "active"
              : ""
          }
          onClick={() =>
            handleFilterChange("READING")
          }
        >
          Reading
        </button>

        <button
          className={
            filter === "FINISHED"
              ? "active"
              : ""
          }
          onClick={() =>
            handleFilterChange("FINISHED")
          }
        >
          Finished
        </button>

        <button
          className={
            filter === "WANT_TO_READ"
              ? "active"
              : ""
          }
          onClick={() =>
            handleFilterChange(
              "WANT_TO_READ"
            )
          }
        >
          Want to Read
        </button>

        <button
          className={
            filter === "DNF" ? "active" : ""
          }
          onClick={() =>
            handleFilterChange("DNF")
          }
        >
          DNF
        </button>

      </div>


      {/* BOOKS */}

      {filteredBooks.length === 0 ? (
        <div className="library-empty">

          <h2>No books found.</h2>

          <p>
            Try changing your search or filters.
          </p>

        </div>
      ) : (

        <div className="book-grid">

          {filteredBooks.map((book) => (

            <div
              className="book-card"
              key={book.book_id}
              onClick={() =>
                navigate(
                  `/books/${book.book_id}`
                )
              }
            >

              <div className="book-card-cover">

                {book.cover_image ? (
                  <img
                    src={`${API_URL}/${book.cover_image}`}
                    alt={book.title}
                  />
                ) : (
                  <div className="book-placeholder">
                    <span>
                      {book.title?.charAt(0)}
                    </span>
                  </div>
                )}

              </div>

              <div className="book-card-info">

                <h3>{book.title}</h3>

                <p>{book.author}</p>

                {book.genre && (
                  <small>
                    {book.genre}
                  </small>
                )}

                <div className="book-card-bottom">

                  <span>
                    {book.status.replaceAll(
                      "_",
                      " "
                    )}
                  </span>

                  {book.rating && (
                    <strong>
                      ★ {book.rating}
                    </strong>
                  )}

                </div>

              </div>

            </div>

          ))}

        </div>

      )}

    </main>
  );
}

export default Library;
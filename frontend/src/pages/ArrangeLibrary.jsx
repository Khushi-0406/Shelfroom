import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getBookshelfLayout,
  saveBookshelfArrangement,
  resetBookshelfLayout,
} from "../api/bookshelf";
import "./ArrangeLibrary.css";

// Rich hardcover cloth textures for placeholder books
const HARDCOVER_PALETTES = [
  { bg: "#4a191f", border: "#c99e52", text: "#f9e7c4", emblem: "⚜" },
  { bg: "#16273b", border: "#d4af37", text: "#f7ecc9", emblem: "✦" },
  { bg: "#1d3a2b", border: "#c29b38", text: "#f3e5b8", emblem: "❦" },
  { bg: "#3e2314", border: "#d8a452", text: "#fae8c6", emblem: "◈" },
  { bg: "#2a1c36", border: "#c89d46", text: "#f5e3bf", emblem: "✤" },
  { bg: "#143339", border: "#caa148", text: "#f8eac7", emblem: "❖" },
];

function getBookPalette(bookId, title = "") {
  const charCode = (title || "").charCodeAt(0) || 0;
  const index = (bookId + charCode) % HARDCOVER_PALETTES.length;
  return HARDCOVER_PALETTES[index];
}

function ArrangeLibrary() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  // Shelves state: array of { shelf_number: number, books: Book[] }
  const [shelves, setShelves] = useState([]);
  const [totalShelves, setTotalShelves] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Saving status: 'saved' | 'saving' | 'error'
  const [saveStatus, setSaveStatus] = useState("saved");
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // Drag state
  const [draggedBook, setDraggedBook] = useState(null); // { book, sourceShelf, sourceIndex }
  const [dropTarget, setDropTarget] = useState(null); // { shelfNumber, insertIndex }

  // Hover state for tooltip preview
  const [hoveredBookId, setHoveredBookId] = useState(null);

  // Quick Move Modal (for mobile or click-to-move accessibility)
  const [modalBook, setModalBook] = useState(null);

  // Prevent drag click conflict
  const isDraggingRef = useRef(false);

  // Fetch bookshelf layout on mount
  useEffect(() => {
    fetchLayout(5);
  }, []);

  const fetchLayout = async (count = 5) => {
    try {
      setLoading(true);
      setError("");
      const response = await getBookshelfLayout(count);
      const data = response.data;
      setTotalShelves(data.total_shelves);
      setShelves(data.shelves);
      setSaveStatus("saved");
    } catch (err) {
      console.error("Failed to load bookshelf layout:", err);
      setError(
        err.response?.data?.detail ||
          "Could not load your bookshelf layout. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Total book count across all shelves
  const totalBookCount = useMemo(() => {
    return shelves.reduce((acc, s) => acc + (s.books ? s.books.length : 0), 0);
  }, [shelves]);

  // Persist current arrangement to server
  const persistArrangement = async (currentShelves, targetShelfCount = totalShelves) => {
    try {
      setSaveStatus("saving");
      const items = [];

      currentShelves.forEach((shelf) => {
        (shelf.books || []).forEach((book, idx) => {
          items.push({
            book_id: book.book_id,
            shelf_number: shelf.shelf_number,
            position: idx,
          });
        });
      });

      const payload = {
        total_shelves: targetShelfCount,
        items,
      };

      const response = await saveBookshelfArrangement(payload);
      setShelves(response.data.shelves);
      setTotalShelves(response.data.total_shelves);
      setSaveStatus("saved");
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err) {
      console.error("Failed to save bookshelf arrangement:", err);
      setSaveStatus("error");
    }
  };

  // Add an extra shelf
  const handleAddShelf = () => {
    if (totalShelves >= 15) return;
    const newTotal = totalShelves + 1;
    const newShelves = [
      ...shelves,
      { shelf_number: newTotal, books: [] },
    ];
    setTotalShelves(newTotal);
    setShelves(newShelves);
    persistArrangement(newShelves, newTotal);
  };

  // Remove empty shelf if last one is empty
  const handleRemoveShelf = () => {
    if (totalShelves <= 3) return;
    const lastShelf = shelves.find((s) => s.shelf_number === totalShelves);
    if (lastShelf && lastShelf.books && lastShelf.books.length > 0) {
      alert(`Shelf ${totalShelves} still contains books. Move them first before removing this shelf.`);
      return;
    }
    const newTotal = totalShelves - 1;
    const newShelves = shelves.filter((s) => s.shelf_number <= newTotal);
    setTotalShelves(newTotal);
    setShelves(newShelves);
    persistArrangement(newShelves, newTotal);
  };

  // Auto-distribute all books evenly across shelves
  const handleAutoDistribute = async () => {
    if (!window.confirm("Auto-distribute will evenly balance all your books across the shelves. Continue?")) {
      return;
    }
    try {
      setSaveStatus("saving");
      const response = await resetBookshelfLayout(totalShelves);
      setShelves(response.data.shelves);
      setTotalShelves(response.data.total_shelves);
      setSaveStatus("saved");
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err) {
      console.error("Auto-distribute error:", err);
      setSaveStatus("error");
    }
  };

  // =========================================================
  // DRAG AND DROP HANDLERS
  // =========================================================

  const handleDragStart = (e, book, sourceShelf, sourceIndex) => {
    isDraggingRef.current = true;
    setDraggedBook({ book, sourceShelf, sourceIndex });
    setHoveredBookId(null);

    // Provide clean drag transfer
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(book.book_id));

      // Transparent/default drag image
      try {
        const dragPreview = e.currentTarget.cloneNode(true);
        dragPreview.style.position = "absolute";
        dragPreview.style.top = "-9999px";
        dragPreview.style.opacity = "0.9";
        document.body.appendChild(dragPreview);
        e.dataTransfer.setDragImage(dragPreview, 50, 80);
        setTimeout(() => document.body.removeChild(dragPreview), 0);
      } catch {
        // Fallback to browser standard
      }
    }
  };

  const handleDragEnd = () => {
    setDraggedBook(null);
    setDropTarget(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 150);
  };

  // Drag over empty shelf or general shelf bay
  const handleShelfDragOver = (e, shelfNumber) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }

    if (!draggedBook) return;

    const shelf = shelves.find((s) => s.shelf_number === shelfNumber);
    const booksCount = shelf?.books?.length || 0;

    // If mouse is at the right end of the shelf or shelf is empty
    if (
      !dropTarget ||
      dropTarget.shelfNumber !== shelfNumber ||
      dropTarget.insertIndex === undefined
    ) {
      setDropTarget({
        shelfNumber,
        insertIndex: booksCount,
      });
    }
  };

  // Drag over a specific book on a shelf to determine before/after position
  const handleBookDragOver = (e, targetShelfNumber, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }

    if (!draggedBook) return;

    const targetRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX;
    const middleX = targetRect.left + targetRect.width / 2;

    const insertIndex = mouseX < middleX ? targetIndex : targetIndex + 1;

    setDropTarget({
      shelfNumber: targetShelfNumber,
      insertIndex,
    });
  };

  // Perform the drop and persist immediately
  const handleDrop = (e, targetShelfNumber, targetInsertIndex) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedBook) return;

    const { book, sourceShelf, sourceIndex } = draggedBook;
    const finalInsertIndex = targetInsertIndex !== undefined
      ? targetInsertIndex
      : (dropTarget?.insertIndex ?? 0);

    // Check if dropping at identical spot
    if (sourceShelf === targetShelfNumber) {
      if (sourceIndex === finalInsertIndex || sourceIndex === finalInsertIndex - 1) {
        setDraggedBook(null);
        setDropTarget(null);
        return;
      }
    }

    // Build new updated shelves state
    const nextShelves = shelves.map((shelf) => {
      const copy = { ...shelf, books: [...shelf.books] };

      // Remove from source shelf
      if (shelf.shelf_number === sourceShelf) {
        copy.books = copy.books.filter((b) => b.book_id !== book.book_id);
      }

      return copy;
    });

    // Insert into target shelf
    const targetShelf = nextShelves.find((s) => s.shelf_number === targetShelfNumber);
    if (targetShelf) {
      // Calculate adjusted insert index
      let adjustedIndex = finalInsertIndex;
      if (sourceShelf === targetShelfNumber && sourceIndex < finalInsertIndex) {
        adjustedIndex = Math.max(0, finalInsertIndex - 1);
      }
      adjustedIndex = Math.min(adjustedIndex, targetShelf.books.length);

      const bookWithUpdatedShelf = {
        ...book,
        shelf_number: targetShelfNumber,
        position: adjustedIndex,
      };

      targetShelf.books.splice(adjustedIndex, 0, bookWithUpdatedShelf);
    }

    // Update local state immediately for instant responsive feel
    setShelves(nextShelves);
    setDraggedBook(null);
    setDropTarget(null);

    // Persist to backend PostgreSQL
    persistArrangement(nextShelves);
  };

  // Quick Move from modal (click-to-move accessibility & mobile)
  const handleQuickMoveToShelf = (targetShelfNumber) => {
    if (!modalBook) return;

    const sourceShelfNumber = modalBook.shelf_number;
    if (sourceShelfNumber === targetShelfNumber) {
      setModalBook(null);
      return;
    }

    const nextShelves = shelves.map((shelf) => {
      const copy = { ...shelf, books: [...shelf.books] };
      if (shelf.shelf_number === sourceShelfNumber) {
        copy.books = copy.books.filter((b) => b.book_id !== modalBook.book_id);
      }
      return copy;
    });

    const targetShelf = nextShelves.find((s) => s.shelf_number === targetShelfNumber);
    if (targetShelf) {
      const movedBook = {
        ...modalBook,
        shelf_number: targetShelfNumber,
        position: targetShelf.books.length,
      };
      targetShelf.books.push(movedBook);
    }

    setShelves(nextShelves);
    setModalBook(null);
    persistArrangement(nextShelves);
  };

  // Clicking a book opens quick actions if not dragging
  const handleBookClick = (book) => {
    if (isDraggingRef.current) return;
    setModalBook(book);
  };

  // Render book spine/cover inside shelf
  const renderBookItem = (book, shelfNumber, index) => {
    const isBeingDragged = draggedBook && draggedBook.book.book_id === book.book_id;
    const palette = getBookPalette(book.book_id, book.title);

    const coverSrc = book.cover_image
      ? book.cover_image.startsWith("http")
        ? book.cover_image
        : `${API_URL}/${book.cover_image}`
      : null;

    return (
      <div
        key={book.book_id}
        className={`shelf-book-wrapper ${isBeingDragged ? "is-dragging" : ""}`}
        onDragOver={(e) => handleBookDragOver(e, shelfNumber, index)}
        onDrop={(e) => handleDrop(e, shelfNumber, index)}
      >
        <div
          className="shelf-book-card"
          draggable={true}
          onDragStart={(e) => handleDragStart(e, book, shelfNumber, index)}
          onDragEnd={handleDragEnd}
          onClick={() => handleBookClick(book)}
          onMouseEnter={() => !draggedBook && setHoveredBookId(book.book_id)}
          onMouseLeave={() => setHoveredBookId(null)}
          title={`${book.title} by ${book.author} (Drag to rearrange or click for options)`}
        >
          {/* Top page edging */}
          <div className="book-top-pages" />

          {/* Spine crease shadow on left */}
          <div className="book-spine-crease" />

          {/* Rating star if available */}
          {book.rating && (
            <div className="book-shelf-rating">
              ★ {book.rating}
            </div>
          )}

          {/* Book Surface: either real cover image or cloth hardcover */}
          {coverSrc ? (
            <div className="book-cover-surface">
              <img
                src={coverSrc}
                alt={book.title}
                loading="lazy"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement.innerHTML = `
                    <div style="background:${palette.bg};width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:10px;text-align:center;color:${palette.text};box-sizing:border-box;">
                      <span style="font-size:11px;font-family:Georgia,serif;font-weight:bold;">${book.title}</span>
                      <small style="font-size:9px;opacity:0.8;margin-top:4px;">${book.author}</small>
                    </div>
                  `;
                }}
              />
            </div>
          ) : (
            <div
              className="book-placeholder-surface"
              style={{
                backgroundColor: palette.bg,
                borderColor: palette.border,
              }}
            >
              <div
                className="placeholder-gold-border"
                style={{ borderColor: palette.border }}
              />

              <div className="placeholder-title" style={{ color: palette.text }}>
                {book.title}
              </div>

              <div className="placeholder-emblem" style={{ color: palette.border }}>
                {palette.emblem}
              </div>

              <div className="placeholder-author">
                {book.author}
              </div>
            </div>
          )}

          {/* Ribbon tag on bottom */}
          <div className="book-ribbon-tag" />

          {/* Hover Tooltip Preview */}
          {hoveredBookId === book.book_id && !draggedBook && (
            <div className="book-hover-tooltip">
              <div className="tooltip-title">{book.title}</div>
              <div className="tooltip-author">by {book.author}</div>
              {book.genre && (
                <div style={{ color: "#dce6df", fontSize: "11px", marginBottom: "4px" }}>
                  {book.genre}
                </div>
              )}
              <div className="tooltip-footer">
                <span>{book.status?.replaceAll("_", " ") || "In Library"}</span>
                <span>Click to manage</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="arrange-page">
      {/* HEADER SECTION */}
      <header className="arrange-header">
        <div className="arrange-header-top">
          <div className="arrange-header-text">
            <span className="eyebrow">VIRTUAL BOOKSHELF</span>
            <h1>Arrange Library</h1>
            <p>
              Drag and drop your books across the wooden shelves to organize your personal
              collection exactly the way you want it. Your custom arrangement is automatically saved.
            </p>
          </div>

          {/* TOOLBAR CONTROLS */}
          <div className="arrange-actions">
            {/* Save Status Badge */}
            <div className={`save-status-pill ${saveStatus}`}>
              <span className="status-dot" />
              {saveStatus === "saved" && (
                <span>
                  All changes saved {lastSavedTime ? `at ${lastSavedTime}` : "✓"}
                </span>
              )}
              {saveStatus === "saving" && <span>Saving arrangement...</span>}
              {saveStatus === "error" && <span>Save failed - retrying</span>}
            </div>

            {/* Add Shelf Button */}
            <button
              className="btn-shelf-action"
              onClick={handleAddShelf}
              disabled={totalShelves >= 15}
              title="Add a new empty shelf to the bookcase"
            >
              <span>+</span> Add Shelf
            </button>

            {/* Remove Shelf Button (if empty) */}
            <button
              className="btn-shelf-action"
              onClick={handleRemoveShelf}
              disabled={totalShelves <= 3}
              title="Remove the bottom shelf if empty"
            >
              <span>−</span> Remove Shelf
            </button>

            {/* Auto Distribute Button */}
            <button
              className="btn-shelf-action"
              onClick={handleAutoDistribute}
              title="Evenly distribute books alphabetically across shelves"
            >
              <span>⇅</span> Auto-Distribute
            </button>
          </div>
        </div>

        {/* STATS & HINT BAR */}
        <div className="arrange-stats-bar">
          <div className="stats-item">
            <strong>{totalBookCount}</strong> books organized across{" "}
            <strong>{totalShelves}</strong> shelves
          </div>
          <div className="arrange-hint">
            <span>💡</span>
            <span>
              Tip: Drag books horizontally on a shelf or move them to any other shelf. Click any book for quick actions.
            </span>
          </div>
        </div>
      </header>

      {/* ERROR BANNER IF ANY */}
      {error && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #f87171",
            padding: "14px 20px",
            borderRadius: "8px",
            color: "#991b1b",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{error}</span>
          <button
            onClick={() => fetchLayout(totalShelves)}
            style={{
              background: "#991b1b",
              color: "white",
              border: "none",
              padding: "6px 14px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* LOADING STATE */}
      {loading ? (
        <div
          style={{
            padding: "80px 20px",
            textAlign: "center",
            color: "#777064",
            background: "rgba(255,255,255,0.4)",
            borderRadius: "12px",
          }}
        >
          <div style={{ fontSize: "36px", marginBottom: "14px" }}>📚</div>
          <h3 style={{ fontFamily: "Georgia, serif", color: "#203c32", fontSize: "22px" }}>
            Assembling your library bookshelf...
          </h3>
          <p style={{ fontSize: "14px", marginTop: "6px" }}>
            Placing your books on their designated wooden shelves.
          </p>
        </div>
      ) : (
        /* REALISTIC WOODEN BOOKCASE CABINET */
        <div className="bookcase-container">
          {/* Top Crown Molding Cornice with Brass Plate */}
          <div className="bookcase-top-cornice">
            <div className="brass-nameplate">Shelfroom Collection</div>
          </div>

          {/* Main Bookcase Body with Side Wood Stiles */}
          <div className="bookcase-body">
            {/* Left Vertical Wood Side */}
            <div className="bookcase-side-left" />

            {/* Horizontal Shelves Stack */}
            <div className="bookcase-shelves-stack">
              {shelves.map((shelf) => {
                const shelfNumber = shelf.shelf_number;
                const shelfBooks = shelf.books || [];
                const isTargetShelf =
                  dropTarget && dropTarget.shelfNumber === shelfNumber;
                const targetInsertIndex = isTargetShelf
                  ? dropTarget.insertIndex
                  : null;

                return (
                  <div key={shelfNumber} className="shelf-row">
                    {/* Shelf Header Tag */}
                    <div className="shelf-header">
                      <div className="shelf-tag">
                        <span>Shelf {shelfNumber}</span>
                      </div>
                      <div className="shelf-book-count">
                        {shelfBooks.length} {shelfBooks.length === 1 ? "book" : "books"}
                      </div>
                    </div>

                    {/* Books Drop Bay */}
                    <div
                      className={`shelf-books-bay ${
                        isTargetShelf ? "drag-over-shelf" : ""
                      }`}
                      onDragOver={(e) => handleShelfDragOver(e, shelfNumber)}
                      onDrop={(e) => handleDrop(e, shelfNumber, targetInsertIndex)}
                    >
                      {shelfBooks.length === 0 && !isTargetShelf ? (
                        <div
                          className="empty-shelf-message"
                          onDragOver={(e) => handleShelfDragOver(e, shelfNumber)}
                          onDrop={(e) => handleDrop(e, shelfNumber, 0)}
                        >
                          <span>Empty Shelf</span>
                          <span>•</span>
                          <span>Drag and drop books here</span>
                        </div>
                      ) : (
                        shelfBooks.map((book, index) => {
                          const showPlaceholderBefore =
                            isTargetShelf &&
                            draggedBook &&
                            targetInsertIndex === index;

                          return (
                            <div
                              key={`wrap-${book.book_id}`}
                              style={{ display: "contents" }}
                            >
                              {/* Drop placeholder before this book */}
                              {showPlaceholderBefore && (
                                <div className="drop-placeholder-slot">
                                  <span>⇩</span>
                                  <span>Drop here</span>
                                </div>
                              )}

                              {renderBookItem(book, shelfNumber, index)}
                            </div>
                          );
                        })
                      )}

                      {/* Drop placeholder at the end of the shelf */}
                      {isTargetShelf &&
                        draggedBook &&
                        targetInsertIndex >= shelfBooks.length && (
                          <div className="drop-placeholder-slot">
                            <span>⇩</span>
                            <span>Drop at end</span>
                          </div>
                        )}
                    </div>

                    {/* Heavy Solid Wooden Shelf Plank */}
                    <div className="shelf-wooden-plank" />
                  </div>
                );
              })}
            </div>

            {/* Right Vertical Wood Side */}
            <div className="bookcase-side-right" />
          </div>

          {/* Bottom Plinth / Skirting */}
          <div className="bookcase-bottom-plinth" />
        </div>
      )}

      {/* QUICK ACTIONS MODAL (ACCESSIBILITY & MOBILE) */}
      {modalBook && (
        <div
          className="quick-move-modal-overlay"
          onClick={() => setModalBook(null)}
        >
          <div
            className="quick-move-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="quick-move-header">
              <h3>Book Options</h3>
              <button
                className="btn-close-modal"
                onClick={() => setModalBook(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="quick-move-body">
              <div className="quick-move-book-preview">
                {modalBook.cover_image ? (
                  <img
                    src={
                      modalBook.cover_image.startsWith("http")
                        ? modalBook.cover_image
                        : `${API_URL}/${modalBook.cover_image}`
                    }
                    alt={modalBook.title}
                    className="modal-book-thumb"
                  />
                ) : (
                  <div className="modal-book-thumb-placeholder">
                    {modalBook.title?.charAt(0) || "B"}
                  </div>
                )}
                <div className="modal-book-info">
                  <h4>{modalBook.title}</h4>
                  <p>by {modalBook.author}</p>
                  <small style={{ color: "#8c600f", marginTop: "4px", display: "block" }}>
                    Currently on Shelf {modalBook.shelf_number}
                  </small>
                </div>
              </div>

              <label className="shelf-picker-label">
                Move directly to shelf:
              </label>

              <div className="shelf-buttons-grid">
                {shelves.map((s) => (
                  <button
                    key={s.shelf_number}
                    className={`btn-shelf-target ${
                      s.shelf_number === modalBook.shelf_number ? "current" : ""
                    }`}
                    onClick={() => handleQuickMoveToShelf(s.shelf_number)}
                  >
                    <span>Shelf {s.shelf_number}</span>
                    <small>
                      {s.shelf_number === modalBook.shelf_number
                        ? "(Current)"
                        : `${s.books.length} books`}
                    </small>
                  </button>
                ))}
              </div>

              <div className="quick-move-actions">
                <button
                  className="btn-shelf-action"
                  onClick={() => {
                    navigate(`/books/${modalBook.book_id}`);
                  }}
                >
                  View Book Details
                </button>

                <button
                  className="btn-shelf-action primary"
                  onClick={() => setModalBook(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArrangeLibrary;

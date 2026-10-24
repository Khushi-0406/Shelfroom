import { useEffect, useState } from "react";

import {
  getShelves,
  createShelf,
  getBookShelves,
  addBookToShelf,
  removeBookFromShelf,
  updateShelf,
  deleteShelf,
} from "../api/shelves";

import "./Shelves.css";

function Shelves({ bookId }) {
  const [shelves, setShelves] = useState([]);
  const [bookShelves, setBookShelves] = useState([]);

  const [newShelf, setNewShelf] = useState("");
  const [editing, setEditing] = useState(false);
  const [editingShelfId, setEditingShelfId] = useState(null);
  const [editingName, setEditingName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchShelves();
  }, [bookId]);

  const fetchShelves = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        shelvesResponse,
        bookShelvesResponse,
      ] = await Promise.all([
        getShelves(),
        getBookShelves(bookId),
      ]);

      setShelves(shelvesResponse.data);
      setBookShelves(bookShelvesResponse.data);
    } catch (err) {
      console.error("Get shelves error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load shelves"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShelf = async (e) => {
    e.preventDefault();

    const name = newShelf.trim();

    if (!name) {
      setError("Please enter a shelf name");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await createShelf(name);

      const shelf = response.data;

      setShelves((prev) => [...prev, shelf]);

      await addBookToShelf(
        shelf.shelf_id,
        bookId
      );

      setBookShelves((prev) => [
        ...prev,
        shelf,
      ]);

      setNewShelf("");
    } catch (err) {
      console.error("Create shelf error:", err);

      setError(
        err.response?.data?.detail ||
          "Failed to create shelf"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAddShelf = async (shelf) => {
    const exists = bookShelves.some(
      (item) =>
        item.shelf_id === shelf.shelf_id
    );

    if (exists) {
      return;
    }

    try {
      setError("");

      await addBookToShelf(
        shelf.shelf_id,
        bookId
      );

      setBookShelves((prev) => [
        ...prev,
        shelf,
      ]);
    } catch (err) {
      console.error("Add shelf error:", err);

      setError(
        err.response?.data?.detail ||
          "Failed to add shelf"
      );
    }
  };

  const handleRemoveShelf = async (shelfId) => {
    try {
      setError("");

      await removeBookFromShelf(
        shelfId,
        bookId
      );

      setBookShelves((prev) =>
        prev.filter(
          (shelf) =>
            shelf.shelf_id !== shelfId
        )
      );
    } catch (err) {
      console.error(
        "Remove shelf error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Failed to remove shelf"
      );
    }
  };

  const handleStartEdit = (shelf) => {
    setEditingShelfId(shelf.shelf_id);
    setEditingName(shelf.name);
    setError("");
  };

  const handleCancelEdit = () => {
    setEditingShelfId(null);
    setEditingName("");
    setError("");
  };

  const handleUpdateShelf = async (shelfId) => {
    const name = editingName.trim();

    if (!name) {
      setError("Shelf name cannot be empty");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await updateShelf(
        shelfId,
        { name }
      );

      const updatedShelf = response.data;

      setShelves((prev) =>
        prev.map((shelf) =>
          shelf.shelf_id === shelfId
            ? updatedShelf
            : shelf
        )
      );

      setBookShelves((prev) =>
        prev.map((shelf) =>
          shelf.shelf_id === shelfId
            ? updatedShelf
            : shelf
        )
      );

      handleCancelEdit();
    } catch (err) {
      console.error(
        "Update shelf error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Failed to update shelf"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteShelf = async (shelfId) => {
    const confirmed = window.confirm(
      "Delete this shelf?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await deleteShelf(shelfId);

      setShelves((prev) =>
        prev.filter(
          (shelf) =>
            shelf.shelf_id !== shelfId
        )
      );

      setBookShelves((prev) =>
        prev.filter(
          (shelf) =>
            shelf.shelf_id !== shelfId
        )
      );
    } catch (err) {
      console.error(
        "Delete shelf error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Failed to delete shelf"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="shelves-section">
        <span className="eyebrow">
          SHELVES
        </span>

        <p>Loading shelves...</p>
      </section>
    );
  }

  return (
    <section className="shelves-section">

      <div className="shelves-header">
        <div>
          <span className="eyebrow">
            ORGANIZE
          </span>

          <h2>Shelves</h2>
        </div>

        <div className="shelves-header-right">
          <span className="shelf-count">
            {bookShelves.length}
          </span>

          <button
            type="button"
            className="shelves-edit-btn"
            onClick={() => {
              setEditing((prev) => !prev);
              setEditingShelfId(null);
              setError("");
            }}
          >
            {editing ? "Done" : "Edit"}
          </button>
        </div>
      </div>


      {/* CURRENT BOOK SHELVES */}

      {bookShelves.length > 0 ? (
        <div className="book-shelves">

          {bookShelves.map((shelf) => {

            if (
              editing &&
              editingShelfId === shelf.shelf_id
            ) {
              return (
                <div
                  className="shelf-edit-row"
                  key={shelf.shelf_id}
                >
                  <input
                    value={editingName}
                    onChange={(e) =>
                      setEditingName(
                        e.target.value
                      )
                    }
                    autoFocus
                  />

                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateShelf(
                        shelf.shelf_id
                      )
                    }
                    disabled={saving}
                  >
                    Save
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              );
            }

            return (
              <div
                className="book-shelf"
                key={shelf.shelf_id}
              >
                <span>{shelf.name}</span>

                {editing && (
                  <div className="shelf-actions">
                    <button
                      type="button"
                      onClick={() =>
                        handleStartEdit(shelf)
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteShelf(
                          shelf.shelf_id
                        )
                      }
                      disabled={saving}
                    >
                      Delete
                    </button>

                    <button
                      type="button"
                      className="remove-shelf-btn"
                      onClick={() =>
                        handleRemoveShelf(
                          shelf.shelf_id
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            );
          })}

        </div>
      ) : (
        <p className="shelves-empty">
          This book isn't on any shelf yet.
        </p>
      )}


      {/* EDIT MODE */}

      {editing && (
        <>
          <form
            className="shelf-create-form"
            onSubmit={handleCreateShelf}
          >
            <input
              type="text"
              placeholder="Create a new shelf..."
              value={newShelf}
              onChange={(e) => {
                setNewShelf(e.target.value);
                setError("");
              }}
              maxLength="100"
            />

            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Adding..."
                : "Add Shelf"}
            </button>
          </form>


          {shelves.length > 0 && (
            <div className="available-shelves">

              <span className="eyebrow">
                AVAILABLE SHELVES
              </span>

              <div className="available-shelf-list">

                {shelves.map((shelf) => {
                  const added =
                    bookShelves.some(
                      (item) =>
                        item.shelf_id ===
                        shelf.shelf_id
                    );

                  return (
                    <button
                      type="button"
                      key={shelf.shelf_id}
                      className={
                        added
                          ? "available-shelf added"
                          : "available-shelf"
                      }
                      disabled={added}
                      onClick={() =>
                        handleAddShelf(shelf)
                      }
                    >
                      {added
                        ? `✓ ${shelf.name}`
                        : `+ ${shelf.name}`}
                    </button>
                  );
                })}

              </div>

            </div>
          )}
        </>
      )}


      {error && (
        <p className="form-error">
          {error}
        </p>
      )}

    </section>
  );
}

export default Shelves;
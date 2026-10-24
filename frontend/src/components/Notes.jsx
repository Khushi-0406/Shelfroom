import { useEffect, useState } from "react";

import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  getBookQuotes,
  createQuote,
  deleteQuote,
} from "../api/notes";

import "./Notes.css";

function Notes({ bookId }) {
  const [note, setNote] = useState(null);
  const [quotes, setQuotes] = useState([]);

  const [newQuote, setNewQuote] = useState("");

  const [form, setForm] = useState({
    review: "",
    personal_thoughts: "",
    favorite_character: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingQuote, setAddingQuote] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, [bookId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [notesResponse, quotesResponse] = await Promise.all([
        getNotes(bookId),
        getBookQuotes(bookId),
      ]);

      const notes = notesResponse.data;

      if (notes.length > 0) {
        setNote(notes[0]);

        setForm({
          review: notes[0].review || "",
          personal_thoughts: notes[0].personal_thoughts || "",
          favorite_character: notes[0].favorite_character || "",
        });
      }

      setQuotes(quotesResponse.data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          "Unable to load notes"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      let response;

      if (note) {
        response = await updateNote(
          note.note_id,
          form
        );
      } else {
        response = await createNote({
          book_id: bookId,
          ...form,
        });
      }

      setNote(response.data);

      setForm({
        review: response.data.review || "",
        personal_thoughts:
          response.data.personal_thoughts || "",
        favorite_character:
          response.data.favorite_character || "",
      });

      setEditing(false);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to save notes"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!note) return;

    if (!window.confirm("Delete these notes?")) {
      return;
    }

    try {
      await deleteNote(note.note_id);

      setNote(null);

      setForm({
        review: "",
        personal_thoughts: "",
        favorite_character: "",
      });

      setEditing(false);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to delete notes"
      );
    }
  };

  const handleAddQuote = async (e) => {
    e.preventDefault();

    const quoteText = newQuote.trim();

    if (!quoteText) return;

    try {
      setAddingQuote(true);
      setError("");

      const response = await createQuote(
        bookId,
        quoteText
      );

      setQuotes((prev) => [
        ...prev,
        response.data,
      ]);

      setNewQuote("");
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to add quote"
      );
    } finally {
      setAddingQuote(false);
    }
  };

  const handleDeleteQuote = async (quoteId) => {
    try {
      setError("");

      await deleteQuote(quoteId);

      setQuotes((prev) =>
        prev.filter(
          (quote) =>
            quote.quote_id !== quoteId
        )
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to delete quote"
      );
    }
  };

  const handleEdit = () => {
    setError("");
    setEditing(true);
  };

  const handleCancel = () => {
    if (note) {
      setForm({
        review: note.review || "",
        personal_thoughts:
          note.personal_thoughts || "",
        favorite_character:
          note.favorite_character || "",
      });
    }

    setNewQuote("");
    setError("");
    setEditing(false);
  };

  if (loading) {
    return (
      <section className="notes-section">
        <span className="eyebrow">MY NOTES</span>
        <p>Loading notes...</p>
      </section>
    );
  }

  return (
    <section className="notes-section">

      {/* HEADER */}

      <div className="notes-header">
        <div>
          <span className="eyebrow">
            PERSONAL SPACE
          </span>

          <h2>My Notes</h2>
        </div>

        {!editing && note && (
          <button
            className="edit-notes-btn"
            onClick={handleEdit}
          >
            Edit
          </button>
        )}
      </div>


      {/* EDIT MODE */}

      {editing ? (
        <form
          className="notes-form"
          onSubmit={handleSave}
        >

          <label>
            My Review

            <textarea
              name="review"
              value={form.review}
              onChange={handleChange}
              rows="4"
            />
          </label>


          <label>
            Personal Thoughts

            <textarea
              name="personal_thoughts"
              value={form.personal_thoughts}
              onChange={handleChange}
              rows="4"
            />
          </label>


          <label>
            Favorite Character

            <input
              name="favorite_character"
              value={form.favorite_character}
              onChange={handleChange}
            />
          </label>


          {/* FAVORITE QUOTES */}

          <div className="favorite-quotes">

            <span className="eyebrow">
              FAVORITE QUOTES
            </span>

            {quotes.length > 0 && (
              <div className="quotes-list">

                {quotes.map((quote) => (
                  <div
                    className="quote-item"
                    key={quote.quote_id}
                  >
                    <p>
                      “{quote.quote}”
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteQuote(
                          quote.quote_id
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}

              </div>
            )}

            <div className="quote-form">

              <textarea
                placeholder="Add a favorite quote..."
                value={newQuote}
                onChange={(e) =>
                  setNewQuote(e.target.value)
                }
                rows="3"
              />

              <button
                type="button"
                disabled={addingQuote}
                onClick={handleAddQuote}
              >
                {addingQuote
                  ? "Adding..."
                  : "+ Add Quote"}
              </button>

            </div>

          </div>


          {error && (
            <p className="form-error">
              {error}
            </p>
          )}


          <div className="notes-actions">

            <button
              type="button"
              onClick={handleCancel}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save Notes"}
            </button>

          </div>


          {note && (
            <button
              type="button"
              className="delete-notes-btn"
              onClick={handleDelete}
            >
              Delete Notes
            </button>
          )}

        </form>
      ) : (

        /* VIEW MODE */

        <div className="notes-content">

          {note ? (
            <>
              {note.review && (
                <div>
                  <span className="eyebrow">
                    MY REVIEW
                  </span>

                  <p>{note.review}</p>
                </div>
              )}


              {note.personal_thoughts && (
                <div>
                  <span className="eyebrow">
                    PERSONAL THOUGHTS
                  </span>

                  <p>
                    {note.personal_thoughts}
                  </p>
                </div>
              )}


              {note.favorite_character && (
                <div>
                  <span className="eyebrow">
                    FAVORITE CHARACTER
                  </span>

                  <p>
                    {note.favorite_character}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="notes-empty">
              <p>
                No notes added for this book yet.
              </p>

              <button
                className="add-notes-btn"
                onClick={() => setEditing(true)}
              >
                Add Notes
              </button>
            </div>
          )}


          {/* QUOTES - VIEW ONLY */}

          {quotes.length > 0 && (
            <div className="favorite-quotes">

              <span className="eyebrow">
                FAVORITE QUOTES
              </span>

              <div className="quotes-list">

                {quotes.map((quote) => (
                  <div
                    className="quote-item"
                    key={quote.quote_id}
                  >
                    <p>
                      “{quote.quote}”
                    </p>
                  </div>
                ))}

              </div>

            </div>
          )}

        </div>
      )}

    </section>
  );
}

export default Notes;
import { useState } from "react";
import { createBook } from "../api/books";
import "./AddBook.css";

function AddBook({ onClose, onBookAdded }) {
  const [form, setForm] = useState({
    title: "",
    author: "",
    genre: "",
    status: "WANT_TO_READ",
    rating: "",
    review: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const data = {
        ...form,
        rating: form.rating ? Number(form.rating) : null,
      };

      const response = await createBook(data);

      onBookAdded(response.data);
      onClose();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || "Failed to add book"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="book-modal">

        <div className="modal-header">
          <div>
            <span className="eyebrow">YOUR LIBRARY</span>
            <h2>Add a book</h2>
          </div>

          <button onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>

          <label>
            Book Title
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Author
            <input
              name="author"
              value={form.author}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Genre
            <input
              name="genre"
              value={form.genre}
              onChange={handleChange}
            />
          </label>

          <label>
            Reading Status
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option value="WANT_TO_READ">
                Want to Read
              </option>

              <option value="READING">
                Currently Reading
              </option>

              <option value="FINISHED">
                Finished
              </option>

              <option value="DNF">
                DNF
              </option>
            </select>
          </label>

          <label>
            Rating
            <input
              type="number"
              name="rating"
              min="1"
              max="5"
              value={form.rating}
              onChange={handleChange}
            />
          </label>

          <label>
            Review
            <textarea
              name="review"
              value={form.review}
              onChange={handleChange}
              rows="4"
            />
          </label>

          {error && (
            <p className="form-error">
              {error}
            </p>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-btn"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-btn"
              disabled={loading}
            >
              {loading ? "Saving..." : "Add Book"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default AddBook;
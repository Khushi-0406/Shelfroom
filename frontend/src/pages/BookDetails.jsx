import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";


import {
  getBookById,
  updateBook,
  deleteBook,
  uploadCover,
  uploadPdf,
} from "../api/books";

import Characters from "../components/Characters";
import Tags from "../components/Tags";
import "./BookDetails.css";
import Notes from "../components/Notes";
import ReadingProgress from "../components/ReadingProgress";
import Shelves from "../components/Shelves";

function BookDetails() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const [form, setForm] = useState({
    title: "",
    author: "",
    genre: "",
    status: "",
    rating: "",
    review: "",
  });

  useEffect(() => {
    fetchBook();
  }, [bookId]);

  const fetchBook = async () => {
    try {
      const response = await getBookById(bookId);

      setBook(response.data);
      setForm(response.data);
    } catch (err) {
      console.error(err);
      setError("Unable to load book");
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

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const data = {
        ...form,
        rating: form.rating ? Number(form.rating) : null,
      };

      const response = await updateBook(bookId, data);

      setBook(response.data);
      setForm(response.data);
      setEditing(false);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to update book"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this book?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteBook(bookId);
      navigate("/library");
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to delete book"
      );
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    try {
      setUploading(true);
      setError("");

      await uploadCover(bookId, file);

      const response = await getBookById(bookId);
      setBook(response.data);
    } catch (err) {
      console.error("Cover upload error:", err);

      setError(
        err.response?.data?.detail ||
          "Failed to upload cover"
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    try {
      setUploadingPdf(true);
      setError("");

      await uploadPdf(bookId, file);

      const response = await getBookById(bookId);
      setBook(response.data);
    } catch (err) {
      console.error("PDF upload error:", err);

      setError(
        err.response?.data?.detail ||
          "Failed to upload PDF"
      );
    } finally {
      setUploadingPdf(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <main className="book-details">
        Loading...
      </main>
    );
  }

  if (error && !book) {
    return (
      <main className="book-details">
        {error}
      </main>
    );
  }

  return (
    <main className="book-details">

      <button
        className="back-button"
        onClick={() => navigate("/library")}
      >
        ← Back to library
      </button>

      {editing ? (

        <div className="edit-book-form">

          <div className="details-header">
            <span className="eyebrow">
              EDIT BOOK
            </span>

            <h1>Edit Book</h1>
          </div>

          <form onSubmit={handleUpdate}>

            <label>
              Book Title

              <input
                name="title"
                value={form.title || ""}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Author

              <input
                name="author"
                value={form.author || ""}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Genre

              <input
                name="genre"
                value={form.genre || ""}
                onChange={handleChange}
              />
            </label>

            <label>
              Reading Status

              <select
                name="status"
                value={form.status || ""}
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
                value={form.rating ?? ""}
                onChange={handleChange}
              />
            </label>

            <label>
              Review

              <textarea
                name="review"
                value={form.review || ""}
                onChange={handleChange}
                rows="5"
              />
            </label>

            {error && (
              <p className="form-error">
                {error}
              </p>
            )}

            <div className="edit-actions">

              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setForm(book);
                  setEditing(false);
                  setError("");
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-btn"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

            </div>

          </form>

        </div>

      ) : (

        <>

          <section className="book-details-content">

            <div className="details-cover">

              {book.cover_image ? (

                <img
                 src={`${API_URL}/${book.cover_image}`}
                  alt={book.title}
                />

              ) : (

                <div className="details-placeholder">
                  {book.title?.charAt(0)}
                </div>

              )}

              <label className="cover-upload-btn">

                {uploading
                  ? "Uploading..."
                  : "Change Cover"}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploading}
                  hidden
                />

              </label>

            </div>


            <div className="details-info">

              <span className="eyebrow">
                {book.genre || "BOOK"}
              </span>

              <h1>{book.title}</h1>

              <h3>{book.author}</h3>


              <div className="details-meta">

                <span>
                  {book.status?.replaceAll(
                    "_",
                    " "
                  )}
                </span>

                {book.rating && (
                  <strong>
                    ★ {book.rating}/5
                  </strong>
                )}

              </div>


              {book.review && (

                <div className="details-section">

                  <span className="eyebrow">
                    MY REVIEW
                  </span>

                  <p>{book.review}</p>

                </div>

              )}


              <div className="book-actions">

                <button
                  className="edit-btn"
                  onClick={() =>
                    setEditing(true)
                  }
                >
                  Edit Book
                </button>

                <button
                  className="delete-btn"
                  onClick={handleDelete}
                >
                  Delete
                </button>

              </div>


              <div className="pdf-section">

                <span className="eyebrow">
                  DIGITAL COPY
                </span>

                {book.pdf_path ? (

                  <div className="pdf-actions">

                    <span>
                      PDF available
                    </span>

                    <button
                      className="read-btn"
                      onClick={() =>
                        navigate(
                          `/books/${bookId}/read`
                        )
                      }
                    >
                      Read Book
                    </button>

                  </div>

                ) : (

                  <label className="pdf-upload-btn">

                    {uploadingPdf
                      ? "Uploading..."
                      : "Upload PDF"}

                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfUpload}
                      disabled={uploadingPdf}
                      hidden
                    />

                  </label>

                )}

              </div>

            </div>

          </section>


          <Characters bookId={bookId} />

          <Notes bookId={bookId} />

          <Tags bookId={bookId} />

          <ReadingProgress bookId={bookId} />

          <Shelves bookId={bookId} />

        </>

      )}

    </main>
  );
}

export default BookDetails;
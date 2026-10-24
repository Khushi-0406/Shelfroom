import { useEffect, useState } from "react";
import {
  getReadingProgress,
  createReadingProgress,
  updateReadingProgress,
} from "../api/reading";

import "./ReadingProgress.css";

function ReadingProgress({ bookId }) {
  const [progress, setProgress] = useState(null);
  const [currentPage, setCurrentPage] = useState("");
  const [totalPages, setTotalPages] = useState("");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProgress();
  }, [bookId]);

  const fetchProgress = async () => {
    try {
      const response = await getReadingProgress(bookId);

      if (response.data.length > 0) {
        const data = response.data[0];

        setProgress(data);
        setCurrentPage(data.current_page);
        setTotalPages(data.total_pages);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load reading progress");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!currentPage || !totalPages) {
      setError("Please enter page details");
      return;
    }

    if (Number(currentPage) > Number(totalPages)) {
      setError("Current page cannot exceed total pages");
      return;
    }

    try {
      setSaving(true);
      setError("");

      let response;

      if (progress) {
        response = await updateReadingProgress(
          progress.progress_id,
          {
            current_page: Number(currentPage),
            total_pages: Number(totalPages),
          }
        );
      } else {
        response = await createReadingProgress({
          book_id: Number(bookId),
          current_page: Number(currentPage),
          total_pages: Number(totalPages),
        });
      }

      setProgress(response.data);
      setEditing(false);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to save reading progress"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="reading-progress-section">
      <div className="reading-progress-header">
        <div>
          <span className="eyebrow">READING</span>
          <h2>Reading Progress</h2>
        </div>

        {progress && !editing && (
          <button
            className="edit-progress-btn"
            onClick={() => setEditing(true)}
          >
            Update
          </button>
        )}
      </div>

      {!progress && !editing ? (
        <div className="progress-empty">
          <p>No reading progress added yet.</p>

          <button
            className="add-progress-btn"
            onClick={() => setEditing(true)}
          >
            + Add Progress
          </button>
        </div>
      ) : editing ? (
        <form
          className="progress-form"
          onSubmit={handleSave}
        >
          <label>
            Current Page
            <input
              type="number"
              min="0"
              value={currentPage}
              onChange={(e) =>
                setCurrentPage(e.target.value)
              }
            />
          </label>

          <label>
            Total Pages
            <input
              type="number"
              min="1"
              value={totalPages}
              onChange={(e) =>
                setTotalPages(e.target.value)
              }
            />
          </label>

          {error && (
            <p className="form-error">{error}</p>
          )}

          <div className="progress-actions">
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError("");
              }}
            >
              Cancel
            </button>

            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Progress"}
            </button>
          </div>
        </form>
      ) : (
        <div className="progress-content">
          <div className="progress-info">
            <strong>
              Page {progress.current_page}
            </strong>

            <span>
              of {progress.total_pages}
            </span>

            <strong>
              {progress.progress_percentage}%
            </strong>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${progress.progress_percentage}%`,
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}

export default ReadingProgress;
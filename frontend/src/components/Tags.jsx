import { useEffect, useState } from "react";

import {
  getTags,
  getBookTags,
  createTag,
  addTagToBook,
  removeTagFromBook,
} from "../api/tags";

import "./Tags.css";

function Tags({ bookId }) {
  const [tags, setTags] = useState([]);
  const [bookTags, setBookTags] = useState([]);

  const [newTag, setNewTag] = useState("");

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTags();
  }, [bookId]);

  const fetchTags = async () => {
    try {
      setLoading(true);
      setError("");

      const [tagsResponse, bookTagsResponse] =
        await Promise.all([
          getTags(),
          getBookTags(bookId),
        ]);

      setTags(tagsResponse.data);
      setBookTags(bookTagsResponse.data);
    } catch (err) {
      console.error("Get tags error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load tags"
      );
    } finally {
      setLoading(false);
    }
  };

  const refreshBookTags = async () => {
    const response = await getBookTags(bookId);
    setBookTags(response.data);
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();

    const tagName = newTag.trim();

    if (!tagName) return;

    try {
      setSaving(true);
      setError("");

      const cleanTagName = tagName
        .replace(/^#/, "")
        .trim();

      if (!cleanTagName) return;

      let createdTag;

      try {
        const response = await createTag(
          cleanTagName
        );

        createdTag = response.data;

        setTags((prev) => [
          ...prev,
          createdTag,
        ]);
      } catch (err) {
        if (
          err.response?.status === 400 &&
          err.response?.data?.detail ===
            "Tag already exists"
        ) {
          const refreshed =
            await getTags();

          setTags(refreshed.data);

          createdTag =
            refreshed.data.find(
              (tag) =>
                tag.name.toLowerCase() ===
                cleanTagName.toLowerCase()
            );
        } else {
          throw err;
        }
      }

      if (!createdTag) {
        throw new Error(
          "Unable to find tag"
        );
      }

      const alreadyAdded =
        bookTags.some(
          (tag) =>
            tag.tag_id ===
            createdTag.tag_id
        );

      if (!alreadyAdded) {
        await addTagToBook(
          createdTag.tag_id,
          bookId
        );
      }

      await refreshBookTags();

      setNewTag("");
    } catch (err) {
      console.error(
        "Create/add tag error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to add tag"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAddExistingTag = async (tag) => {
    const alreadyAdded =
      bookTags.some(
        (bookTag) =>
          bookTag.tag_id ===
          tag.tag_id
      );

    if (alreadyAdded) return;

    try {
      setSaving(true);
      setError("");

      await addTagToBook(
        tag.tag_id,
        bookId
      );

      await refreshBookTags();
    } catch (err) {
      console.error(
        "Add tag error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Failed to add tag"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTag = async (
    tagId
  ) => {
    try {
      setSaving(true);
      setError("");

      await removeTagFromBook(
        tagId,
        bookId
      );

      await refreshBookTags();
    } catch (err) {
      console.error(
        "Remove tag error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Failed to remove tag"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setNewTag("");
    setError("");
  };

  if (loading) {
    return (
      <section className="tags-section">
        <span className="eyebrow">
          TAGS
        </span>

        <p>Loading tags...</p>
      </section>
    );
  }

  return (
    <section className="tags-section">

      {/* HEADER */}

      <div className="tags-header">

        <div>
          <span className="eyebrow">
            ORGANIZE
          </span>

          <h2>Tags</h2>
        </div>

        <div className="tags-header-right">

          <span className="tag-count">
            {bookTags.length}
          </span>

          {!editing && (
            <button
              type="button"
              className="edit-tags-btn"
              onClick={() =>
                setEditing(true)
              }
            >
              Edit
            </button>
          )}

        </div>

      </div>


      {/* ASSIGNED TAGS */}

      {bookTags.length > 0 ? (

        <div className="book-tags">

          {bookTags.map((tag) => (

            <div
              className="book-tag"
              key={tag.tag_id}
            >

              <span>
                #
                {tag.name.replace(
                  /^#/,
                  ""
                )}
              </span>

              {editing && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    handleRemoveTag(
                      tag.tag_id
                    )
                  }
                >
                  ×
                </button>
              )}

            </div>

          ))}

        </div>

      ) : (

        <p className="tags-empty">
          No tags added yet.
        </p>

      )}


      {/* EDIT MODE */}

      {editing && (

        <>

          {/* CREATE TAG */}

          <form
            className="tag-create-form"
            onSubmit={
              handleCreateTag
            }
          >

            <input
              type="text"
              placeholder="Create a new tag..."
              value={newTag}
              onChange={(e) =>
                setNewTag(e.target.value)
              }
              maxLength={100}
              disabled={saving}
            />

            <button
              type="submit"
              disabled={
                saving ||
                !newTag.trim()
              }
            >
              {saving
                ? "Adding..."
                : "Add Tag"}
            </button>

          </form>


          {/* AVAILABLE TAGS */}

          {tags.length > 0 && (

            <div className="available-tags">

              <span className="eyebrow">
                AVAILABLE TAGS
              </span>

              <div className="available-tag-list">

                {tags.map((tag) => {

                  const added =
                    bookTags.some(
                      (bookTag) =>
                        bookTag.tag_id ===
                        tag.tag_id
                    );

                  return (
                    <button
                      type="button"
                      key={tag.tag_id}
                      className={
                        added
                          ? "available-tag added"
                          : "available-tag"
                      }
                      disabled={
                        added ||
                        saving
                      }
                      onClick={() =>
                        handleAddExistingTag(
                          tag
                        )
                      }
                    >
                      #
                      {tag.name.replace(
                        /^#/,
                        ""
                      )}
                    </button>
                  );
                })}

              </div>

            </div>

          )}


          <div className="tags-edit-actions">

            <button
              type="button"
              className="tags-cancel-btn"
              onClick={handleCancel}
            >
              Done
            </button>

          </div>

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

export default Tags;
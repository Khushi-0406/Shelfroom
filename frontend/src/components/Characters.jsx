import { useEffect, useState } from "react";

import {
  getCharacters,
  createCharacter,
  updateCharacter,
  deleteCharacter,
} from "../api/characters";

import "./Characters.css";

function Characters({ bookId }) {
  const [characters, setCharacters] = useState([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editing, setEditing] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCharacters();
  }, [bookId]);

  const fetchCharacters = async () => {
    try {
      setError("");

      const response = await getCharacters(bookId);

      setCharacters(response.data);
    } catch (err) {
      console.error("Get characters error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load characters"
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) return;

    try {
      setLoading(true);
      setError("");

      const data = {
        name: name.trim(),
        description: description.trim() || null,
      };

      if (editingId) {
        const response = await updateCharacter(
          editingId,
          data
        );

        setCharacters((prev) =>
          prev.map((character) =>
            character.character_id === editingId
              ? response.data
              : character
          )
        );
      } else {
        const response = await createCharacter(
          bookId,
          data
        );

        setCharacters((prev) => [
          ...prev,
          response.data,
        ]);
      }

      resetForm();
    } catch (err) {
      console.error("Save character error:", err);

      setError(
        err.response?.data?.detail ||
          "Failed to save character"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (character) => {
    setEditing(true);
    setEditingId(character.character_id);

    setName(character.name || "");
    setDescription(character.description || "");
  };

  const handleDelete = async (characterId) => {
    const confirmed = window.confirm(
      "Delete this character?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await deleteCharacter(characterId);

      setCharacters((prev) =>
        prev.filter(
          (character) =>
            character.character_id !== characterId
        )
      );

      if (editingId === characterId) {
        resetForm();
      }
    } catch (err) {
      console.error("Delete character error:", err);

      setError(
        err.response?.data?.detail ||
          "Failed to delete character"
      );
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
  };

  const handleCancel = () => {
    resetForm();
    setEditing(false);
    setError("");
  };

  return (
    <section className="characters-section">

      {/* HEADER */}

      <div className="characters-header">

        <div>
          <span className="eyebrow">
            THE PEOPLE
          </span>

          <h2>Characters</h2>
        </div>

        <div className="characters-header-right">

          <span className="character-count">
            {characters.length}
          </span>

          {!editing && (
            <button
              type="button"
              className="edit-characters-btn"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
          )}

        </div>

      </div>


      {/* EDIT MODE */}

      {editing && (
        <form
          className="character-form"
          onSubmit={handleSubmit}
        >

          <input
            type="text"
            placeholder="Character name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            required
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            rows="3"
          />

          <div className="character-form-actions">

            <button
              type="submit"
              className="character-save"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : editingId
                ? "Update Character"
                : "Add Character"}
            </button>

            <button
              type="button"
              className="character-cancel"
              onClick={handleCancel}
            >
              Cancel
            </button>

          </div>

        </form>
      )}


      {error && (
        <p className="form-error">
          {error}
        </p>
      )}


      {/* CHARACTER LIST */}

      <div className="characters-list">

        {characters.length === 0 ? (

          <p className="characters-empty">
            No characters added yet.
          </p>

        ) : (

          characters.map((character) => (

            <div
              className="character-card"
              key={character.character_id}
            >

              <div className="character-avatar">
                {character.name
                  ?.charAt(0)
                  ?.toUpperCase()}
              </div>


              <div className="character-info">

                <h3>
                  {character.name}
                </h3>

                {character.description && (
                  <p>
                    {character.description}
                  </p>
                )}

              </div>


              {/* ACTIONS ONLY IN EDIT MODE */}

              {editing && (
                <div className="character-actions">

                  <button
                    type="button"
                    onClick={() =>
                      handleEdit(character)
                    }
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(
                        character.character_id
                      )
                    }
                  >
                    Delete
                  </button>

                </div>
              )}

            </div>

          ))

        )}

      </div>

    </section>
  );
}

export default Characters;
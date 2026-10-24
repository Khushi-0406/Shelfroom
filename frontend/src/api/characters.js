import api from "./api";

export const getCharacters = (bookId) => {
  return api.get(`/characters/?book_id=${bookId}`);
};

export const createCharacter = (bookId, data) => {
  return api.post("/characters/", {
    book_id: Number(bookId),
    name: data.name,
    description: data.description,
  });
};

export const updateCharacter = (characterId, data) => {
  return api.put(`/characters/${characterId}`, {
    name: data.name,
    description: data.description,
  });
};

export const deleteCharacter = (characterId) => {
  return api.delete(`/characters/${characterId}`);
};
import api from "./api";

export const getShelves = () => {
  return api.get("/shelves/");
};

export const getShelf = (shelfId) => {
  return api.get(`/shelves/${shelfId}`);
};

export const createShelf = (name, description = null) => {
  return api.post("/shelves/", {
    name,
    description,
  });
};

export const updateShelf = (shelfId, data) => {
  return api.put(`/shelves/${shelfId}`, data);
};

export const deleteShelf = (shelfId) => {
  return api.delete(`/shelves/${shelfId}`);
};

export const getBookShelves = (bookId) => {
  return api.get(`/shelves/book/${bookId}`);
};

export const addBookToShelf = (shelfId, bookId) => {
  return api.post(
    `/shelves/${shelfId}/books/${bookId}`
  );
};

export const removeBookFromShelf = (
  shelfId,
  bookId
) => {
  return api.delete(
    `/shelves/${shelfId}/books/${bookId}`
  );
};
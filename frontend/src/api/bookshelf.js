import api from "./api";

export const getBookshelfLayout = (shelves = 5) => {
  return api.get(`/bookshelf/?shelves=${shelves}`);
};

export const saveBookshelfArrangement = (payload) => {
  return api.put("/bookshelf/arrangement", payload);
};

export const moveBookshelfBook = (bookId, payload) => {
  return api.put(`/bookshelf/books/${bookId}`, payload);
};

export const resetBookshelfLayout = (shelves = 5) => {
  return api.post(`/bookshelf/reset?shelves=${shelves}`);
};

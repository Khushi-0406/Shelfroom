import api from "./api";

export const getNotes = (bookId) => {
  return api.get(`/notes/?book_id=${bookId}`);
};

export const createNote = (data) => {
  return api.post("/notes/", data);
};

export const updateNote = (noteId, data) => {
  return api.put(`/notes/${noteId}`, data);
};

export const deleteNote = (noteId) => {
  return api.delete(`/notes/${noteId}`);
};

// Favorite Quotes

export const getBookQuotes = (bookId) => {
  return api.get(`/notes/quotes/book/${bookId}`);
};

export const createQuote = (bookId, quote) => {
  return api.post("/notes/quotes/", {
    book_id: bookId,
    quote,
  });
};

export const deleteQuote = (quoteId) => {
  return api.delete(`/notes/quotes/${quoteId}`);
};
import api from "./api";

export const getBooks = (params = {}) => {
  return api.get("/books/", { params });
};

export const getBookById = (bookId) => {
  return api.get(`/books/${bookId}`);
};

export const createBook = (bookData) => {
  return api.post("/books/", bookData);
};

export const updateBook = (bookId, bookData) => {
  return api.put(`/books/${bookId}`, bookData);
};

export const deleteBook = (bookId) => {
  return api.delete(`/books/${bookId}`);
};

export const uploadCover = (bookId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post(`/books/${bookId}/cover`, formData);
};

export const uploadPdf = (bookId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post(`/books/${bookId}/pdf`, formData);
};

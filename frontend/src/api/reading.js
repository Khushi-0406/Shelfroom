import api from "./api";

export const getReadingProgress = (bookId) => {
  return api.get(`/reading/?book_id=${bookId}`);
};

export const createReadingProgress = (data) => {
  return api.post("/reading/", data);
};

export const updateReadingProgress = (progressId, data) => {
  return api.put(`/reading/${progressId}`, data);
};
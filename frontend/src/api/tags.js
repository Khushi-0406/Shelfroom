import api from "./api";

export const getTags = () => {
  return api.get("/tags/");
};

export const getBookTags = (bookId) => {
  return api.get(`/tags/book/${bookId}`);
};

export const createTag = (name) => {
  return api.post("/tags/", {
    name,
  });
};

export const addTagToBook = (tagId, bookId) => {
  return api.post(
    `/tags/${tagId}/books/${bookId}`
  );
};

export const removeTagFromBook = (
  tagId,
  bookId
) => {
  return api.delete(
    `/tags/${tagId}/books/${bookId}`
  );
};
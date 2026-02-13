// utils/normalize.js
export const normalizeInput = (input) =>
  input
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

// lib/api.js

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const authorizedFetch = async (url, token, options = {}) => {
  console.log("Fetching from:", `${API_URL}${url}`);
  return fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
};
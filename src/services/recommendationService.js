import axios from 'axios';

// The URL of your Python Flask backend — uses environment variable in production
const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000/api';

/**
 * Fetches movie recommendations from the backend API.
 * @param {string[]} movieIds - An array of movie IDs from the user's watch history.
 * @returns {Promise<any>} The recommendation data from the API.
 */
export const getRecommendations = (movieIds) => {
  console.log("Sending movie IDs to backend:", movieIds);
  return axios.post(`${API_URL}/recommend`, {
    movie_ids: movieIds,
  }, { timeout: 15000 }); // 15s timeout for cold starts
};

/**
 * Fetches trending movies from the backend (for cold-start users).
 * @returns {Promise<any>} The trending movie IDs.
 */
export const getTrending = () => {
  return axios.get(`${API_URL}/trending`, { timeout: 15000 });
};

/**
 * Fetches movie trailer data from the backend (proxied from TMDB).
 * @param {string|number} movieId - The TMDB movie ID.
 * @returns {Promise<any>} The trailer video data.
 */
export const getTrailers = (movieId) => {
  return axios.get(`${API_URL}/trailers/${movieId}`, { timeout: 8000 });
};

/**
 * Checks if the backend API is healthy.
 * @returns {Promise<any>} Health status.
 */
export const checkHealth = () => {
  return axios.get(`${API_URL}/health`, { timeout: 5000 });
};
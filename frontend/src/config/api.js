// API Configuration
const getBackendURL = () => {
  return process.env.REACT_APP_BACKEND_URL || window.location.origin;
};

export const API_URL = getBackendURL();

export default {
  API_URL,
  BACKEND_URL: API_URL
};

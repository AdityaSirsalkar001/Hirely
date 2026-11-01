// src/utils/axiosInstance.js
import axios from "axios";

const configuredBaseURL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000/api/v1";

const resolveBaseURL = () => {
  if (typeof window === "undefined") {
    return configuredBaseURL;
  }

  try {
    const url = new URL(configuredBaseURL);
    const pageHost = window.location.hostname;
    if (
      (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
      (pageHost === "localhost" || pageHost === "127.0.0.1")
    ) {
      url.hostname = pageHost;
    }
    return `${url.origin}${url.pathname.replace(/\/$/, "")}`;
  } catch {
    return configuredBaseURL;
  }
};

const axiosInstance = axios.create({
  // Keep frontend and API on the same hostname so browser cookies are sent
  // consistently when the app is opened through localhost or 127.0.0.1.
  baseURL: resolveBaseURL(),
  withCredentials: true,
});

// Add request interceptor for logging
axiosInstance.interceptors.request.use(
  (config) => {
    // console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(
      `API Response [${
        response.status
      }]: ${response.config.method.toUpperCase()} ${response.config.url}`
    );
    return response;
  },
  (error) => {
    if (error.response) {
      const logError = error.response.status >= 500 ? console.error : console.warn;
      logError(
        `API Error [${
          error.response.status
        }]: ${error.config.method.toUpperCase()} ${error.config.url}`,
      );
    } else {
      console.warn(`API request failed: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

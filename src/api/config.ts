import axios from "axios";

export const API_BASE_URL = "https://analyz.khanetalaa.ir";

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.timeout = 30000;
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_id");
      localStorage.removeItem("phoneNumber");
      localStorage.removeItem("firstName");
      localStorage.removeItem("lastName");
      window.location.href = "/login";
    }

    if (!error.response) {
      console.error("Network error:", error.message);
    }

    return Promise.reject(error);
  }
);

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
  },
  UPLOADS: {
    UPLOAD_EXCELS: "/uploads/uploadExcels",
    PROCESS_FILES: "/uploads/processFiles",
    GET_FILE: (id: string) => `/uploads/file/${id}`,
    DELETE_FILE: (id: string) => `/uploads/file/${id}`,
    PROCESS_FILES_AGAIN: (id: string) => `/uploads/processFilesAgain/${id}`,
    UPLOAD_STATUS_HISTORY: "/uploadStatus/history",
    UPLOAD_STATUS_HISTORY_ITEM: (id: string) => `/uploadStatus/history/${id}`,
  },
  ADMIN: {
    USERS: "/admin/users",
    USER: (id: string) => `/admin/users/${id}`,
    TOGGLE_STATUS: (id: string) => `/admin/users/${id}/toggle-status`,
  },
  USER: {
    CREATE: "/user",
    GET_ALL: "/user",
    GET_BY_ID: (id: string) => `/user/${id}`,
    UPDATE: (id: string) => `/user/${id}`,
    DELETE: (id: string) => `/user/${id}`,
  },
} as const;

import { toast } from "@/hooks/use-toast";
import axios from "axios";

const apiUrl = import.meta.env.VITE_API_BASE_URL;

const http = axios.create({
  baseURL: apiUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
http.interceptors.request.use(
  function (config) {
    // Read latest token from localStorage on each request
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // FormData: let axios set Content-Type with boundary
    // Otherwise default to application/json if missing
    if (config.data instanceof FormData) {
      // Drop Content-Type so axios sets multipart boundary
      delete config.headers["Content-Type"];
    } else if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }
    
    return config;
  },
  function (error) {
    // Handle request error
    return Promise.reject(error);
  },
);

// Response interceptor
http.interceptors.response.use(
  function (response) {
    // Any 2xx status runs this handler
    return response;
  },
  function (error) {
    if (!error.config?.skipErrorToast) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "An unknown error occurred",
        variant: "destructive",
      });
    }
    return Promise.reject(error);
  },
);

export default http;

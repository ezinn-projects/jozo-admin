import { toast } from "@/hooks/use-toast";
import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

const http = axios.create({
  baseURL: apiUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Thêm một bộ đón chặn request
http.interceptors.request.use(
  function (config) {
    // Lấy token mới nhất từ localStorage mỗi khi gửi request
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  function (error) {
    // Làm gì đó với lỗi request
    return Promise.reject(error);
  }
);

// Thêm một bộ đón chặn response
http.interceptors.response.use(
  function (response) {
    // Bất kì mã trạng thái nào nằm trong tầm 2xx đều khiến hàm này được trigger
    // Làm gì đó với dữ liệu response
    return response;
  },
  function (error) {
    // Bất kì mã trạng thái nào lọt ra ngoài tầm 2xx đều khiến hàm này được trigger\
    // Làm gì đó với lỗi response
    toast({
      title: "Error",
      description: error.response?.data?.message || "An unknown error occurred",
      variant: "destructive",
    });
    return Promise.reject(error);
  }
);

export default http;

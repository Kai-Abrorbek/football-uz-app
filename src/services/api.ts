import axios from "axios";
import { API_URL } from "../constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import EventEmitter from "eventemitter3";

export const apiErrorEmitter = new EventEmitter();

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터 (토큰 자동 추가)
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // 로그아웃 처리
    } else {
      const msg = error.response?.data?.message || error.message;
      apiErrorEmitter.emit("error", msg);
    }
    return Promise.reject(error);
  },
);

export default api;

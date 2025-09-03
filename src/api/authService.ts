import axios from "axios";
import { API_ENDPOINTS } from "./config";
import type { LoginRequest, LoginResponse, User } from "./types";

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await axios.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
  return response.data;
}

export async function logout(): Promise<void> {
  await axios.post(API_ENDPOINTS.AUTH.LOGOUT);
}

export async function getCurrentUser(): Promise<User> {
  const response = await axios.get(API_ENDPOINTS.AUTH.ME);
  return response.data;
}

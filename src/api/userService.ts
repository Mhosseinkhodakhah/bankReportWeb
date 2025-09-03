import axios from "axios";
import { API_ENDPOINTS } from "./config";
import type { User, CreateUserRequest, UpdateUserRequest } from "./types";

interface ApiUserResponse {
  success: boolean;
  message: string;
  user?: User & { _id?: string };
  data?: User & { _id?: string };
  timestamp: string;
}

interface ApiUsersResponse {
  success: boolean;
  message: string;
  users?: (User & { _id?: string })[];
  data?: (User & { _id?: string })[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

interface ApiUpdateResponse {
  success: boolean;
  message: string;
  user?: User & { _id?: string };
  data?: User & { _id?: string };
  timestamp: string;
}

function transformUser(user: User & { _id?: string }): User {
  if (!user) {
    throw new Error("User data is undefined or null");
  }

  return {
    id: user._id || user.id || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    phoneNumber: user.phoneNumber || "",
    role: user.role || "admin",
    isActive: user.isActive !== undefined ? user.isActive : true,
    createdAt: user.createdAt,
  };
}

export async function createUser(userData: CreateUserRequest): Promise<User> {
  try {
    const response = await axios.post<ApiUserResponse>(
      API_ENDPOINTS.USER.CREATE,
      userData
    );

    const userResponseData = response.data.user || response.data.data;

    if (!userResponseData) {
      throw new Error("No user data received from server");
    }

    return transformUser(userResponseData);
  } catch (error) {
    console.error("Error in createUser:", error);
    throw error;
  }
}

export async function getAllUsers(
  page = 1,
  limit = 10
): Promise<{
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const response = await axios.get<ApiUsersResponse>(
    API_ENDPOINTS.USER.GET_ALL,
    {
      params: { page, limit },
    }
  );

  const usersData = response.data.users || response.data.data || [];
  const pagination = response.data.pagination || {
    page,
    limit,
    total: usersData.length,
    totalPages: 1,
  };

  return {
    users: usersData.map(transformUser),
    pagination,
  };
}

export async function getUserById(id: string): Promise<User> {
  const response = await axios.get<ApiUserResponse>(
    API_ENDPOINTS.USER.GET_BY_ID(id)
  );
  const userData = response.data.user || response.data.data;
  if (!userData) {
    throw new Error("No user data received from server");
  }
  return transformUser(userData);
}

export async function updateUser(
  id: string,
  userData: UpdateUserRequest
): Promise<User> {
  try {
    const response = await axios.patch<ApiUpdateResponse>(
      API_ENDPOINTS.USER.UPDATE(id),
      userData
    );

    const userResponseData = response.data.user || response.data.data;

    if (userResponseData) {
      return transformUser(userResponseData);
    } else if (response.data.success) {
      return await getUserById(id);
    } else {
      throw new Error("Update operation failed");
    }
  } catch (error) {
    console.error("Error in updateUser:", error);
    throw error;
  }
}

export async function deleteUser(id: string): Promise<void> {
  await axios.delete(API_ENDPOINTS.USER.DELETE(id));
}

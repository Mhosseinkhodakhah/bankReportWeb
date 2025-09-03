export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

export interface UploadedFile {
  path: string;
  originalName: string;
  savedAs: string;
  size: number;
  uploader: string;
  type: "userExcel" | "adminExcel";
  uploadedAt: string;
  version: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: UploadedFile[];
  timestamp: string;
}

export interface CombinedUploadResponse {
  success: boolean;
  message: string;
  data: {
    version: string;
    userFiles?: UploadedFile[]; // حسابداری (accounting) files
    adminFiles?: UploadedFile[]; // بانک (bank) files
  };
  timestamp: string;
}

export interface ProcessFilesRequest {
  version: string;
}

export interface ProcessFilesResponse {
  success: boolean;
  message: string;
  data: {
    uploadStatusId: string;
  };
  timestamp: string;
}

export interface ProcessStatusResponse {
  success: boolean;
  message: string;
  data: {
    status: "processing" | "finished" | "failed";
    progress?: number;
    downloadUrl?: string;
    error?: string;
    generatedFileId?: string;
  };
  timestamp: string;
}

export interface FileHistoryItem {
  id: string;
  fileName: string;
  originalName: string;
  uploadDate: string;
  status: "processing" | "finished" | "failed";
  version: string;
  uploader: string;
  size: number;
  type: "userExcel" | "adminExcel";
  downloadUrl?: string;
  generatedFileId?: string;
}

export interface FileHistoryResponse {
  success: boolean;
  message: string;
  data: FileHistoryItem[];
  timestamp: string;
}

export interface DownloadFileResponse {
  success: boolean;
  message: string;
  data: {
    downloadUrl: string;
    fileName: string;
  };
  timestamp: string;
}

export interface UploadStatusHistoryItemResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    status: string;
    resultFiles: Array<{
      _id: string;
      fileName: string;
    }>;
    userUploads: Array<{
      _id: string;
      savedAs: string;
    }>;
    adminUploads: Array<{
      _id: string;
      savedAs: string;
    }>;
    createdAt: string;
  };
  timestamp: string;
}

export interface FileInfo {
  id: string;
  filename: string;
  size: number;
  uploadDate: string;
  version: string;
}

export type UserRole = "admin" | "superAdmin";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  password: string;
  role: UserRole;
  isActive: boolean;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UsersResponse {
  success: boolean;
  message: string;
  data: User[];
  timestamp: string;
}

export interface UserResponse {
  success: boolean;
  message: string;
  data: User;
  timestamp: string;
}

export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    token: string;
    role: UserRole;
  };
  timestamp: string;
}

export interface AuthUser {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  token: string;
}

import axios from "axios";
import { API_ENDPOINTS } from "./config";
import type {
  ProcessFilesResponse,
  ProcessStatusResponse,
  FileHistoryResponse,
  FileInfo,
  UploadStatusHistoryItemResponse,
  CombinedUploadResponse,
} from "./types";

export async function uploadExcels(
  accountingFiles: File[],
  bankFiles: File[],
  bankType: string
): Promise<CombinedUploadResponse> {
  if (!accountingFiles.length && !bankFiles.length) {
    throw new Error("No files selected");
  }

  if (!bankType) {
    throw new Error("Bank type is required");
  }

  const formData = new FormData();
  accountingFiles.forEach((file) => {
    formData.append("userFiles", file); // API expects "userFiles" for حسابداری files
  });
  bankFiles.forEach((file) => {
    formData.append("adminFiles", file); // API expects "adminFiles" for بانک files
  });

  formData.append("bankType", bankType);

  const response = await axios.post<CombinedUploadResponse>(
    API_ENDPOINTS.UPLOADS.UPLOAD_EXCELS,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}

export async function processFiles(
  version: string,
  bankType: string
): Promise<ProcessFilesResponse> {
  if (!bankType) {
    throw new Error("Bank type is required");
  }

  const requestBody = {
    version,
    bankType,
  };

  const response = await axios.post<ProcessFilesResponse>(
    API_ENDPOINTS.UPLOADS.PROCESS_FILES,
    requestBody
  );
  return response.data;
}

export async function getFileById(id: string): Promise<FileInfo> {
  const response = await axios.get<FileInfo>(
    API_ENDPOINTS.UPLOADS.GET_FILE(id)
  );
  return response.data;
}

export async function deleteFileById(
  id: string
): Promise<{ success: boolean }> {
  const response = await axios.delete<{ success: boolean }>(
    API_ENDPOINTS.UPLOADS.DELETE_FILE(id)
  );
  return response.data;
}

export async function processFilesAgain(
  id: string
): Promise<ProcessFilesResponse> {
  const response = await axios.post<ProcessFilesResponse>(
    API_ENDPOINTS.UPLOADS.PROCESS_FILES_AGAIN(id)
  );
  return response.data;
}

export async function getUploadStatusHistory(
  skip?: string,
  limit?: string,
  options?: { signal?: AbortSignal }
): Promise<FileHistoryResponse> {
  const params: Record<string, string> = {};
  if (skip) params.skip = skip;
  if (limit) params.limit = limit;
  const response = await axios.get<FileHistoryResponse>(
    API_ENDPOINTS.UPLOADS.UPLOAD_STATUS_HISTORY,
    { params, signal: options?.signal }
  );
  return response.data;
}

export async function getUploadStatusHistoryItem(
  id: string
): Promise<UploadStatusHistoryItemResponse> {
  const response = await axios.get<UploadStatusHistoryItemResponse>(
    API_ENDPOINTS.UPLOADS.UPLOAD_STATUS_HISTORY_ITEM(id)
  );
  return response.data;
}

export async function generateExcel(
  bankId: string,
  accountingId: string
): Promise<{ downloadUrl: string }> {
  const response = await axios.post("/generate-excel", {
    bankId,
    accountingId,
  });

  return response.data;
}

export async function getProcessStatus(
  statusId: string
): Promise<ProcessStatusResponse> {
  const response = await axios.get<ProcessStatusResponse>(
    API_ENDPOINTS.UPLOADS.UPLOAD_STATUS_HISTORY_ITEM(statusId)
  );
  return response.data;
}

export async function getFileHistory(): Promise<FileHistoryResponse> {
  const response = await axios.get<FileHistoryResponse>(
    API_ENDPOINTS.UPLOADS.UPLOAD_STATUS_HISTORY
  );
  return response.data;
}

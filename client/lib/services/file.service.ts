import axios from "../config/axios";

// Get server base URL from environment variables
const SERVER_BASE_URL =
  process.env.NEXT_PUBLIC_SERVER_BASE_URL || "http://localhost:5000";

export interface UploadedFile {
  name: string;
  path: string;
  relativePath?: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
  _id?: string;
}

export interface UploadProgressCallback {
  (progress: number): void;
}

interface UploadResponse {
  success: boolean;
  count: number;
  data: UploadedFile[];
}

import { Case } from "@/lib/types/case.types";

interface AssociateFilesResponse {
  success: boolean;
  data: Case;
}

interface RemoveFileResponse {
  success: boolean;
  data: Case;
}

const FileService = {
  /**
   * Upload files to the server with progress tracking
   * @param files - Array of files to upload
   * @param onProgress - Optional callback for tracking upload progress
   * @returns Promise with upload response
   */
  async uploadFiles(
    files: any[],
    onProgress?: UploadProgressCallback,
    token?: string,
    folderStructure?: any,
    caseId?: string
  ): Promise<UploadResponse> {
    try {
      if (onProgress) {
        onProgress(0);
      }

      const formData = new FormData();

      files.forEach((file: any) => {
        formData.append("files", file);
        if (file.relativePath || file.webkitRelativePath) {
          const relativePath = file.relativePath || file.webkitRelativePath;
          const relativePathStr = typeof relativePath === 'string' ? relativePath : relativePath.toString();
          formData.append(`relativePath_${file.name}`, relativePathStr);
          
          if (relativePathStr.includes('/')) {
            const folderPath = relativePathStr.substring(0, relativePathStr.lastIndexOf('/'));
            formData.append(`folderPath_${file.name}`, folderPath);
          }
        }
      });
      
      if (folderStructure) {
        formData.append('folderStructure', JSON.stringify(folderStructure));
      }
      
      if (caseId) {
        formData.append('caseId', caseId);
      }

      const response = await axios.post("/files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: "Bearer " + token,
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 90) / progressEvent.total
            );
            onProgress(Math.min(percentCompleted, 90));
          }
        },
      });

      if (onProgress) {
        onProgress(100);
      }

      return response.data;
    } catch (error) {
      console.error("Error uploading files:", error);
      throw error;
    }
  },

  /**
   * Associate uploaded files with a case
   * @param caseId - ID of the case to associate files with
   * @param files - Array of file data to associate
   * @returns Promise with case data including files
   */
  async associateFilesWithCase(
    caseId: string,
    files: UploadedFile[],
    token: string,
    folderStructure?: any
  ): Promise<AssociateFilesResponse> {
    try {
      const response = await axios.post(
        `/files/associate/${caseId}`,
        {
          fileIds: files.map(file => file._id),
          files: files,
          folderStructure,
        },
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error associating files with case ${caseId}:`, error);
      throw error;
    }
  },

  /**
   * Remove a file from a case
   * @param caseId - ID of the case containing the file
   * @param fileId - ID of the file to remove
   * @returns Promise with updated case data
   */
  async removeFileFromCase(
    caseId: string,
    fileId: string
  ): Promise<RemoveFileResponse> {
    try {
      const response = await axios.delete(`/files/remove/${caseId}/${fileId}`);
      return response.data;
    } catch (error) {
      console.error(
        `Error removing file ${fileId} from case ${caseId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Get a complete URL for accessing a file
   * @param filePath - The relative path of the file stored in the database
   * @returns Complete URL to access the file
   */
  getFileUrl(filePath: string): string {
    if (!filePath) return "";

    if (filePath.startsWith("http")) {
      return filePath;
    }

    const normalizedPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
    return `${SERVER_BASE_URL}${normalizedPath}`;
  },

  /**
   * Open a file in a new browser tab
   * @param filePath - The relative path of the file to open
   */
  openFileInNewTab(filePath: string): void {
    const url = this.getFileUrl(filePath);
    if (url) {
      window.open(url, "_blank");
    }
  },
};

export default FileService;

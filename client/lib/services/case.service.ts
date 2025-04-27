import axios from "../config/axios";
import {
  CaseFormData,
  CaseListResponse,
  CaseResponse,
  CaseFilters,
} from "@/lib/types/case.types";

const CaseService = {
  /**
   * Get cases with optional filtering and pagination
   */
  async getCases(filters: CaseFilters = {}): Promise<CaseListResponse> {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, String(value));
        }
      });

      const response = await axios.get(`/cases?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching cases:", error);
      throw error;
    }
  },

  /**
   * Get a single case by ID
   */
  async getCase(id: string): Promise<CaseResponse> {
    try {
      const response = await axios.get(`/cases/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching case ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new case with patient information
   */
  async createCase(caseData: CaseFormData): Promise<CaseResponse> {
    try {
      const response = await axios.post("/cases", caseData);
      return response.data;
    } catch (error) {
      console.error("Error creating case:", error);
      throw error;
    }
  },

  /**
   * Update an existing case
   */
  async updateCase(
    id: string,
    caseData: Partial<CaseFormData>
  ): Promise<CaseResponse> {
    try {
      const response = await axios.put(`/cases/${id}`, caseData);
      return response.data;
    } catch (error) {
      console.error(`Error updating case ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a case
   */
  async deleteCase(id: string): Promise<{ success: boolean }> {
    try {
      const response = await axios.delete(`/cases/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting case ${id}:`, error);
      throw error;
    }
  },

  /**
   * Upload files to a case
   */
  async uploadFiles(id: string, files: File[]): Promise<CaseResponse> {
    try {
      const formData = new FormData();

      files.forEach((file) => {
        formData.append(`files`, file);
      });

      const response = await axios.put(`/cases/${id}/files`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      console.error(`Error uploading files to case ${id}:`, error);
      throw error;
    }
  },
};

export default CaseService;

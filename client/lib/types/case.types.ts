export interface Case {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  patientId: string;
  gender: 'male' | 'female' | 'other';
  birthDate: Date;
  status: 'In Process' | 'Cancelled' | 'Completed';
  files: CaseFile[];
  user: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  fullName?: string;
}

export interface CaseFile {
  _id: string;
  name: string;
  path: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
}

export interface CaseListResponse {
  success: boolean;
  count: number;
  pagination: {
    total: number;
    current: number;
    next?: { page: number; limit: number };
    prev?: { page: number; limit: number };
  };
  data: Case[];
}

export interface CaseResponse {
  success: boolean;
  data: Case;
}

export interface CaseFormData {
  firstName: string;
  middleName?: string;
  lastName: string;
  patientId: string;
  gender: 'male' | 'female' | 'other';
  status: 'In Process' | 'Cancelled' | 'Completed';
  birthDate: Date;
  notes?: string;
}

export interface CaseFilters {
  status?: 'All' | 'In Process' | 'Cancelled' | 'Completed';
  startDate?: string;
  endDate?: string;
  firstName?: string;
  lastName?: string;
  patientId?: string;
  gender?: 'male' | 'female' | 'other';
  page?: number;
  limit?: number;
  sort?: string;
}

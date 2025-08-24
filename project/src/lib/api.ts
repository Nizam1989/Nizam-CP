// API service layer for manufacturing system
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7071/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'operator' | 'inspector' | 'manager' | 'engineer' | 'admin' | 'super_admin';
  status: 'pending' | 'approved' | 'rejected' | 'active';
  permissions?: Record<string, string[]>;
  created_at: string;
}

export interface Job {
  id: string;
  jobNumber: string;
  title: string;
  productType: string;
  status: 'draft' | 'in_progress' | 'completed' | 'on_hold';
  currentStage: string;
  totalStages: number;
  createdBy: string;
  assignedTo: string | null;
  startedAt: string | null;
  completedAt: string | null;
  holdReason: string | null;
  createdAt: string;
  updatedAt: string;
  progress?: {
    completed: number;
    total: number;
  };
  openNotifications?: number;
}

export interface JobStep {
  id: string;
  jobId: string;
  stepNumber: number;
  stepName: string;
  description?: string;
  data?: any;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  assignedTo?: string;
  completedBy?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QualityNotification {
  id: string;
  jobId?: string;
  notificationType: string;
  title: string;
  message: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdBy: string;
  assignedTo?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemUpdate {
  id: string;
  type: 'created' | 'updated' | 'deleted';
  entityType: 'job' | 'step' | 'notification' | 'pdf';
  entityId: string;
  data: any;
  createdBy?: string;
  createdAt: string;
}

// API Response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: any;
}

// API Error handler
const handleApiError = (error: any) => {
  if (error.response) {
    console.error('API Error:', error.response.data);
    return error.response.data;
  } else if (error.request) {
    console.error('Network Error:', error.message);
    return { success: false, error: 'Network error', message: 'Unable to connect to server' };
  } else {
    console.error('Request Error:', error.message);
    return { success: false, error: 'Request error', message: error.message };
  }
};

// API functions
export const api = {
  // Initialize database
  async initializeDatabase(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post('/initDatabase');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Jobs
  async getJobs(params?: { status?: string; limit?: number; offset?: number }): Promise<ApiResponse<Job[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.set('status', params.status);
      if (params?.limit) queryParams.set('limit', params.limit.toString());
      if (params?.offset) queryParams.set('offset', params.offset.toString());

      const response = await apiClient.get(`/getJobs?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async createJob(jobData: {
    jobNumber: string;
    title: string;
    productType?: string;
    createdBy: string;
    assignedTo?: string;
    totalStages?: number;
  }): Promise<ApiResponse<Job>> {
    try {
      const response = await apiClient.post('/createJob', jobData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async updateJob(jobId: string, jobData: Partial<Job>): Promise<ApiResponse<Job>> {
    try {
      const response = await apiClient.put(`/updateJob/${jobId}`, jobData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Production Steps
  async getJobSteps(jobId: string): Promise<ApiResponse<JobStep[]>> {
    try {
      const response = await apiClient.get(`/getSteps/${jobId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async updateStep(stepData: {
    stepId?: string;
    jobId?: string;
    stepNumber?: number;
    status: string;
    completedBy: string;
    data?: any;
  }): Promise<ApiResponse<JobStep>> {
    try {
      const response = await apiClient.put('/updateStep', stepData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Quality Notifications
  async getNotifications(params?: { jobId?: string; status?: string }): Promise<ApiResponse<QualityNotification[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.jobId) queryParams.set('jobId', params.jobId);
      if (params?.status) queryParams.set('status', params.status);

      const response = await apiClient.get(`/getNotifications?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async createNotification(notificationData: {
    jobId?: string;
    notificationType: string;
    title: string;
    message: string;
    severity: string;
    createdBy: string;
    assignedTo?: string;
  }): Promise<ApiResponse<QualityNotification>> {
    try {
      const response = await apiClient.post('/createNotification', notificationData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Real-time updates (polling)
  async getUpdates(since: string): Promise<ApiResponse<SystemUpdate[]>> {
    try {
      const response = await apiClient.get(`/getUpdates?since=${encodeURIComponent(since)}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Generate PDF
  async generatePDF(pdfData: {
    jobId: string;
    templateType: string;
    formData: any;
  }): Promise<ApiResponse<{ pdfUrl: string }>> {
    try {
      const response = await apiClient.post('/generatePDF', pdfData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Export individual functions for backwards compatibility
export const getJobs = api.getJobs;
export const createJob = api.createJob;
export const updateStep = api.updateStep;
export const getUpdates = api.getUpdates;
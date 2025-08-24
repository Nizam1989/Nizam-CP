// Data service layer that replaces localStorage with API calls
import { api, type User, type Job, type JobStep, type PDFReport, type QualityNotification } from './api';

// This class provides the same interface as the old localStorage API
// but makes real API calls instead
class DataService {
  // Users
  async getUsers(): Promise<User[]> {
    return api.getUsers();
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      return await api.getUserById(id);
    } catch (error) {
      return null;
    }
  }

  async createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<User> {
    return api.createUser(userData);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      return await api.updateUser(id, updates);
    } catch (error) {
      return null;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await api.deleteUser(id);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getPendingUsers(): Promise<User[]> {
    return api.getPendingUsers();
  }

  async approveUser(userId: string, adminId: string): Promise<User | null> {
    try {
      return await api.approveUser(userId);
    } catch (error) {
      return null;
    }
  }

  async rejectUser(userId: string, adminId: string): Promise<User | null> {
    try {
      return await api.rejectUser(userId);
    } catch (error) {
      return null;
    }
  }

  // Jobs
  async getJobs(): Promise<Job[]> {
    return api.getJobs();
  }

  async getJobById(id: string): Promise<Job | null> {
    try {
      return await api.getJobById(id);
    } catch (error) {
      return null;
    }
  }

  async createJob(jobData: Omit<Job, 'id' | 'created_at' | 'updated_at'>): Promise<Job> {
    return api.createJob(jobData);
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | null> {
    try {
      return await api.updateJob(id, updates);
    } catch (error) {
      return null;
    }
  }

  async deleteJob(id: string): Promise<boolean> {
    try {
      await api.deleteJob(id);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Job Steps
  async getJobSteps(jobId: string): Promise<JobStep[]> {
    return api.getJobSteps(jobId);
  }

  async createJobSteps(steps: Omit<JobStep, 'id' | 'created_at'>[]): Promise<JobStep[]> {
    if (steps.length === 0) return [];
    
    const jobId = steps[0].job_id;
    return api.createJobSteps(jobId, steps);
  }

  async updateJobStep(jobId: string, stepNumber: number, updates: Partial<JobStep>): Promise<JobStep | null> {
    try {
      return await api.updateJobStep(jobId, stepNumber, updates);
    } catch (error) {
      return null;
    }
  }

  // PDF Reports
  async getPDFReports(): Promise<PDFReport[]> {
    return api.getPDFReports();
  }

  async createPDFReport(reportData: Omit<PDFReport, 'id'>): Promise<PDFReport> {
    return api.createPDFReport(reportData);
  }

  // Quality Notifications
  async getQualityNotifications(): Promise<QualityNotification[]> {
    return api.getQualityNotifications();
  }

  async createQualityNotification(qnData: Omit<QualityNotification, 'id' | 'created_at' | 'updated_at'>): Promise<QualityNotification> {
    return api.createQualityNotification(qnData);
  }

  async updateQualityNotification(id: string, updates: Partial<QualityNotification>): Promise<QualityNotification | null> {
    try {
      return await api.updateQualityNotification(id, updates);
    } catch (error) {
      return null;
    }
  }

  async deleteQualityNotification(id: string): Promise<boolean> {
    try {
      await api.deleteQualityNotification(id);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Settings (replacing localStorage configurations)
  async getSettings(): Promise<any> {
    return api.getSettings();
  }

  async updateSettings(settings: any): Promise<any> {
    return api.updateSettings(settings);
  }

  // Analytics
  async getAnalytics(): Promise<any> {
    return api.getAnalytics();
  }
}

// Create and export the service instance
export const dataService = new DataService();

// Keep the same export name for compatibility
export const apiService = dataService;
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { AssignPhysioData, AuthResponse, CreatePatientData, CreatePhysioData, Exercise, FeedbackData, Metrics, Patient, Physio, PhysioDropdownOption, PrescribeExerciseData, Submission, SubmissionDetail, SubmissionQueueItem, UpdatePatientData, UpdatePhysioData, User } from '../types';
import { storageService } from '../utils/storage';

/**
 * Kore Physiotherapy App API Service
 *
 * Centralized API service with authentication, error handling, and type safety.
 * Handles all HTTP communication with the backend API.
 */

// Configuration
const API_BASE_URL = 'http://10.128.37.54:3000'; // Replace with your actual API URL
const API_TIMEOUT = 10000; // 10 seconds

// API Error types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private decodeJWT(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return decoded;
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  async getUserFromToken(token: string): Promise<User | null> {
    try {
      const payload = this.decodeJWT(token);
      if (payload) {
        return {
          id: payload.id,
          name: '', // TODO: Fetch from API or set default if needed
          email: '',
          role: payload.role,
        };
      }
    } catch (error) {
      console.error('Error getting user from token:', error);
    }
    return null;
  }

  private async setupInterceptors() {
    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        try {
          const token = await storageService.getItem('auth-token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh or logout on 401
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, clear stored data and trigger logout
          await storageService.removeItem('auth-token');
          // Trigger global logout by dispatching custom event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:logout'));
          }
        } else if (error.response?.status === 403) {
          // Forbidden - user doesn't have permission
          console.warn('Access forbidden:', error.response.data?.message);
        } else if (error.response?.status >= 500) {
          // Server error
          console.error('Server error:', error.response.data?.message);
        }
        return Promise.reject(error);
      }
    );
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<{ token: string }> = await this.axiosInstance.post('/auth/login', {
        email,
        password,
      });

      // Decode the JWT to get user info
      const user = await this.getUserFromToken(response.data.token);
      if (!user) {
        throw new Error('Invalid token received');
      }

      // Store the token securely
      await storageService.setItem('auth-token', response.data.token);

      return {
        token: response.data.token,
        user,
      };
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await storageService.getItem('auth-token');
      return !!token;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  // Get stored auth token
  async getAuthToken(): Promise<string | null> {
    try {
      return await storageService.getItem('auth-token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.axiosInstance.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Still proceed with local cleanup even if API call fails
    } finally {
      // Always clear local token regardless of API call success
      await storageService.removeItem('auth-token');
    }
  }

  // Generic GET request
  async get<T>(url: string): Promise<T> {
    try {
      const response = await this.axiosInstance.get<T>(url);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  // Generic POST request
  async post<T>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.axiosInstance.post<T>(url, data);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  // Generic PUT request
  async put<T>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.axiosInstance.put<T>(url, data);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  // Generic DELETE request
  async delete<T>(url: string): Promise<T> {
    try {
      const response = await this.axiosInstance.delete<T>(url);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  // Error handling method
  private handleApiError(error: any): ApiError {
    if (axios.isAxiosError(error)) {
      const axiosError = error;
      const status = axiosError.response?.status;
      const message = axiosError.response?.data?.message || axiosError.message || 'An error occurred';

      return {
        message,
        status,
        code: axiosError.code,
      };
    }

    return {
      message: error?.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    };
  }

  // ===== PATIENT API METHODS =====
  async getPatientExercises(): Promise<Exercise[]> {
    return this.get<Exercise[]>('/patient/exercises');
  }

  async getPatientSubmissionHistory(): Promise<Submission[]> {
    return this.get<Submission[]>('/patient/submissions/history');
  }

  async submitExercise(exerciseId: string, mediaUrl?: string): Promise<Submission> {
    return this.post<Submission>('/patient/submissions', { exerciseId, mediaUrl });
  }

  // ===== PHYSIO API METHODS =====
  async getAssignedPatients(): Promise<Patient[]> {
    return this.get<Patient[]>('/physio/patients');
  }

  async getSubmissionQueue(): Promise<SubmissionQueueItem[]> {
    return this.get<SubmissionQueueItem[]>('/physio/submissions/queue');
  }

  async getSubmissionDetail(submissionId: string): Promise<SubmissionDetail> {
    return this.get<SubmissionDetail>(`/physio/submissions/${submissionId}`);
  }

  async submitFeedback(submissionId: string, feedback: FeedbackData): Promise<void> {
    return this.post<void>(`/physio/submissions/${submissionId}/feedback`, feedback);
  }

  // ===== MANAGER API METHODS =====
  async getMetrics(): Promise<Metrics> {
    return this.get<Metrics>('/manager/metrics');
  }

  async getPatients(): Promise<Patient[]> {
    return this.get<Patient[]>('/manager/patients');
  }

  async getPhysios(): Promise<Physio[]> {
    return this.get<Physio[]>('/manager/physiotherapists');
  }

  async getPhysioDropdown(): Promise<PhysioDropdownOption[]> {
    return this.get<PhysioDropdownOption[]>('/manager/physiotherapists/profile/dropdown');
  }

  async createPatient(patientData: CreatePatientData): Promise<Patient> {
    return this.post<Patient>('/manager/patients', patientData);
  }

  async updatePatient(patientId: string, updateData: UpdatePatientData): Promise<void> {
    return this.put<void>(`/manager/patients/${patientId}`, updateData);
  }

  async assignPhysioToPatient(patientId: string, assignData: AssignPhysioData): Promise<void> {
    return this.post<void>(`/manager/patients/${patientId}/assign`, assignData);
  }

  async prescribeExerciseToPatient(patientId: string, prescribeData: PrescribeExerciseData): Promise<void> {
    return this.post<void>(`/manager/patients/${patientId}/prescribe`, prescribeData);
  }

  async createPhysio(physioData: CreatePhysioData): Promise<Physio> {
    return this.post<Physio>('/manager/physiotherapists', physioData);
  }

  async updatePhysio(physioId: string, updateData: UpdatePhysioData): Promise<void> {
    return this.put<void>(`/manager/physiotherapists/${physioId}`, updateData);
  }

  // ===== UTILITY METHODS =====
  /**
   * Test API connectivity
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get<{ status: string; timestamp: string }>('/health');
  }
}

export const apiService = new ApiService();
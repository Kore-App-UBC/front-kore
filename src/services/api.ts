import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Platform } from 'react-native';
import { AssignPhysioData, AuthResponse, AvailableExercise, CreateExerciseData, CreatePatientData, CreatePhysioData, Exercise, FeedbackData, Metrics, Patient, Physio, PhysioDropdownOption, PrescribedExercise, PrescribeExerciseData, PrescribeExerciseResponse, RemovePrescriptionResponse, Submission, SubmissionDetail, SubmissionQueueItem, UpdateExerciseData, UpdatePatientData, UpdatePhysioData, User } from '../types';
import { storageService } from '../utils/storage';

let RNFS: typeof import('react-native-fs') | null = null;

if (Platform.OS !== 'web') {
  RNFS = require('react-native-fs');
}

/**
 * Kore Physiotherapy App API Service
 *
 * Centralized API service with authentication, error handling, and type safety.
 * Handles all HTTP communication with the backend API.
 */

// Configuration
const API_BASE_URL = 'http://192.168.15.6:3000'; // Replace with your actual API URL
const API_TIMEOUT = 10000; // 10 seconds

// API Error types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  responseData?: any;
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

  // Refresh token flow control
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<void> | null = null;

  private async storeTokens(token: string | null, refreshToken: string | null) {
    try {
      if (token) {
        await storageService.setItem('auth-token', token);
      } else {
        await storageService.removeItem('auth-token');
      }

      // store token expiry (exp claim) so we can proactively refresh before it expires
      if (token) {
        const payload = this.decodeJWT(token);
        const exp = payload?.exp; // exp is typically seconds since epoch
        if (exp) {
          // store as stringified number (seconds)
          await storageService.setItem('auth-token-exp', String(exp));
        } else {
          await storageService.removeItem('auth-token-exp');
        }
      } else {
        await storageService.removeItem('auth-token-exp');
      }

      if (refreshToken) {
        await storageService.setItem('refresh-token', refreshToken);
      } else {
        await storageService.removeItem('refresh-token');
      }
    } catch (err) {
      console.error('Error storing tokens:', err);
    }
  }

  // Margin in seconds before expiry to trigger a refresh
  private TOKEN_REFRESH_MARGIN = 60;

  // Shared refresh logic (uses concurrency controls defined on the class)
  private async refreshTokens(currentRefresh: string): Promise<void> {
    try {
      const raw = axios.create({ baseURL: API_BASE_URL, timeout: API_TIMEOUT });
      const resp = await raw.post('/auth/refresh', { refreshToken: currentRefresh });

      const newToken = resp.data?.token;
      const newRefresh = resp.data?.refreshToken;

      if (!newToken) {
        throw new Error('No token returned from refresh');
      }

      await this.storeTokens(newToken, newRefresh || null);

      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (refreshError) {
      await this.storeTokens(null, null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
      throw refreshError;
    }
  }

  // Ensure the token is fresh before sending a request. If the token is near expiry,
  // attempt to refresh using the stored refresh token.
  private async ensureFreshToken(): Promise<void> {
    try {
      const token = await storageService.getItem('auth-token');
      if (!token) return;

      const expStr = await storageService.getItem('auth-token-exp');
      let exp: number | null = null;

      if (expStr) {
        const parsed = parseInt(expStr, 10);
        if (!Number.isNaN(parsed)) exp = parsed;
      } else {
        // fallback: decode token and store exp for next time
        const payload = this.decodeJWT(token);
        if (payload?.exp) {
          exp = payload.exp;
          await storageService.setItem('auth-token-exp', String(exp));
        }
      }

      if (!exp) return;

      const nowSec = Math.floor(Date.now() / 1000);
      // If token is already expired or will expire within the margin, refresh
      if (nowSec >= exp - this.TOKEN_REFRESH_MARGIN) {
        const currentRefresh = await storageService.getItem('refresh-token');
        if (!currentRefresh) {
          await this.storeTokens(null, null);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:logout'));
          }
          return;
        }

        if (this.isRefreshing && this.refreshPromise) {
          await this.refreshPromise;
        } else {
          this.isRefreshing = true;
          this.refreshPromise = (async () => {
            try {
              await this.refreshTokens(currentRefresh);
            } finally {
              this.isRefreshing = false;
              this.refreshPromise = null;
            }
          })();

          await this.refreshPromise;
        }
      }
    } catch (err) {
      // If refresh fails here, let the request proceed; response interceptor will handle 401
      console.warn('ensureFreshToken failed:', err);
    }
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
          // Ensure token is fresh (refresh proactively if it's near expiry)
          await this.ensureFreshToken();

          const token = await storageService.getItem('auth-token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error ensuring auth token is fresh or getting auth token:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh or logout on 401
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest?._retry) {
          originalRequest._retry = true;

          try {
            const currentRefresh = await storageService.getItem('refresh-token');

            if (!currentRefresh) {
              await this.storeTokens(null, null);
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('auth:logout'));
              }
              return Promise.reject(error);
            }

            if (this.isRefreshing && this.refreshPromise) {
              await this.refreshPromise;
            } else {
              this.isRefreshing = true;
              this.refreshPromise = (async () => {
                try {
                  const raw = axios.create({ baseURL: API_BASE_URL, timeout: API_TIMEOUT });
                  const resp = await raw.post('/auth/refresh', { refreshToken: currentRefresh });

                  const newToken = resp.data?.token;
                  const newRefresh = resp.data?.refreshToken;

                  if (!newToken) {
                    throw new Error('No token returned from refresh');
                  }

                  await this.storeTokens(newToken, newRefresh || null);

                  this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                } catch (refreshError) {
                  await this.storeTokens(null, null);
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('auth:logout'));
                  }
                  throw refreshError;
                } finally {
                  this.isRefreshing = false;
                  this.refreshPromise = null;
                }
              })();

              await this.refreshPromise;
            }

            const latestToken = await storageService.getItem('auth-token');
            if (latestToken) {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${latestToken}`;
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshErr) {
            return Promise.reject(refreshErr);
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
      const response: AxiosResponse<{ token: string; refreshToken?: string }> = await this.axiosInstance.post('/auth/login', {
        email,
        password,
      });

      // Decode the JWT to get user info
      const user = await this.getUserFromToken(response.data.token);
      if (!user) {
        throw new Error('Invalid token received');
      }

  const token = response.data.token;
  const refreshToken = response.data.refreshToken || null;
  await this.storeTokens(token, refreshToken);

      return {
        token,
        refreshToken: response.data.refreshToken,
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
      // await this.axiosInstance.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Still proceed with local cleanup even if API call fails
    } finally {
      await this.storeTokens(null, null);
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
      const responseData = axiosError.response?.data;

      return {
        message,
        status,
        responseData,
        code: axiosError.code,
      };
    }

    return {
      message: error?.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    };
  }

  // ===== PATIENT API METHODS =====
  async getPatientExercises(): Promise<Array<{
    id: string;                    // Prescription ID (CUID)
    patientId: string;             // Patient profile ID
    exerciseId: string;            // Exercise ID
    prescribedAt: string;          // ISO date string
    exercise: {                    // Full exercise object
      id: string;                  // Exercise ID
      name: string;                // Exercise name
      description: string;         // Exercise description
      instructionsUrl: string;     // URL to exercise instructions
      classificationData: {        // Pose classification configuration
        landmarks: string[];       // Required landmark names
        thresholds: {
          up: number;              // Upper threshold angle
          down: number;            // Lower threshold angle
        };
        evaluationType: "high_to_low" | "low_to_high";
      };
      animationData: {             // 3D animation configuration
        keyframes: Array<{         // Animation keyframes
          progress: number;        // Animation progress (0.0 to 1.0)
          transformations: Array<{
            axis?: "x" | "y" | "z"; // Rotation axis (optional)
            type: "relative_translate" | "rotate_around_joint";
            angle?: number;         // Rotation angle in degrees (optional)
            joint: string;          // Joint name to transform
            distance?: number;      // Distance from pivot (optional)
            pivotJoint?: string;    // Pivot joint for rotation (optional)
            offset?: [number, number, number]; // Translation offset (optional)
            relativeTo?: string;    // Reference joint for relative positioning (optional)
          }>;
        }>;
        basePoints: Record<string, [number, number, number]>; // 3D joint positions
        animationType?: string;     // Animation pattern (e.g., "oscillating")
      };
      createdAt: string;           // ISO date string
      updatedAt: string;           // ISO date string
    };
  }>> {
    return this.get<Array<{
      id: string;
      patientId: string;
      exerciseId: string;
      prescribedAt: string;
      exercise: {
        id: string;
        name: string;
        description: string;
        instructionsUrl: string;
        classificationData: {
          landmarks: string[];
          thresholds: {
            up: number;
            down: number;
          };
          evaluationType: "high_to_low" | "low_to_high";
        };
        animationData: {
          keyframes: Array<{
            progress: number;
            transformations: Array<{
              axis?: "x" | "y" | "z";
              type: "relative_translate" | "rotate_around_joint";
              angle?: number;
              joint: string;
              distance?: number;
              pivotJoint?: string;
              offset?: [number, number, number];
              relativeTo?: string;
            }>;
          }>;
          basePoints: Record<string, [number, number, number]>;
          animationType?: string;
        };
        createdAt: string;
        updatedAt: string;
      };
    }>>('/patient/exercises');
  }

  async getPatientSubmissionHistory(): Promise<Submission[]> {
    return this.get<Submission[]>('/patient/submissions/history');
  }

  async submitExercise(
    exerciseId: string,
    videoFile: any,
    patientComments?: string,
    onUploadProgress?: (progressEvent: { loaded: number; total: number }) => void,
    onUploadComplete?: () => void
  ): Promise<{ message: string; submission: Submission, uploadUrl: string }> {
    try {
      if (!exerciseId) {
        throw new Error('exerciseId is required');
      }

      if (!videoFile) {
        const err: any = new Error('videoFile is required');
        err.response = { status: 400, data: { message: 'videoFile is required' } };

        throw err;
      }

      const formData = new FormData();
      formData.append('exerciseId', exerciseId);

      if (typeof patientComments === 'string') {
        formData.append('patientComments', patientComments);
      }

      const response = await fetch(`${API_BASE_URL}/patient/submissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken() || ''}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const error: any = new Error(errorData.message || 'Failed to submit exercise');
        error.response = { status: response.status, data: errorData };
        throw error;
      }

      const responseData = await response.json() as { message: string; submission: Submission, uploadUrl: string };

      await RNFS?.uploadFiles({
        toUrl: responseData.uploadUrl,
        files: [{
          name: 'videoFile',
          filename: videoFile.name,
          filepath: videoFile.uri.replace('file://', ''),
          filetype: videoFile.type,
        }],
        method: 'PUT',
        binaryStreamOnly: true,
        headers: {
          'Content-Type': videoFile.type,
        },
        progressCallback(res) {
          if (onUploadProgress) {
            onUploadProgress({ loaded: res.totalBytesSent, total: res.totalBytesExpectedToSend });
          }
        },
      }).promise.then((uploadResult) => {
        if (uploadResult.statusCode >= 200 && uploadResult.statusCode < 300) {
          if (onUploadComplete) {
            onUploadComplete();
          }
        } else {
          console.error('Upload failed with status code:', uploadResult.statusCode);
        }
      });

      return responseData;
    } catch (error) {
      console.error('submitExercise error:', error);
      throw this.handleApiError(error);
    }
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

  async prescribeExercise(patientId: string, exerciseId: string): Promise<PrescribeExerciseResponse> {
    return this.post<PrescribeExerciseResponse>(`/physio/patients/${patientId}/prescribe`, { exerciseId });
  }

  async getPrescribedExercises(patientId: string): Promise<PrescribedExercise[]> {
    return this.get<PrescribedExercise[]>(`/physio/patients/${patientId}/prescriptions`);
  }

  async removePrescribedExercise(patientId: string, exerciseId: string): Promise<RemovePrescriptionResponse> {
    return this.delete<RemovePrescriptionResponse>(`/physio/patients/${patientId}/prescriptions/${exerciseId}`);
  }

  async getAvailableExercises(patientId: string): Promise<AvailableExercise[]> {
    return this.get<AvailableExercise[]>(`/physio/patients/${patientId}/available-exercises`);
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

  async getExercises(): Promise<Exercise[]> {
    return this.get<Exercise[]>('/manager/exercises');
  }

  async createExercise(exerciseData: CreateExerciseData): Promise<{ message: string; exercise: Exercise }> {
    return this.post<{ message: string; exercise: Exercise }>('/manager/exercises', exerciseData);
  }

  async updateExercise(exerciseId: string, updateData: UpdateExerciseData): Promise<{ message: string }> {
    return this.put<{ message: string }>(`/manager/exercises/${exerciseId}`, updateData);
  }

  async deleteExercise(exerciseId: string): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/manager/exercises/${exerciseId}`);
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
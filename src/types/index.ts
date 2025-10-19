// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "PATIENT" | "PHYSIOTHERAPIST" | "MANAGER";
  avatar?: string;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  instructions: string[];
  mediaUrl?: string;
}

export interface Submission {
  id: string;
  exerciseId: string;
  userId: string;
  submittedAt: Date;
  score?: number;
  feedback?: string;
  mediaUrl?: string;
}

export interface Session {
  id: string;
  userId: string;
  exercises: Exercise[];
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  notes?: string;
}

// State Types
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  currentSession: Session | null;
  exercises: Exercise[];
  loading: boolean;
  error: string | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface ExerciseState {
  exercises: Exercise[];
  currentExercise: Exercise | null;
  loading: boolean;
  error: string | null;
}

export interface SessionState {
  currentSession: Session | null;
  sessions: Session[];
  loading: boolean;
  error: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  PatientTabs: undefined;
  PhysioTabs: undefined;
  ManagerTabs: undefined;
};

export type PatientTabParamList = {
  Exercises: undefined;
  RealTimeSession: undefined;
  History: undefined;
};

export type PhysioTabParamList = {
  Patients: undefined;
  SubmissionQueue: undefined;
  Profile: undefined;
  SubmissionDetail: { submissionId: string };
};

export type ManagerTabParamList = {
  Metrics: undefined;
  ManagePatients: undefined;
  ManagePhysios: undefined;
};

// Physio-specific types
export interface Patient {
  id: string; // PatientProfile ID
  userId: string; // User ID
  physiotherapistId: string | null; // Assigned physiotherapist ID
  user: {
    id: string;
    name: string;
    email: string;
  };
  physiotherapist: {
    id: string | null;
    user: {
      id: string | null;
      name: string | null;
    };
  } | null;
}

export interface SubmissionQueueItem {
  id: string;
  patientName: string;
  exerciseName: string;
  submittedAt: string;
  status: 'pending' | 'reviewed';
}

export interface SubmissionDetail {
  id: string;
  exerciseId: string;
  userId: string;
  submittedAt: string;
  score?: number;
  feedback?: string;
  mediaUrl: string;
  exercise: {
    name: string;
    description: string;
  };
  patient: {
    name: string;
    email: string;
  };
}

export interface FeedbackData {
  score: number;
  feedback: string;
}

// Manager-specific types
export interface Metrics {
  totalPatients: number;
  totalPhysios: number;
  totalExercises: number;
  activeSessions: number;
  completedSessions: number;
}

export interface CreatePatientData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface UpdatePatientData {
  name?: string;
  email?: string;
  password?: string;
}

export interface AssignPhysioData {
  physioId: string;
}

export interface PrescribeExerciseData {
  exerciseId: string;
  notes?: string;
}

export interface CreatePhysioData {
  name: string;
  email: string;
  phone?: string;
}

export interface UpdatePhysioData {
  name?: string;
  email?: string;
  password?: string;
}

export interface Physio {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}
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
  id: string; // CUID format
  name: string;
  description: string;
  instructionsUrl: string;
  classificationData: ClassificationData | null;
  animationData: AnimationData | null;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface ClassificationData {
  thresholds: {
    up: number;
    down: number;
  };
  landmarks: string[];
  evaluationType: "high_to_low" | "low_to_high" | "custom";
}

export type Transformation = (
  | {
    type: 'relative_translate';
    joint: string;
    offset: [number, number, number];
    relativeTo: string;
  }
  | {
    type: 'rotate_around_joint';
    joint: string;
    pivotJoint: string;
    axis: 'x' | 'y' | 'z';
    angle: number; // in degrees
    distance: number;
  }
);

export interface Keyframe {
  progress: number; // 0 to 1
  transformations: Transformation[];
}

export interface AnimationData {
  basePoints: Record<string, [number, number, number]>;
  keyframes: Keyframe[]; // Array of keyframe objects
  animationType?: "oscillating" | "loop";
  classificationData?: {
    landmarks: string[];
  };
}

export interface CreateExerciseData {
  name: string;
  description: string;
  instructionsUrl: string;
  classificationData?: ClassificationData;
  animationData?: AnimationData;
}

export interface UpdateExerciseData {
  name?: string;
  description?: string;
  instructionsUrl?: string;
  classificationData?: ClassificationData | null;
  animationData?: AnimationData | null;
}

export interface Submission {
  id: string
  patientId: string
  exerciseId: string
  videoUrl: string
  patientComments?: string
  status: string
  submittedAt: string
  createdAt: string
  updatedAt: string
  report: {
    id: string
    submissionId: string
    iaAnalysis: {
      accuracy: number
      corrections: string[]
    }
    physioFeedback: string
    finalizedAt: string
    createdAt: string
    updatedAt: string
  }
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
  refreshToken?: string;
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
  exercises: undefined;
  realTimeSession: undefined;
  history: undefined;
  exerciseDetail: { exercise: PrescribedExercise };
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
  id: string
  patientId: string
  exerciseId: string
  videoUrl: string
  patientComments: any
  status: string
  submittedAt: string
  createdAt: string
  updatedAt: string
  report: {
    id: string
    submissionId: string
    iaAnalysis: {
      accuracy: number
      corrections: string[]
    }
    physioFeedback: any
    finalizedAt: any
    createdAt: string
    updatedAt: string
  }
  patient: {
    id: string
    userId: string
    physiotherapistId: string
    createdAt: string
    updatedAt: string
    user: {
      id: string
      name: string
      email: string
      password: string
      role: string
      clinicId: string
      createdAt: string
      updatedAt: string
    }
  }
  exercise: {
    id: string
    name: string
    description: string
    instructionsUrl: string
    classificationData: {
      landmarks: string[]
      thresholds: {
        up: number
        down: number
      }
      evaluationType: string
    }
    animationData: {
      keyframes: {
        progress: number
        transformations: {
          type: string
          joint: string
          offset?: number[]
          relativeTo?: string
          axis?: string
          angle?: number
          distance?: number
          pivotJoint?: string
        }[]
      }[]
      basePoints: {
        head: number[]
        neck: number[]
        mid_hip: number[]
        left_hip: number[]
        left_knee: number[]
        right_hip: number[]
        left_ankle: number[]
        left_elbow: number[]
        left_wrist: number[]
        right_knee: number[]
        right_ankle: number[]
        right_elbow: number[]
        right_wrist: number[]
        left_shoulder: number[]
        right_shoulder: number[]
      }
      animationType: string
    }
    createdAt: string
    updatedAt: string
  }
}

export interface SubmissionDetail {
  id: string
  patientId: string
  exerciseId: string
  videoUrl: string
  patientComments: string
  status: string
  submittedAt: string
  createdAt: string
  updatedAt: string
  report: {
    id: string
    submissionId: string
    iaAnalysis: {
      accuracy: number
      corrections: string[]
    }
    physioFeedback: any
    finalizedAt: any
    createdAt: string
    updatedAt: string
  }
  patient: {
    id: string
    userId: string
    physiotherapistId: string
    createdAt: string
    updatedAt: string
    user: {
      id: string
      name: string
      email: string
      password: string
      role: string
      clinicId: string
      createdAt: string
      updatedAt: string
    }
  }
  exercise: {
    id: string
    name: string
    description: string
    instructionsUrl: string
    classificationData: {
      landmarks: string[]
      thresholds: {
        up: number
        down: number
      }
      evaluationType: string
    }
    animationData: {
      keyframes: {
        progress: number
        transformations: {
          type: string
          joint: string
          offset?: number[]
          relativeTo?: string
          axis?: string
          angle?: number
          distance?: number
          pivotJoint?: string
        }[]
      }[]
      basePoints: {
        head: number[]
        neck: number[]
        mid_hip: number[]
        left_hip: number[]
        left_knee: number[]
        right_hip: number[]
        left_ankle: number[]
        left_elbow: number[]
        left_wrist: number[]
        right_knee: number[]
        right_ankle: number[]
        right_elbow: number[]
        right_wrist: number[]
        left_shoulder: number[]
        right_shoulder: number[]
      }
      animationType: string
    }
    createdAt: string
    updatedAt: string
  }
}

export interface FeedbackData {
  physioFeedback: string;
}

// Manager-specific types
export interface Metrics {
  // Total counts
  totalPatients: number;
  // Some APIs/clients may call this "totalPhysios" or "totalPhysiotherapists" - support both as optional
  totalPhysios?: number;
  totalPhysiotherapists?: number;
  totalExercises: number;

  // Aggregations for prescriptions grouped by exercise (optional)
  exercisesByPrescription?: {
    exerciseId: string;
    exerciseName: string | null;
    prescribedCount: number;
  }[];

  // Submission/session counts (field names differ between implementations)
  // prefer the explicit names from the manager endpoint if present
  activeSubmissionsNotReviewed?: number;
  completeSessionsReviewed?: number;

  // legacy/backwards-compatible fields
  activeSessions?: number;
  completedSessions?: number;
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
  physiotherapistId: string;
}

export interface PrescribeExerciseData {
  exerciseId: string;
  notes?: string;
}

export interface CreatePhysioData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface UpdatePhysioData {
  name?: string;
  email?: string;
  password?: string;
}

export interface Physio {
  id: string; // Physiotherapist profile ID
  userId: string; // User ID
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PhysioDropdownOption {
  label: string;
  value: string;
}

// Prescription-related types
export interface PrescribedExercise {
  id: string;           // Prescription ID (CUID format)
  patientId: string;    // Patient profile ID
  exerciseId: string;   // Exercise ID
  prescribedAt: string; // ISO date string
  exercise: Exercise;   // Full exercise object
  patient?: {           // Only included in prescribe response
    user: {
      name: string;     // Patient's name
    };
  };
}

export interface PatientExercisesResponse extends Array<PrescribedExercise> { }

export interface PrescribeExerciseResponse {
  message: string;
  prescription: PrescribedExercise;
}

export interface RemovePrescriptionResponse {
  message: string;
}

// Available exercise with prescription status
export interface AvailableExercise extends Exercise {
  isPrescribed: boolean;
}
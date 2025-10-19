import { create } from 'zustand';
import { Exercise, ExerciseState } from '../types';

interface ExerciseStore extends ExerciseState {
  setExercises: (exercises: Exercise[]) => void;
  setCurrentExercise: (exercise: Exercise | null) => void;
  addExercise: (exercise: Exercise) => void;
  updateExercise: (id: string, updates: Partial<Exercise>) => void;
  deleteExercise: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useExerciseStore = create<ExerciseStore>((set, get) => ({
  exercises: [],
  currentExercise: null,
  loading: false,
  error: null,
  setExercises: (exercises: Exercise[]) => set({ exercises }),
  setCurrentExercise: (exercise: Exercise | null) => set({ currentExercise: exercise }),
  addExercise: (exercise: Exercise) =>
    set((state) => ({ exercises: [...state.exercises, exercise] })),
  updateExercise: (id: string, updates: Partial<Exercise>) =>
    set((state) => ({
      exercises: state.exercises.map((ex) =>
        ex.id === id ? { ...ex, ...updates } : ex
      ),
    })),
  deleteExercise: (id: string) =>
    set((state) => ({
      exercises: state.exercises.filter((ex) => ex.id !== id),
    })),
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
}));
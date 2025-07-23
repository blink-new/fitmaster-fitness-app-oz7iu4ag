export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'abs' | 'cardio';

export type LoadType = 'bodyweight' | 'additional_weight' | 'resistance_band' | 'machine';

export type ExerciseType = 'main' | 'auxiliary' | 'isolation';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  loadType: LoadType;
  technique: string;
  videoUrl?: string;
  sets: number;
  reps: number;
  exerciseType: ExerciseType;
  machineName?: string;
  machineSettings?: string;
  comment?: string;
  lastWeight?: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: number;
  reps: number;
  weight: number;
  completed: boolean;
}

export interface Workout {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
  status: 'active' | 'completed' | 'paused';
  userId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface TimerSettings {
  duration: number; // в секундах
  isActive: boolean;
  remainingTime: number;
}

export interface MuscleGroupSelection {
  muscleGroup: MuscleGroup;
  exerciseCount: number;
}
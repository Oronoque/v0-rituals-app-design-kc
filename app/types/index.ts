export interface StepMetrics {
  completionHistory: Array<{ date: string; completed: boolean; answer?: any }>
  totalCompletions: number
  completionRate: number
  currentStreak: number
  longestStreak: number
  averageScore?: number
  personalBest?: number
  fitnessData?: {
    volume: Array<{ date: string; totalWeight: number; totalReps: number }>
    maxWeights: Array<{ date: string; weight: number; reps: number }>
    personalRecords: Array<{ date: string; weight: number; reps: number; oneRepMax: number }>
  }
  customData?: Array<{ date: string; value: number; unit: string }>
}

export interface RitualMetrics {
  completionHistory: Array<{ date: string; completed: boolean; completionRate: number }>
  totalCompletions: number
  completionRate: number
  currentStreak: number
  longestStreak: number
  averageCompletionTime?: number
  stepMetrics: { [stepId: string]: StepMetrics }
}

export interface Step {
  id: string
  type: "yesno" | "qa" | "weightlifting" | "cardio" | "custom"
  name: string
  question?: string
  completed: boolean
  skipped?: boolean
  answer?: string | WeightliftingData | CardioData | CustomData
  weightliftingConfig?: Array<{ reps: number; weight: number; completed?: boolean }>
  cardioConfig?: Array<{ time: number; distance: number; completed?: boolean }>
  customConfig?: { label: string; unit: string }
  metrics?: StepMetrics
  // Track if step was modified during execution
  wasModified?: boolean
}

export interface WeightliftingData {
  sets: Array<{ reps: number; weight: number; completed?: boolean }>
}

export interface CardioData {
  rounds: Array<{ time: number; distance: number; completed?: boolean }>
}

export interface CustomData {
  value: number
  unit: string
}

export interface Ritual {
  id: string
  name: string
  steps: Step[]
  completed: boolean
  scheduledTime?: string
  location?: string
  gear?: string[]
  category?: string
  description?: string
  metrics?: RitualMetrics
  // Track if ritual was modified during execution
  wasModified?: boolean
}

export type FlowState =
  | "auth"
  | "home"
  | "dayflow"
  | "library"
  | "journal"
  | "social"
  | "review"
  | "schedule"
  | "proof-leaderboard"
  | "reflection"

export interface AppState {
  flowState: FlowState
  isAuthenticated: boolean
  rituals: Ritual[]
  currentRitualIndex: number
  currentStepIndex: number
  showMetrics: boolean
  selectedMetrics: {
    title: string
    type: "ritual" | "yesno" | "qa" | "weightlifting" | "cardio" | "custom"
    data: any
  } | null
  showChangelog: boolean
  changelogRitualId: string | null
  showGlobalChangelog: boolean
  // Track completed rituals for the day
  completedRituals: string[]
  // User progress tracking
  currentStreak: number
  proofScore: number
  dayRating: number
  dayReflection: string
}

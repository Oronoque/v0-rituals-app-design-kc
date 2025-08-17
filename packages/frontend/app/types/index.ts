import { FullRitual } from "@rituals/shared";

export type FlowState =
  | "auth"
  | "home"
  | "dayflow"
  | "library"
  | "library-private"
  | "library-public"
  | "create"
  | "journal"
  | "social"
  | "review"
  | "schedule"
  | "proof-leaderboard"
  | "reflection"
  | "settings";

export interface AppState {
  flowState: FlowState;
  isAuthenticated: boolean;
  rituals: FullRitual[];
  currentRitualIndex: number;
  currentStepIndex: number;
  showMetrics: boolean;
  selectedMetrics: {
    title: string;
    type: "ritual" | "yesno" | "qa" | "weightlifting" | "cardio" | "custom";
    data: any;
  } | null;
  showChangelog: boolean;
  changelogRitualId: string | null;
  showGlobalChangelog: boolean;
  // Track completed rituals for the day
  completedRituals: string[];
  // User progress tracking
  currentStreak: number;
  proofScore: number;
  dayRating: number;
  dayReflection: string;
}

export interface NavigationItem {
  id: FlowState;
  label: string;
  icon: any;
  emoji?: string;
}

export interface Ritual {
  id: string;
  name: string;
  description?: string;
  steps: RitualStep[];
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RitualStep {
  id: string;
  name: string;
  description?: string;
  duration?: number;
  order: number;
}

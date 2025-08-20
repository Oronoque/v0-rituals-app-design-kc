"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FullRitual, FullStepDefinition } from "@rituals/shared";
import {
  Calendar,
  Check,
  CheckCircle,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  Dumbbell,
  Hash,
  MessageSquare,
  Star,
  Timer,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

interface RitualCompletionReviewSheetProps {
  ritual: FullRitual | null;
  stepCompletions: Record<number, any>;
  notes: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirmComplete: () => void;
  isLoading?: boolean;
}

export function RitualCompletionReviewSheet({
  ritual,
  stepCompletions,
  notes,
  isOpen,
  onClose,
  onConfirmComplete,
  isLoading = false,
}: RitualCompletionReviewSheetProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  if (!isOpen || !ritual) return null;

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case "boolean":
        return <CheckSquare className="w-4 h-4" />;
      case "counter":
        return <Hash className="w-4 h-4" />;
      case "qna":
        return <MessageSquare className="w-4 h-4" />;
      case "timer":
        return <Timer className="w-4 h-4" />;
      case "scale":
        return <Star className="w-4 h-4" />;
      case "workout":
        return <Dumbbell className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStepTypeLabel = (stepType: string) => {
    switch (stepType) {
      case "boolean":
        return "Yes/No";
      case "counter":
        return "Tracker";
      case "qna":
        return "Text Response";
      case "timer":
        return "Timer";
      case "scale":
        return "Rating Scale";
      case "workout":
        return "Workout";
      default:
        return stepType;
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return remainingSeconds > 0
        ? `${minutes}m ${remainingSeconds}s`
        : `${minutes}m`;
    }
    return `${seconds}s`;
  };

  const getFrequencyDisplay = () => {
    const { frequency_type, days_of_week } = ritual.frequency;

    switch (frequency_type) {
      case "daily":
        return "Daily";
      case "weekly":
        if (days_of_week && days_of_week.length > 0) {
          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          return `Weekly on ${days_of_week.map((d) => dayNames[d]).join(", ")}`;
        }
        return "Weekly";
      case "custom":
        return "Custom schedule";
      case "once":
        return "One time";
      default:
        return "Unknown";
    }
  };

  const completedSteps = Object.values(stepCompletions).filter(
    (completion) => completion?.completed
  ).length;
  const totalSteps = ritual.step_definitions.length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-[#1C1C1E] rounded-t-3xl border-t border-[#3C3C3E]/30 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-[#3C3C3E] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 border-b border-[#3C3C3E]/30">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">
              Review & Complete
            </h2>
            <p className="text-[#8E8E93] text-sm">
              {ritual.name} • {completedSteps}/{totalSteps} steps completed
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-[#8E8E93] hover:text-white p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
          <div className="space-y-6 py-4">
            {/* Session Summary */}
            <div className="bg-[#2C2C2E] rounded-xl p-4 border border-[#3C3C3E]/30">
              <h3 className="text-white font-semibold mb-3">Session Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-[#8E8E93]">
                  <CheckCircle className="w-4 h-4" />
                  <span>{completedSteps} steps completed</span>
                </div>
                <div className="flex items-center gap-2 text-[#8E8E93]">
                  <Calendar className="w-4 h-4" />
                  <span>{getFrequencyDisplay()}</span>
                </div>
                <div className="flex items-center gap-2 text-[#8E8E93]">
                  <Clock className="w-4 h-4" />
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-[#8E8E93]">
                  <Users className="w-4 h-4" />
                  <span>{ritual.category}</span>
                </div>
              </div>
            </div>

            {/* Session Notes */}
            {notes.trim() && (
              <div className="bg-[#2C2C2E] rounded-xl p-4 border border-[#3C3C3E]/30">
                <h4 className="text-white font-medium mb-2">Session Notes</h4>
                <p className="text-[#AEAEB2] text-sm leading-relaxed">
                  {notes}
                </p>
              </div>
            )}

            {/* Steps Review */}
            <div>
              <h3 className="text-white font-semibold text-lg mb-4">
                Your Responses
              </h3>
              <div className="space-y-3">
                {ritual.step_definitions?.map((step, index) => (
                  <StepReviewCard
                    key={step.id}
                    step={step}
                    stepNumber={index + 1}
                    completion={stepCompletions[index]}
                    isExpanded={expandedSteps.has(step.id)}
                    onToggleExpansion={() => toggleStepExpansion(step.id)}
                    getStepIcon={getStepIcon}
                    getStepTypeLabel={getStepTypeLabel}
                    formatDuration={formatDuration}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-[#3C3C3E]/30 space-y-3">
          <Button
            onClick={onConfirmComplete}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                Completing Ritual...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Confirm & Complete Ritual
              </>
            )}
          </Button>

          <Button
            onClick={onClose}
            variant="outline"
            className="w-full border-[#3C3C3E] text-[#8E8E93]"
            size="lg"
            disabled={isLoading}
          >
            Back to Edit
          </Button>
        </div>
      </div>
    </>
  );
}

// Individual Step Review Card Component
function StepReviewCard({
  step,
  stepNumber,
  completion,
  isExpanded,
  onToggleExpansion,
  getStepIcon,
  getStepTypeLabel,
  formatDuration,
}: {
  step: FullStepDefinition;
  stepNumber: number;
  completion: any;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  getStepIcon: (stepType: string) => React.ReactElement;
  getStepTypeLabel: (stepType: string) => string;
  formatDuration: (seconds: number) => string;
}) {
  const isCompleted = completion?.completed;
  const hasData = !!completion;

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        isCompleted
          ? "bg-green-600/10 border-green-600/30"
          : hasData
            ? "bg-blue-600/10 border-blue-600/30"
            : "bg-[#2C2C2E] border-[#3C3C3E]/30"
      }`}
    >
      {/* Step Header */}
      <div
        className="p-4 cursor-pointer hover:bg-black/20 transition-colors"
        onClick={onToggleExpansion}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                isCompleted
                  ? "bg-green-600 text-white"
                  : hasData
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-gray-500/20 text-gray-400"
              }`}
            >
              {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
            </div>
            <div>
              <h4 className="text-white font-medium">{step.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                {getStepIcon(step.type)}
                <span className="text-[#8E8E93] text-sm">
                  {getStepTypeLabel(step.type)}
                </span>
                {isCompleted && (
                  <Badge className="text-xs bg-green-600/20 text-green-400 border-green-600/30">
                    Completed
                  </Badge>
                )}
                {!isCompleted && hasData && (
                  <Badge className="text-xs bg-blue-600/20 text-blue-400 border-blue-600/30">
                    Started
                  </Badge>
                )}
                {!hasData && (
                  <Badge className="text-xs bg-gray-600/20 text-gray-400 border-gray-600/30">
                    Skipped
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {(hasData || isCompleted) && (
            <>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-[#8E8E93]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#8E8E93]" />
              )}
            </>
          )}
        </div>
      </div>

      {/* Step Response Details */}
      {isExpanded && (hasData || isCompleted) && (
        <div className="px-4 pb-4 border-t border-white/10">
          <StepResponseContent
            step={step}
            completion={completion}
            formatDuration={formatDuration}
          />
        </div>
      )}
    </div>
  );
}

// Step Response Content based on step type and user input
function StepResponseContent({
  step,
  completion,
  formatDuration,
}: {
  step: FullStepDefinition;
  completion: any;
  formatDuration: (seconds: number) => string;
}) {
  if (!completion) return null;

  switch (step.type) {
    case "boolean":
      return (
        <div className="pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[#8E8E93] text-sm">Your Response:</span>
            <span
              className={`font-medium ${
                completion.value_boolean ? "text-green-400" : "text-red-400"
              }`}
            >
              {completion.value_boolean ? "Yes" : "No"}
            </span>
          </div>
        </div>
      );

    case "counter":
      return (
        <div className="pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#8E8E93] text-sm">Actual Count:</span>
            <span className="text-white font-medium">
              {completion.actual_count || 0}{" "}
              {step.target_unit_with_data?.display_unit || ""}
            </span>
          </div>
          {step.target_count && (
            <div className="flex items-center justify-between">
              <span className="text-[#8E8E93] text-sm">Target:</span>
              <span className="text-[#8E8E93]">
                {step.target_count}{" "}
                {step.target_unit_with_data?.display_unit || ""}
              </span>
            </div>
          )}
        </div>
      );

    case "timer":
      return (
        <div className="pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#8E8E93] text-sm">Time Completed:</span>
            <span className="text-white font-medium">
              {formatDuration(completion.actual_seconds || 0)}
            </span>
          </div>
          {step.target_seconds && (
            <div className="flex items-center justify-between">
              <span className="text-[#8E8E93] text-sm">Target Duration:</span>
              <span className="text-[#8E8E93]">
                {formatDuration(step.target_seconds)}
              </span>
            </div>
          )}
          {step.target_seconds &&
            completion.actual_seconds >= step.target_seconds && (
              <div className="mt-2 p-2 bg-green-600/20 rounded-lg">
                <p className="text-green-300 text-xs">
                  ✓ Target duration completed!
                </p>
              </div>
            )}
        </div>
      );

    case "scale":
      return (
        <div className="pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#8E8E93] text-sm">Your Rating:</span>
            <span className="text-white font-medium text-lg">
              {completion.scale_response || 1} / {step.max_value || 10}
            </span>
          </div>
          <div className="w-full bg-[#3C3C3E] rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{
                width: `${((completion.scale_response || 1) / (step.max_value || 10)) * 100}%`,
              }}
            />
          </div>
        </div>
      );

    case "qna":
      return (
        <div className="pt-3">
          <div className="space-y-2">
            <span className="text-[#8E8E93] text-sm">Your Response:</span>
            <div className="bg-[#1C1C1E] rounded-lg p-3">
              <p className="text-white text-sm leading-relaxed">
                {completion.answer || "No response provided"}
              </p>
            </div>
            <div className="text-[#8E8E93] text-xs">
              {(completion.answer || "").length} characters
            </div>
          </div>
        </div>
      );

    case "workout":
      return (
        <div className="pt-3">
          <WorkoutResponseDetail completion={completion} step={step} />
        </div>
      );

    default:
      return null;
  }
}

// Workout Response Detail Component
function WorkoutResponseDetail({
  completion,
  step,
}: {
  completion: any;
  step: FullStepDefinition;
}) {
  const workoutResponses = completion.workout_set_responses || [];
  const workoutExercises = step.full_workout_exercises || [];

  if (workoutResponses.length === 0) {
    return (
      <p className="text-[#8E8E93] text-sm">
        No sets completed in this workout.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {workoutExercises.map((workoutExercise, exerciseIndex) => {
        const exerciseResponses = workoutResponses.filter((response: any) =>
          workoutExercise.workout_sets.some(
            (set: any) => set.id === response.workout_set_id
          )
        );

        if (exerciseResponses.length === 0) return null;

        return (
          <div key={exerciseIndex} className="space-y-2">
            <h5 className="text-white font-medium">
              {workoutExercise.exercise?.name ||
                `Exercise ${exerciseIndex + 1}`}
            </h5>

            <div className="space-y-1">
              {exerciseResponses.map((response: any, responseIndex: number) => {
                const workoutSet = workoutExercise.workout_sets.find(
                  (set: any) => set.id === response.workout_set_id
                );

                return (
                  <div
                    key={responseIndex}
                    className="bg-[#1C1C1E] rounded-lg p-3 flex items-center justify-between"
                  >
                    <span className="text-[#8E8E93] text-sm">
                      Set {workoutSet?.set_number || responseIndex + 1}
                    </span>
                    <div className="flex gap-3 text-sm">
                      {response.actual_weight_kg !== undefined && (
                        <span className="text-white">
                          {response.actual_weight_kg}kg
                        </span>
                      )}
                      {response.actual_reps !== undefined && (
                        <span className="text-white">
                          {response.actual_reps} reps
                        </span>
                      )}
                      {response.actual_seconds !== undefined && (
                        <span className="text-white">
                          {response.actual_seconds}s
                        </span>
                      )}
                      {response.actual_distance_m !== undefined && (
                        <span className="text-white">
                          {response.actual_distance_m}m
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-[#8E8E93] text-xs">
              {exerciseResponses.length} of{" "}
              {workoutExercise.workout_sets.length} sets completed
            </div>
          </div>
        );
      })}
    </div>
  );
}

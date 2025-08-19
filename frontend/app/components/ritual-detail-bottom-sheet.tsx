"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FullRitual, FullStepDefinition } from "@rituals/shared";
import {
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  Dumbbell,
  Hash,
  MapPin,
  MessageSquare,
  Star,
  Timer,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

interface RitualDetailBottomSheetProps {
  ritual: FullRitual | null;
  isOpen: boolean;
  onClose: () => void;
  onStartRitual?: (ritual: FullRitual) => void;
  onForkRitual?: (ritualId: string) => void;
  isMyRitual?: boolean;
}

export function RitualDetailBottomSheet({
  ritual,
  isOpen,
  onClose,
  onStartRitual,
  onForkRitual,
  isMyRitual = false,
}: RitualDetailBottomSheetProps) {
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
              {ritual.name}
            </h2>
            <p className="text-[#8E8E93] text-sm">
              by {ritual.user_id.slice(0, 8)}
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
            {/* Description */}
            {ritual.description && (
              <div>
                <p className="text-[#AEAEB2] leading-relaxed">
                  {ritual.description}
                </p>
              </div>
            )}

            {/* Meta Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#8E8E93] text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{getFrequencyDisplay()}</span>
                </div>
                {ritual.location && (
                  <div className="flex items-center gap-2 text-[#8E8E93] text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{ritual.location}</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#8E8E93] text-sm">
                  <Users className="w-4 h-4" />
                  <span>{ritual.fork_count} forks</span>
                </div>
                <div className="flex items-center gap-2 text-[#8E8E93] text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{ritual.step_definitions?.length || 0} steps</span>
                </div>
              </div>
            </div>

            {/* Category and Gear */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {ritual.category}
                </Badge>
              </div>

              {ritual.gear && ritual.gear.length > 0 && (
                <div>
                  <h4 className="text-white font-medium text-sm mb-2">
                    Required Gear
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {ritual.gear.map((item, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-[#2C2C2E] text-[#8E8E93] border-[#3C3C3E]"
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Steps */}
            <div>
              <h3 className="text-white font-semibold text-lg mb-4">Steps</h3>
              <div className="space-y-3">
                {ritual.step_definitions?.map((step, index) => (
                  <StepDetailCard
                    key={step.id}
                    step={step}
                    stepNumber={index + 1}
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
          {!isMyRitual && (
            <Button
              onClick={() => onForkRitual?.(ritual.id)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              Fork to My Library
            </Button>
          )}

          <Button
            onClick={onClose}
            variant="outline"
            className="w-full border-[#3C3C3E] text-[#8E8E93]"
            size="lg"
          >
            Close
          </Button>
        </div>
      </div>
    </>
  );
}

// Individual Step Detail Card Component
function StepDetailCard({
  step,
  stepNumber,
  isExpanded,
  onToggleExpansion,
  getStepIcon,
  getStepTypeLabel,
  formatDuration,
}: {
  step: FullStepDefinition;
  stepNumber: number;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  getStepIcon: (stepType: string) => React.ReactElement;
  getStepTypeLabel: (stepType: string) => string;
  formatDuration: (seconds: number) => string;
}) {
  return (
    <div className="bg-[#2C2C2E] rounded-xl border border-[#3C3C3E]/30 overflow-hidden">
      {/* Step Header */}
      <div
        className="p-4 cursor-pointer hover:bg-[#3C3C3E]/20 transition-colors"
        onClick={onToggleExpansion}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-sm font-medium">
              {stepNumber}
            </div>
            <div>
              <h4 className="text-white font-medium">{step.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                {getStepIcon(step.type)}
                <span className="text-[#8E8E93] text-sm">
                  {getStepTypeLabel(step.type)}
                </span>
                {step.is_required && (
                  <Badge
                    variant="outline"
                    className="text-xs border-red-500/30 text-red-400"
                  >
                    Required
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-[#8E8E93]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#8E8E93]" />
          )}
        </div>
      </div>

      {/* Step Details */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-[#3C3C3E]/30">
          <StepDetailContent step={step} formatDuration={formatDuration} />
        </div>
      )}
    </div>
  );
}

// Step Detail Content based on step type
function StepDetailContent({
  step,
  formatDuration,
}: {
  step: FullStepDefinition;
  formatDuration: (seconds: number) => string;
}) {
  switch (step.type) {
    case "boolean":
      return (
        <div className="pt-3">
          <p className="text-[#8E8E93] text-sm">
            Complete this step by marking it as done.
          </p>
        </div>
      );

    case "counter":
      return (
        <div className="pt-3 space-y-2">
          {step.target_count && (
            <div className="flex items-center justify-between">
              <span className="text-[#8E8E93] text-sm">Target:</span>
              <span className="text-white font-medium">
                {step.target_count}{" "}
                {step.target_unit_with_data?.display_unit || ""}
              </span>
            </div>
          )}
          <p className="text-[#8E8E93] text-sm">
            Track your progress by entering the actual count.
          </p>
        </div>
      );

    case "timer":
      return (
        <div className="pt-3 space-y-2">
          {step.target_seconds && (
            <div className="flex items-center justify-between">
              <span className="text-[#8E8E93] text-sm">Duration:</span>
              <span className="text-white font-medium">
                {formatDuration(step.target_seconds)}
              </span>
            </div>
          )}
          <p className="text-[#8E8E93] text-sm">
            Use the built-in timer to complete this timed activity.
          </p>
        </div>
      );

    case "scale":
      return (
        <div className="pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#8E8E93] text-sm">Scale:</span>
            <span className="text-white font-medium">
              {step.min_value || 1} - {step.max_value || 10}
            </span>
          </div>
          <p className="text-[#8E8E93] text-sm">
            Rate your experience on the specified scale.
          </p>
        </div>
      );

    case "qna":
      return (
        <div className="pt-3">
          <p className="text-[#8E8E93] text-sm">
            Provide a text response or reflection for this step.
          </p>
        </div>
      );

    case "workout":
      return (
        <div className="pt-3">
          <WorkoutStepDetail step={step} />
        </div>
      );

    default:
      return null;
  }
}

// Workout Step Detail Component
function WorkoutStepDetail({ step }: { step: FullStepDefinition }) {
  const workoutExercises = step.full_workout_exercises || [];

  if (workoutExercises.length === 0) {
    return (
      <p className="text-[#8E8E93] text-sm">
        No exercises configured for this workout step.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {workoutExercises.map((workoutExercise, index) => (
        <div key={index} className="space-y-2">
          <h5 className="text-white font-medium">
            {workoutExercise.exercise?.name || `Exercise ${index + 1}`}
          </h5>

          {/* Exercise Details */}
          {workoutExercise.exercise && (
            <div className="flex gap-4 text-sm text-[#8E8E93]">
              <span>Body: {workoutExercise.exercise.body_part}</span>
              <span>Type: {workoutExercise.exercise.measurement_type}</span>
            </div>
          )}

          {/* Workout Sets */}
          {workoutExercise.workout_sets &&
            workoutExercise.workout_sets.length > 0 && (
              <div className="space-y-1">
                <p className="text-[#8E8E93] text-xs font-medium">Sets:</p>
                {workoutExercise.workout_sets.map((set, setIndex) => (
                  <div
                    key={setIndex}
                    className="bg-[#1C1C1E] rounded-lg p-2 flex items-center justify-between"
                  >
                    <span className="text-[#8E8E93] text-sm">
                      Set {set.set_number}
                    </span>
                    <div className="flex gap-2 text-sm">
                      {set.target_weight_kg && (
                        <span className="text-white">
                          {set.target_weight_kg}kg
                        </span>
                      )}
                      {set.target_reps && (
                        <span className="text-white">
                          {set.target_reps} reps
                        </span>
                      )}
                      {set.target_seconds !== undefined && (
                        <span className="text-white">
                          {set.target_seconds}s
                        </span>
                      )}
                      {set.target_distance_m !== undefined && (
                        <span className="text-white">
                          {set.target_distance_m}m
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      ))}
    </div>
  );
}

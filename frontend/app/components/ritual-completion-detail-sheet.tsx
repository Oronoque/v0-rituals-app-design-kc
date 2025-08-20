"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  FullRitualCompletion,
  FullStepDefinition,
  FullStepResponse,
} from "@rituals/shared";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  Hash,
  MessageSquare,
  Star,
  Timer,
  X,
} from "lucide-react";
import { useState } from "react";

interface RitualCompletionDetailSheetProps {
  completion: FullRitualCompletion | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RitualCompletionDetailSheet({
  completion,
  isOpen,
  onClose,
}: RitualCompletionDetailSheetProps) {
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>(
    {}
  );

  if (!completion) return null;

  const toggleStepExpanded = (stepId: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0m 0s";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const completedAt = new Date(completion.completion_data.completed_at);
  const completedSteps = completion.step_responses.length;
  const totalSteps = completion.step_definitions.length;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-[90vh] bg-[#1C1C1E] border-t border-[#3C3C3E] p-0 rounded-t-3xl"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#3C3C3E]/30 flex-shrink-0">
            <div className="flex-1">
              <h2 className="text-white font-semibold text-xl mb-1">
                {completion.name}
              </h2>
              <div className="flex items-center gap-3 text-sm text-[#8E8E93]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {completedAt.toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {completedAt.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
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
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Completion Summary */}
            <div className="bg-[#2C2C2E] rounded-xl p-4 border border-[#3C3C3E]/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold text-lg">
                  Session Summary
                </h3>
                <Badge className="bg-green-600 text-white">Completed</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-[#8E8E93] text-sm">Steps Completed</p>
                  <p className="text-white font-medium">
                    {completedSteps} of {totalSteps}
                  </p>
                </div>
                <div>
                  <p className="text-[#8E8E93] text-sm">Category</p>
                  <p className="text-white font-medium">
                    {completion.category}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-[#8E8E93] text-sm mb-1">Frequency</p>
                <p className="text-white font-medium capitalize">
                  {completion.frequency.frequency_type}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#3C3C3E] rounded-full h-2 mb-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-[#8E8E93] text-xs text-center">
                {Math.round((completedSteps / totalSteps) * 100)}% Complete
              </p>
            </div>

            {/* Session Notes */}
            {completion.completion_data.notes && (
              <div className="bg-[#2C2C2E] rounded-xl p-4 border border-[#3C3C3E]/30">
                <h4 className="text-white font-medium mb-2">Session Notes</h4>
                <p className="text-[#AEAEB2] text-sm leading-relaxed">
                  {completion.completion_data.notes}
                </p>
              </div>
            )}

            {/* Step Responses */}
            <div>
              <h3 className="text-white font-semibold text-lg mb-4">
                Your Responses
              </h3>
              <div className="space-y-3">
                {completion.step_definitions?.map((step, index) => {
                  const response = completion.step_responses.find(
                    (r) => r.step_definition_id === step.id
                  );
                  const isExpanded = expandedSteps[step.id];
                  const hasResponse = !!response;

                  return (
                    <StepResponseCard
                      key={step.id}
                      step={step}
                      response={response}
                      stepNumber={index + 1}
                      isExpanded={isExpanded}
                      onToggleExpanded={() => toggleStepExpanded(step.id)}
                      hasResponse={hasResponse}
                      formatDuration={formatDuration}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Individual Step Response Card
function StepResponseCard({
  step,
  response,
  stepNumber,
  isExpanded,
  onToggleExpanded,
  hasResponse,
  formatDuration,
}: {
  step: FullStepDefinition;
  response?: FullStepResponse;
  stepNumber: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  hasResponse: boolean;
  formatDuration: (seconds?: number) => string;
}) {
  const getStepIcon = (type: string) => {
    switch (type) {
      case "boolean":
        return <Check className="w-4 h-4" />;
      case "counter":
        return <Hash className="w-4 h-4" />;
      case "timer":
        return <Timer className="w-4 h-4" />;
      case "scale":
        return <Star className="w-4 h-4" />;
      case "qna":
        return <MessageSquare className="w-4 h-4" />;
      case "workout":
        return <Dumbbell className="w-4 h-4" />;
      default:
        return <Hash className="w-4 h-4" />;
    }
  };

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        hasResponse
          ? "bg-green-600/10 border-green-600/30"
          : "bg-[#2C2C2E] border-[#3C3C3E]/30"
      }`}
    >
      {/* Step Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={hasResponse ? onToggleExpanded : undefined}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                hasResponse
                  ? "bg-green-600 text-white"
                  : "bg-gray-500/20 text-gray-400"
              }`}
            >
              {hasResponse ? <Check className="w-4 h-4" /> : stepNumber}
            </div>

            <div className="flex items-center gap-2">
              {getStepIcon(step.type)}
              <span className="text-white font-medium">{step.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasResponse && (
              <Badge className="bg-green-600/20 text-green-300 border-green-600/30">
                Completed
              </Badge>
            )}

            {!hasResponse && (
              <Badge className="bg-gray-600/20 text-gray-400 border-gray-600/30">
                Skipped
              </Badge>
            )}

            {hasResponse && (
              <Button
                variant="ghost"
                size="sm"
                className="text-[#8E8E93] hover:text-white p-1"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Response Details */}
      {isExpanded && hasResponse && response && (
        <div className="px-4 pb-4 border-t border-white/10">
          <StepResponseContent
            step={step}
            response={response}
            formatDuration={formatDuration}
          />
        </div>
      )}
    </div>
  );
}

// Step Response Content Component
function StepResponseContent({
  step,
  response,
  formatDuration,
}: {
  step: FullStepDefinition;
  response: FullStepResponse;
  formatDuration: (seconds?: number) => string;
}) {
  switch (step.type) {
    case "boolean":
      return (
        <div className="py-3">
          <div className="flex items-center justify-between">
            <span className="text-[#8E8E93] text-sm">Your Response:</span>
            <span
              className={`font-medium ${
                response.value_boolean ? "text-green-400" : "text-red-400"
              }`}
            >
              {response.value_boolean ? "Yes" : "No"}
            </span>
          </div>
        </div>
      );

    case "counter":
      return (
        <div className="py-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#8E8E93] text-sm">Actual Count:</span>
            <span className="text-white font-medium">
              {response.actual_count || 0}{" "}
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
        <div className="py-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#8E8E93] text-sm">Actual Duration:</span>
            <span className="text-white font-medium">
              {formatDuration(response.actual_seconds)}
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
            response.actual_seconds &&
            response.actual_seconds >= step.target_seconds && (
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
        <div className="py-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#8E8E93] text-sm">Your Rating:</span>
            <span className="text-white font-medium">
              {response.scale_response}/10
            </span>
          </div>
          <div className="w-full bg-[#3C3C3E] rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((response.scale_response || 0) / 10) * 100}%`,
              }}
            />
          </div>
        </div>
      );

    case "qna":
      return (
        <div className="py-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#8E8E93] text-sm">Your Response:</span>
            <span className="text-[#8E8E93] text-xs">
              {response.answer?.length || 0} characters
            </span>
          </div>
          <div className="bg-[#3C3C3E] rounded-lg p-3">
            <p className="text-white text-sm leading-relaxed">
              {response.answer || "No response provided"}
            </p>
          </div>
        </div>
      );

    case "workout":
      return <WorkoutResponseDetail response={response} step={step} />;

    default:
      return null;
  }
}

// Workout Response Detail Component
function WorkoutResponseDetail({
  response,
  step,
}: {
  response: FullStepResponse;
  step: FullStepDefinition;
}) {
  const workoutResponses = response.workout_set_responses || [];
  const workoutExercises = step.full_workout_exercises || [];

  return (
    <div className="py-3 space-y-4">
      <div className="text-[#8E8E93] text-sm">
        {workoutResponses.length} sets completed
      </div>

      {workoutExercises.map((workoutExercise, exerciseIndex) => {
        const exerciseResponses = workoutResponses.filter((response) =>
          workoutExercise.workout_sets.some(
            (set) => set.id === response.workout_set_id
          )
        );

        return (
          <div key={exerciseIndex} className="space-y-2">
            <h5 className="text-white font-medium">
              {workoutExercise.exercise?.name ||
                `Exercise ${exerciseIndex + 1}`}
            </h5>

            <div className="space-y-2">
              {exerciseResponses.map((response, responseIndex) => {
                const correspondingSet = workoutExercise.workout_sets.find(
                  (set) => set.id === response.workout_set_id
                );

                return (
                  <div
                    key={responseIndex}
                    className="bg-[#3C3C3E] rounded-lg p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[#8E8E93] text-xs">
                        Set {responseIndex + 1}
                      </span>
                      <Check className="w-4 h-4 text-green-400" />
                    </div>

                    <div className="space-y-2">
                      {/* Target vs Actual Values */}
                      {(correspondingSet?.target_weight_kg ||
                        response.actual_weight_kg) && (
                        <div className="flex justify-between items-center">
                          <span className="text-[#8E8E93] text-xs">
                            Weight:
                          </span>
                          <div className="text-xs">
                            {correspondingSet?.target_weight_kg && (
                              <span className="text-[#8E8E93]">
                                Target: {correspondingSet.target_weight_kg}kg
                              </span>
                            )}
                            {correspondingSet?.target_weight_kg &&
                              response.actual_weight_kg && (
                                <span className="mx-2 text-[#8E8E93]">→</span>
                              )}
                            {response.actual_weight_kg && (
                              <span className="text-white font-medium">
                                Actual: {response.actual_weight_kg}kg
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {(correspondingSet?.target_reps ||
                        response.actual_reps) && (
                        <div className="flex justify-between items-center">
                          <span className="text-[#8E8E93] text-xs">Reps:</span>
                          <div className="text-xs">
                            {correspondingSet?.target_reps && (
                              <span className="text-[#8E8E93]">
                                Target: {correspondingSet.target_reps}
                              </span>
                            )}
                            {correspondingSet?.target_reps &&
                              response.actual_reps && (
                                <span className="mx-2 text-[#8E8E93]">→</span>
                              )}
                            {response.actual_reps && (
                              <span className="text-white font-medium">
                                Actual: {response.actual_reps}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {(correspondingSet?.target_seconds ||
                        response.actual_seconds) && (
                        <div className="flex justify-between items-center">
                          <span className="text-[#8E8E93] text-xs">
                            Duration:
                          </span>
                          <div className="text-xs">
                            {correspondingSet?.target_seconds && (
                              <span className="text-[#8E8E93]">
                                Target:{" "}
                                {Math.floor(
                                  correspondingSet.target_seconds / 60
                                )}
                                m {correspondingSet.target_seconds % 60}s
                              </span>
                            )}
                            {correspondingSet?.target_seconds &&
                              response.actual_seconds && (
                                <span className="mx-2 text-[#8E8E93]">→</span>
                              )}
                            {response.actual_seconds && (
                              <span className="text-white font-medium">
                                Actual:{" "}
                                {Math.floor(response.actual_seconds / 60)}m{" "}
                                {response.actual_seconds % 60}s
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {(correspondingSet?.target_distance_m ||
                        response.actual_distance_m) && (
                        <div className="flex justify-between items-center">
                          <span className="text-[#8E8E93] text-xs">
                            Distance:
                          </span>
                          <div className="text-xs">
                            {correspondingSet?.target_distance_m && (
                              <span className="text-[#8E8E93]">
                                Target: {correspondingSet.target_distance_m}m
                              </span>
                            )}
                            {correspondingSet?.target_distance_m &&
                              response.actual_distance_m && (
                                <span className="mx-2 text-[#8E8E93]">→</span>
                              )}
                            {response.actual_distance_m && (
                              <span className="text-white font-medium">
                                Actual: {response.actual_distance_m}m
                              </span>
                            )}
                          </div>
                        </div>
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

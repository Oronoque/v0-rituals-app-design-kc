"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useCompleteRitual } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import {
  FullRitual,
  completeRitualSchema,
  prettifyError,
  type CompleteRitualSchemaType,
} from "@rituals/shared";
import {
  ArrowLeft,
  Check,
  CheckCircle,
  Hash,
  Pause,
  Play,
  Star,
  Timer,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { RitualCompletionReviewSheet } from "./ritual-completion-review-sheet";
import { DurationPicker } from "./ui/duration-picker";

// Validation function for ritual completion data
function validateCompletionData(
  ritual: FullRitual,
  stepCompletions: Record<number, any>,
  notes: string
): CompleteRitualSchemaType | undefined {
  // Transform form data to API format
  const step_responses = ritual.step_definitions.map((step, index) => {
    const completion = stepCompletions[index];

    if (!completion) {
      if (step.is_required) {
        throw new Error(
          `Step ${index + 1} (${step.name}) is required but not completed`
        );
      }
      // For optional steps, provide default values
      switch (step.type) {
        case "boolean":
          return {
            step_definition_id: step.id,
            type: "boolean" as const,
            value_boolean: false,
          };
        case "counter":
          return {
            step_definition_id: step.id,
            type: "counter" as const,
            actual_count: 0,
          };
        case "qna":
          return {
            step_definition_id: step.id,
            type: "qna" as const,
            answer: "",
          };
        case "timer":
          return {
            step_definition_id: step.id,
            type: "timer" as const,
            actual_seconds: 0,
          };
        case "scale":
          return {
            step_definition_id: step.id,
            type: "scale" as const,
            scale_response: step.min_value || 1,
          };
        case "workout":
          return {
            step_definition_id: step.id,
            type: "workout" as const,
            workout_set_responses: [],
          };
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }
    }

    switch (step.type) {
      case "boolean":
        return {
          step_definition_id: step.id,
          type: "boolean" as const,
          value_boolean: !!completion.value_boolean,
        };
      case "counter":
        return {
          step_definition_id: step.id,
          type: "counter" as const,
          actual_count: completion.actual_count || 0,
        };
      case "qna":
        return {
          step_definition_id: step.id,
          type: "qna" as const,
          answer: completion.answer || "",
        };
      case "timer":
        return {
          step_definition_id: step.id,
          type: "timer" as const,
          actual_seconds: completion.actual_seconds || 0,
        };
      case "scale":
        return {
          step_definition_id: step.id,
          type: "scale" as const,
          scale_response: completion.scale_response || 1,
        };
      case "workout":
        return {
          step_definition_id: step.id,
          type: "workout" as const,
          workout_set_responses: completion.workout_set_responses || [],
        };
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  });

  const completionData: CompleteRitualSchemaType = {
    ritual_id: ritual.id,
    notes: notes.trim() || undefined,
    step_responses,
  };

  console.log("Completion data:", completionData);
  const validatedData = completeRitualSchema.safeParse(completionData);

  if (!validatedData.success) {
    const errorMessage = prettifyError(validatedData.error);
    console.log(errorMessage);

    // Split at the cross (×) symbol or handle specific validation errors
    const errors = errorMessage.split("✖");
    const errorMap: Record<string, string[]> = errors.reduce((acc, error) => {
      const [mainError, ...innerErrors] = error.split("→").map((e) => e.trim());
      acc[mainError] = innerErrors;
      return acc;
    }, {});

    // Handle each error type separately
    for (const [error, description] of Object.entries(errorMap)) {
      if (error.length > 0) {
        toast.error(error, {
          description: description.join("\n"),
        });
      }
    }
    return undefined;
  }

  return validatedData.data;
}

interface StepCompletionFormProps {
  ritual: FullRitual;
  onComplete: () => void;
  onCancel: () => void;
}

export function StepCompletionForm({
  ritual,
  onComplete,
  onCancel,
}: StepCompletionFormProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepCompletions, setStepCompletions] = useState<Record<number, any>>(
    {}
  );
  const [notes, setNotes] = useState("");
  const [showReviewSheet, setShowReviewSheet] = useState(false);
  const [timerState, setTimerState] = useState<{
    isRunning: boolean;
    timeLeft: number;
    startTime: number;
  }>({
    isRunning: false,
    timeLeft: 0,
    startTime: 0,
  });
  const { mutate: completeRitual, isPending: isLoading } = useCompleteRitual();

  const totalSteps = ritual.step_definitions.length;
  const completedSteps = Object.values(stepCompletions).filter(
    (completion) => completion?.completed
  ).length;
  const requiredSteps = ritual.step_definitions.filter(
    (step) => step.is_required
  ).length;
  const completedRequiredSteps = ritual.step_definitions.filter(
    (step, index) => step.is_required && stepCompletions[index]?.completed
  ).length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const handleStepComplete = (stepIndex: number, data: any) => {
    setStepCompletions((prev) => ({ ...prev, [stepIndex]: data }));
  };

  const markStepCompleted = () => {
    const currentCompletion = stepCompletions[currentStepIndex];
    if (currentCompletion) {
      setStepCompletions((prev) => ({
        ...prev,
        [currentStepIndex]: {
          ...currentCompletion,
          completed: true,
        },
      }));
    }
  };

  const handleShowReview = () => {
    setShowReviewSheet(true);
  };

  const handleConfirmComplete = async () => {
    try {
      // Validate completion data
      const validatedData = validateCompletionData(
        ritual,
        stepCompletions,
        notes
      );
      if (!validatedData) {
        return;
      }

      // Make API request
      const { ritual_id, ...completion } = validatedData;
      await completeRitual({ id: ritual_id, completion });

      // Handle success
      setShowReviewSheet(false);
      onComplete();
    } catch (error) {
      console.error("Error completing ritual:", error);
      toast.error("Failed to complete ritual", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  const currentStep = ritual.step_definitions[currentStepIndex];
  const isStepCompleted = stepCompletions[currentStepIndex]?.completed;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#3C3C3E]/30 flex-shrink-0">
        <div className="flex items-center flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-[#AEAEB2] hover:text-white p-2 mr-3"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-medium text-lg truncate">
              {ritual.name}
            </h1>
            <p className="text-[#AEAEB2] text-sm truncate">
              Step {currentStepIndex + 1} of {totalSteps}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {/* Progress */}
        <Card className="mb-6 bg-[#2C2C2E] border-[#3C3C3E]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">Progress</span>
              <span className="text-[#AEAEB2] text-sm">
                {completedSteps}/{totalSteps} steps
                {requiredSteps > 0 &&
                  ` • ${completedRequiredSteps}/${requiredSteps} required`}
              </span>
            </div>
            <Progress value={progress} className="w-full h-2 bg-[#3C3C3E]" />
            <div className="text-[#AEAEB2] text-xs mt-1">
              {Math.round(progress)}% complete
            </div>
          </CardContent>
        </Card>

        {/* Current Step */}
        {currentStep && (
          <Card className="mb-6 bg-[#2C2C2E] border-[#3C3C3E]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">
                  {currentStep.name}
                </CardTitle>
                {isStepCompleted && (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Step type specific input */}
                <div className="space-y-4">
                  {currentStep.type === "boolean" && (
                    <BooleanStepInput
                      step={currentStep}
                      completion={isStepCompleted}
                      onComplete={(completion) =>
                        handleStepComplete(currentStepIndex, completion)
                      }
                    />
                  )}

                  {currentStep.type === "counter" && (
                    <CounterStepInput
                      step={currentStep}
                      completion={isStepCompleted}
                      onComplete={(completion) =>
                        handleStepComplete(currentStepIndex, completion)
                      }
                    />
                  )}

                  {currentStep.type === "scale" && (
                    <ScaleStepInput
                      step={currentStep}
                      completion={isStepCompleted}
                      onComplete={(completion) =>
                        handleStepComplete(currentStepIndex, completion)
                      }
                    />
                  )}

                  {currentStep.type === "timer" && (
                    <TimerStepInput
                      step={currentStep}
                      completion={isStepCompleted}
                      timerState={timerState}
                      setTimerState={setTimerState}
                      onComplete={(completion) =>
                        handleStepComplete(currentStepIndex, completion)
                      }
                    />
                  )}

                  {currentStep.type === "qna" && (
                    <QnaStepInput
                      step={currentStep}
                      completion={isStepCompleted}
                      onComplete={(completion) =>
                        handleStepComplete(currentStepIndex, completion)
                      }
                    />
                  )}

                  {currentStep.type === "workout" && (
                    <ExerciseSetCompletion
                      step={currentStep}
                      completion={isStepCompleted}
                      onComplete={(completion) =>
                        handleStepComplete(currentStepIndex, completion)
                      }
                    />
                  )}
                </div>

                {/* Optional notes for non-QnA steps */}
                {currentStep.type !== "qna" && (
                  <div className="space-y-2">
                    <label className="text-white text-sm">
                      Notes (optional)
                    </label>
                    <Textarea
                      value={isStepCompleted?.notes || ""}
                      onChange={(e) => {
                        const completion = {
                          ...(isStepCompleted || { completed: true }),
                          notes: e.target.value,
                        };
                        handleStepComplete(currentStepIndex, completion);
                      }}
                      placeholder="How did this step go?"
                      className="bg-[#3C3C3E] border-[#3C3C3E] text-white"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="space-y-3 mt-6">
          {/* Complete Step Button - only show if step has data but isn't completed */}
          {stepCompletions[currentStepIndex] && !isStepCompleted && (
            <Button
              onClick={markStepCompleted}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Complete Step
            </Button>
          )}

          <div className="flex gap-3">
            {currentStepIndex > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStepIndex(currentStepIndex - 1)}
                className="flex-1 border-[#3C3C3E] text-[#AEAEB2] hover:text-white"
              >
                Previous
              </Button>
            )}

            {currentStepIndex < totalSteps - 1 ? (
              <Button
                onClick={() => setCurrentStepIndex(currentStepIndex + 1)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
              >
                {isStepCompleted ? "Next Step" : "Skip Step"}
              </Button>
            ) : (
              <Button
                onClick={handleShowReview}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                disabled={completedRequiredSteps < requiredSteps}
              >
                <Check className="w-4 h-4 mr-2" />
                Review & Complete
              </Button>
            )}
          </div>
        </div>

        {/* Session Notes */}
        <Card className="mt-6 bg-[#2C2C2E] border-[#3C3C3E]">
          <CardHeader>
            <CardTitle className="text-white text-lg">Session Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How was your overall experience with this ritual?"
              className="bg-[#3C3C3E] border-[#3C3C3E] text-white"
              rows={3}
            />
          </CardContent>
        </Card>
      </div>

      {/* Review Sheet */}
      <RitualCompletionReviewSheet
        ritual={ritual}
        stepCompletions={stepCompletions}
        notes={notes}
        isOpen={showReviewSheet}
        onClose={() => setShowReviewSheet(false)}
        onConfirmComplete={handleConfirmComplete}
        isLoading={isLoading}
      />
    </div>
  );
}

// Exercise Set Completion Component
function ExerciseSetCompletion({
  step,
  completion,
  onComplete,
}: {
  step: any; // FullStepDefinition with full_workout_exercises
  completion: any;
  onComplete: (completion: any) => void;
}) {
  // Initialize set responses based on the step definition's workout sets
  const [setResponses, setSetResponses] = useState<Record<string, any>>(() => {
    if (completion?.workout_set_responses) {
      return completion.workout_set_responses.reduce(
        (acc: any, response: any) => {
          acc[response.workout_set_id] = response;
          return acc;
        },
        {}
      );
    }
    return {};
  });

  // Track which sets are expanded for input
  const [expandedSets, setExpandedSets] = useState<Record<string, boolean>>({});

  const workoutExercises = step.full_workout_exercises || [];

  const handleSetResponse = (
    workout_set_id: string,
    field: string,
    value: any
  ) => {
    setSetResponses((prev: any) => ({
      ...prev,
      [workout_set_id]: {
        ...prev[workout_set_id],
        workout_set_id,
        [field]: value,
      },
    }));
  };

  const toggleSetExpanded = (
    workout_set_id: string,
    workoutSet: any,
    exercise: any
  ) => {
    setExpandedSets((prev) => ({
      ...prev,
      [workout_set_id]: !prev[workout_set_id],
    }));

    // Initialize set response with measurement type if not exists
    if (!setResponses[workout_set_id]) {
      setSetResponses((prev: any) => ({
        ...prev,
        [workout_set_id]: {
          workout_set_id,
          exercise_measurement_type: exercise.measurement_type,
          // Initialize with target values as starting point
          ...(exercise.measurement_type === "weight_reps" ||
          exercise.measurement_type === "reps"
            ? { actual_reps: workoutSet.target_reps || 0 }
            : {}),
          ...(exercise.measurement_type === "weight_reps"
            ? { actual_weight_kg: workoutSet.target_weight_kg || 0 }
            : {}),
          ...(exercise.measurement_type === "time"
            ? { actual_seconds: workoutSet.target_seconds || 0 }
            : {}),
          ...(exercise.measurement_type === "distance_time"
            ? {
                actual_seconds: workoutSet.target_seconds || 0,
                actual_distance_m: workoutSet.target_distance_m || 0,
              }
            : {}),
        },
      }));
    }
  };

  const markSetCompleted = (workout_set_id: string) => {
    setSetResponses((prev: any) => ({
      ...prev,
      [workout_set_id]: {
        ...prev[workout_set_id],
        completed: true,
      },
    }));
    // Collapse the set after completion
    setExpandedSets((prev) => ({
      ...prev,
      [workout_set_id]: false,
    }));
  };

  const removeSetCompletion = (workout_set_id: string) => {
    setSetResponses((prev: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [workout_set_id]: _, ...rest } = prev;
      return rest;
    });
    setExpandedSets((prev) => ({
      ...prev,
      [workout_set_id]: false,
    }));
  };

  // Use ref to store stable reference to onComplete to prevent infinite loops
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Update completion when setResponses changes - only send completed sets
  useEffect(() => {
    const completedResponses = Object.values(setResponses).filter(
      (response: any) => response.completed
    );
    const workout_set_responses = completedResponses.map((response: any) => {
      // Remove the completed flag before sending to API
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { completed, ...apiResponse } = response;
      return apiResponse;
    });

    const totalSets = workoutExercises.reduce(
      (sum: number, exercise: any) => sum + exercise.workout_sets.length,
      0
    );

    // Only mark step as completed if ALL sets are completed
    const isStepCompleted =
      completedResponses.length === totalSets && totalSets > 0;

    onCompleteRef.current({
      workout_set_responses,
      completed: isStepCompleted,
    });
  }, [setResponses, workoutExercises]);

  const totalSets = workoutExercises.reduce(
    (sum: number, exercise: any) => sum + exercise.workout_sets.length,
    0
  );
  const completedSets = Object.values(setResponses).filter(
    (response: any) => response.completed
  ).length;

  const getFieldsForMeasurementType = (measurementType: string) => {
    switch (measurementType) {
      case "weight_reps":
        return ["actual_weight_kg", "actual_reps"];
      case "reps":
        return ["actual_reps"];
      case "time":
        return ["actual_seconds"];
      case "distance_time":
        return ["actual_distance_m", "actual_seconds"];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-white font-medium">{step.name}</h3>
        <p className="text-gray-400 text-sm">
          {workoutExercises.length} exercise
          {workoutExercises.length !== 1 ? "s" : ""} • {totalSets} sets total
        </p>
        <div className="text-sm text-gray-300 mt-1">
          Progress: {completedSets}/{totalSets} sets completed
        </div>
      </div>

      <div className="space-y-4">
        {workoutExercises.map((workoutExercise: any, exerciseIndex: number) => (
          <div key={exerciseIndex} className="space-y-3">
            <div className="text-white font-medium">
              {workoutExercise.exercise.name}
              <span className="text-gray-400 text-sm ml-2">
                ({workoutExercise.exercise.body_part})
              </span>
            </div>

            {workoutExercise.workout_sets.map((workoutSet: any) => {
              const response = setResponses[workoutSet.id];
              const isCompleted = response?.completed;
              const isExpanded = expandedSets[workoutSet.id];
              const fields = getFieldsForMeasurementType(
                workoutExercise.exercise_measurement_type
              );

              return (
                <Card
                  key={workoutSet.id}
                  className={cn(
                    "bg-[#3C3C3E] border-[#3C3C3E]",
                    isCompleted && "bg-green-600/20 border-green-600/30"
                  )}
                >
                  <CardContent className="p-4">
                    {/* Set Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-white font-medium">
                          Set {workoutSet.set_number}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSetCompletion(workoutSet.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Reset
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              toggleSetExpanded(
                                workoutSet.id,
                                workoutSet,
                                workoutExercise.exercise
                              )
                            }
                            className="border-[#3C3C3E] text-white"
                          >
                            {isExpanded ? "Cancel" : "Start Set"}
                          </Button>
                        )}
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                            isCompleted
                              ? "bg-green-600 border-green-600"
                              : "border-gray-400"
                          )}
                        >
                          {isCompleted && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Input Fields (when expanded) */}
                    {isExpanded && !isCompleted && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                          {fields.includes("actual_weight_kg") && (
                            <div>
                              <div className="text-xs text-gray-400 mb-1">
                                Target: {workoutSet.target_weight_kg || 0}kg
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  step="0.5"
                                  value={response?.actual_weight_kg || ""}
                                  onChange={(e) =>
                                    handleSetResponse(
                                      workoutSet.id,
                                      "actual_weight_kg",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  placeholder="Weight"
                                  className="bg-[#2C2C2E] border-[#2C2C2E] text-white"
                                />
                                <span className="text-gray-400 text-sm">
                                  kg
                                </span>
                              </div>
                            </div>
                          )}

                          {fields.includes("actual_reps") && (
                            <div>
                              <div className="text-xs text-gray-400 mb-1">
                                Target: {workoutSet.target_reps || 0} reps
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={response?.actual_reps || ""}
                                  onChange={(e) =>
                                    handleSetResponse(
                                      workoutSet.id,
                                      "actual_reps",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  placeholder="Reps"
                                  className="bg-[#2C2C2E] border-[#2C2C2E] text-white"
                                />
                                <span className="text-gray-400 text-sm">
                                  reps
                                </span>
                              </div>
                            </div>
                          )}

                          {fields.includes("actual_seconds") && (
                            <div>
                              <div className="text-xs text-gray-400 mb-1">
                                Target:{" "}
                                {Math.floor(
                                  (workoutSet.target_seconds || 0) / 60
                                )}
                                m {(workoutSet.target_seconds || 0) % 60}s
                              </div>
                              <DurationPicker
                                value={response?.actual_seconds || 0}
                                onChange={(seconds) =>
                                  handleSetResponse(
                                    workoutSet.id,
                                    "actual_seconds",
                                    seconds
                                  )
                                }
                                label=""
                                placeholder="Duration"
                                showClock={false}
                                showArrow={false}
                              />
                            </div>
                          )}

                          {fields.includes("actual_distance_m") && (
                            <div>
                              <div className="text-xs text-gray-400 mb-1">
                                Target: {workoutSet.target_distance_m || 0}m
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={response?.actual_distance_m || ""}
                                  onChange={(e) =>
                                    handleSetResponse(
                                      workoutSet.id,
                                      "actual_distance_m",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  placeholder="Distance"
                                  className="bg-[#2C2C2E] border-[#2C2C2E] text-white"
                                />
                                <span className="text-gray-400 text-sm">m</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={() => markSetCompleted(workoutSet.id)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Complete Set
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))}
      </div>

      {completedSets === totalSets && totalSets > 0 && (
        <div className="text-center p-3 bg-green-600/20 rounded-lg border border-green-600/30">
          <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
          <p className="text-green-300 text-sm">All sets completed! 🎉</p>
        </div>
      )}
    </div>
  );
}

// Boolean Step Input Component
function BooleanStepInput({
  step,
  completion,
  onComplete,
}: {
  step: any;
  completion: any;
  onComplete: (completion: any) => void;
}) {
  const [selectedValue, setSelectedValue] = useState<boolean | null>(
    completion?.value_boolean ?? null
  );

  const handleSelection = (value: boolean) => {
    setSelectedValue(value);
    // Don't auto-complete the step, just store the value
    onComplete({ value_boolean: value, completed: false });
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#3C3C3E] rounded-xl p-6">
        <div className="flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-blue-400" />
        </div>

        <div className="text-center mb-6">
          <h3 className="text-white font-medium text-lg mb-2">{step.name}</h3>
          <p className="text-gray-400 text-sm">Choose your response below.</p>
        </div>

        <div className="space-y-3">
          <div
            onClick={() => handleSelection(true)}
            className={cn(
              "w-full p-4 rounded-lg border-2 cursor-pointer transition-all",
              selectedValue === true
                ? "border-green-500 bg-green-500/20"
                : "border-[#3C3C3E] bg-[#2C2C2E] hover:border-green-500/50"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">Yes</span>
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  selectedValue === true
                    ? "border-green-500 bg-green-500"
                    : "border-gray-400"
                )}
              >
                {selectedValue === true && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            </div>
          </div>

          <div
            onClick={() => handleSelection(false)}
            className={cn(
              "w-full p-4 rounded-lg border-2 cursor-pointer transition-all",
              selectedValue === false
                ? "border-red-500 bg-red-500/20"
                : "border-[#3C3C3E] bg-[#2C2C2E] hover:border-red-500/50"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">No</span>
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  selectedValue === false
                    ? "border-red-500 bg-red-500"
                    : "border-gray-400"
                )}
              >
                {selectedValue === false && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            </div>
          </div>
        </div>

        {selectedValue !== null && (
          <div className="mt-4 text-center p-3 bg-blue-600/20 rounded-lg border border-blue-600/30">
            <p className="text-blue-300 text-sm">
              Response saved: {selectedValue ? "Yes" : "No"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Counter Step Input Component
function CounterStepInput({
  step,
  completion,
  onComplete,
}: {
  step: any;
  completion: any;
  onComplete: (completion: any) => void;
}) {
  const [actualValue, setActualValue] = useState(completion?.actual_count || 0);
  const targetCount = step.target_count || 0;
  const unit = step.target_unit_with_data?.display_unit || "";

  const handleValueChange = (value: number) => {
    setActualValue(value);
    onComplete({
      actual_count: value,
      completed: false, // Don't auto-complete
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#3C3C3E] rounded-xl p-6">
        <div className="flex items-center justify-center mb-4">
          <Hash className="w-8 h-8 text-blue-400" />
        </div>

        <div className="text-center mb-6">
          <h3 className="text-white font-medium text-lg mb-2">
            Track Your Progress
          </h3>
          {targetCount > 0 && (
            <p className="text-gray-400 text-sm">
              Target:{" "}
              <span className="text-blue-400 font-medium">
                {targetCount} {unit}
              </span>
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <label className="text-white text-sm font-medium mb-2 block">
              Actual Amount
            </label>
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleValueChange(Math.max(0, actualValue - 1))}
                className="w-10 h-10 rounded-full border-gray-600 text-gray-300 hover:text-white"
              >
                -
              </Button>
              <Input
                type="number"
                value={actualValue}
                onChange={(e) => handleValueChange(Number(e.target.value) || 0)}
                className="w-24 text-center bg-[#2C2C2E] border-[#2C2C2E] text-white text-xl font-bold"
                min="0"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleValueChange(actualValue + 1)}
                className="w-10 h-10 rounded-full border-gray-600 text-gray-300 hover:text-white"
              >
                +
              </Button>
            </div>
            {unit && <p className="text-gray-400 text-sm mt-2">{unit}</p>}
          </div>

          {actualValue > 0 && (
            <div className="text-center p-3 bg-blue-600/20 rounded-lg border border-blue-600/30">
              <p className="text-blue-300 text-sm">
                Progress: {actualValue} {unit}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Scale Step Input Component
function ScaleStepInput({
  step,
  completion,
  onComplete,
}: {
  step: any;
  completion: any;
  onComplete: (completion: any) => void;
}) {
  const minValue = step.min_value || 1;
  const maxValue = step.max_value || 10;
  const [scaleValue, setScaleValue] = useState(
    completion?.scale_response || minValue
  );

  const handleValueChange = (value: number) => {
    setScaleValue(value);
    onComplete({
      scale_response: value,
      completed: false, // Don't auto-complete
    });
  };

  const getScaleColor = (value: number) => {
    const ratio = (value - minValue) / (maxValue - minValue);
    if (ratio <= 0.3) return "text-red-400";
    if (ratio <= 0.7) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#3C3C3E] rounded-xl p-6">
        <div className="flex items-center justify-center mb-4">
          <Star className="w-8 h-8 text-blue-400" />
        </div>

        <div className="text-center mb-6">
          <h3 className="text-white font-medium text-lg mb-2">
            Rate Your Experience
          </h3>
          <p className="text-gray-400 text-sm">
            Scale: {minValue} - {maxValue}
          </p>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <div
              className={`text-4xl font-bold mb-4 ${getScaleColor(scaleValue)}`}
            >
              {scaleValue}
            </div>

            <Slider
              value={[scaleValue]}
              onValueChange={(value) => handleValueChange(value[0])}
              min={minValue}
              max={maxValue}
              step={1}
              className="w-full"
            />

            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>{minValue}</span>
              <span>{maxValue}</span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {Array.from(
              { length: Math.min(maxValue - minValue + 1, 10) },
              (_, i) => {
                const value = minValue + i;
                return (
                  <Button
                    key={value}
                    variant={scaleValue === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleValueChange(value)}
                    className={`h-12 ${
                      scaleValue === value
                        ? "bg-blue-600 text-white"
                        : "border-gray-600 text-gray-300 hover:text-white"
                    }`}
                  >
                    {value}
                  </Button>
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Timer Step Input Component
function TimerStepInput({
  step,
  completion,
  timerState,
  setTimerState,
  onComplete,
}: {
  step: any;
  completion: any;
  timerState: any;
  setTimerState: any;
  onComplete: (completion: any) => void;
}) {
  const targetSeconds = step.target_seconds || 300;
  const [timeElapsed, setTimeElapsed] = useState(
    completion?.actual_seconds || 0
  );
  const [displayTime, setDisplayTime] = useState(0);

  const stopTimer = useCallback(() => {
    if (timerState.isRunning) {
      const currentElapsed = Math.floor(
        (Date.now() - timerState.startTime) / 1000
      );
      const totalElapsed = timeElapsed + currentElapsed;
      setTimeElapsed(totalElapsed);
      setDisplayTime(totalElapsed);
    }

    setTimerState({ isRunning: false, timeLeft: 0, startTime: 0 });

    onComplete({
      actual_seconds: displayTime,
      completed: displayTime >= targetSeconds, // Only complete if target reached
    });
  }, [
    timerState.isRunning,
    timerState.startTime,
    timeElapsed,
    setTimerState,
    onComplete,
    displayTime,
    targetSeconds,
  ]);

  // Update timer display every second when running
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerState.isRunning) {
      interval = setInterval(() => {
        const currentElapsed = Math.floor(
          (Date.now() - timerState.startTime) / 1000
        );
        const totalElapsed = timeElapsed + currentElapsed;
        setDisplayTime(totalElapsed);

        // Auto-complete when target is reached
        if (totalElapsed >= targetSeconds) {
          stopTimer();
        }
      }, 1000);
    } else {
      setDisplayTime(timeElapsed);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    timerState.isRunning,
    timerState.startTime,
    timeElapsed,
    targetSeconds,
    stopTimer,
  ]);

  const startTimer = () => {
    setTimerState({
      isRunning: true,
      timeLeft: targetSeconds - timeElapsed,
      startTime: Date.now(),
    });
  };

  const skipTimer = () => {
    setTimerState({ isRunning: false, timeLeft: 0, startTime: 0 });

    onComplete({
      actual_seconds: displayTime,
      completed: false, // Don't auto-complete on skip
    });
  };

  const resetTimer = () => {
    setTimeElapsed(0);
    setDisplayTime(0);
    setTimerState({ isRunning: false, timeLeft: 0, startTime: 0 });

    onComplete({
      actual_seconds: 0,
      completed: false,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = Math.min((displayTime / targetSeconds) * 100, 100);
  const isCompleted = displayTime >= targetSeconds;

  return (
    <div className="space-y-4">
      <div className="bg-[#3C3C3E] rounded-xl p-6">
        <div className="flex items-center justify-center mb-4">
          <Timer className="w-8 h-8 text-blue-400" />
        </div>

        <div className="text-center mb-6">
          <h3 className="text-white font-medium text-lg mb-2">{step.name}</h3>
          <p className="text-gray-400 text-sm">
            Target Duration:{" "}
            <span className="text-blue-400 font-medium">
              {formatTime(targetSeconds)}
            </span>
          </p>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <div
              className={cn(
                "text-5xl font-mono font-bold mb-4",
                isCompleted ? "text-green-400" : "text-white"
              )}
            >
              {formatTime(displayTime)}
            </div>

            <Progress value={progress} className="w-full h-3 mb-4" />

            <div className="flex justify-center space-x-3">
              {!timerState.isRunning ? (
                <>
                  <Button
                    onClick={startTimer}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3"
                    disabled={isCompleted}
                  >
                    <Play className="w-5 h-5 mr-2" />
                    {timeElapsed > 0 ? "Resume" : "Start"}
                  </Button>
                  {timeElapsed > 0 && !isCompleted && (
                    <Button
                      onClick={resetTimer}
                      variant="outline"
                      className="border-[#3C3C3E] text-white px-6 py-3"
                    >
                      Reset
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    onClick={stopTimer}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3"
                  >
                    <Pause className="w-5 h-5 mr-2" />
                    Stop
                  </Button>
                  <Button
                    onClick={skipTimer}
                    variant="outline"
                    className="border-[#3C3C3E] text-white px-6 py-3"
                  >
                    Skip
                  </Button>
                </>
              )}
            </div>

            {isCompleted && (
              <div className="text-center p-3 bg-green-600/20 rounded-lg border border-green-600/30 mt-4">
                <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <p className="text-green-300 text-sm">Timer completed! 🎉</p>
              </div>
            )}

            {!isCompleted && displayTime > 0 && (
              <div className="text-center p-3 bg-blue-600/20 rounded-lg border border-blue-600/30 mt-4">
                <p className="text-blue-300 text-sm">
                  Progress: {formatTime(displayTime)} /{" "}
                  {formatTime(targetSeconds)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// QnA Step Input Component
function QnaStepInput({
  completion,
  onComplete,
}: {
  step: any;
  completion: any;
  onComplete: (completion: any) => void;
}) {
  const [response, setResponse] = useState(completion?.answer || "");

  const handleResponseChange = (value: string) => {
    setResponse(value);
    onComplete({
      answer: value,
      completed: false, // Don't auto-complete
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#3C3C3E] rounded-xl p-6">
        <div className="text-center mb-6">
          <h3 className="text-white font-medium text-lg mb-2">
            Share Your Thoughts
          </h3>
          <p className="text-gray-400 text-sm">
            Take a moment to reflect and write your response.
          </p>
        </div>

        <div className="space-y-4">
          <Textarea
            value={response}
            onChange={(e) => handleResponseChange(e.target.value)}
            placeholder="Enter your response here..."
            className="bg-[#2C2C2E] border-[#2C2C2E] text-white min-h-[120px] resize-none"
            rows={5}
          />

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">{response.length} characters</span>
            {response.trim().length > 0 && (
              <span className="text-blue-400 flex items-center">
                <Check className="w-4 h-4 mr-1" />
                Response saved
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

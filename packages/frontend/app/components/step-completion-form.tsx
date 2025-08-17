"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FullRitual } from "@rituals/shared";
import { ArrowLeft, Check, CheckCircle } from "lucide-react";
import { useState } from "react";

// Exercise set completion interface
interface ExerciseSet {
  set_index: number;
  set_type: string;
  values: Array<{
    type: string;
    value: number;
    unit: string;
  }>;
  completed: boolean;
  rest_time_seconds?: number;
  reps: number; // Track reps separately
}

interface StepCompletionFormProps {
  ritual: FullRitual;
  onComplete: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function StepCompletionForm({
  ritual,
  onComplete,
  onCancel,
  isLoading = false,
}: StepCompletionFormProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepCompletions, setStepCompletions] = useState<Record<number, any>>(
    {}
  );
  const [notes, setNotes] = useState("");

  const totalSteps = ritual.step_definitions.length;
  const completedSteps = Object.keys(stepCompletions).length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const handleStepComplete = (stepIndex: number, data: any) => {
    setStepCompletions((prev) => ({ ...prev, [stepIndex]: data }));
    // Removed auto-advance - only advance when user clicks "Next" button
  };

  const handleComplete = () => {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Create step responses in the format expected by the API
    const step_responses = ritual.step_definitions.map((step, index) => {
      const completion = stepCompletions[index];

      // Create the appropriate value based on step type
      let value;
      switch (step.type) {
        case "boolean":
          value = {
            type: "boolean" as const,
            value: { value: !!completion },
          };
          break;
        case "counter":
          value = {
            type: "counter" as const,
            value: { actual_value: completion?.actual_value || 0 },
          };
          break;
        case "qna":
          value = {
            type: "qna" as const,
            value: { text_response: completion?.notes || "" },
          };
          break;
        case "scale":
          value = {
            type: "scale" as const,
            value: { scale_value: completion?.scale_value || 1 },
          };
          break;
        case "timer":
          value = {
            type: "timer" as const,
            value: {
              planned_duration: completion?.planned_duration || 60,
              actual_duration: completion?.actual_duration || 0,
              completed_early: completion?.completed_early || false,
            },
          };
          break;
        case "workout":
          value = {
            type: "workout" as const,
            value: {
              sets_completed: completion?.sets_completed || 0,
              sets: completion?.sets || [],
            },
          };
          break;
        default:
          // Default to boolean for unknown types
          value = {
            type: "boolean" as const,
            value: { value: !!completion },
          };
      }

      return {
        step_definition_id: step.id,
        value,
        response_time_ms: null,
      };
    });

    onComplete({
      completed_date: today,
      step_responses,
      notes,
      duration_seconds: null,
    });
  };

  const currentStep = ritual.step_definitions[currentStepIndex];
  const isStepCompleted = stepCompletions[currentStepIndex];

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
                <div className="space-y-2">
                  {currentStep.type === "boolean" && (
                    <div>
                      <label className="text-white text-sm">
                        Mark as completed
                      </label>
                      <Button
                        onClick={() =>
                          handleStepComplete(currentStepIndex, {
                            completed: true,
                          })
                        }
                        variant={isStepCompleted ? "default" : "outline"}
                        className="w-full mt-2"
                      >
                        {isStepCompleted ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completed
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Mark Complete
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {currentStep.type === "qna" && (
                    <div>
                      <label className="text-white text-sm">
                        Your response
                      </label>
                      <Textarea
                        value={isStepCompleted?.notes || ""}
                        onChange={(e) => {
                          const completion = {
                            completed: true,
                            notes: e.target.value,
                          };
                          handleStepComplete(currentStepIndex, completion);
                        }}
                        placeholder="Enter your response..."
                        className="bg-[#3C3C3E] border-[#3C3C3E] text-white mt-2"
                      />
                    </div>
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

                  {(currentStep.type === "counter" ||
                    currentStep.type === "scale" ||
                    currentStep.type === "timer") && (
                    <div>
                      <label className="text-white text-sm">
                        Mark as completed
                      </label>
                      <Button
                        onClick={() =>
                          handleStepComplete(currentStepIndex, {
                            completed: true,
                          })
                        }
                        variant={isStepCompleted ? "default" : "outline"}
                        className="w-full mt-2"
                      >
                        {isStepCompleted ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completed
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Mark Complete
                          </>
                        )}
                      </Button>
                      <p className="text-gray-500 text-xs mt-1">
                        Advanced {currentStep.type} input coming soon
                      </p>
                    </div>
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
        <div className="flex gap-3 mt-6">
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
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!isStepCompleted}
            >
              Next Step
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                  Completing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Complete Ritual
                </>
              )}
            </Button>
          )}
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
    </div>
  );
}

// Exercise Set Completion Component
function ExerciseSetCompletion({
  step,
  completion,
  onComplete,
}: {
  step: { config?: any; name: string; type: string };
  completion: any;
  onComplete: (completion: any) => void;
}) {
  const targetSets = step.config?.target_sets || 3;
  const targetReps = step.config?.target_reps || 10;
  const targetWeight = step.config?.target_weight || 0;

  const [sets, setSets] = useState<ExerciseSet[]>(() => {
    if (completion?.sets) return completion.sets;

    return Array.from({ length: targetSets }, (_, index) => {
      const setValues: ExerciseSet["values"] = [];

      // Only track weight for weighted exercises (reps will be tracked separately in the response)
      if (targetWeight > 0) {
        setValues.push({ type: "WEIGHT", value: targetWeight, unit: "kg" });
      }

      return {
        set_index: index,
        set_type: targetWeight > 0 ? "WEIGHT" : "BODYWEIGHT",
        values: setValues,
        completed: false,
        rest_time_seconds: step.config?.rest_time_seconds || 60,
        reps: 0, // Track reps separately, not as a value with unit
      };
    });
  });

  const handleSetUpdate = (setIndex: number, field: string, value: any) => {
    const updatedSets = [...sets];
    if (field === "reps") {
      updatedSets[setIndex].reps = value;
    } else if (field === "weight") {
      // Update weight value if it exists
      const weightIndex = updatedSets[setIndex].values.findIndex(
        (v) => v.type === "WEIGHT"
      );
      if (weightIndex >= 0) {
        updatedSets[setIndex].values[weightIndex].value = value;
      }
    } else if (field === "completed") {
      updatedSets[setIndex].completed = value;
    }
    setSets(updatedSets);

    // Auto-update completion
    const completedSets = updatedSets.filter((set) => set.completed).length;
    const totalReps = updatedSets.reduce(
      (sum, set) => sum + (set.completed ? set.reps : 0),
      0
    );

    onComplete({
      completed: completedSets > 0,
      sets_completed: completedSets,
      total_reps: totalReps,
      sets: updatedSets,
    });
  };

  const completedSets = sets.filter((set) => set.completed).length;
  const totalReps = sets.reduce(
    (sum, set) => sum + (set.completed ? set.reps : 0),
    0
  );

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-white font-medium">
          {step.config?.exercise?.name || step.name}
        </h3>
        <p className="text-gray-400 text-sm">
          Target: {targetSets} sets × {targetReps} reps
          {targetWeight > 0 && ` @ ${targetWeight}kg`}
        </p>
        <div className="text-sm text-gray-300 mt-1">
          Progress: {completedSets}/{targetSets} sets • {totalReps} total reps
        </div>
      </div>

      <div className="space-y-3">
        {sets.map((set, index) => (
          <Card
            key={index}
            className={cn(
              "bg-[#3C3C3E] border-[#3C3C3E]",
              set.completed && "bg-green-600/20 border-green-600/30"
            )}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Set {index + 1}</span>
                <Checkbox
                  checked={set.completed}
                  onCheckedChange={(checked: boolean) =>
                    handleSetUpdate(index, "completed", checked)
                  }
                  className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 text-xs">Reps</label>
                  <Input
                    type="number"
                    value={set.reps}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleSetUpdate(
                        index,
                        "reps",
                        parseInt(e.target.value) || 0
                      )
                    }
                    placeholder={targetReps.toString()}
                    className="bg-[#2C2C2E] border-[#2C2C2E] text-white text-sm h-8"
                  />
                </div>

                {targetWeight > 0 && (
                  <div>
                    <label className="text-gray-300 text-xs">Weight (kg)</label>
                    <Input
                      type="number"
                      value={
                        set.values.find((v) => v.type === "WEIGHT")?.value ||
                        targetWeight
                      }
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleSetUpdate(
                          index,
                          "weight",
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder={targetWeight.toString()}
                      className="bg-[#2C2C2E] border-[#2C2C2E] text-white text-sm h-8"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {completedSets === targetSets && (
        <div className="text-center p-3 bg-green-600/20 rounded-lg border border-green-600/30">
          <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
          <p className="text-green-300 text-sm">All sets completed! 🎉</p>
        </div>
      )}
    </div>
  );
}

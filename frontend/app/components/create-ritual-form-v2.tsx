"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateRitual,
  useExercises,
  usePhysicalQuantities,
} from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import {
  createRitualSchema,
  Exercise,
  fromSI,
  prettifyError,
  toSI,
  type CreateRitualSchemaType,
  type ExerciseBodyPart,
  type ExerciseEquipment,
  type ExerciseMeasurementType,
  type RitualCategory,
  type RitualFrequencyType,
  type StepType,
} from "@rituals/shared";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Info,
  Plus,
  Search,
  Trash,
  Trash2Icon,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DurationPicker } from "./ui/duration-picker";

interface CreateRitualFormProps {
  onCancel: () => void;
  onSuccess?: () => void;
}

// Frontend-specific interfaces for form state
interface FormStepDefinition {
  id: string;
  type: StepType;
  name: string;
  placeholder: string;
  config: any;
  is_required: boolean;
  order_index: number;
}

function trimStepDefinition(
  step: FormStepDefinition
): CreateRitualSchemaType["step_definitions"][number] {
  switch (step.type) {
    case "counter":
      return {
        name: step.name,
        is_required: step.is_required,
        order_index: step.order_index,
        type: "counter",
        target_count_value: step.config.target_count_value || 0,
        target_count_unit: step.config.target_count_unit,
      };
    case "timer":
      return {
        name: step.name,
        is_required: step.is_required,
        order_index: step.order_index,
        type: "timer",
        target_seconds: step.config.target_seconds,
      };
    case "scale":
      return {
        name: step.name,
        is_required: step.is_required,
        order_index: step.order_index,
        type: "scale",
        min_value: step.config.min_value,
        max_value: step.config.max_value,
      };
    case "workout":
      return {
        name: step.name,
        is_required: step.is_required,
        order_index: step.order_index,
        type: "workout",
        workout_exercises: step.config.workout_exercises || [],
      };
    case "qna":
      return {
        name: step.name,
        is_required: step.is_required,
        order_index: step.order_index,
        type: "qna",
      };
    case "boolean":
      return {
        name: step.name,
        is_required: step.is_required,
        order_index: step.order_index,
        type: "boolean",
      };
    default:
      return {
        name: step.name,
        is_required: step.is_required,
        order_index: step.order_index,
        type: step.type,
      };
  }
}

function validateRitualData(
  formData: FormData
): CreateRitualSchemaType | undefined {
  // Transform formData to API format
  const ritualData: CreateRitualSchemaType = {
    ritual: {
      name: formData.ritual.name,
      description: formData.ritual.description,
      category: formData.ritual.category,
      location: formData.ritual.location,
      gear: formData.ritual.gear.length > 0 ? formData.ritual.gear : [],
      is_public: formData.ritual.is_public,
      is_active: formData.ritual.is_active,
    },
    frequency: {
      frequency_type: formData.frequency.frequency_type,
      frequency_interval: formData.frequency.frequency_interval,
      days_of_week:
        formData.frequency.days_of_week.length > 0
          ? formData.frequency.days_of_week
          : undefined,
      specific_dates:
        formData.frequency.specific_dates.length > 0
          ? formData.frequency.specific_dates
          : undefined,
    },

    step_definitions: formData.step_definitions.map(trimStepDefinition),
  };

  console.log("Ritual data:", ritualData);
  const validatedRitualData = createRitualSchema.safeParse(ritualData);
  if (!validatedRitualData.success) {
    const errorMessage = prettifyError(validatedRitualData.error);
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

  return validatedRitualData.data;
}

interface FormData {
  ritual: {
    name: string;
    description: string;
    category: RitualCategory;
    location: string;
    gear: string[];
    is_public: boolean;
    is_active: boolean;
  };
  frequency: {
    frequency_type: RitualFrequencyType;
    frequency_interval: number;
    days_of_week: number[];
    specific_dates: string[];
  };
  step_definitions: FormStepDefinition[];
}

const RITUAL_CATEGORIES: { value: RitualCategory; label: string }[] = [
  { value: "wellness", label: "Wellness" },
  { value: "fitness", label: "Fitness" },
  { value: "productivity", label: "Productivity" },
  { value: "learning", label: "Learning" },
  { value: "spiritual", label: "Spiritual" },
  { value: "social", label: "Social" },
  { value: "other", label: "Other" },
];

const FREQUENCY_TYPES: { value: RitualFrequencyType; label: string }[] = [
  { value: "once", label: "One Time" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "custom", label: "Custom" },
];

const STEP_TYPES: {
  value: StepType;
  label: string;
  placeholder: string;
  description: string;
}[] = [
  {
    value: "boolean",
    label: "Yes/No",
    placeholder: "Did you meditate today?",
    description: "Simple true/false questions",
  },
  {
    value: "counter",
    label: "Tracker",
    placeholder: "Do breathwork",
    description: "Track numbers with units",
  },
  {
    value: "qna",
    label: "Text Response",
    placeholder: "How did this step go?",
    description: "Open-ended questions",
  },
  {
    value: "timer",
    label: "Timer",
    placeholder: "Complete this timed activity",
    description: "Time-based activities",
  },
  {
    value: "scale",
    label: "Rating Scale",
    placeholder: "How was the mood after workout?",
    description: "Rate on a scale (1-10)",
  },
  {
    value: "workout",
    label: "Workout",
    placeholder: "Upper body workout",
    description: "Exercise with sets and reps",
  },
];

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export function CreateRitualFormV2({
  onCancel,
  onSuccess,
}: CreateRitualFormProps) {
  const [currentTab, setCurrentTab] = useState(0);
  const [showStepInfo, setShowStepInfo] = useState(false);
  const [selectedStepType, setSelectedStepType] = useState<StepType | null>(
    null
  );
  const [formData, setFormData] = useState<FormData>({
    ritual: {
      name: "",
      description: "",
      category: "wellness",
      location: "",
      gear: [],
      is_public: false,
      is_active: true,
    },
    frequency: {
      frequency_type: "daily",
      frequency_interval: 1,
      days_of_week: [],
      specific_dates: [],
    },
    step_definitions: [],
  });
  const [gearInput, setGearInput] = useState("");
  const [specificDateInput, setSpecificDateInput] = useState("");

  const createRitualMutation = useCreateRitual();

  const getStepTypeInfo = (stepType: StepType) => {
    const infoContent = {
      boolean: {
        title: "Yes/No Question",
        description: "Perfect for simple binary choices in your ritual.",
        examples: [
          "Did you meditate today?",
          "Did you drink enough water?",
          "Did you complete your morning stretch?",
        ],
        usage: "Users will see a checkbox or toggle to mark as completed.",
      },
      counter: {
        title: "Tracker",
        description:
          "Track quantities with specific units - ideal for measurable goals.",
        examples: [
          "Glasses of water (8 glasses)",
          "Push-ups completed (20 reps)",
          "Distance walked (5 kilometers)",
        ],
        usage:
          "Users input a number with the unit you specify (liters, reps, etc.).",
      },
      qna: {
        title: "Text Response",
        description: "Capture thoughts, reflections, or detailed responses.",
        examples: [
          "How are you feeling today?",
          "What did you learn?",
          "Describe your workout experience",
        ],
        usage: "Users can write free-form text responses.",
      },
      timer: {
        title: "Timer",
        description: "Time-based activities with built-in countdown timer.",
        examples: [
          "5-minute meditation",
          "10-minute stretching",
          "3-minute breathing exercise",
        ],
        usage:
          "Users start a timer and the app tracks completion when time is up.",
      },
      scale: {
        title: "Rating Scale",
        description:
          "Rate experiences on a numerical scale for tracking progress.",
        examples: [
          "Energy level (1-10)",
          "Workout intensity (1-5)",
          "Mood after exercise (1-10)",
        ],
        usage: "Users select a number on your defined scale range.",
      },
      workout: {
        title: "Workout",
        description:
          "Structured exercise routines with sets, reps, and weights.",
        examples: ["Upper body strength", "Cardio session", "Yoga flow"],
        usage: "Users follow a predefined workout and log their performance.",
      },
    };

    return infoContent[stepType] || null;
  };

  const tabs = [
    { id: 0, label: "Basic Info", description: "Name, category, and details" },
    { id: 1, label: "Frequency", description: "When to perform this ritual" },
    { id: 2, label: "Steps", description: "Define the ritual steps" },
    { id: 3, label: "Review", description: "Review and create" },
  ];

  const handleNext = () => {
    if (currentTab < tabs.length - 1) {
      if (currentTab === 2) {
        const validatedData = validateRitualData(formData);
        if (!validatedData) {
          return;
        }
      }
      setCurrentTab(currentTab + 1);
    }
  };

  const handlePrevious = () => {
    if (currentTab > 0) {
      setCurrentTab(currentTab - 1);
    }
  };

  const addGear = () => {
    const trimmedGear = gearInput.trim();

    if (trimmedGear && !formData.ritual.gear.includes(trimmedGear)) {
      setFormData({
        ...formData,
        ritual: {
          ...formData.ritual,
          gear: [...formData.ritual.gear, trimmedGear],
        },
      });
      setGearInput("");
    }
  };

  const removeGear = (gear: string) => {
    setFormData({
      ...formData,
      ritual: {
        ...formData.ritual,
        gear: formData.ritual.gear.filter((g) => g !== gear),
      },
    });
  };

  const addSpecificDate = () => {
    if (
      specificDateInput &&
      !formData.frequency.specific_dates.includes(specificDateInput)
    ) {
      setFormData({
        ...formData,
        frequency: {
          ...formData.frequency,
          specific_dates: [
            ...formData.frequency.specific_dates,
            specificDateInput,
          ],
        },
      });
      setSpecificDateInput("");
    }
  };

  const removeSpecificDate = (date: string) => {
    setFormData({
      ...formData,
      frequency: {
        ...formData.frequency,
        specific_dates: formData.frequency.specific_dates.filter(
          (d) => d !== date
        ),
      },
    });
  };

  const addStep = (type: string) => {
    const newStep: FormStepDefinition = {
      id: `step-${Date.now()}`,
      type: type as any,
      name: "",
      config: defaultStepConfig(type as StepType),
      is_required: true,
      order_index: formData.step_definitions.length,
      placeholder: STEP_TYPES.find((t) => t.value === type)?.placeholder || "",
    };

    setFormData({
      ...formData,
      step_definitions: [...formData.step_definitions, newStep],
    });
  };
  const defaultStepConfig = (stepType: StepType) => {
    switch (stepType) {
      case "boolean":
        return {};
      case "qna":
        return {};
      case "workout":
        return {};
      case "counter":
        return {};
      case "timer":
        return { target_seconds: 300 };
      case "scale":
        return {
          min_value: 1,
          max_value: 10,
        };
    }
  };

  const updateStep = (stepId: string, field: string, value: any) => {
    setFormData({
      ...formData,
      step_definitions: formData.step_definitions.map((step) =>
        step.id === stepId ? { ...step, [field]: value } : step
      ),
    });
  };

  const updateStepConfig = (
    stepId: string,
    configField: string,
    value: any
  ) => {
    setFormData({
      ...formData,
      step_definitions: formData.step_definitions.map((step) =>
        step.id === stepId
          ? { ...step, config: { ...step.config, [configField]: value } }
          : step
      ),
    });
  };

  const removeStep = (stepId: string) => {
    setFormData({
      ...formData,
      step_definitions: formData.step_definitions
        .filter((step) => step.id !== stepId)
        .map((step, index) => ({ ...step, order_index: index })),
    });
  };

  const moveStep = (stepId: string, direction: "up" | "down") => {
    const currentIndex = formData.step_definitions.findIndex(
      (s) => s.id === stepId
    );
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" &&
        currentIndex === formData.step_definitions.length - 1)
    ) {
      return;
    }

    const newSteps = [...formData.step_definitions];
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    [newSteps[currentIndex], newSteps[targetIndex]] = [
      newSteps[targetIndex],
      newSteps[currentIndex],
    ];

    // Update order indices
    newSteps.forEach((step, index) => {
      step.order_index = index;
    });

    setFormData({
      ...formData,
      step_definitions: newSteps,
    });
  };

  const handleSubmit = async () => {
    try {
      // Call the API using the mutation
      const validatedData = validateRitualData(formData);
      if (!validatedData) {
        return;
      }
      const result = await createRitualMutation.mutateAsync(validatedData);

      if (result.isOk()) {
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error creating ritual:", error);
      // Error is already handled by the mutation hook
    }
  };

  const canProceed = () => {
    switch (currentTab) {
      case 0:
        return formData.ritual.name.trim() && formData.ritual.category;
      case 1:
        return formData.frequency.frequency_type;
      case 2:
        return formData.step_definitions.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
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
            <h1 className="text-white font-medium text-lg">Create Ritual</h1>
            <p className="text-[#AEAEB2] text-sm">
              {tabs[currentTab].description}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-[#3C3C3E]/30 px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id < currentTab) {
                setCurrentTab(tab.id);
              } else if (canProceed()) {
                if (currentTab === 2) {
                  const validatedData = validateRitualData(formData);
                  if (!validatedData) {
                    return;
                  }
                }
                setCurrentTab(tab.id);
              }
            }}
            className={cn(
              "flex-1 py-3 text-sm font-medium border-b-2 transition-colors",
              currentTab === tab.id
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-[#AEAEB2] hover:text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Basic Info Tab */}
        {currentTab === 0 && (
          <div className="space-y-6">
            <Card className="bg-[#2C2C2E] border-[#3C3C3E]">
              <CardHeader>
                <CardTitle className="text-white">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Ritual Name *</Label>
                  <Input
                    value={formData.ritual.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ritual: { ...formData.ritual, name: e.target.value },
                      })
                    }
                    placeholder="e.g., Morning Meditation"
                    className="bg-[#3C3C3E] border-[#3C3C3E] text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Description</Label>
                  <Textarea
                    value={formData.ritual.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ritual: {
                          ...formData.ritual,
                          description: e.target.value,
                        },
                      })
                    }
                    placeholder="Describe what this ritual involves..."
                    className="bg-[#3C3C3E] border-[#3C3C3E] text-white"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Category *</Label>
                  <Select
                    value={formData.ritual.category}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        ritual: {
                          ...formData.ritual,
                          category: value as RitualCategory,
                        },
                      })
                    }
                  >
                    <SelectTrigger className="bg-[#3C3C3E] border-[#3C3C3E] text-white">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2C2C2E] border-[#3C3C3E]">
                      {RITUAL_CATEGORIES.map((category) => (
                        <SelectItem
                          key={category.value}
                          value={category.value}
                          className="text-white"
                        >
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Location</Label>
                  <Input
                    value={formData.ritual.location}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ritual: {
                          ...formData.ritual,
                          location: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g., Living room, Gym, Outdoors"
                    className="bg-[#3C3C3E] border-[#3C3C3E] text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Required Gear</Label>
                  <div className="flex gap-2">
                    <Input
                      value={gearInput}
                      onChange={(e) => setGearInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addGear()}
                      placeholder="e.g., Yoga mat, Dumbbells"
                      className="bg-[#3C3C3E] border-[#3C3C3E] text-white flex-1"
                    />
                    <Button
                      onClick={addGear}
                      variant="outline"
                      className="border-[#3C3C3E]"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.ritual.gear.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.ritual.gear.map((gear) => (
                        <Badge
                          key={gear}
                          variant="secondary"
                          className="bg-[#3C3C3E] text-white"
                        >
                          {gear}
                          <button
                            onClick={() => removeGear(gear)}
                            className="ml-2 text-[#AEAEB2] hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Frequency Tab */}
        {currentTab === 1 && (
          <div className="space-y-6">
            <Card className="bg-[#2C2C2E] border-[#3C3C3E]">
              <CardHeader>
                <CardTitle className="text-white">Frequency Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">
                    How often should this ritual be performed?
                  </Label>
                  <Select
                    value={formData.frequency.frequency_type}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        frequency: {
                          ...formData.frequency,
                          frequency_type: value as RitualFrequencyType,
                        },
                      })
                    }
                  >
                    <SelectTrigger className="bg-[#3C3C3E] border-[#3C3C3E] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2C2C2E] border-[#3C3C3E]">
                      {FREQUENCY_TYPES.map((freq) => (
                        <SelectItem
                          key={freq.value}
                          value={freq.value}
                          className="text-white"
                        >
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.frequency.frequency_type === "weekly" && (
                  <div className="space-y-2">
                    <Label className="text-white">Days of the week</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <div
                          key={day.value}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`day-${day.value}`}
                            checked={formData.frequency.days_of_week.includes(
                              day.value
                            )}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  frequency: {
                                    ...formData.frequency,
                                    days_of_week: [
                                      ...formData.frequency.days_of_week,
                                      day.value,
                                    ],
                                  },
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  frequency: {
                                    ...formData.frequency,
                                    days_of_week:
                                      formData.frequency.days_of_week.filter(
                                        (d) => d !== day.value
                                      ),
                                  },
                                });
                              }
                            }}
                          />
                          <Label
                            htmlFor={`day-${day.value}`}
                            className="text-white text-sm"
                          >
                            {day.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.frequency.frequency_type === "custom" && (
                  <div className="space-y-2">
                    <Label className="text-white">Specific Dates</Label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={specificDateInput}
                        onChange={(e) => setSpecificDateInput(e.target.value)}
                        className="bg-[#3C3C3E] border-[#3C3C3E] text-white flex-1"
                      />
                      <Button
                        onClick={addSpecificDate}
                        variant="outline"
                        className="border-[#3C3C3E]"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {formData.frequency.specific_dates.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.frequency.specific_dates.map((date) => (
                          <Badge
                            key={date}
                            variant="secondary"
                            className="bg-[#3C3C3E] text-white"
                          >
                            {date}
                            <button
                              onClick={() => removeSpecificDate(date)}
                              className="ml-2 text-[#AEAEB2] hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Steps Tab */}
        {currentTab === 2 && (
          <div className="space-y-6">
            <Card className="bg-[#2C2C2E] border-[#3C3C3E]">
              <CardHeader>
                <CardTitle className="text-white">Ritual Steps</CardTitle>
                <p className="text-[#AEAEB2] text-sm">
                  Define the steps that make up this ritual. Users will complete
                  these in order.
                </p>
              </CardHeader>
              <CardContent>
                {/* Add Step Section */}
                <div className="mb-6">
                  <Label className="text-white mb-3 block">
                    Add a new step:
                  </Label>
                  <div className="grid grid-cols-1 gap-3">
                    {STEP_TYPES.map((stepType) => (
                      <div key={stepType.value} className="relative">
                        <Button
                          onClick={() => addStep(stepType.value)}
                          variant="outline"
                          className="border-[#3C3C3E] text-left h-auto p-4 flex flex-col items-start w-full relative ios-touch-target"
                        >
                          <div className="font-medium text-white text-ios-headline mb-1">
                            {stepType.label}
                          </div>
                          <div className="text-xs text-[#AEAEB2] text-ios-footnote">
                            {stepType.description}
                          </div>
                        </Button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStepType(stepType.value);
                            setShowStepInfo(true);
                          }}
                          className="absolute top-3 right-3 text-[#AEAEB2] hover:text-blue-400 p-2 ios-touch-target"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Steps List */}
                {formData.step_definitions.length > 0 && (
                  <div className="space-y-4">
                    <Label className="text-white">Current Steps:</Label>
                    {formData.step_definitions.map((step, index) => (
                      <StepEditor
                        key={step.id}
                        step={step}
                        index={index}
                        totalSteps={formData.step_definitions.length}
                        onUpdate={updateStep}
                        onUpdateConfig={updateStepConfig}
                        onRemove={removeStep}
                        onMove={moveStep}
                      />
                    ))}
                  </div>
                )}

                {formData.step_definitions.length === 0 && (
                  <div className="text-center py-8 text-[#AEAEB2]">
                    <p>
                      No steps added yet. Add your first step above to get
                      started.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Review Tab */}
        {currentTab === 3 && (
          <div className="space-y-6">
            <Card className="bg-[#2C2C2E] border-[#3C3C3E]">
              <CardHeader>
                <CardTitle className="text-white">Review Your Ritual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info Summary */}
                <div>
                  <h3 className="text-white font-medium mb-2">
                    Basic Information
                  </h3>
                  <div className="text-[#AEAEB2] space-y-1">
                    <p>
                      <strong>Name:</strong> {formData.ritual.name}
                    </p>
                    <p>
                      <strong>Category:</strong>{" "}
                      {
                        RITUAL_CATEGORIES.find(
                          (c) => c.value === formData.ritual.category
                        )?.label
                      }
                    </p>
                    {formData.ritual.description && (
                      <p>
                        <strong>Description:</strong>{" "}
                        {formData.ritual.description}
                      </p>
                    )}
                    {formData.ritual.location && (
                      <p>
                        <strong>Location:</strong> {formData.ritual.location}
                      </p>
                    )}
                    {formData.ritual.gear.length > 0 && (
                      <p>
                        <strong>Gear:</strong> {formData.ritual.gear.join(", ")}
                      </p>
                    )}
                    <p>
                      <strong>Visibility:</strong>{" "}
                      {formData.ritual.is_public ? "Public" : "Private"}
                    </p>
                  </div>
                </div>

                {/* Frequency Summary */}
                <div>
                  <h3 className="text-white font-medium mb-2">Frequency</h3>
                  <div className="text-[#AEAEB2]">
                    <p>
                      {
                        FREQUENCY_TYPES.find(
                          (f) => f.value === formData.frequency.frequency_type
                        )?.label
                      }
                    </p>
                    {formData.frequency.frequency_type === "weekly" &&
                      formData.frequency.days_of_week.length > 0 && (
                        <p>
                          Days:{" "}
                          {formData.frequency.days_of_week
                            .map(
                              (d) =>
                                DAYS_OF_WEEK.find((day) => day.value === d)
                                  ?.label
                            )
                            .join(", ")}
                        </p>
                      )}
                    {formData.frequency.frequency_type === "custom" &&
                      formData.frequency.specific_dates.length > 0 && (
                        <p>
                          Dates: {formData.frequency.specific_dates.join(", ")}
                        </p>
                      )}
                  </div>
                </div>

                {/* Steps Summary */}
                <div>
                  <h3 className="text-white font-medium mb-2">
                    Steps ({formData.step_definitions.length})
                  </h3>
                  <div className="space-y-2">
                    {formData.step_definitions.map((step, index) => (
                      <div
                        key={step.id}
                        className="flex items-center space-x-3 p-3 bg-[#3C3C3E]/50 rounded"
                      >
                        <div className="w-6 h-6 bg-blue-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">
                            {step.name}
                          </div>
                          <div className="text-[#AEAEB2] text-sm">
                            {
                              STEP_TYPES.find((t) => t.value === step.type)
                                ?.label
                            }
                            {step.is_required && (
                              <span className="text-red-400 ml-1">*</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_public"
                    checked={formData.ritual.is_public}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        ritual: { ...formData.ritual, is_public: !!checked },
                      })
                    }
                  />
                  <Label htmlFor="is_public" className="text-white">
                    Publish
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.ritual.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        ritual: { ...formData.ritual, is_active: !!checked },
                      })
                    }
                  />
                  <Label htmlFor="is_active" className="text-white">
                    Activate
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between p-4 border-t border-[#3C3C3E]/30 ios-safe-area">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentTab === 0}
          className="border-[#3C3C3E] text-[#AEAEB2] hover:text-white ios-touch-target"
        >
          Previous
        </Button>

        <div className="text-center">
          <p className="text-[#AEAEB2] text-ios-footnote">
            Step {currentTab + 1} of {tabs.length}
          </p>
        </div>

        {currentTab < tabs.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="ios-button-primary"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canProceed() || createRitualMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white ios-touch-target"
          >
            {createRitualMutation.isPending ? "Creating..." : "Create Ritual"}
          </Button>
        )}
      </div>

      {/* Step Type Info Modal - Mobile-First Bottom Sheet */}
      {showStepInfo && selectedStepType && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setShowStepInfo(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 animate-ios-slide-in">
            <div className="bg-[#1C1C1E] rounded-t-xl mx-2 mb-2 max-h-[85vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#3C3C3E] flex-shrink-0">
                <h2 className="text-white text-lg font-semibold">
                  {getStepTypeInfo(selectedStepType)?.title}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStepInfo(false)}
                  className="text-[#AEAEB2] hover:text-white h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 ios-scroll-container">
                {getStepTypeInfo(selectedStepType) && (
                  <>
                    <div>
                      <h3 className="text-white font-medium mb-2 text-ios-headline">
                        Description
                      </h3>
                      <p className="text-[#AEAEB2] text-ios-body">
                        {getStepTypeInfo(selectedStepType)!.description}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-white font-medium mb-2 text-ios-headline">
                        How it works
                      </h3>
                      <p className="text-[#AEAEB2] text-ios-body">
                        {getStepTypeInfo(selectedStepType)!.usage}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-white font-medium mb-2 text-ios-headline">
                        Examples
                      </h3>
                      <ul className="text-[#AEAEB2] text-ios-body space-y-2">
                        {getStepTypeInfo(selectedStepType)!.examples.map(
                          (example, idx) => (
                            <li
                              key={idx}
                              className="flex items-start space-x-3"
                            >
                              <span className="text-blue-400 mt-1 text-sm">
                                •
                              </span>
                              <span className="flex-1">{example}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </>
                )}
              </div>

              {/* Action Button - Fixed at bottom */}
              <div className="p-4 border-t border-[#3C3C3E] flex-shrink-0 ios-safe-area">
                <Button
                  onClick={() => {
                    addStep(selectedStepType);
                    setShowStepInfo(false);
                  }}
                  className="w-full ios-button-primary"
                >
                  Add {getStepTypeInfo(selectedStepType)?.title} Step
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Step Editor Component
interface StepEditorProps {
  step: FormStepDefinition;
  index: number;
  totalSteps: number;
  onUpdate: (stepId: string, field: string, value: any) => void;
  onUpdateConfig: (stepId: string, configField: string, value: any) => void;
  onRemove: (stepId: string) => void;
  onMove: (stepId: string, direction: "up" | "down") => void;
}

function StepEditor({
  step,
  index,
  totalSteps,
  onUpdate,
  onUpdateConfig,
  onRemove,
  onMove,
}: StepEditorProps) {
  return (
    <Card className="bg-[#3C3C3E]/50 border-[#3C3C3E]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 text-white text-sm font-medium rounded-full flex items-center justify-center">
              {index + 1}
            </div>
            <div>
              <div className="text-white font-medium">
                {STEP_TYPES.find((t) => t.value === step.type)?.label}
              </div>
              <div className="text-[#AEAEB2] text-xs">
                {step.is_required ? "Required" : "Optional"}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMove(step.id, "up")}
              disabled={index === 0}
              className="text-[#AEAEB2] hover:text-white p-1"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMove(step.id, "down")}
              disabled={index === totalSteps - 1}
              className="text-[#AEAEB2] hover:text-white p-1"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(step.id)}
              className="text-red-400 hover:text-red-300 p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-white">Step Name</Label>
          <Input
            required
            placeholder={step.placeholder}
            onChange={(e) => onUpdate(step.id, "name", e.target.value)}
            className="bg-[#2C2C2E] border-[#2C2C2E] text-white"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id={`required-${step.id}`}
            className="w-4 h-4 border-2 border-[#3C3C3E] data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 hover:border-blue-400 transition-colors"
            checked={step.is_required}
            onCheckedChange={(checked) =>
              onUpdate(step.id, "is_required", !!checked)
            }
          />
          <Label htmlFor={`required-${step.id}`} className="text-white text-sm">
            Required step
          </Label>
        </div>

        {/* Step-specific configuration */}
        <StepConfigEditor step={step} onUpdateConfig={onUpdateConfig} />
      </CardContent>
    </Card>
  );
}

// Step Config Editor Component
interface StepConfigEditorProps {
  step: FormStepDefinition;
  onUpdateConfig: (stepId: string, configField: string, value: any) => void;
}

function StepConfigEditor({ step, onUpdateConfig }: StepConfigEditorProps) {
  switch (step.type) {
    case "boolean":
      return <></>;
    case "counter":
      return <CounterStepEditor step={step} onUpdateConfig={onUpdateConfig} />;

    case "qna":
      return <></>;

    case "timer":
      return (
        <DurationPicker
          value={step.config.target_seconds || 300}
          onChange={(seconds) =>
            onUpdateConfig(step.id, "target_seconds", seconds)
          }
          label="Timer Duration"
          placeholder="Select timer duration"
        />
      );

    case "scale":
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Minimum Value</Label>
              <Input
                type="number"
                value={step.config.scale_min || ""}
                onChange={(e) =>
                  onUpdateConfig(
                    step.id,
                    "scale_min",
                    parseInt(e.target.value) || 1
                  )
                }
                className="bg-[#2C2C2E] border-[#2C2C2E] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Maximum Value</Label>
              <Input
                type="number"
                value={step.config.scale_max || ""}
                onChange={(e) =>
                  onUpdateConfig(
                    step.id,
                    "scale_max",
                    parseInt(e.target.value) || 10
                  )
                }
                className="bg-[#2C2C2E] border-[#2C2C2E] text-white"
              />
            </div>
          </div>
        </div>
      );

    case "workout":
      return (
        <SimpleWorkoutStepEditor step={step} onUpdateConfig={onUpdateConfig} />
      );

    default:
      return null;
  }
}

// Counter Step Editor Component
function CounterStepEditor({
  step,
  onUpdateConfig,
}: {
  step: FormStepDefinition;
  onUpdateConfig: (stepId: string, key: string, value: any) => void;
}) {
  const { isLoading, data: physicalQuantities } = usePhysicalQuantities();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-white">Unit</Label>
        {isLoading || !physicalQuantities ? (
          <div className="text-[#AEAEB2] text-sm py-2">Loading units...</div>
        ) : (
          <Select
            value={step.config.target_count_unit || ""}
            onValueChange={(value) =>
              onUpdateConfig(step.id, "target_count_unit", value)
            }
          >
            <SelectTrigger className="bg-[#2C2C2E] border-[#2C2C2E] text-white">
              <SelectValue placeholder="Select what to measure" />
            </SelectTrigger>
            <SelectContent className="bg-[#2C2C2E] border-[#3C3C3E] max-h-60">
              {physicalQuantities.physical_quantities.map((quantity) => (
                <SelectItem
                  key={quantity.id}
                  value={quantity.id}
                  className="text-white"
                >
                  <div className="flex items-center gap-2">
                    <span>{quantity.name}</span>
                    <span className="text-xs text-[#AEAEB2]">
                      ({quantity.display_unit})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="space-y-2">
        {isLoading || !physicalQuantities ? (
          <div className="text-[#AEAEB2] text-sm py-2">Loading units...</div>
        ) : (
          <>
            <Label className="text-white">Target Value</Label>
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                min="0"
                value={(() => {
                  // compute something
                  const value = parseFloat(step.config.target_count_value || 0);
                  const selectedUnit =
                    physicalQuantities?.physical_quantities.find(
                      (q) => q.id === step.config.target_count_unit
                    );
                  if (selectedUnit) {
                    const siValue = fromSI(value, selectedUnit);
                    return siValue;
                  }
                  return 0;
                })()}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  const selectedUnit =
                    physicalQuantities?.physical_quantities.find(
                      (q) => q.id === step.config.target_count_unit
                    );
                  if (selectedUnit) {
                    const siValue = toSI(value, selectedUnit);
                    onUpdateConfig(step.id, "target_count_value", siValue);
                  }
                }}
                placeholder={
                  step.config.target_count_unit ? `` : "Select a unit first"
                }
                className="bg-[#2C2C2E] border-[#2C2C2E] text-white pr-20"
              />
              {step.config.target_count_unit && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-[#AEAEB2]">
                    {
                      physicalQuantities.physical_quantities.find(
                        (q) => q.id === step.config.target_count_unit
                      )?.display_unit
                    }
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Target Duration - Only show for time-based units */}
      {step.config.target_count_unit === "duration" && (
        <DurationPicker
          value={step.config.target_seconds || 0}
          onChange={(seconds) =>
            onUpdateConfig(step.id, "target_seconds", seconds)
          }
          label="Target Duration"
          placeholder="Set target duration"
        />
      )}
    </div>
  );
}

// Simple Workout Step Editor - opens dialog
function SimpleWorkoutStepEditor({
  step,
  onUpdateConfig,
}: {
  step: FormStepDefinition;
  onUpdateConfig: (stepId: string, key: string, value: any) => void;
}) {
  const [showWorkoutDialog, setShowWorkoutDialog] = useState(false);
  const workoutExercises = step.config.workout_exercises || [];

  return (
    <>
      <div className="space-y-4">
        <div className="border border-[#3C3C3E] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-white font-medium">Workout Configuration</div>
            <Button
              onClick={() => setShowWorkoutDialog(true)}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Edit
            </Button>
          </div>
          {workoutExercises.length === 0 ? (
            <p className="text-[#AEAEB2] text-sm">
              Click "Edit" to add exercises.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-[#AEAEB2] text-sm">
                {workoutExercises.length} exercise
                {workoutExercises.length !== 1 ? "s" : ""} configured
              </p>
              <div className="text-xs text-[#AEAEB2]">
                {workoutExercises.map((ex, i) => (
                  <div key={i}>
                    • Exercise {i + 1}: {ex.workout_sets.length} set
                    {ex.workout_sets.length !== 1 ? "s" : ""}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <WorkoutDialog
        isOpen={showWorkoutDialog}
        onClose={() => setShowWorkoutDialog(false)}
        step={step}
        onUpdateConfig={onUpdateConfig}
      />
    </>
  );
}

// Exercise Selection Dialog Component
function ExerciseSelectionDialog({
  isOpen,
  onClose,
  onSelectExercise,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: any) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBodyPart, setSelectedBodyPart] = useState<
    ExerciseBodyPart | "all_body_parts"
  >("all_body_parts");
  const [selectedEquipment, setSelectedEquipment] = useState<
    ExerciseEquipment | "all_equipment"
  >("all_equipment");

  const { data: exercisesData, isLoading } = useExercises({
    search: searchTerm || undefined,
    body_part:
      selectedBodyPart === "all_body_parts" ? undefined : selectedBodyPart,
    equipment:
      selectedEquipment === "all_equipment" ? undefined : selectedEquipment,
    limit: 50,
  });

  const exercises = exercisesData?.exercises || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 animate-ios-slide-in">
      <div className="bg-[#1C1C1E] rounded-t-xl mx-2 mb-2 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#3C3C3E] flex-shrink-0">
          <h2 className="text-white text-lg font-semibold">Select Exercise</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-[#AEAEB2] hover:text-white h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 space-y-3 border-b border-[#3C3C3E]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#AEAEB2]" />
            <Input
              type="text"
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#2C2C2E] border-[#3C3C3E] text-white"
            />
          </div>

          <div className="flex gap-2">
            <Select
              value={selectedBodyPart}
              onValueChange={(value) =>
                setSelectedBodyPart(value as ExerciseBodyPart)
              }
            >
              <SelectTrigger className="flex-1 bg-[#2C2C2E] border-[#3C3C3E] text-white">
                <SelectValue placeholder="Any Body Part" />
              </SelectTrigger>
              <SelectContent className="bg-[#2C2C2E] border-[#3C3C3E]">
                <SelectItem value="all_body_parts">Any Body Part</SelectItem>
                <SelectItem value="chest">Chest</SelectItem>
                <SelectItem value="back">Back</SelectItem>
                <SelectItem value="shoulders">Shoulders</SelectItem>
                <SelectItem value="arms">Arms</SelectItem>
                <SelectItem value="legs">Legs</SelectItem>
                <SelectItem value="core">Core</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedEquipment}
              onValueChange={(value) =>
                setSelectedEquipment(value as ExerciseEquipment)
              }
            >
              <SelectTrigger className="flex-1 bg-[#2C2C2E] border-[#3C3C3E] text-white">
                <SelectValue placeholder="Any Equipment" />
              </SelectTrigger>
              <SelectContent className="bg-[#2C2C2E] border-[#3C3C3E]">
                <SelectItem value="all_equipment">Any Equipment</SelectItem>
                <SelectItem value="barbell">Barbell</SelectItem>
                <SelectItem value="dumbbell">Dumbbell</SelectItem>
                <SelectItem value="bodyweight">Bodyweight</SelectItem>
                <SelectItem value="machine">Machine</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto ios-scroll-container">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-[#AEAEB2]">Loading exercises...</div>
            </div>
          ) : (
            <div className="p-2">
              {exercises.length === 0 ? (
                <div className="text-center py-8 text-[#AEAEB2]">
                  No exercises found
                </div>
              ) : (
                exercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    onClick={() => {
                      onSelectExercise(exercise);
                      onClose();
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#2C2C2E] cursor-pointer transition-colors"
                  >
                    {/* Exercise Icon Placeholder */}
                    <div className="w-12 h-12 bg-[#3C3C3E] rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-[#AEAEB2]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">
                        {exercise.name}
                      </div>
                      <div className="text-[#AEAEB2] text-sm capitalize">
                        {exercise.body_part}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <span className="text-blue-400 text-xs">?</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Workout Dialog Component
function WorkoutDialog({
  isOpen,
  onClose,
  step,
  onUpdateConfig,
}: {
  isOpen: boolean;
  onClose: () => void;
  step: FormStepDefinition;
  onUpdateConfig: (stepId: string, key: string, value: any) => void;
}) {
  const [showExerciseSelection, setShowExerciseSelection] = useState(false);
  const { data: exercisesData } = useExercises();
  const exercises = exercisesData?.exercises || [];

  const workoutExercises: Array<
    NonNullable<
      CreateRitualSchemaType["step_definitions"][number]["workout_exercises"]
    >[number]
  > = step.config.workout_exercises || [];

  const defaultExerciseSetValue = (
    exercise_measurement_type: ExerciseMeasurementType
  ): {
    target_weight_kg?: number;
    target_reps?: number;
    target_seconds?: number;
    target_distance_m?: number;
  } => {
    switch (exercise_measurement_type) {
      case "weight_reps":
        return { target_weight_kg: 0, target_reps: 0 };
      case "reps":
        return { target_reps: 0 };
      case "time":
        return { target_seconds: 0 };
      case "distance_time":
        return { target_distance_m: 0, target_seconds: 0 };
    }
  };
  const addExercise = (exercise: Exercise) => {
    const newExercise = {
      exercise_id: exercise.id,
      exercise_measurement_type: exercise.measurement_type,
      order_index: workoutExercises.length,
      workout_sets: [
        {
          set_number: 1,
          ...defaultExerciseSetValue(exercise.measurement_type),
        },
      ],
    };
    onUpdateConfig(step.id, "workout_exercises", [
      ...workoutExercises,
      newExercise,
    ]);
  };

  const removeExercise = (exerciseIndex: number) => {
    const updated = workoutExercises.filter((_, i) => i !== exerciseIndex);
    onUpdateConfig(step.id, "workout_exercises", updated);
  };

  const addSet = (exerciseIndex: number) => {
    const updated = [...workoutExercises];
    const currentSets = updated[exerciseIndex].workout_sets;
    const newSet = {
      set_number: currentSets.length + 1,
      ...defaultExerciseSetValue(
        workoutExercises[exerciseIndex].exercise_measurement_type
      ),
    };
    updated[exerciseIndex].workout_sets = [...currentSets, newSet];
    onUpdateConfig(step.id, "workout_exercises", updated);
  };

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: string,
    value: any
  ) => {
    const updated = [...workoutExercises];
    updated[exerciseIndex].workout_sets[setIndex] = {
      ...updated[exerciseIndex].workout_sets[setIndex],
      [field]: value,
    };
    onUpdateConfig(step.id, "workout_exercises", updated);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...workoutExercises];
    updated[exerciseIndex].workout_sets = updated[
      exerciseIndex
    ].workout_sets.filter((_, i) => i !== setIndex);
    // Renumber sets
    updated[exerciseIndex].workout_sets.forEach((set, i) => {
      set.set_number = i + 1;
    });
    onUpdateConfig(step.id, "workout_exercises", updated);
  };

  const getFieldsForMeasurementType = (
    measurementType: ExerciseMeasurementType
  ) => {
    switch (measurementType) {
      case "weight_reps":
        return ["target_weight_kg", "target_reps"];
      case "reps":
        return ["target_reps"];
      case "time":
        return ["target_seconds"];
      case "distance_time":
        return ["target_distance_m", "target_seconds"];
      default:
        return [];
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 animate-ios-slide-in">
        <div className="bg-[#1C1C1E] rounded-t-xl mx-2 mb-2 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#3C3C3E] flex-shrink-0">
            <h2 className="text-white text-lg font-semibold">Edit Workout</h2>
            <Button onClick={onClose} className="ios-button-primary">
              Save
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 ios-scroll-container">
            {/* Exercises */}
            {workoutExercises.map((workoutExercise, exerciseIndex) => {
              const selectedExercise = exercises.find(
                (ex) => ex.id === workoutExercise.exercise_id
              );
              const measurementType = workoutExercise.exercise_measurement_type;
              const visibleFields =
                getFieldsForMeasurementType(measurementType);
              const showWeight = visibleFields.includes("target_weight_kg");
              const showReps = visibleFields.includes("target_reps");
              const showSeconds = visibleFields.includes("target_seconds");
              const showDistance = visibleFields.includes("target_distance_m");

              console.log(selectedExercise);
              return (
                <div key={exerciseIndex} className="space-y-4">
                  {/* Exercise Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-blue-400 text-lg font-medium">
                        {selectedExercise?.name || "Unknown Exercise"}
                        {selectedExercise?.equipment && (
                          <span className="text-[#AEAEB2] text-sm ml-2">
                            ({selectedExercise.equipment.join(", ")})
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#AEAEB2] hover:text-white"
                      >
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                      <button
                        className="text-[#AEAEB2] hover:text-white"
                        onClick={() => removeExercise(exerciseIndex)}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Sets Table */}
                  <div className="bg-[#2C2C2E] rounded-lg overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-5 gap-4 p-3 bg-[#3C3C3E] text-[#AEAEB2] text-sm font-medium">
                      <div>Set</div>
                      {/* <div>Previous</div> */}
                      {showWeight && <div>kg</div>}
                      {showReps && <div>reps</div>}
                      {showSeconds && <div>sec</div>}
                      {showDistance && <div>m</div>}
                      <div></div>
                    </div>

                    {/* Sets */}
                    {workoutExercise.workout_sets.map((set, setIndex) => (
                      <div
                        key={setIndex}
                        className="grid grid-cols-5 gap-4 p-3 border-t border-[#3C3C3E] items-center"
                      >
                        <div className="text-white font-medium">
                          {set.set_number}
                        </div>
                        {/* <div className="text-[#AEAEB2] text-sm">
                          {showWeight &&
                            showReps &&
                            `${set.target_weight_kg || 0} kg × ${set.target_reps || 0}`}
                          {!showWeight &&
                            showReps &&
                            `${set.target_reps || 0} reps`}
                          {showWeight &&
                            !showReps &&
                            `${set.target_weight_kg || 0} kg`}
                        </div> */}
                        {showWeight && (
                          <div>
                            <Input
                              type="number"
                              min={0}
                              step={0.1}
                              value={set.target_weight_kg || ""}
                              onChange={(e) =>
                                updateSet(
                                  exerciseIndex,
                                  setIndex,
                                  "target_weight_kg",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="bg-[#3C3C3E] border-[#3C3C3E] text-white text-sm h-8"
                              placeholder="0"
                            />
                          </div>
                        )}
                        {showReps && (
                          <div>
                            <Input
                              type="number"
                              min={0}
                              step={1}
                              value={set.target_reps || ""}
                              onChange={(e) =>
                                updateSet(
                                  exerciseIndex,
                                  setIndex,
                                  "target_reps",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="bg-[#3C3C3E] border-[#3C3C3E] text-white text-sm h-8"
                              placeholder="0"
                            />
                          </div>
                        )}
                        {showSeconds && (
                          <div>
                            <DurationPicker
                              showClock={false}
                              showArrow={false}
                              value={set.target_seconds || 0}
                              onChange={(seconds) =>
                                updateSet(
                                  exerciseIndex,
                                  setIndex,
                                  "target_seconds",
                                  seconds
                                )
                              }
                              placeholder="0s"
                              label=""
                            />
                          </div>
                        )}
                        {showDistance && (
                          <div>
                            <Input
                              type="number"
                              min={0}
                              value={set.target_distance_m || ""}
                              onChange={(e) =>
                                updateSet(
                                  exerciseIndex,
                                  setIndex,
                                  "target_distance_m",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="bg-[#3C3C3E] border-[#3C3C3E] text-white text-sm h-8"
                              placeholder="0"
                            />
                          </div>
                        )}
                        <div className="flex justify-end">
                          <button
                            className="text-[#AEAEB2] hover:text-white"
                            onClick={() => removeSet(exerciseIndex, setIndex)}
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add Set Button */}
                    <div className="p-3 border-t border-[#3C3C3E]">
                      <Button
                        onClick={() => addSet(exerciseIndex)}
                        variant="ghost"
                        className="w-full text-[#AEAEB2] hover:text-white hover:bg-[#3C3C3E]"
                      >
                        + Add Set
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add Exercise Button */}
            <Button
              onClick={() => setShowExerciseSelection(true)}
              variant="outline"
              className="w-full border-dashed border-[#3C3C3E] text-[#AEAEB2] hover:text-white hover:bg-[#2C2C2E]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Exercise
            </Button>
          </div>
        </div>
      </div>

      {/* Exercise Selection Dialog */}
      <ExerciseSelectionDialog
        isOpen={showExerciseSelection}
        onClose={() => setShowExerciseSelection(false)}
        onSelectExercise={addExercise}
      />
    </>
  );
}

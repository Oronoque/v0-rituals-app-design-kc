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
import type {
  CreateRitualSchemaType,
  ExerciseBodyPart,
  ExerciseEquipment,
  ExerciseMeasurementType,
  StepType,
} from "@rituals/shared";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Plus,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Import enum values from schema

const EQUIPMENT_TYPES = [
  "DUMBBELL",
  "KETTLEBELLS",
  "BARBELL",
  "SMITH_MACHINE",
  "BODY_ONLY",
  "OTHER",
  "BANDS",
  "EZ_BAR",
  "MACHINE",
  "DESK",
  "PULLUP_BAR",
  "NONE",
  "CABLE",
  "MEDICINE_BALL",
  "SWISS_BALL",
  "FOAM_ROLL",
  "WEIGHT_PLATE",
  "TRX",
  "BOX",
  "ROPES",
  "SPIN_BIKE",
  "STEP",
  "BOSU",
  "TYRE",
  "SANDBAG",
  "POLE",
  "BENCH",
  "WALL",
  "BAR",
  "RACK",
  "CAR",
  "SLED",
  "CHAIN",
  "SKIERG",
  "ROPE",
  "NA",
] as const;

const MECHANICS_TYPES = ["ISOLATION", "COMPOUND"] as const;

const PROGRESSION_TYPES = ["reps", "weight", "time", "distance"] as const;

// Helper component for multi-select with badges
function MultiSelectBadges({
  options,
  selected,
  onChange,
  label,
  placeholder,
}: {
  options: readonly string[];
  selected: string[];
  onChange: (values: string[]) => void;
  label: string;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-white">{label}</Label>
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between bg-[#2C2C2E] border-[#2C2C2E] text-white hover:bg-[#3C3C3E]"
          onClick={() => setIsOpen(!isOpen)}
        >
          {selected.length > 0
            ? `${selected.length} selected`
            : placeholder || `Select ${label}`}
          <ChevronDown className="h-4 w-4" />
        </Button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-[#2C2C2E] border border-[#3C3C3E] rounded-md shadow-lg max-h-48 overflow-y-auto">
            {options.map((option) => (
              <div
                key={option}
                className="flex items-center space-x-2 px-3 py-2 hover:bg-[#3C3C3E] cursor-pointer"
                onClick={() => toggleOption(option)}
              >
                <Checkbox
                  checked={selected.includes(option)}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <span className="text-white text-sm">
                  {option.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((item) => (
            <Badge
              key={item}
              variant="secondary"
              className="bg-blue-600/20 text-blue-300 border-blue-600/30"
            >
              {item.replace(/_/g, " ")}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => toggleOption(item)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

interface CreateRitualFormProps {
  onCancel: () => void;
  onSuccess?: () => void;
}

// Frontend-specific interfaces for form state
interface FormStepDefinition {
  id: string;
  type: StepType;
  name: string;
  config: any;
  is_required: boolean;
  order_index: number;
}

interface FormData {
  ritual: {
    name: string;
    description: string;
    category: string;
    location: string;
    gear: string[];
    is_public: boolean;
    is_active: boolean;
  };
  frequency: {
    frequency_type: string;
    frequency_interval: number;
    days_of_week: number[];
    specific_dates: string[];
  };
  step_definitions: FormStepDefinition[];
}

const RITUAL_CATEGORIES = [
  { value: "wellness", label: "Wellness" },
  { value: "fitness", label: "Fitness" },
  { value: "productivity", label: "Productivity" },
  { value: "learning", label: "Learning" },
  { value: "spiritual", label: "Spiritual" },
  { value: "social", label: "Social" },
  { value: "other", label: "Other" },
];

const FREQUENCY_TYPES = [
  { value: "once", label: "One Time" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "custom", label: "Custom" },
];

const STEP_TYPES = [
  {
    value: "boolean",
    label: "Yes/No Question",
    description: "Simple true/false questions",
  },
  {
    value: "counter",
    label: "Counter",
    description: "Track numbers with units",
  },
  { value: "qna", label: "Text Response", description: "Open-ended questions" },
  { value: "timer", label: "Timer", description: "Time-based activities" },
  {
    value: "scale",
    label: "Rating Scale",
    description: "Rate on a scale (1-10)",
  },
  {
    value: "workout",
    label: "Workout",
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
  const [formData, setFormData] = useState<FormData>({
    ritual: {
      name: "",
      description: "",
      category: "",
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

  const tabs = [
    { id: 0, label: "Basic Info", description: "Name, category, and details" },
    { id: 1, label: "Frequency", description: "When to perform this ritual" },
    { id: 2, label: "Steps", description: "Define the ritual steps" },
    { id: 3, label: "Review", description: "Review and create" },
  ];

  const handleNext = () => {
    if (currentTab < tabs.length - 1) {
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
      name: `${STEP_TYPES.find((t) => t.value === type)?.label} Step`,
      config: getDefaultConfig(type),
      is_required: true,
      order_index: formData.step_definitions.length,
    };

    setFormData({
      ...formData,
      step_definitions: [...formData.step_definitions, newStep],
    });
  };

  const getDefaultConfig = (type: string) => {
    switch (type) {
      case "boolean":
        return { question: "Did you complete this step?" };
      case "counter":
        return {
          question: "How many did you complete?",
          target_value: 10,
          unit: { value: 1, unit: "count" },
          min_value: 0,
          max_value: 100,
        };
      case "qna":
        return { question: "How did this step go?" };
      case "timer":
        return {
          question: "Complete this timed activity",
          duration_seconds: 300,
        };
      case "scale":
        return {
          question: "Rate your effort level",
          scale_min: 1,
          scale_max: 10,
        };
      case "workout":
        return {
          workout_exercises: [],
        };
      default:
        return {};
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
    // Validate required fields
    if (!formData.ritual.name.trim()) {
      toast.error("Please enter a ritual name");
      return;
    }

    if (!formData.ritual.category) {
      toast.error("Please select a category");
      return;
    }

    if (formData.step_definitions.length === 0) {
      toast.error("Please add at least one step");
      return;
    }

    try {
      // Transform formData to API format
      const ritualData: CreateRitualSchemaType = {
        ritual: {
          name: formData.ritual.name,
          description: formData.ritual.description,
          category: formData.ritual.category as any,
          location: formData.ritual.location,
          gear: formData.ritual.gear.length > 0 ? formData.ritual.gear : [],
          is_public: formData.ritual.is_public,
          is_active: formData.ritual.is_active,
        },
        frequency: {
          frequency_type: formData.frequency.frequency_type as any,
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

        step_definitions: formData.step_definitions.map((step) => {
          const baseStep = {
            order_index: step.order_index,
            type: step.type as any,
            name: step.name,
            is_required: step.is_required,
          };

          // Add type-specific fields based on step type
          switch (step.type) {
            case "counter":
              return {
                ...baseStep,
                target_count_value: step.config.target_count_value,
                target_count_unit: step.config.target_count_unit,
              };
            case "timer":
              return {
                ...baseStep,
                target_seconds: step.config.target_seconds,
              };
            case "scale":
              return {
                ...baseStep,
                min_value: step.config.min_value,
                max_value: step.config.max_value,
              };
            case "workout":
              return {
                ...baseStep,
                workout_exercises: step.config.workout_exercises || [],
              };
            default:
              return baseStep;
          }
        }),
      };

      // Call the API using the mutation
      await createRitualMutation.mutateAsync(ritualData);

      onSuccess?.();
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
    <div className="flex-1 flex flex-col overflow-hidden">
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
            onClick={() => setCurrentTab(tab.id)}
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
                        ritual: { ...formData.ritual, category: value },
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
                          frequency_type: value,
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
                  <div className="grid grid-cols-2 gap-3">
                    {STEP_TYPES.map((stepType) => (
                      <div key={stepType.value}>
                        <div className="text-xs text-[#AEAEB2] mt-1 truncate">
                          {stepType.description}
                        </div>
                        <Button
                          onClick={() => addStep(stepType.value)}
                          variant="outline"
                          className="border-[#3C3C3E] text-left h-auto p-3 flex flex-col items-start"
                        >
                          <div className="flex flex-col items-start">
                            <div className="font-medium text-white">
                              {stepType.label}
                            </div>
                          </div>
                        </Button>
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
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between p-4 border-t border-[#3C3C3E]/30">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentTab === 0}
          className="border-[#3C3C3E] text-[#AEAEB2] hover:text-white"
        >
          Previous
        </Button>

        <div className="text-center">
          <p className="text-[#AEAEB2] text-sm">
            Step {currentTab + 1} of {tabs.length}
          </p>
        </div>

        {currentTab < tabs.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canProceed() || createRitualMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {createRitualMutation.isPending ? "Creating..." : "Create Ritual"}
          </Button>
        )}
      </div>
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
            value={step.name}
            onChange={(e) => onUpdate(step.id, "name", e.target.value)}
            className="bg-[#2C2C2E] border-[#2C2C2E] text-white"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id={`required-${step.id}`}
            className="w-4 h-4 border-2 border-white bg-transparent"
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
      return (
        <div className="space-y-2">
          <Label className="text-white">Question</Label>
          <Input
            value={step.config.question || ""}
            onChange={(e) =>
              onUpdateConfig(step.id, "question", e.target.value)
            }
            placeholder="e.g., Did you complete this step?"
            className="bg-[#2C2C2E] border-[#2C2C2E] text-white"
          />
        </div>
      );

    case "counter":
      return <CounterStepEditor step={step} onUpdateConfig={onUpdateConfig} />;

    case "qna":
      return (
        <div className="space-y-2">
          <Label className="text-white">Question</Label>
          <Textarea
            value={step.config.question || ""}
            onChange={(e) =>
              onUpdateConfig(step.id, "question", e.target.value)
            }
            placeholder="e.g., How did this step make you feel?"
            className="bg-[#2C2C2E] border-[#2C2C2E] text-white"
            rows={3}
          />
        </div>
      );

    case "timer":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white">Activity Description</Label>
            <Input
              value={step.config.question || ""}
              onChange={(e) =>
                onUpdateConfig(step.id, "question", e.target.value)
              }
              placeholder="e.g., Meditate quietly"
              className="bg-[#2C2C2E] border-[#2C2C2E] text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white">Duration (seconds)</Label>
            <Input
              type="number"
              value={step.config.duration_seconds || ""}
              onChange={(e) =>
                onUpdateConfig(
                  step.id,
                  "duration_seconds",
                  parseInt(e.target.value) || 0
                )
              }
              className="bg-[#2C2C2E] border-[#2C2C2E] text-white"
            />
          </div>
        </div>
      );

    case "scale":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white">Question</Label>
            <Input
              value={step.config.question || ""}
              onChange={(e) =>
                onUpdateConfig(step.id, "question", e.target.value)
              }
              placeholder="e.g., Rate your energy level"
              className="bg-[#2C2C2E] border-[#2C2C2E] text-white"
            />
          </div>
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
  const { data: physicalQuantitiesData, isLoading } = usePhysicalQuantities();
  const physicalQuantities = physicalQuantitiesData?.physical_quantities || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-white">Target Count Value</Label>
          <Input
            type="number"
            step="0.1"
            value={step.config.target_count_value || ""}
            onChange={(e) =>
              onUpdateConfig(
                step.id,
                "target_count_value",
                parseFloat(e.target.value) || undefined
              )
            }
            placeholder="e.g., 10, 2.5"
            className="bg-[#2C2C2E] border-[#2C2C2E] text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white">Unit</Label>
          {isLoading ? (
            <div className="text-[#AEAEB2] text-sm py-2">Loading units...</div>
          ) : (
            <Select
              value={step.config.target_count_unit || ""}
              onValueChange={(value) =>
                onUpdateConfig(step.id, "target_count_unit", value)
              }
            >
              <SelectTrigger className="bg-[#2C2C2E] border-[#2C2C2E] text-white">
                <SelectValue placeholder="Select a unit..." />
              </SelectTrigger>
              <SelectContent className="bg-[#2C2C2E] border-[#3C3C3E] max-h-60">
                {physicalQuantities.map((quantity) => (
                  <SelectItem
                    key={quantity.id}
                    value={quantity.id}
                    className="text-white"
                  >
                    <div className="flex flex-col">
                      <span>{quantity.name}</span>
                      <span className="text-xs text-[#AEAEB2] capitalize">
                        {/* Display unit dimensions in a readable way */}
                        {quantity.m_exp !== 0 &&
                          `m${quantity.m_exp !== 1 ? `^${quantity.m_exp}` : ""}`}
                        {quantity.kg_exp !== 0 &&
                          ` kg${quantity.kg_exp !== 1 ? `^${quantity.kg_exp}` : ""}`}
                        {quantity.s_exp !== 0 &&
                          ` s${quantity.s_exp !== 1 ? `^${quantity.s_exp}` : ""}`}
                        {quantity.A_exp !== 0 &&
                          ` A${quantity.A_exp !== 1 ? `^${quantity.A_exp}` : ""}`}
                        {quantity.K_exp !== 0 &&
                          ` K${quantity.K_exp !== 1 ? `^${quantity.K_exp}` : ""}`}
                        {quantity.mol_exp !== 0 &&
                          ` mol${quantity.mol_exp !== 1 ? `^${quantity.mol_exp}` : ""}`}
                        {quantity.cd_exp !== 0 &&
                          ` cd${quantity.cd_exp !== 1 ? `^${quantity.cd_exp}` : ""}`}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {step.config.target_count_unit && (
        <div className="mt-2 p-3 bg-[#3C3C3E]/50 rounded">
          <p className="text-[#AEAEB2] text-sm">
            <strong>Selected Unit:</strong>{" "}
            {physicalQuantities.find(
              (q) => q.id === step.config.target_count_unit
            )?.name || "Unknown"}
          </p>
          <p className="text-[#AEAEB2] text-xs mt-1">
            Users will input how many {step.config.target_count_value || "X"}{" "}
            {physicalQuantities.find(
              (q) => q.id === step.config.target_count_unit
            )?.name || "units"}{" "}
            they completed.
          </p>
        </div>
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
            <h4 className="text-white font-medium">Workout Configuration</h4>
            <Button
              onClick={() => setShowWorkoutDialog(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Configure Workout
            </Button>
          </div>

          {workoutExercises.length === 0 ? (
            <p className="text-[#AEAEB2] text-sm">
              No exercises configured. Click "Configure Workout" to add
              exercises and sets.
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

// New Workout Step Editor Component
function WorkoutStepEditor({
  step,
  onUpdateConfig,
}: {
  step: FormStepDefinition;
  onUpdateConfig: (stepId: string, key: string, value: any) => void;
}) {
  const { data: exercisesData, isLoading } = useExercises();
  const exercises = exercisesData?.exercises || [];

  // Initialize workout_exercises if not exists
  const workoutExercises = step.config.workout_exercises || [];

  const addExercise = () => {
    const newExercise = {
      exercise_id: "",
      exercise_measurement_type: "weight_reps" as ExerciseMeasurementType,
      order_index: workoutExercises.length,
      workout_sets: [
        {
          set_number: 1,
          target_weight_kg: undefined,
          target_reps: undefined,
          target_seconds: undefined,
          target_distance_m: undefined,
        },
      ],
    };
    onUpdateConfig(step.id, "workout_exercises", [
      ...workoutExercises,
      newExercise,
    ]);
  };

  const updateExercise = (exerciseIndex: number, field: string, value: any) => {
    const updated = [...workoutExercises];
    if (field === "exercise_id") {
      // When exercise changes, find its measurement type and reset sets
      const selectedExercise = exercises.find((ex) => ex.id === value);
      if (selectedExercise) {
        updated[exerciseIndex] = {
          ...updated[exerciseIndex],
          exercise_id: value,
          exercise_measurement_type: selectedExercise.measurement_type,
          workout_sets: [
            {
              set_number: 1,
              target_weight_kg: undefined,
              target_reps: undefined,
              target_seconds: undefined,
              target_distance_m: undefined,
            },
          ],
        };
      }
    } else {
      updated[exerciseIndex] = { ...updated[exerciseIndex], [field]: value };
    }
    onUpdateConfig(step.id, "workout_exercises", updated);
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
      target_weight_kg: undefined,
      target_reps: undefined,
      target_seconds: undefined,
      target_distance_m: undefined,
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

  const getFieldLabel = (field: string) => {
    switch (field) {
      case "target_weight_kg":
        return "Weight (kg)";
      case "target_reps":
        return "Reps";
      case "target_seconds":
        return "Time (sec)";
      case "target_distance_m":
        return "Distance (m)";
      default:
        return field;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium">Workout Exercises</h3>
        <Button
          onClick={addExercise}
          variant="outline"
          size="sm"
          className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Exercise
        </Button>
      </div>

      {isLoading && (
        <div className="text-[#AEAEB2] text-center py-4">
          Loading exercises...
        </div>
      )}

      {workoutExercises.length === 0 && !isLoading && (
        <div className="text-center py-8 text-[#AEAEB2] border border-dashed border-[#3C3C3E] rounded-lg">
          <p>No exercises added yet. Click "Add Exercise" to get started.</p>
        </div>
      )}

      {workoutExercises.map((workoutExercise, exerciseIndex) => {
        const selectedExercise = exercises.find(
          (ex) => ex.id === workoutExercise.exercise_id
        );
        const measurementType = workoutExercise.exercise_measurement_type;
        const visibleFields = getFieldsForMeasurementType(measurementType);

        return (
          <Card key={exerciseIndex} className="bg-[#3C3C3E] border-[#4C4C4E]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">
                  Exercise {exerciseIndex + 1}
                </CardTitle>
                <Button
                  onClick={() => removeExercise(exerciseIndex)}
                  variant="outline"
                  size="sm"
                  className="border-red-500 text-red-400 hover:bg-red-500/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Exercise Selection */}
              <div className="space-y-2">
                <Label className="text-white">Select Exercise</Label>
                <Select
                  value={workoutExercise.exercise_id}
                  onValueChange={(value) =>
                    updateExercise(exerciseIndex, "exercise_id", value)
                  }
                >
                  <SelectTrigger className="bg-[#2C2C2E] border-[#2C2C2E] text-white">
                    <SelectValue placeholder="Choose an exercise..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2C2C2E] border-[#3C3C3E] max-h-60">
                    {exercises.map((exercise) => (
                      <SelectItem
                        key={exercise.id}
                        value={exercise.id}
                        className="text-white"
                      >
                        <div className="flex flex-col">
                          <span>{exercise.name}</span>
                          <span className="text-xs text-[#AEAEB2]">
                            {exercise.body_part} •{" "}
                            {exercise.measurement_type.replace("_", " ")}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedExercise?.equipment && (
                  <div className="text-xs text-[#AEAEB2] mt-1">
                    <span className="inline-block bg-[#2C2C2E] px-2 py-1 rounded mr-2">
                      {selectedExercise.body_part}
                    </span>
                    <span className="inline-block bg-[#2C2C2E] px-2 py-1 rounded mr-2">
                      {selectedExercise.measurement_type.replace("_", " ")}
                    </span>
                    {selectedExercise.equipment.map((eq, i) => (
                      <span
                        key={i}
                        className="inline-block bg-[#2C2C2E] px-2 py-1 rounded mr-2"
                      >
                        {eq.replace("_", " ")}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Workout Sets */}
              {workoutExercise.exercise_id && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Sets</Label>
                    <Button
                      onClick={() => addSet(exerciseIndex)}
                      variant="outline"
                      size="sm"
                      className="border-green-500 text-green-400 hover:bg-green-500/10"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Set
                    </Button>
                  </div>

                  {workoutExercise.workout_sets.map((set, setIndex) => (
                    <div
                      key={setIndex}
                      className="border border-[#2C2C2E] rounded p-3 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">
                          Set {set.set_number}
                        </span>
                        {workoutExercise.workout_sets.length > 1 && (
                          <Button
                            onClick={() => removeSet(exerciseIndex, setIndex)}
                            variant="outline"
                            size="sm"
                            className="border-red-500 text-red-400 hover:bg-red-500/10"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {visibleFields.map((field) => (
                          <div key={field} className="space-y-1">
                            <Label className="text-white text-sm">
                              {getFieldLabel(field)}
                            </Label>
                            <Input
                              type="number"
                              step={field === "target_weight_kg" ? "0.1" : "1"}
                              value={(set as any)[field] || ""}
                              onChange={(e) =>
                                updateSet(
                                  exerciseIndex,
                                  setIndex,
                                  field,
                                  field === "target_weight_kg"
                                    ? parseFloat(e.target.value) || undefined
                                    : parseInt(e.target.value) || undefined
                                )
                              }
                              className="bg-[#2C2C2E] border-[#2C2C2E] text-white"
                              placeholder="0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[#1C1C1E] rounded-xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#3C3C3E]">
          <h2 className="text-white text-lg font-semibold">Select Exercise</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-[#AEAEB2] hover:text-white"
          >
            <X className="h-5 w-5" />
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
        <div className="flex-1 overflow-y-auto">
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

  const workoutExercises = step.config.workout_exercises || [];

  const addExercise = (exercise: any) => {
    const newExercise = {
      exercise_id: exercise.id,
      exercise_measurement_type:
        exercise.measurement_type as ExerciseMeasurementType,
      order_index: workoutExercises.length,
      workout_sets: [
        {
          set_number: 1,
          target_weight_kg: undefined,
          target_reps: undefined,
          target_seconds: undefined,
          target_distance_m: undefined,
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
      target_weight_kg: undefined,
      target_reps: undefined,
      target_seconds: undefined,
      target_distance_m: undefined,
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#1C1C1E] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#3C3C3E]">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-[#AEAEB2] hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
              <h2 className="text-white text-lg font-semibold">
                Edit Template
              </h2>
            </div>
            <Button
              onClick={onClose}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Save
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Template Title */}
            <div>
              <h3 className="text-white text-xl font-semibold">
                Weightlifting
              </h3>
              <p className="text-[#AEAEB2] text-sm">Notes</p>
            </div>

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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#AEAEB2] hover:text-white"
                        onClick={() => removeExercise(exerciseIndex)}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Sets Table */}
                  <div className="bg-[#2C2C2E] rounded-lg overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-5 gap-4 p-3 bg-[#3C3C3E] text-[#AEAEB2] text-sm font-medium">
                      <div>Set</div>
                      <div>Previous</div>
                      {showWeight && <div>kg</div>}
                      {showReps && <div>Reps</div>}
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
                        <div className="text-[#AEAEB2] text-sm">
                          {showWeight &&
                            showReps &&
                            `${set.target_weight_kg || 0} kg × ${set.target_reps || 0}`}
                          {!showWeight &&
                            showReps &&
                            `${set.target_reps || 0} reps`}
                          {showWeight &&
                            !showReps &&
                            `${set.target_weight_kg || 0} kg`}
                        </div>
                        {showWeight && (
                          <div>
                            <Input
                              type="number"
                              step="0.1"
                              value={set.target_weight_kg || ""}
                              onChange={(e) =>
                                updateSet(
                                  exerciseIndex,
                                  setIndex,
                                  "target_weight_kg",
                                  parseFloat(e.target.value) || undefined
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
                              value={set.target_reps || ""}
                              onChange={(e) =>
                                updateSet(
                                  exerciseIndex,
                                  setIndex,
                                  "target_reps",
                                  parseInt(e.target.value) || undefined
                                )
                              }
                              className="bg-[#3C3C3E] border-[#3C3C3E] text-white text-sm h-8"
                              placeholder="0"
                            />
                          </div>
                        )}
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSet(exerciseIndex, setIndex)}
                            className="text-[#AEAEB2] hover:text-white h-6 w-6 p-0"
                          >
                            ―
                          </Button>
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

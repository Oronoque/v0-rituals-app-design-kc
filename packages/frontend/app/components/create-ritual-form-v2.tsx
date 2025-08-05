"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, X, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateRitual } from "@/hooks/use-api";
import { toast } from "sonner";
import type { CreateRitual } from "@rituals/shared";

// Import enum values from schema
const EXERCISE_TYPES = [
  "BODYWEIGHT", "STRENGTH", "POWERLIFTING", "CALISTHENIC", "PLYOMETRICS", 
  "STRETCHING", "STRONGMAN", "CARDIO", "STABILIZATION", "POWER", 
  "RESISTANCE", "CROSSFIT", "WEIGHTLIFTING"
] as const;

const PRIMARY_MUSCLE_GROUPS = [
  "BICEPS", "SHOULDERS", "CHEST", "BACK", "GLUTES", "TRICEPS", 
  "HAMSTRINGS", "QUADRICEPS", "FOREARMS", "CALVES", "TRAPS", 
  "ABDOMINALS", "NECK", "LATS"
] as const;

const SECONDARY_MUSCLE_GROUPS = [
  "ADDUCTORS", "ABDUCTORS", "OBLIQUES", "GROIN", "FULL_BODY", 
  "ROTATOR_CUFF", "HIP_FLEXOR", "ACHILLES_TENDON", "FINGERS"
] as const;

const EQUIPMENT_TYPES = [
  "DUMBBELL", "KETTLEBELLS", "BARBELL", "SMITH_MACHINE", "BODY_ONLY", 
  "OTHER", "BANDS", "EZ_BAR", "MACHINE", "DESK", "PULLUP_BAR", "NONE", 
  "CABLE", "MEDICINE_BALL", "SWISS_BALL", "FOAM_ROLL", "WEIGHT_PLATE", 
  "TRX", "BOX", "ROPES", "SPIN_BIKE", "STEP", "BOSU", "TYRE", "SANDBAG", 
  "POLE", "BENCH", "WALL", "BAR", "RACK", "CAR", "SLED", "CHAIN", 
  "SKIERG", "ROPE", "NA"
] as const;

const MECHANICS_TYPES = ["ISOLATION", "COMPOUND"] as const;

const PROGRESSION_TYPES = ["reps", "weight", "time", "distance"] as const;

// Helper component for multi-select with badges
function MultiSelectBadges({ 
  options, 
  selected, 
  onChange, 
  label, 
  placeholder 
}: {
  options: readonly string[]
  selected: string[]
  onChange: (values: string[]) => void
  label: string
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option))
    } else {
      onChange([...selected, option])
    }
  }
  
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
          {selected.length > 0 ? `${selected.length} selected` : placeholder || `Select ${label}`}
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
                <span className="text-white text-sm">{option.replace(/_/g, ' ')}</span>
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
              {item.replace(/_/g, ' ')}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => toggleOption(item)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

interface CreateRitualFormProps {
  onCancel: () => void;
  onSuccess?: () => void;
}

// Frontend-specific interfaces for form state
interface FormStepDefinition {
  id: string;
  type: "boolean" | "counter" | "qna" | "timer" | "scale" | "exercise_set";
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
    value: "exercise_set",
    label: "Exercise Set",
    description: "Track workout sets and reps",
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
  
    if (
      trimmedGear &&
      !formData.ritual.gear.includes(trimmedGear)
    ) {
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
          specific_dates: [...formData.frequency.specific_dates, specificDateInput],
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
        specific_dates: formData.frequency.specific_dates.filter((d) => d !== date),
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
      case "exercise_set":
        return {
          question: "Complete this exercise",
          target_sets: 3,
          target_reps: 10,
          target_weight: 0,
          rest_time_seconds: 60,
          progression_type: "reps",
          exercise: {
            name: "Push-ups",
            type: ["BODYWEIGHT"],
            primary_muscles: ["CHEST"],
            secondary_muscles: [],
            equipment: ["BODY_ONLY"],
            mechanics: "COMPOUND",
            difficulty: 3,
            instructions: [
              "Get into push-up position",
              "Lower body until chest nearly touches floor",
              "Push back up",
            ],
            tips: [],
          },
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
      const ritualData: CreateRitual = {
        ritual: {
          name: formData.ritual.name,
          description: formData.ritual.description || null,
          category: formData.ritual.category as any,
          location: formData.ritual.location || null,
          gear: formData.ritual.gear.length > 0 ? formData.ritual.gear : null,
          is_public: formData.ritual.is_public,
          is_active: formData.ritual.is_active,
        },
        frequency: {
          frequency_type: formData.frequency.frequency_type as any,
          frequency_interval: formData.frequency.frequency_interval,
          days_of_week: formData.frequency.days_of_week.length > 0 ? formData.frequency.days_of_week : null,
          specific_dates: formData.frequency.specific_dates.length > 0 ? formData.frequency.specific_dates : null,
        },
        // @ts-ignore
        step_definitions: formData.step_definitions.map((step) => ({
          order_index: step.order_index,
          type: step.type as any,
          name: step.name,
          config: {
            type: step.type,
            config: step.config,
          },
          is_required: step.is_required,
        })),
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
                          {formData.frequency.days_of_week.map(
                            (d) =>
                                    DAYS_OF_WEEK.find((day) => day.value === d)
                                ?.label
                          ).join(", ")}
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
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white">Question</Label>
            <Input
              value={step.config.question || ""}
              onChange={(e) =>
                onUpdateConfig(step.id, "question", e.target.value)
              }
              placeholder="e.g., How many reps did you do?"
              className="bg-[#2C2C2E] border-[#2C2C2E] text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Target Value</Label>
              <Input
                type="number"
                value={step.config.target_value || ""}
                onChange={(e) =>
                  onUpdateConfig(
                    step.id,
                    "target_value",
                    parseInt(e.target.value) || 0
                  )
                }
                className="bg-[#2C2C2E] border-[#2C2C2E] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Unit</Label>
              <Input
                value={step.config.unit?.unit || ""}
                onChange={(e) =>
                  onUpdateConfig(step.id, "unit", {
                    ...step.config.unit,
                    unit: e.target.value,
                  })
                }
                placeholder="e.g., reps, minutes, cups"
                className="bg-[#2C2C2E] border-[#2C2C2E] text-white"
              />
            </div>
          </div>
        </div>
      );

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

    case "exercise_set":
      return (
        <div className="space-y-4">
          {/* Exercise Basic Info */}
          <div className="space-y-2">
            <Label className="text-white">Exercise Name</Label>
            <Input
              value={step.config.exercise?.name || ""}
              onChange={(e) =>
                onUpdateConfig(step.id, "exercise", {
                  ...step.config.exercise,
                  name: e.target.value,
                })
              }
              placeholder="e.g., Push-ups"
              className="bg-[#2C2C2E] border-[#2C2C2E] text-white"
            />
          </div>

          {/* Target Values */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Target Sets</Label>
              <Input
                type="number"
                value={step.config.target_sets || ""}
                onChange={(e) =>
                  onUpdateConfig(
                    step.id,
                    "target_sets",
                    parseInt(e.target.value) || 0
                  )
                }
                className="bg-[#2C2C2E] border-[#2C2C2E] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Target Reps</Label>
              <Input
                type="number"
                value={step.config.target_reps || ""}
                onChange={(e) =>
                  onUpdateConfig(
                    step.id,
                    "target_reps",
                    parseInt(e.target.value) || 0
                  )
                }
                className="bg-[#2C2C2E] border-[#2C2C2E] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Target Weight</Label>
              <Input
                type="number"
                value={step.config.target_weight || ""}
                onChange={(e) =>
                  onUpdateConfig(
                    step.id,
                    "target_weight",
                    parseInt(e.target.value) || 0
                  )
                }
                className="bg-[#2C2C2E] border-[#2C2C2E] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Rest Time (sec)</Label>
              <Input
                type="number"
                value={step.config.rest_time_seconds || ""}
                onChange={(e) =>
                  onUpdateConfig(
                    step.id,
                    "rest_time_seconds",
                    parseInt(e.target.value) || 0
                  )
                }
                className="bg-[#2C2C2E] border-[#2C2C2E] text-white"
              />
            </div>
          </div>

          {/* Exercise Classification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Progression Type</Label>
              <Select
                value={step.config.progression_type || ""}
                onValueChange={(value) =>
                  onUpdateConfig(step.id, "progression_type", value)
                }
              >
                <SelectTrigger className="bg-[#2C2C2E] border-[#2C2C2E] text-white">
                  <SelectValue placeholder="Select progression type" />
                </SelectTrigger>
                <SelectContent className="bg-[#2C2C2E] border-[#3C3C3E]">
                  {PROGRESSION_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="text-white">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Mechanics</Label>
              <Select
                value={step.config.exercise?.mechanics || ""}
                onValueChange={(value) =>
                  onUpdateConfig(step.id, "exercise", {
                    ...step.config.exercise,
                    mechanics: value,
                  })
                }
              >
                <SelectTrigger className="bg-[#2C2C2E] border-[#2C2C2E] text-white">
                  <SelectValue placeholder="Select mechanics" />
                </SelectTrigger>
                <SelectContent className="bg-[#2C2C2E] border-[#3C3C3E]">
                  {MECHANICS_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="text-white">
                      {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Multi-select Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MultiSelectBadges
              options={EXERCISE_TYPES}
              selected={step.config.exercise?.type || []}
              onChange={(values) =>
                onUpdateConfig(step.id, "exercise", {
                  ...step.config.exercise,
                  type: values,
                })
              }
              label="Exercise Types"
              placeholder="Select exercise types"
            />

            <MultiSelectBadges
              options={EQUIPMENT_TYPES}
              selected={step.config.exercise?.equipment || []}
              onChange={(values) =>
                onUpdateConfig(step.id, "exercise", {
                  ...step.config.exercise,
                  equipment: values,
                })
              }
              label="Equipment"
              placeholder="Select equipment"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MultiSelectBadges
              options={PRIMARY_MUSCLE_GROUPS}
              selected={step.config.exercise?.primary_muscles || []}
              onChange={(values) =>
                onUpdateConfig(step.id, "exercise", {
                  ...step.config.exercise,
                  primary_muscles: values,
                })
              }
              label="Primary Muscles"
              placeholder="Select primary muscles"
            />

            <MultiSelectBadges
              options={SECONDARY_MUSCLE_GROUPS}
              selected={step.config.exercise?.secondary_muscles || []}
              onChange={(values) =>
                onUpdateConfig(step.id, "exercise", {
                  ...step.config.exercise,
                  secondary_muscles: values,
                })
              }
              label="Secondary Muscles"
              placeholder="Select secondary muscles"
            />
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <Label className="text-white">Difficulty (1-5)</Label>
            <Select
              value={step.config.exercise?.difficulty?.toString() || ""}
              onValueChange={(value) =>
                onUpdateConfig(step.id, "exercise", {
                  ...step.config.exercise,
                  difficulty: parseInt(value),
                })
              }
            >
              <SelectTrigger className="bg-[#2C2C2E] border-[#2C2C2E] text-white">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent className="bg-[#2C2C2E] border-[#3C3C3E]">
                {[1, 2, 3, 4, 5].map((level) => (
                  <SelectItem key={level} value={level.toString()} className="text-white">
                    {level} - {['Beginner', 'Easy', 'Moderate', 'Hard', 'Expert'][level - 1]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label className="text-white">Instructions</Label>
            <Textarea
              value={step.config.exercise?.instructions?.join('\n') || ""}
              onChange={(e) =>
                onUpdateConfig(step.id, "exercise", {
                  ...step.config.exercise,
                  instructions: e.target.value.split('\n').filter(line => line.trim()),
                })
              }
              placeholder="Enter each instruction on a new line..."
              className="bg-[#2C2C2E] border-[#2C2C2E] text-white"
              rows={4}
            />
          </div>

          {/* Tips */}
          <div className="space-y-2">
            <Label className="text-white">Tips (Optional)</Label>
            <Textarea
              value={step.config.exercise?.tips?.join('\n') || ""}
              onChange={(e) =>
                onUpdateConfig(step.id, "exercise", {
                  ...step.config.exercise,
                  tips: e.target.value.split('\n').filter(line => line.trim()),
                })
              }
              placeholder="Enter each tip on a new line..."
              className="bg-[#2C2C2E] border-[#2C2C2E] text-white"
              rows={3}
            />
          </div>

          {/* Media URLs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Video URL (Optional)</Label>
              <Input
                value={step.config.exercise?.video_url || ""}
                onChange={(e) =>
                  onUpdateConfig(step.id, "exercise", {
                    ...step.config.exercise,
                    video_url: e.target.value,
                  })
                }
                placeholder="https://example.com/video"
                className="bg-[#2C2C2E] border-[#2C2C2E] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Image URL (Optional)</Label>
              <Input
                value={step.config.exercise?.image_url || ""}
                onChange={(e) =>
                  onUpdateConfig(step.id, "exercise", {
                    ...step.config.exercise,
                    image_url: e.target.value,
                  })
                }
                placeholder="https://example.com/image"
                className="bg-[#2C2C2E] border-[#2C2C2E] text-white"
              />
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}

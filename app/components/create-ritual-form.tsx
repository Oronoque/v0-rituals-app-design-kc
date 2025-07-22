"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, Plus, X, MapPin, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCreateRitual } from "@/hooks/use-api"
import type { CreateRitualRequest } from "@/lib/api"

interface CreateRitualFormProps {
  onBack: () => void
}

interface StepFormData {
  type: "yesno" | "qa" | "weightlifting" | "cardio" | "custom"
  name: string
  question?: string
  weightlifting_config?: Array<{
    reps: number
    weight: number
    completed?: boolean | null
  }>
  cardio_config?: Array<{
    time: number
    distance: number
    completed?: boolean | null
  }>
  custom_config?: {
    label: string
    unit: string
  }
}

const categories = [
  "Wellness",
  "Fitness", 
  "Productivity",
  "Mindfulness",
  "Health",
  "Morning",
  "Evening",
  "Work",
  "Study"
]

const stepTypes = [
  {
    id: "yesno",
    name: "Yes/No - Simple completion checkbox",
    description: "Perfect for binary tasks like 'Did you exercise?'"
  },
  {
    id: "qa", 
    name: "Q&A - Text response",
    description: "For reflections, journaling, or detailed responses"
  },
  {
    id: "weightlifting",
    name: "Weightlifting - Sets, reps, weight tracking",
    description: "Track your strength training workouts"
  },
  {
    id: "cardio",
    name: "Cardio - Time and distance tracking", 
    description: "Track running, cycling, or cardio workouts"
  },
  {
    id: "custom",
    name: "Custom - Flexible metric tracking",
    description: "Track any custom metric with your own unit"
  }
]

function AddStepModal({ 
  open, 
  onOpenChange, 
  onAddStep 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddStep: (step: StepFormData) => void
}) {
  const [stepData, setStepData] = useState<StepFormData>({
    type: "yesno",
    name: "",
    question: ""
  })

  const handleSubmit = () => {
    if (!stepData.name.trim()) return
    
    onAddStep(stepData)
    onOpenChange(false)
    setStepData({
      type: "yesno",
      name: "",
      question: ""
    })
  }

  const selectedStepType = stepTypes.find(type => type.id === stepData.type)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#2C2C2E] border-[#3C3C3E] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Add Step
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Step Name */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Step Name <span className="text-red-400">*</span>
            </label>
            <Input
              placeholder="e.g., Take a cold shower"
              value={stepData.name}
              onChange={(e) => setStepData({ ...stepData, name: e.target.value })}
              className="bg-[#3C3C3E] border-[#4C4C4E] text-white"
            />
          </div>

          {/* Step Type */}
          <div>
            <label className="text-sm font-medium mb-2 block">Step Type</label>
            <Select
              value={stepData.type}
              onValueChange={(value: any) => setStepData({ ...stepData, type: value })}
            >
              <SelectTrigger className="bg-[#3C3C3E] border-[#4C4C4E] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2C2C2E] border-[#3C3C3E] text-white">
                {stepTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id} className="focus:bg-[#3C3C3E]">
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStepType && (
              <p className="text-xs text-[#8E8E93] mt-1">{selectedStepType.description}</p>
            )}
          </div>

          {/* Question (for qa and yesno types) */}
          {(stepData.type === "qa" || stepData.type === "yesno") && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Question {stepData.type === "qa" ? "(Optional)" : "(Optional)"}
              </label>
              <Textarea
                placeholder="Enter your question..."
                value={stepData.question || ""}
                onChange={(e) => setStepData({ ...stepData, question: e.target.value })}
                className="bg-[#3C3C3E] border-[#4C4C4E] text-white resize-none"
                rows={3}
              />
            </div>
          )}

          {/* Custom Config */}
          {stepData.type === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Label</label>
                <Input
                  placeholder="e.g., Water"
                  value={stepData.custom_config?.label || ""}
                  onChange={(e) => setStepData({
                    ...stepData,
                    custom_config: {
                      ...stepData.custom_config,
                      label: e.target.value,
                      unit: stepData.custom_config?.unit || ""
                    }
                  })}
                  className="bg-[#3C3C3E] border-[#4C4C4E] text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Unit</label>
                <Input
                  placeholder="e.g., glasses"
                  value={stepData.custom_config?.unit || ""}
                  onChange={(e) => setStepData({
                    ...stepData,
                    custom_config: {
                      ...stepData.custom_config,
                      unit: e.target.value,
                      label: stepData.custom_config?.label || ""
                    }
                  })}
                  className="bg-[#3C3C3E] border-[#4C4C4E] text-white"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-transparent border-[#4C4C4E] text-white hover:bg-[#3C3C3E]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!stepData.name.trim()}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              Add Step
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function CreateRitualForm({ onBack }: CreateRitualFormProps) {
  const [formData, setFormData] = useState<CreateRitualRequest>({
    name: "",
    description: "",
    category: "",
    location: "",
    gear: [],
    steps: [],
    is_public: false,
  })
  const [showAddStep, setShowAddStep] = useState(false)
  const [newGearItem, setNewGearItem] = useState("")

  const createRitualMutation = useCreateRitual()

  const handleSubmit = () => {
    if (!formData.name.trim() || formData.steps.length === 0) return
    
    createRitualMutation.mutate({
      ...formData,
      gear: formData.gear && formData.gear.length > 0 ? formData.gear : undefined,
      category: formData.category || undefined,
      description: formData.description || undefined,
      location: formData.location || undefined,
      is_public: formData.is_public
    })
  }
  

  const handleAddStep = (step: StepFormData) => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, step]
    }))
  }

  const handleRemoveStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }))
  }

  const handleAddGear = () => {
    if (!newGearItem.trim()) return
    
    setFormData(prev => ({
      ...prev,
      gear: [...(prev.gear || []), newGearItem.trim()]
    }))
    setNewGearItem("")
  }

  const handleRemoveGear = (index: number) => {
    setFormData(prev => ({
      ...prev,
      gear: (prev.gear || []).filter((_, i) => i !== index)
    }))
  }

  const canSave = formData.name.trim() && formData.steps.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D0E] via-[#1C1C1E] to-[#2C2C2E] flex items-center justify-center p-4">
      {/* Phone Container */}
      <div className="w-full max-w-sm mx-auto">
        {/* Phone Frame Effect */}
        <div className="bg-[#1C1C1E] rounded-3xl shadow-2xl border border-[#3C3C3E]/30 overflow-hidden h-[800px] flex flex-col">
          {/* Status Bar Simulation */}
          <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-600 flex-shrink-0"></div>
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#3C3C3E]/30 flex-shrink-0">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack} className="p-2 -ml-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold">Create Ritual</h1>
            </div>
            <div className="flex items-center gap-4">
              {/* Public/Private Toggle */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#8E8E93]">Private</span>
                <Switch
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                  className="data-[state=checked]:bg-green-500"
                />
                <span className="text-sm text-[#8E8E93]">Public</span>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!canSave || createRitualMutation.isPending}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
              >
                {createRitualMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Saving...
                  </div>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>

          {/* Main Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="bg-[#2C2C2E] rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-6">Basic Information</h2>
                
                <div className="space-y-5">
                  {/* Ritual Name */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Ritual Name <span className="text-red-400">*</span>
                    </label>
                    <Input
                      placeholder="e.g., Morning Routine"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-[#3C3C3E] border-[#4C4C4E] text-white h-12"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Textarea
                      placeholder="Describe what this ritual is about..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-[#3C3C3E] border-[#4C4C4E] text-white resize-none"
                      rows={4}
                    />
                  </div>

                  {/* Location and Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Location
                      </label>
                      <Input
                        placeholder="e.g., Bedroom"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="bg-[#3C3C3E] border-[#4C4C4E] text-white h-12"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Category</label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger className="bg-[#3C3C3E] border-[#4C4C4E] text-white h-12">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2C2C2E] border-[#3C3C3E] text-white">
                          {categories.map((category) => (
                            <SelectItem key={category} value={category} className="focus:bg-[#3C3C3E]">
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gear & Equipment */}
              <div className="bg-[#2C2C2E] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Package className="w-5 h-5" />
                  <h2 className="text-xl font-semibold">Gear & Equipment</h2>
                </div>

                <div className="space-y-4">
                  {/* Add Gear Input */}
                  <div className="flex gap-3">
                    <Input
                      placeholder="Add gear item..."
                      value={newGearItem}
                      onChange={(e) => setNewGearItem(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddGear()}
                      className="bg-[#3C3C3E] border-[#4C4C4E] text-white h-12 flex-1"
                    />
                    <Button
                      onClick={handleAddGear}
                      disabled={!newGearItem.trim()}
                      className="bg-blue-500 hover:bg-blue-600 px-4"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Gear List */}
                  {formData.gear && formData.gear.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.gear.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-[#3C3C3E] px-3 py-2 rounded-xl"
                        >
                          <span className="text-sm">{item}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveGear(index)}
                            className="h-4 w-4 p-0 hover:bg-red-500/20"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Steps */}
              <div className="bg-[#2C2C2E] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Steps ({formData.steps.length})</h2>
                  <Button
                    onClick={() => setShowAddStep(true)}
                    className="bg-black hover:bg-black/80 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Step
                  </Button>
                </div>

                {formData.steps.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-[#3C3C3E] rounded-xl">
                    <p className="text-[#8E8E93] mb-2">No steps added yet</p>
                    <p className="text-[#8E8E93] text-sm">Add steps to define your ritual</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.steps.map((step, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-[#3C3C3E] rounded-xl"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </span>
                            <h4 className="font-medium">{step.name}</h4>
                            <span className="text-xs bg-[#4C4C4E] px-2 py-1 rounded-full">
                              {step.type}
                            </span>
                          </div>
                          {step.question && (
                            <p className="text-[#8E8E93] text-sm ml-9">{step.question}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveStep(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Extra padding at bottom for better scrolling */}
              <div className="h-4"></div>
            </div>
          </div>

          <AddStepModal
            open={showAddStep}
            onOpenChange={setShowAddStep}
            onAddStep={handleAddStep}
          />
        </div>
      </div>
    </div>
  )
} 
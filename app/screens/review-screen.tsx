"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Check, Edit3, Star } from "lucide-react"
import type { FlowState, Ritual, Step } from "@/app/types"
import { cn } from "@/lib/utils"

interface ReviewScreenProps {
  onNavigate: (flow: FlowState) => void
  completedRituals: Ritual[]
  onUpdateRitual: (ritualIndex: number, updatedRitual: Ritual) => void
  onContinueToSchedule: () => void
  onUpdateReviewData: (rating: number, reflection: string) => void
}

export function ReviewScreen({
  onNavigate,
  completedRituals,
  onUpdateRitual,
  onContinueToSchedule,
  onUpdateReviewData,
}: ReviewScreenProps) {
  const [selectedRitual, setSelectedRitual] = useState<number>(0)
  const [editingStep, setEditingStep] = useState<string | null>(null)
  const [dayRating, setDayRating] = useState<number>(0)
  const [dayReflection, setDayReflection] = useState<string>("")

  const currentRitual = completedRituals[selectedRitual]

  const handleStepEdit = (stepId: string, newValue: any) => {
    if (!currentRitual) return

    const updatedSteps = currentRitual.steps.map((step) => {
      if (step.id === stepId) {
        return {
          ...step,
          answer: newValue,
          wasModified: true,
        }
      }
      return step
    })

    const updatedRitual = {
      ...currentRitual,
      steps: updatedSteps,
      wasModified: true,
    }

    onUpdateRitual(selectedRitual, updatedRitual)
    setEditingStep(null)
  }

  const handleRatingChange = (rating: number) => {
    setDayRating(rating)
    onUpdateReviewData(rating, dayReflection)
  }

  const handleReflectionChange = (reflection: string) => {
    setDayReflection(reflection)
    onUpdateReviewData(dayRating, reflection)
  }

  const getTotalCompletedSteps = () => {
    return completedRituals.reduce((total, ritual) => {
      return total + ritual.steps.filter((step) => step.completed).length
    }, 0)
  }

  const getTotalSteps = () => {
    return completedRituals.reduce((total, ritual) => total + ritual.steps.length, 0)
  }

  const getCompletionRate = () => {
    const total = getTotalSteps()
    const completed = getTotalCompletedSteps()
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  const renderStepReview = (step: Step) => {
    const isEditing = editingStep === step.id

    return (
      <div key={step.id} className="ios-card p-4 mb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-medium text-ios-subhead">{step.name}</h4>
              {step.question && <p className="text-[#AEAEB2] text-ios-footnote mt-1">{step.question}</p>}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingStep(isEditing ? null : step.id)}
            className="text-blue-400 hover:text-blue-300 p-1"
          >
            <Edit3 className="w-4 h-4" />
          </Button>
        </div>

        {/* Step Answer/Data */}
        <div className="ml-9">
          {step.type === "yesno" && <div className="text-green-400 text-ios-subhead font-medium">✓ Completed</div>}

          {step.type === "qa" && (
            <div>
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={typeof step.answer === "string" ? step.answer : ""}
                    onChange={(e) => handleStepEdit(step.id, e.target.value)}
                    className="min-h-20 bg-[#3C3C3E] border-[#4C4C4E] text-white"
                    placeholder="Edit your answer..."
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => setEditingStep(null)}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingStep(null)} className="text-[#AEAEB2]">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#3C3C3E] rounded-lg p-3">
                  <p className="text-white text-ios-subhead">
                    {typeof step.answer === "string" ? step.answer : "No answer provided"}
                  </p>
                </div>
              )}
            </div>
          )}

          {step.type === "weightlifting" && step.weightliftingConfig && (
            <div className="space-y-2">
              {step.weightliftingConfig.map((set, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg",
                    set.completed ? "bg-green-500/10 border border-green-500/30" : "bg-[#3C3C3E]",
                  )}
                >
                  <span className="text-white text-ios-footnote">Set {index + 1}</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-[#AEAEB2] text-ios-footnote">{set.reps} reps</span>
                    <span className="text-[#AEAEB2] text-ios-footnote">{set.weight} lbs</span>
                    {set.completed && <Check className="w-4 h-4 text-green-400" />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step.type === "cardio" && step.cardioConfig && (
            <div className="space-y-2">
              {step.cardioConfig.map((round, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg",
                    round.completed ? "bg-green-500/10 border border-green-500/30" : "bg-[#3C3C3E]",
                  )}
                >
                  <span className="text-white text-ios-footnote">Round {index + 1}</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-[#AEAEB2] text-ios-footnote">{round.time} min</span>
                    <span className="text-[#AEAEB2] text-ios-footnote">{round.distance} mi</span>
                    {round.completed && <Check className="w-4 h-4 text-green-400" />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step.type === "custom" && step.answer && typeof step.answer === "object" && "value" in step.answer && (
            <div className="bg-[#3C3C3E] rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-white text-ios-subhead">
                  {step.answer.value} {step.answer.unit}
                </span>
                <Check className="w-4 h-4 text-green-400" />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1C1C1E] text-white flex flex-col ios-safe-area">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate("home")}
          className="text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <div className="text-white font-medium text-ios-subhead">Day Review</div>
          <div className="text-[#AEAEB2] text-ios-footnote">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
        </div>
        <div className="w-12" />
      </div>

      {/* Day Summary */}
      <div className="p-4 border-b border-gray-700">
        <div className="ios-card p-4">
          <h2 className="text-white font-bold text-ios-title-3 mb-4">Today's Accomplishments</h2>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <div className="text-ios-title-2 font-bold text-green-400">{completedRituals.length}</div>
              <div className="text-ios-footnote text-[#AEAEB2]">Rituals</div>
            </div>
            <div className="text-center">
              <div className="text-ios-title-2 font-bold text-blue-400">{getTotalCompletedSteps()}</div>
              <div className="text-ios-footnote text-[#AEAEB2]">Steps</div>
            </div>
            <div className="text-center">
              <div className="text-ios-title-2 font-bold text-purple-400">{getCompletionRate()}%</div>
              <div className="text-ios-footnote text-[#AEAEB2]">Complete</div>
            </div>
          </div>

          {/* Day Rating */}
          <div className="mb-4">
            <h3 className="text-white font-medium text-ios-subhead mb-2">How was your day?</h3>
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRatingChange(rating)}
                  className="p-2"
                >
                  <Star
                    className={cn(
                      "w-6 h-6 transition-colors",
                      rating <= dayRating ? "text-yellow-400 fill-yellow-400" : "text-gray-500",
                    )}
                  />
                </Button>
              ))}
            </div>
          </div>

          {/* Day Reflection */}
          <div>
            <h3 className="text-white font-medium text-ios-subhead mb-2">Daily Reflection</h3>
            <Textarea
              value={dayReflection}
              onChange={(e) => handleReflectionChange(e.target.value)}
              placeholder="What went well today? What could be improved?"
              className="min-h-20 bg-[#3C3C3E] border-[#4C4C4E] text-white placeholder-[#AEAEB2]"
            />
          </div>
        </div>
      </div>

      {/* Ritual Tabs */}
      {completedRituals.length > 1 && (
        <div className="flex border-b border-gray-700">
          {completedRituals.map((ritual, index) => (
            <Button
              key={ritual.id}
              variant="ghost"
              onClick={() => setSelectedRitual(index)}
              className={cn(
                "flex-1 h-12 rounded-none border-b-2 transition-colors",
                selectedRitual === index
                  ? "border-blue-500 text-blue-400 bg-blue-500/10"
                  : "border-transparent text-[#AEAEB2] hover:text-white",
              )}
            >
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500/20 rounded flex items-center justify-center">
                  <span className="text-blue-400 text-xs font-bold">{index + 1}</span>
                </div>
                <span className="truncate">{ritual.name}</span>
              </div>
            </Button>
          ))}
        </div>
      )}

      {/* Ritual Review */}
      <div className="flex-1 overflow-auto ios-scroll-container">
        <div className="p-4">
          {currentRitual && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-ios-title-3">{currentRitual.name}</h3>
                <div className="flex items-center space-x-2">
                  <div className="text-[#AEAEB2] text-ios-footnote">{currentRitual.scheduledTime}</div>
                </div>
              </div>

              <div className="space-y-3">
                {currentRitual.steps.filter((step) => step.completed).map((step) => renderStepReview(step))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-gray-700 space-y-3">
        <Button onClick={onContinueToSchedule} className="w-full bg-blue-500 hover:bg-blue-600 text-white h-12">
          Continue to Schedule
        </Button>

        <Button
          onClick={() => onNavigate("home")}
          variant="ghost"
          className="w-full text-[#AEAEB2] hover:text-white h-10"
        >
          Save & Return Home
        </Button>
      </div>
    </div>
  )
}

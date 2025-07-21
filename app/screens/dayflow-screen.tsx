"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Check,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
  GripVertical,
  X,
  Clock,
  AlertTriangle,
  List,
} from "lucide-react"
import { AnimatedCheckbox } from "@/app/components/ui/animated-checkbox"
import { BottomNavigation } from "@/app/components/ui/bottom-navigation"
import { MetricsDashboard } from "@/app/components/metrics-dashboard"
import type { FlowState, Ritual, Step, WeightliftingData, CardioData, CustomData } from "@/app/types"
import { generateStepMetricsData } from "@/app/utils/metrics"
import { cn } from "@/lib/utils"

interface DayFlowScreenProps {
  onNavigate: (flow: FlowState) => void
  rituals: Ritual[]
  currentRitualIndex: number
  currentStepIndex: number
  onUpdateRitual: (ritualIndex: number, updatedRitual: Ritual) => void
  onUpdateStep: (ritualIndex: number, stepIndex: number, updatedStep: Step) => void
  onUpdateStepIndex: (newStepIndex: number) => void
  onReorderRituals: (reorderedRituals: Ritual[]) => void
  onRemoveRitual: (ritualIndex: number) => void
}

export function DayFlowScreen({
  onNavigate,
  rituals,
  currentRitualIndex,
  currentStepIndex,
  onUpdateRitual,
  onUpdateStep,
  onUpdateStepIndex,
  onReorderRituals,
  onRemoveRitual,
}: DayFlowScreenProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showMetrics, setShowMetrics] = useState(false)
  const [selectedMetrics, setSelectedMetrics] = useState<any>(null)
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null)
  const [draggedRitual, setDraggedRitual] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [showRitualList, setShowRitualList] = useState(false)
  const [timeConflictWarning, setTimeConflictWarning] = useState<string | null>(null)

  const currentRitual = rituals[currentRitualIndex]

  // Find the next incomplete step and make it active
  useEffect(() => {
    if (!currentRitual) return

    const nextIncompleteIndex = currentRitual.steps.findIndex((step, index) => !isStepCompleted(step))

    if (nextIncompleteIndex !== -1) {
      setActiveStepIndex(nextIncompleteIndex)

      // Auto-expand the active step if it's a complex type
      const activeStep = currentRitual.steps[nextIncompleteIndex]
      if (
        activeStep &&
        (activeStep.type === "qa" ||
          activeStep.type === "weightlifting" ||
          activeStep.type === "cardio" ||
          activeStep.type === "custom")
      ) {
        setExpandedSteps((prev) => new Set([...prev, nextIncompleteIndex]))
      }
    } else {
      setActiveStepIndex(null)
    }
  }, [currentRitual])

  // Generate week days for date selector
  const getWeekDays = () => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      return date
    })
  }

  const weekDays = getWeekDays()

  // Desktop drag handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedRitual(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    if (draggedRitual !== null && dragOverIndex !== null && draggedRitual !== dragOverIndex) {
      const newRituals = [...rituals]
      const [movedRitual] = newRituals.splice(draggedRitual, 1)
      newRituals.splice(dragOverIndex, 0, movedRitual)

      // Check for time conflicts after reordering
      const updatedRituals = newRituals.map((ritual, index) => {
        if (!ritual.scheduledTime) return ritual

        // Check if this ritual's time conflicts with its new position
        const prevRitual = newRituals[index - 1]
        const nextRitual = newRituals[index + 1]

        let hasConflict = false
        let conflictMessage = ""

        if (prevRitual?.scheduledTime && ritual.scheduledTime < prevRitual.scheduledTime) {
          hasConflict = true
          conflictMessage = `Scheduled time conflicts with previous ritual`
        } else if (nextRitual?.scheduledTime && ritual.scheduledTime > nextRitual.scheduledTime) {
          hasConflict = true
          conflictMessage = `Scheduled time conflicts with next ritual`
        }

        if (hasConflict) {
          setTimeConflictWarning(conflictMessage)
          return { ...ritual, scheduledTime: undefined }
        }

        return ritual
      })

      onReorderRituals(updatedRituals)
    }
    setDraggedRitual(null)
    setDragOverIndex(null)
  }

  const handleScheduleTimeChange = (ritualIndex: number, time: string) => {
    const updatedRitual = { ...rituals[ritualIndex], scheduledTime: time }
    onUpdateRitual(ritualIndex, updatedRitual)
  }

  const handleRemoveRitualClick = (ritualIndex: number) => {
    if (confirm("Are you sure you want to remove this ritual from today's flow?")) {
      onRemoveRitual(ritualIndex)
    }
  }

  const handleStepComplete = (stepIndex: number, completed: boolean) => {
    const step = currentRitual.steps[stepIndex]
    if (!step) return

    const updatedStep = { ...step, completed }
    onUpdateStep(currentRitualIndex, stepIndex, updatedStep)

    // If step was completed, find and activate the next incomplete step
    if (completed) {
      setTimeout(() => {
        const nextIncompleteIndex = currentRitual.steps.findIndex((s, i) => i > stepIndex && !isStepCompleted(s))
        if (nextIncompleteIndex !== -1) {
          setActiveStepIndex(nextIncompleteIndex)

          // Auto-expand the next active step if it's complex
          const nextStep = currentRitual.steps[nextIncompleteIndex]
          if (
            nextStep &&
            (nextStep.type === "qa" ||
              nextStep.type === "weightlifting" ||
              nextStep.type === "cardio" ||
              nextStep.type === "custom")
          ) {
            setExpandedSteps((prev) => new Set([...prev, nextIncompleteIndex]))
          }
        }
      }, 300) // Small delay for smooth transition
    }
  }

  const handleStepAnswer = (stepIndex: number, answer: string | WeightliftingData | CardioData | CustomData) => {
    const step = currentRitual.steps[stepIndex]
    if (!step) return

    const updatedStep = { ...step, answer, completed: true }
    onUpdateStep(currentRitualIndex, stepIndex, updatedStep)

    // Auto-advance to next step after answering
    setTimeout(() => {
      const nextIncompleteIndex = currentRitual.steps.findIndex((s, i) => i > stepIndex && !isStepCompleted(s))
      if (nextIncompleteIndex !== -1) {
        setActiveStepIndex(nextIncompleteIndex)

        // Auto-expand the next active step if it's complex
        const nextStep = currentRitual.steps[nextIncompleteIndex]
        if (
          nextStep &&
          (nextStep.type === "qa" ||
            nextStep.type === "weightlifting" ||
            nextStep.type === "cardio" ||
            nextStep.type === "custom")
        ) {
          setExpandedSteps((prev) => new Set([...prev, nextIncompleteIndex]))
        }
      }
    }, 300)
  }

  const handleCompleteRitual = () => {
    // Mark all steps as completed and ritual as completed
    const completedSteps = currentRitual.steps.map((step) => ({ ...step, completed: true }))
    const updatedRitual = { ...currentRitual, steps: completedSteps, completed: true }

    // Show completion celebration
    const nextRitualIndex = rituals.findIndex((ritual, index) => index > currentRitualIndex && !ritual.completed)

    if (nextRitualIndex !== -1) {
      // Brief celebration before moving to next ritual
      setTimeout(() => {
        onUpdateRitual(currentRitualIndex, updatedRitual)
      }, 500) // Small delay for celebration effect
    } else {
      // Complete immediately if it's the last ritual
      onUpdateRitual(currentRitualIndex, updatedRitual)
    }
  }

  const handleShowStepMetrics = (step: Step) => {
    const metricsData = generateStepMetricsData(step)
    setSelectedMetrics({
      title: step.name,
      type: step.type,
      data: metricsData,
    })
    setShowMetrics(true)
  }

  const toggleStepExpanded = (stepIndex: number) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepIndex)) {
      newExpanded.delete(stepIndex)
    } else {
      newExpanded.add(stepIndex)
    }
    setExpandedSteps(newExpanded)
  }

  const isStepCompleted = (step: Step) => {
    switch (step.type) {
      case "yesno":
        return step.completed
      case "qa":
        return step.answer && typeof step.answer === "string" && step.answer.trim().length > 0
      case "weightlifting":
        return step.weightliftingConfig?.some((set) => set.completed) || false
      case "cardio":
        return step.cardioConfig?.some((round) => round.completed) || false
      case "custom":
        return step.answer && typeof step.answer === "object" && "value" in step.answer && step.answer.value > 0
      default:
        return step.completed
    }
  }

  const getCompletedStepsCount = () => {
    return currentRitual.steps.filter((step) => isStepCompleted(step)).length
  }

  const getStepContainerClasses = (stepIndex: number, step: Step) => {
    const isCompleted = isStepCompleted(step)
    const isActive = activeStepIndex === stepIndex

    return cn(
      "ios-card mb-3 transition-all duration-300",
      isCompleted && "border-green-500/30 bg-green-500/5",
      isActive && !isCompleted && "border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/20",
      !isActive && !isCompleted && "border-gray-600/30",
    )
  }

  const renderStepContent = (step: Step, stepIndex: number) => {
    const isExpanded = expandedSteps.has(stepIndex)
    const isActive = activeStepIndex === stepIndex
    const isCompleted = isStepCompleted(step)

    switch (step.type) {
      case "yesno":
        return (
          <div className={getStepContainerClasses(stepIndex, step)}>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <AnimatedCheckbox
                    isCompleted={step.completed}
                    onComplete={() => handleStepComplete(stepIndex, !step.completed)}
                    size="medium"
                  />
                  <div className="flex-1">
                    <h3
                      className={cn(
                        "font-medium text-ios-subhead transition-colors",
                        isActive ? "text-blue-400" : "text-white",
                      )}
                    >
                      {step.name}
                    </h3>
                    {step.question && <p className="text-[#AEAEB2] text-ios-footnote mt-1">{step.question}</p>}
                    {isActive && !isCompleted && (
                      <p className="text-blue-400 text-ios-footnote mt-1 animate-pulse">👆 Tap to complete</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShowStepMetrics(step)}
                  className="text-[#AEAEB2] hover:text-blue-400 p-1"
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )

      case "qa":
        return (
          <div className={getStepContainerClasses(stepIndex, step)}>
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="mt-1">
                    <AnimatedCheckbox
                      isCompleted={isStepCompleted(step)}
                      onComplete={() => toggleStepExpanded(stepIndex)}
                      size="medium"
                    />
                  </div>
                  <div className="flex-1">
                    <h3
                      className={cn(
                        "font-medium text-ios-subhead transition-colors",
                        isActive ? "text-blue-400" : "text-white",
                      )}
                    >
                      {step.name}
                    </h3>
                    {step.question && <p className="text-[#AEAEB2] text-ios-footnote mt-1">{step.question}</p>}
                    {isActive && !isCompleted && (
                      <p className="text-blue-400 text-ios-footnote mt-1 animate-pulse">✍️ Ready for your answer</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShowStepMetrics(step)}
                    className="text-[#AEAEB2] hover:text-blue-400 p-1"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStepExpanded(stepIndex)}
                    className="text-[#AEAEB2] hover:text-white p-1"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-3 animate-ios-fade-in">
                  <Textarea
                    placeholder="Type your answer here..."
                    value={typeof step.answer === "string" ? step.answer : ""}
                    onChange={(e) => handleStepAnswer(stepIndex, e.target.value)}
                    className={cn(
                      "min-h-24 border rounded-lg resize-none transition-all duration-200",
                      isActive
                        ? "bg-blue-500/10 border-blue-500/50 text-white placeholder-blue-300/70 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                        : "bg-[#3C3C3E] border-[#4C4C4E] text-white placeholder-[#AEAEB2]",
                    )}
                    autoFocus={isActive && !isCompleted}
                  />
                  {step.answer && (
                    <div className="flex items-center text-green-400 text-ios-footnote mt-2">
                      <Check className="w-3 h-3 mr-1" />
                      Answer saved
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )

      case "weightlifting":
        return (
          <div className={getStepContainerClasses(stepIndex, step)}>
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="mt-1">
                    <AnimatedCheckbox
                      isCompleted={isStepCompleted(step)}
                      onComplete={() => toggleStepExpanded(stepIndex)}
                      size="medium"
                    />
                  </div>
                  <div className="flex-1">
                    <h3
                      className={cn(
                        "font-medium text-ios-subhead transition-colors",
                        isActive ? "text-blue-400" : "text-white",
                      )}
                    >
                      {step.name}
                    </h3>
                    <p className="text-[#AEAEB2] text-ios-footnote mt-1">
                      {step.weightliftingConfig?.filter((set) => set.completed).length || 0} of{" "}
                      {step.weightliftingConfig?.length || 0} sets completed
                    </p>
                    {isActive && !isCompleted && (
                      <p className="text-blue-400 text-ios-footnote mt-1 animate-pulse">💪 Time to lift!</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShowStepMetrics(step)}
                    className="text-[#AEAEB2] hover:text-blue-400 p-1"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStepExpanded(stepIndex)}
                    className="text-[#AEAEB2] hover:text-white p-1"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="space-y-3 animate-ios-fade-in">
                  {step.weightliftingConfig?.map((set, setIndex) => (
                    <div
                      key={setIndex}
                      className={cn(
                        "rounded-lg p-3 transition-all duration-200",
                        isActive ? "bg-blue-500/10 border border-blue-500/30" : "bg-[#3C3C3E]",
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium text-ios-footnote">Set {setIndex + 1}</span>
                        <AnimatedCheckbox
                          isCompleted={set.completed || false}
                          onComplete={() => {
                            const updatedConfig = [...(step.weightliftingConfig || [])]
                            updatedConfig[setIndex] = { ...set, completed: !set.completed }

                            // Update the step with the new config
                            const updatedStep = {
                              ...step,
                              weightliftingConfig: updatedConfig,
                              // Mark step as completed if any set is completed
                              completed: updatedConfig.some((s) => s.completed),
                              wasModified: true,
                            }

                            onUpdateStep(currentRitualIndex, stepIndex, updatedStep)
                          }}
                          size="medium"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-ios-caption-1 text-[#AEAEB2] block mb-1">Reps</label>
                          <Input
                            type="number"
                            value={set.reps}
                            onChange={(e) => {
                              const newReps = Number.parseInt(e.target.value) || 0
                              const updatedConfig = [...(step.weightliftingConfig || [])]
                              updatedConfig[setIndex] = { ...set, reps: newReps }

                              const updatedStep = {
                                ...step,
                                weightliftingConfig: updatedConfig,
                                wasModified: true,
                              }

                              onUpdateStep(currentRitualIndex, stepIndex, updatedStep)
                            }}
                            className={cn(
                              "h-10 text-center text-ios-subhead font-medium transition-all duration-200 ios-input",
                              "bg-[#4C4C4E] border-[#5C5C5E] text-white placeholder-[#AEAEB2]",
                              "focus:bg-[#3C3C3E] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                              isActive && "focus:border-blue-400 focus:ring-blue-400/20",
                            )}
                            min="0"
                            max="999"
                            inputMode="numeric"
                          />
                        </div>
                        <div>
                          <label className="text-ios-caption-1 text-[#AEAEB2] block mb-1">Weight (lbs)</label>
                          <Input
                            type="number"
                            value={set.weight}
                            onChange={(e) => {
                              const newWeight = Number.parseInt(e.target.value) || 0
                              const updatedConfig = [...(step.weightliftingConfig || [])]
                              updatedConfig[setIndex] = { ...set, weight: newWeight }

                              const updatedStep = {
                                ...step,
                                weightliftingConfig: updatedConfig,
                                wasModified: true,
                              }

                              onUpdateStep(currentRitualIndex, stepIndex, updatedStep)
                            }}
                            className={cn(
                              "h-10 text-center text-ios-subhead font-medium transition-all duration-200 ios-input",
                              "bg-[#4C4C4E] border-[#5C5C5E] text-white placeholder-[#AEAEB2]",
                              "focus:bg-[#3C3C3E] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                              isActive && "focus:border-blue-400 focus:ring-blue-400/20",
                            )}
                            min="0"
                            max="9999"
                            step="5"
                            inputMode="numeric"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      case "cardio":
        return (
          <div className={getStepContainerClasses(stepIndex, step)}>
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="mt-1">
                    <AnimatedCheckbox
                      isCompleted={isStepCompleted(step)}
                      onComplete={() => toggleStepExpanded(stepIndex)}
                      size="medium"
                    />
                  </div>
                  <div className="flex-1">
                    <h3
                      className={cn(
                        "font-medium text-ios-subhead transition-colors",
                        isActive ? "text-blue-400" : "text-white",
                      )}
                    >
                      {step.name}
                    </h3>
                    <p className="text-[#AEAEB2] text-ios-footnote mt-1">
                      {step.cardioConfig?.filter((round) => round.completed).length || 0} of{" "}
                      {step.cardioConfig?.length || 0} rounds completed
                    </p>
                    {isActive && !isCompleted && (
                      <p className="text-blue-400 text-ios-footnote mt-1 animate-pulse">🏃 Let's get moving!</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShowStepMetrics(step)}
                    className="text-[#AEAEB2] hover:text-blue-400 p-1"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStepExpanded(stepIndex)}
                    className="text-[#AEAEB2] hover:text-white p-1"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="space-y-3 animate-ios-fade-in">
                  {step.cardioConfig?.map((round, roundIndex) => (
                    <div
                      key={roundIndex}
                      className={cn(
                        "rounded-lg p-3 transition-all duration-200",
                        isActive ? "bg-blue-500/10 border border-blue-500/30" : "bg-[#3C3C3E]",
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium text-ios-footnote">Round {roundIndex + 1}</span>
                        <AnimatedCheckbox
                          isCompleted={round.completed || false}
                          onComplete={() => {
                            const updatedConfig = [...(step.cardioConfig || [])]
                            updatedConfig[roundIndex] = { ...round, completed: !round.completed }

                            // Update the step with the new config
                            const updatedStep = {
                              ...step,
                              cardioConfig: updatedConfig,
                              // Mark step as completed if any round is completed
                              completed: updatedConfig.some((r) => r.completed),
                              wasModified: true,
                            }

                            onUpdateStep(currentRitualIndex, stepIndex, updatedStep)
                          }}
                          size="medium"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-ios-caption-1 text-[#AEAEB2] block mb-1">Time (min)</label>
                          <Input
                            type="number"
                            value={round.time}
                            onChange={(e) => {
                              const newTime = Number.parseInt(e.target.value) || 0
                              const updatedConfig = [...(step.cardioConfig || [])]
                              updatedConfig[roundIndex] = { ...round, time: newTime }

                              const updatedStep = {
                                ...step,
                                cardioConfig: updatedConfig,
                                wasModified: true,
                              }

                              onUpdateStep(currentRitualIndex, stepIndex, updatedStep)
                            }}
                            className={cn(
                              "h-10 text-center text-ios-subhead font-medium transition-all duration-200 ios-input",
                              "bg-[#4C4C4E] border-[#5C5C5E] text-white placeholder-[#AEAEB2]",
                              "focus:bg-[#3C3C3E] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                              isActive && "focus:border-blue-400 focus:ring-blue-400/20",
                            )}
                            min="0"
                            max="999"
                            inputMode="numeric"
                          />
                        </div>
                        <div>
                          <label className="text-ios-caption-1 text-[#AEAEB2] block mb-1">Distance (mi)</label>
                          <Input
                            type="number"
                            step="0.1"
                            value={round.distance}
                            onChange={(e) => {
                              const newDistance = Number.parseFloat(e.target.value) || 0
                              const updatedConfig = [...(step.cardioConfig || [])]
                              updatedConfig[roundIndex] = { ...round, distance: newDistance }

                              const updatedStep = {
                                ...step,
                                cardioConfig: updatedConfig,
                                wasModified: true,
                              }

                              onUpdateStep(currentRitualIndex, stepIndex, updatedStep)
                            }}
                            className={cn(
                              "h-10 text-center text-ios-subhead font-medium transition-all duration-200 ios-input",
                              "bg-[#4C4C4E] border-[#5C5C5E] text-white placeholder-[#AEAEB2]",
                              "focus:bg-[#3C3C3E] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                              isActive && "focus:border-blue-400 focus:ring-blue-400/20",
                            )}
                            min="0"
                            max="999"
                            step="0.1"
                            inputMode="decimal"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      case "custom":
        return (
          <div className={getStepContainerClasses(stepIndex, step)}>
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="mt-1">
                    <AnimatedCheckbox
                      isCompleted={isStepCompleted(step)}
                      onComplete={() => toggleStepExpanded(stepIndex)}
                      size="medium"
                    />
                  </div>
                  <div className="flex-1">
                    <h3
                      className={cn(
                        "font-medium text-ios-subhead transition-colors",
                        isActive ? "text-blue-400" : "text-white",
                      )}
                    >
                      {step.name}
                    </h3>
                    <p className="text-[#AEAEB2] text-ios-footnote mt-1">
                      {step.customConfig?.label || "Enter measurement"}
                    </p>
                    {isActive && !isCompleted && (
                      <p className="text-blue-400 text-ios-footnote mt-1 animate-pulse">📊 Enter your value</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShowStepMetrics(step)}
                    className="text-[#AEAEB2] hover:text-blue-400 p-1"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStepExpanded(stepIndex)}
                    className="text-[#AEAEB2] hover:text-white p-1"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="animate-ios-fade-in">
                  <div
                    className={cn(
                      "rounded-lg p-3 transition-all duration-200",
                      isActive ? "bg-blue-500/10 border border-blue-500/30" : "bg-[#3C3C3E]",
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Input
                        type="number"
                        placeholder="0"
                        value={typeof step.answer === "object" && "value" in step.answer ? step.answer.value : ""}
                        onChange={(e) => {
                          const newValue = Number.parseFloat(e.target.value) || 0
                          const customData: CustomData = {
                            value: newValue,
                            unit: step.customConfig?.unit || "",
                          }

                          const updatedStep = {
                            ...step,
                            answer: customData,
                            completed: newValue > 0,
                            wasModified: true,
                          }

                          onUpdateStep(currentRitualIndex, stepIndex, updatedStep)
                        }}
                        className={cn(
                          "flex-1 h-12 text-center text-ios-subhead font-medium transition-all duration-200 ios-input",
                          "bg-[#4C4C4E] border-[#5C5C5E] text-white placeholder-[#AEAEB2]",
                          "focus:bg-[#3C3C3E] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                          isActive && "focus:border-blue-400 focus:ring-blue-400/20",
                        )}
                        step="0.1"
                        inputMode="decimal"
                      />
                      <span className="text-[#AEAEB2] text-ios-subhead min-w-12 font-medium">
                        {step.customConfig?.unit}
                      </span>
                    </div>
                    {step.answer && (
                      <div className="flex items-center text-green-400 text-ios-footnote mt-2">
                        <Check className="w-3 h-3 mr-1" />
                        Value recorded
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (showMetrics && selectedMetrics) {
    return (
      <MetricsDashboard
        title={selectedMetrics.title}
        type={selectedMetrics.type}
        data={selectedMetrics.data}
        onClose={() => setShowMetrics(false)}
      />
    )
  }

  if (!currentRitual) {
    return (
      <div className="min-h-screen bg-[#1C1C1E] text-white flex flex-col ios-safe-area">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🌊</div>
            <h2 className="text-ios-title-2 font-bold mb-2">No Ritual Selected</h2>
            <p className="text-[#AEAEB2] text-ios-body mb-6">Choose a ritual from your home screen</p>
            <Button onClick={() => onNavigate("home")} className="bg-blue-500 hover:bg-blue-600">
              Go to Home
            </Button>
          </div>
        </div>
        <BottomNavigation currentFlow="dayflow" onNavigate={onNavigate} />
      </div>
    )
  }

  const completedSteps = getCompletedStepsCount()
  const totalSteps = currentRitual.steps.length
  const progressPercentage = (completedSteps / totalSteps) * 100

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
          <div className="text-white font-medium text-ios-subhead">{currentRitual.name}</div>
          <div className="text-[#AEAEB2] text-ios-footnote">
            {completedSteps} of {totalSteps} steps completed
          </div>
          {/* Show ritual progress */}
          <div className="text-blue-400 text-ios-caption-1 mt-1">
            Ritual {currentRitualIndex + 1} of {rituals.length}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowRitualList(!showRitualList)}
          className="text-[#AEAEB2] hover:text-blue-400"
        >
          <List className="w-5 h-5" />
        </Button>
      </div>

      {/* Time Conflict Warning */}
      {timeConflictWarning && (
        <div className="mx-4 mt-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <p className="text-yellow-400 text-ios-footnote">{timeConflictWarning}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTimeConflictWarning(null)}
            className="text-yellow-400 hover:text-yellow-300 p-1 ml-auto"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Ritual List (Collapsible) */}
      {showRitualList && (
        <div className="border-b border-gray-700 bg-[#2C2C2E]">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-medium text-ios-subhead">Today's Rituals</h3>
              <div className="text-[#AEAEB2] text-ios-footnote">Drag to reorder</div>
            </div>
            <div className="space-y-2">
              {rituals.map((ritual, index) => (
                <div
                  key={ritual.id}
                  data-ritual-index={index}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg transition-all duration-200 select-none",
                    index === currentRitualIndex
                      ? "bg-blue-500/20 border border-blue-500/30"
                      : "bg-[#3C3C3E] hover:bg-[#4C4C4E]",
                    dragOverIndex === index && "ring-2 ring-blue-500 scale-105",
                    draggedRitual === index && "opacity-50 scale-95",
                  )}
                  style={{
                    cursor: draggedRitual === index ? "grabbing" : "grab",
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <GripVertical className="w-4 h-4 text-[#AEAEB2] touch-manipulation" />
                    <div className="flex items-center space-x-2">
                      {ritual.completed ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-[#AEAEB2]" />
                      )}
                      <div>
                        <div className="text-white font-medium text-ios-subhead">{ritual.name}</div>
                        <div className="text-[#AEAEB2] text-ios-footnote">
                          {ritual.steps.filter((s) => isStepCompleted(s)).length}/{ritual.steps.length} steps
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-[#AEAEB2]" />
                      <Input
                        type="time"
                        value={ritual.scheduledTime || ""}
                        onChange={(e) => {
                          e.stopPropagation()
                          handleScheduleTimeChange(index, e.target.value)
                        }}
                        className="w-20 bg-[#2C2C2E] border-[#4C4C4E] text-white text-xs"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveRitualClick(index)
                      }}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Date Selector */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-medium text-ios-subhead">Today</h3>
          <Button variant="ghost" size="sm" className="text-blue-400">
            <Calendar className="w-4 h-4 mr-2" />
            {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </Button>
        </div>

        <div className="flex justify-between">
          {weekDays.map((date, index) => {
            const isToday = date.toDateString() === new Date().toDateString()
            const isSelected = date.toDateString() === selectedDate.toDateString()

            return (
              <Button
                key={index}
                variant="ghost"
                onClick={() => setSelectedDate(date)}
                className={cn(
                  "flex flex-col items-center p-2 rounded-lg transition-colors",
                  isSelected
                    ? "bg-blue-500 text-white"
                    : isToday
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-[#AEAEB2] hover:text-white",
                )}
              >
                <span className="text-ios-footnote">{date.toLocaleDateString("en-US", { weekday: "short" })}</span>
                <span className="text-ios-subhead font-medium">{date.getDate()}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-ios-footnote text-[#AEAEB2]">Progress</span>
          <span className="text-ios-footnote text-[#AEAEB2]">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-[#2C2C2E] rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Steps List */}
      <div className="flex-1 overflow-auto ios-scroll-container">
        <div className="p-4">
          {currentRitual.steps.map((step, stepIndex) => (
            <div key={step.id}>{renderStepContent(step, stepIndex)}</div>
          ))}
        </div>
      </div>

      {/* Complete Ritual Button */}
      <div className="p-4 border-t border-gray-700">
        <Button
          onClick={handleCompleteRitual}
          disabled={completedSteps < totalSteps}
          className="w-full bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed h-12"
        >
          {completedSteps === totalSteps
            ? // Check if there are more rituals
              rituals.findIndex((ritual, index) => index > currentRitualIndex && !ritual.completed) !== -1
              ? "Complete & Continue to Next Ritual ✓"
              : "Complete Final Ritual ✓"
            : `Complete Ritual (${completedSteps}/${totalSteps})`}
        </Button>
      </div>

      <BottomNavigation currentFlow="dayflow" onNavigate={onNavigate} />
    </div>
  )
}

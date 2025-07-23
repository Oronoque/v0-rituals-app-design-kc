"use client"
import { useState } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Clock, Target, Check, Calendar, GripVertical, X, AlertTriangle } from "lucide-react"
import type { FlowState } from "@/app/types"
import { RitualWithSteps } from "@/backend/src/types/database"
import { cn } from "@/lib/utils"

interface ScheduleScreenProps {
  onNavigate: (flow: FlowState) => void
  rituals: RitualWithSteps[]
  onScheduleRituals: (scheduledRituals: RitualWithSteps[]) => void
  onAddNewRitual: () => void
  onReorderRituals: (reorderedRituals: RitualWithSteps[]) => void
  onRemoveRitual: (ritualIndex: number) => void
}

export function ScheduleScreen({
  onNavigate,
  rituals,
  onScheduleRituals,
  onAddNewRitual,
  onReorderRituals,
  onRemoveRitual,
}: ScheduleScreenProps) {
  const [selectedRituals, setSelectedRituals] = useState<string[]>(rituals.map((r) => r.id))
  const [ritualTimes, setRitualTimes] = useState<{ [key: string]: string }>(() => {
    const times: { [key: string]: string } = {}
    rituals.forEach((ritual) => {
      times[ritual.id] = ritual.category || "08:00"
    })
    return times
  })
  const [draggedRitual, setDraggedRitual] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [timeConflictWarning, setTimeConflictWarning] = useState<string | null>(null)

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const handleToggleRitual = (ritualId: string) => {
    setSelectedRituals((prev) => (prev.includes(ritualId) ? prev.filter((id) => id !== ritualId) : [...prev, ritualId]))
  }

  const handleTimeChange = (ritualId: string, time: string) => {
    setRitualTimes((prev) => ({ ...prev, [ritualId]: time }))
  }

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
        if (!ritual.category) return ritual

        // Check if this ritual's time conflicts with its new position
        const prevRitual = newRituals[index - 1]
        const nextRitual = newRituals[index + 1]

        let hasConflict = false
        let conflictMessage = ""

        if (prevRitual?.category && ritual.category < prevRitual.category) {
          hasConflict = true
          conflictMessage = `${ritual.name} scheduled time conflicts with previous ritual`
        } else if (nextRitual?.category && ritual.category > nextRitual.category) {
          hasConflict = true
          conflictMessage = `${ritual.name} scheduled time conflicts with next ritual`
        }

        if (hasConflict) {
          setTimeConflictWarning(conflictMessage)
          // Clear the scheduled time and remove from ritualTimes
          setRitualTimes((prev) => ({ ...prev, [ritual.id]: "" }))
          return { ...ritual, category: undefined }
        }

        return ritual
      })

      // onReorderRituals(updatedRituals)
    }
    setDraggedRitual(null)
    setDragOverIndex(null)
  }

  const handleRemoveRitualClick = (ritualIndex: number) => {
    const ritual = rituals[ritualIndex]
    if (confirm(`Are you sure you want to remove "${ritual.name}" from tomorrow's schedule?`)) {
      // Remove from selected rituals
      setSelectedRituals((prev) => prev.filter((id) => id !== ritual.id))
      // Remove from ritual times
      setRitualTimes((prev) => {
        const newTimes = { ...prev }
        delete newTimes[ritual.id]
        return newTimes
      })
      onRemoveRitual(ritualIndex)
    }
  }

  const handleSchedule = () => {
    const scheduledRituals = rituals
      .filter((ritual) => selectedRituals.includes(ritual.id))
      .map((ritual) => ({
        ...ritual,
        category: ritualTimes[ritual.id],
        completed: false,
        step_definitions: ritual.step_definitions.map((step) => ({
          ...step,
          completed: false,
          answer: undefined,
          wasModified: false,
        })),
        wasModified: false,
      }))

    // onScheduleRituals(scheduledRituals)
    onNavigate("home")
  }

  const getScheduledCount = () => selectedRituals.length

  // Check for time conflicts in current schedule
  const hasTimeConflicts = () => {
    const selectedTimes = selectedRituals.map((id) => ritualTimes[id]).filter((time) => time && time.length > 0)

    return selectedTimes.length !== new Set(selectedTimes).size
  }

  return (
    <div className="min-h-screen bg-[#1C1C1E] text-white flex flex-col ios-safe-area">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate("review")}
          className="text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <div className="text-white font-medium text-ios-subhead">Schedule Tomorrow</div>
          <div className="text-[#AEAEB2] text-ios-footnote">
            {tomorrow.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
        </div>
        <div className="w-12" />
      </div>

      {/* Time Conflict Warning */}
      {timeConflictWarning && (
        <div className="mx-4 mt-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <p className="text-yellow-400 text-ios-footnote flex-1">{timeConflictWarning}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTimeConflictWarning(null)}
            className="text-yellow-400 hover:text-yellow-300 p-1"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Summary */}
      <div className="p-4 border-b border-gray-700">
        <div className="ios-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold text-ios-title-3">Tomorrow's Plan</h2>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400 font-medium">{getScheduledCount()} rituals</span>
              {hasTimeConflicts() && <AlertTriangle className="w-4 h-4 text-yellow-400" />}
            </div>
          </div>
          <p className="text-[#AEAEB2] text-ios-subhead">
            Select and schedule your rituals for tomorrow. Drag to reorder, set times, and remove unwanted rituals.
          </p>
        </div>
      </div>

      {/* Ritual List */}
      <div className="flex-1 overflow-auto ios-scroll-container">
        <div className="p-4">
          <h3 className="text-white font-medium text-ios-subhead mb-3">Available Rituals</h3>

          <div className="space-y-3">
            {rituals.map((ritual, index) => {
              const isSelected = selectedRituals.includes(ritual.id)

              return (
                <div
                  key={ritual.id}
                  draggable={isSelected}
                  onDragStart={(e) => (isSelected ? handleDragStart(e, index) : e.preventDefault())}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "ios-card p-4 transition-all duration-200",
                    isSelected ? "border-blue-500/50 bg-blue-500/10" : "border-gray-600/30",
                    dragOverIndex === index && isSelected && "ring-2 ring-blue-500",
                    draggedRitual === index && "opacity-50",
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1">
                      {isSelected && (
                        <div className="mt-1 cursor-move">
                          <GripVertical className="w-4 h-4 text-[#AEAEB2]" />
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleRitual(ritual.id)}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 p-0 transition-all mt-1",
                          isSelected
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-gray-500 hover:border-blue-400",
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </Button>
                      <div className="flex-1">
                        <h4 className="text-white font-medium text-ios-subhead">{ritual.name}</h4>
                        <p className="text-[#AEAEB2] text-ios-footnote mt-1">
                          {ritual.step_definitions.length} steps • {ritual.category}
                        </p>
                        {ritual.location && <p className="text-[#AEAEB2] text-ios-footnote">{ritual.location}</p>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4 text-blue-400" />
                      </div>
                      {isSelected && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRitualClick(index)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className={cn("animate-ios-fade-in", isSelected && ritual.name ? "ml-11" : "ml-9")}>
                      <div className="flex items-center space-x-3">
                        <Clock className="w-4 h-4 text-[#AEAEB2]" />
                        <Input
                          type="time"
                          value={ritualTimes[ritual.id] || ""}
                          onChange={(e) => handleTimeChange(ritual.id, e.target.value)}
                          className="flex-1 h-8 bg-[#3C3C3E] border-[#4C4C4E] text-white text-sm"
                          placeholder="Set time"
                        />
                        {/* Show conflict indicator if this time conflicts with others */}
                        {ritualTimes[ritual.id] &&
                          selectedRituals
                            .filter((id) => id !== ritual.id)
                            .some((id) => ritualTimes[id] === ritualTimes[ritual.id]) && (
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                          )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Add New Ritual Button */}
          <Button
            onClick={onAddNewRitual}
            variant="ghost"
            className="w-full mt-4 h-12 border-2 border-dashed border-gray-600 hover:border-blue-400 text-[#AEAEB2] hover:text-blue-400 transition-all duration-200 hover:bg-blue-500/10"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Ritual
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-gray-700 space-y-3">
        <Button
          onClick={handleSchedule}
          disabled={getScheduledCount() === 0 || hasTimeConflicts()}
          className="w-full bg-green-500 hover:bg-green-600 text-white h-12 disabled:opacity-50"
        >
          <Check className="w-4 h-4 mr-2" />
          Schedule {getScheduledCount()} Ritual{getScheduledCount() !== 1 ? "s" : ""} for Tomorrow
          {hasTimeConflicts() && " (Fix time conflicts first)"}
        </Button>

        <Button
          onClick={() => onNavigate("home")}
          variant="ghost"
          className="w-full text-[#AEAEB2] hover:text-white h-10"
        >
          Skip & Return Home
        </Button>
      </div>
    </div>
  )
}

"use client"
import { useState } from "react"
import { Clock, MapPin, Target, Play, BarChart3, TrendingUp, GitCommit, X, GripVertical, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { DailyRitualWithData, StepInstanceWithData } from "@/backend/src/types/database"

interface RitualCardProps {
  ritual: DailyRitualWithData
  onStart: () => void
  onShowMetrics: (ritual: DailyRitualWithData) => void
  onShowChangelog: (ritualId: string) => void
  onRemove?: () => void
  onTimeChange?: (time: string) => void
  showDragHandle?: boolean
  isDragging?: boolean
  showTimeEditor?: boolean
  hasTimeConflict?: boolean
  conflictingRituals?: DailyRitualWithData[]
}

export function RitualCard({
  ritual,
  onStart,
  onShowMetrics,
  onShowChangelog,
  onRemove,
  onTimeChange,
  showDragHandle = false,
  isDragging = false,
  showTimeEditor = false,
  hasTimeConflict = false,
  conflictingRituals = [],
}: RitualCardProps) {
  const [showSteps, setShowSteps] = useState(false)
  
  // Get data from daily ritual and ritual snapshot
  const totalSteps = ritual.step_instances?.length || 0
  const requiredSteps = ritual.step_instances?.filter((step: StepInstanceWithData) => step.snapshot.is_required).length || 0
  const completedSteps = ritual.step_instances?.filter((step: StepInstanceWithData) => step.status === 'completed').length || 0

  // Get frequency display text from daily ritual frequency
  const getFrequencyText = () => {
    if (!ritual.frequency) return "No schedule"
    
    switch (ritual.frequency.frequency_type) {
      case "daily":
        return "Daily"
      case "weekly":
        if (ritual.frequency.days_of_week?.length) {
          const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
          return ritual.frequency.days_of_week.map((d: number) => days[d]).join(", ")
        }
        return "Weekly"
      case "custom":
        return `Every ${ritual.frequency.frequency_interval} days`
      case "once":
        return "One-time"
      default:
        return "Custom"
    }
  }

  // Get step type icon and color
  const getStepTypeInfo = (type: string) => {
    switch (type) {
      case "boolean":
        return { icon: "✓", color: "bg-green-500/20 text-green-400" }
      case "counter":
        return { icon: "#", color: "bg-blue-500/20 text-blue-400" }
      case "timer":
        return { icon: "⏱", color: "bg-orange-500/20 text-orange-400" }
      case "scale":
        return { icon: "📊", color: "bg-purple-500/20 text-purple-400" }
      case "qna":
        return { icon: "💭", color: "bg-yellow-500/20 text-yellow-400" }
      case "exercise_set":
        return { icon: "💪", color: "bg-red-500/20 text-red-400" }
      default:
        return { icon: "•", color: "bg-gray-500/20 text-gray-400" }
    }
  }

  // Get ritual status styling
  const getStatusColor = () => {
    switch (ritual.status) {
      case "completed":
        return "text-green-400"
      case "in_progress":
        return "text-orange-400"
      case "scheduled":
        return "text-blue-400"
      case "skipped":
        return "text-gray-400"
      default:
        return "text-[#AEAEB2]"
    }
  }

  return (
    <div
      className={cn(
        "ios-card p-4 transition-all duration-200",
        isDragging && "shadow-lg shadow-blue-500/20",
        hasTimeConflict && "border-yellow-500/50 bg-yellow-500/5",
        ritual.status === "completed" && "border-green-500/20 bg-green-500/5",
        ritual.status === "in_progress" && "border-orange-500/20 bg-orange-500/5",
      )}
    >
      {/* Header Section */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          {showDragHandle && (
            <div className="cursor-move pt-1">
              <GripVertical className="w-4 h-4 text-[#AEAEB2] touch-manipulation" />
            </div>
          )}
          
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 text-blue-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-ios-body mb-1 truncate">
              {ritual.ritual_snapshot.name || "Untitled Ritual"}
            </h3>
            
            <div className="flex items-center space-x-4 text-[#AEAEB2] text-ios-footnote mb-2">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">
                  {ritual.scheduled_time || getFrequencyText()}
                </span>
              </div>
              
              {/* Status Badge */}
              <div className={cn("flex items-center space-x-1", getStatusColor())}>
                <span className="w-2 h-2 rounded-full bg-current flex-shrink-0"></span>
                <span className="text-xs capitalize">{ritual.status}</span>
              </div>
            </div>

            {/* Description */}
            {ritual.ritual_snapshot.description && (
              <p className="text-[#AEAEB2] text-ios-caption-1 line-clamp-2 mb-2">
                {ritual.ritual_snapshot.description}
              </p>
            )}

            {/* Progress and Metadata Row */}
            <div className="flex items-center space-x-3 text-ios-caption-1">
              <span className="text-[#AEAEB2]">
                {completedSteps} of {totalSteps} steps
              </span>
              
              {requiredSteps < totalSteps && (
                <span className="text-yellow-400">
                  {requiredSteps} required
                </span>
              )}
              
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                {ritual.ritual_snapshot.category || 'other'}
              </Badge>
              
              {ritual.workout_duration_seconds && (
                <span className="text-blue-400 text-xs">
                  {Math.round(ritual.workout_duration_seconds / 60)}m
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onShowChangelog(ritual.ritual_snapshot.ritual_id)
            }}
            className="text-[#AEAEB2] hover:text-purple-400 p-1.5"
          >
            <GitCommit className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onShowMetrics(ritual)
            }}
            className="text-[#AEAEB2] hover:text-blue-400 p-1.5"
          >
            <BarChart3 className="w-4 h-4" />
          </Button>
          
          {totalSteps > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setShowSteps(!showSteps)
              }}
              className="text-[#AEAEB2] hover:text-white p-1.5"
            >
              {showSteps ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
          
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              className="text-red-400 hover:text-red-300 p-1.5"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Time Conflicts Warning */}
      {hasTimeConflict && conflictingRituals.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <span className="text-yellow-400 text-ios-caption-1">
              Time conflicts with: {conflictingRituals.map((r) => r.ritual_snapshot.name).join(", ")}
            </span>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {totalSteps > 0 && (
        <div className="mb-3">
          <div className="w-full bg-[#2C2C2E] rounded-full h-2">
            <div
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                ritual.status === "completed" ? "bg-green-500" : "bg-blue-500"
              )}
              style={{ width: `${totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Start Button */}
      <div className="flex items-center justify-between">
        <div className="flex-1" />
        <Button
          onClick={onStart}
          disabled={ritual.status === "completed"}
          className={cn(
            "px-6 py-2 rounded-xl text-ios-footnote font-medium",
            ritual.status === "completed" 
              ? "bg-green-500 text-white cursor-not-allowed opacity-70"
              : ritual.status === "in_progress"
              ? "bg-orange-500 hover:bg-orange-600 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          )}
        >
          <Play className="w-4 h-4 mr-2" />
          {ritual.status === "completed" 
            ? "Completed" 
            : ritual.status === "in_progress" 
            ? "Continue" 
            : "Start Ritual"
          }
        </Button>
      </div>

      {/* Expandable Steps List */}
      {showSteps && totalSteps > 0 && (
        <div className="mt-4 pt-4 border-t border-[#3C3C3E]">
          <div className="space-y-3">
            <h4 className="text-white text-ios-footnote font-medium">
              Steps ({completedSteps}/{totalSteps})
            </h4>
            
            {ritual.step_instances.map((stepInstance: StepInstanceWithData, index: number) => {
              const stepInfo = getStepTypeInfo(stepInstance.snapshot.type)
              const isCompleted = stepInstance.status === 'completed'
              const isInProgress = stepInstance.status === 'in_progress'
              
              return (
                <div 
                  key={stepInstance.id} 
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-xl transition-colors",
                    isCompleted ? "bg-green-500/10 border border-green-500/20" :
                    isInProgress ? "bg-orange-500/10 border border-orange-500/20" :
                    "bg-[#2C2C2E]"
                  )}
                >
                  <div className="text-[#AEAEB2] text-ios-caption-1 w-6 text-center font-medium">
                    {index + 1}
                  </div>
                  
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-sm font-medium", stepInfo.color)}>
                    {isCompleted ? "✓" : stepInfo.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-ios-footnote font-medium truncate">
                      {stepInstance.snapshot.name}
                    </div>
                    {stepInstance.snapshot.description && (
                      <div className="text-[#AEAEB2] text-ios-caption-1 line-clamp-1 mt-0.5">
                        {stepInstance.snapshot.description}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {stepInstance.snapshot.is_required && (
                      <Badge variant="outline" className="text-xs text-red-400 border-red-400/30">
                        Required
                      </Badge>
                    )}
                    
                    {isCompleted && (
                      <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">
                        ✓ Done
                      </Badge>
                    )}
                    
                    {isInProgress && (
                      <Badge variant="outline" className="text-xs text-orange-400 border-orange-400/30">
                        In Progress
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

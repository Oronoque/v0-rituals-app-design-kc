"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Clock,
  MapPin,
  Target,
  GitCommit,
  BarChart3,
  TrendingUp,
  Play,
  GripVertical,
  X,
  AlertTriangle,
} from "lucide-react"
import type { Ritual } from "@/app/types"
import { cn } from "@/lib/utils"

interface RitualCardProps {
  ritual: Ritual
  onStart: () => void
  onShowMetrics: (ritual: Ritual) => void
  onShowChangelog: (ritualId: string) => void
  onRemove?: () => void
  onTimeChange?: (time: string) => void
  showDragHandle?: boolean
  isDragging?: boolean
  showTimeEditor?: boolean
  hasTimeConflict?: boolean
  conflictingRituals?: Ritual[]
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
  const completedSteps = ritual.steps.filter((s) => s.completed).length
  const totalSteps = ritual.steps.length
  const progressPercentage = (completedSteps / totalSteps) * 100

  return (
    <div
      className={cn(
        "ios-card p-4 transition-all duration-200",
        isDragging && "shadow-lg shadow-blue-500/20",
        hasTimeConflict && "border-yellow-500/50 bg-yellow-500/5",
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1">
          {showDragHandle && (
            <div className="cursor-move">
              <GripVertical className="w-4 h-4 text-[#AEAEB2] touch-manipulation" />
            </div>
          )}
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="text-white font-medium text-ios-subhead">{ritual.name}</div>
            <div className="text-[#AEAEB2] text-ios-footnote flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {showTimeEditor && onTimeChange ? (
                <div className="flex items-center space-x-2">
                  <Input
                    type="time"
                    value={ritual.scheduledTime || ""}
                    onChange={(e) => {
                      e.stopPropagation()
                      onTimeChange(e.target.value)
                    }}
                    className={cn(
                      "w-20 h-6 bg-[#3C3C3E] border-[#4C4C4E] text-white text-xs px-2 py-1",
                      hasTimeConflict && "border-yellow-500/50 bg-yellow-500/10",
                    )}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {hasTimeConflict && <AlertTriangle className="w-3 h-3 text-yellow-400" />}
                </div>
              ) : (
                ritual.scheduledTime || "No time set"
              )}
              {ritual.location && (
                <>
                  <MapPin className="w-3 h-3 ml-2 mr-1" />
                  {ritual.location}
                </>
              )}
            </div>
            {hasTimeConflict && conflictingRituals.length > 0 && (
              <div className="text-yellow-400 text-ios-caption-1 mt-1">
                Time conflicts with: {conflictingRituals.map((r) => r.name).join(", ")}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onShowChangelog(ritual.id)
            }}
            className="text-[#AEAEB2] hover:text-purple-400 p-1"
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
            className="text-[#AEAEB2] hover:text-blue-400 p-1"
          >
            <BarChart3 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onShowMetrics(ritual)
            }}
            className="text-[#AEAEB2] hover:text-green-400 p-1"
          >
            <TrendingUp className="w-4 h-4" />
          </Button>
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              className="text-red-400 hover:text-red-300 p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-ios-footnote text-[#AEAEB2]">
          {completedSteps} of {totalSteps} steps completed
        </div>
        <Button
          onClick={onStart}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-ios-footnote"
        >
          <Play className="w-3 h-3 mr-1" />
          Start
        </Button>
      </div>

      <div className="mt-3 w-full bg-[#2C2C2E] rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  )
}

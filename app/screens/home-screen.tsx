"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Calendar, Settings } from "lucide-react"
import { RitualCard } from "@/app/components/ritual-card"
import { BottomNavigation } from "@/app/components/ui/bottom-navigation"
import type { FlowState, Ritual } from "@/app/types"

interface HomeScreenProps {
  rituals: Ritual[]
  onNavigate: (flow: FlowState) => void
  onStartRitual: (index: number) => void
  onShowMetrics: (ritual: Ritual) => void
  onShowChangelog: (ritualId: string) => void
  onRemoveRitual: (ritualId: string) => void
  onUpdateRituals: (rituals: Ritual[]) => void
}

export function HomeScreen({
  rituals,
  onNavigate,
  onStartRitual,
  onShowMetrics,
  onShowChangelog,
  onRemoveRitual,
  onUpdateRituals,
}: HomeScreenProps) {
  const [showTimeEditor, setShowTimeEditor] = useState(false)

  const today = new Date()
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const completedRituals = rituals.filter((r) => r.completed).length
  const totalRituals = rituals.length

  const handleTimeChange = (ritualId: string, time: string) => {
    const updatedRituals = rituals.map((ritual) =>
      ritual.id === ritualId ? { ...ritual, scheduledTime: time } : ritual,
    )
    onUpdateRituals(updatedRituals)
  }

  const detectTimeConflicts = (ritual: Ritual) => {
    if (!ritual.scheduledTime) return { hasConflict: false, conflictingRituals: [] }

    const conflictingRituals = rituals.filter((r) => r.id !== ritual.id && r.scheduledTime === ritual.scheduledTime)

    return {
      hasConflict: conflictingRituals.length > 0,
      conflictingRituals,
    }
  }

  return (
    <div className="min-h-screen bg-[#1C1C1E] text-white flex flex-col ios-safe-area">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div>
          <div className="text-white font-medium text-ios-subhead">Today</div>
          <div className="text-[#AEAEB2] text-ios-footnote">{dateString}</div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTimeEditor(!showTimeEditor)}
            className="text-[#AEAEB2] hover:text-white p-2"
          >
            <Calendar className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("library")}
            className="text-[#AEAEB2] hover:text-white p-2"
          >
            <Plus className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-[#AEAEB2] hover:text-white p-2">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="px-4 pb-4">
        <div className="ios-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-white font-medium text-ios-body">Daily Progress</div>
            <div className="text-[#AEAEB2] text-ios-footnote">
              {completedRituals} of {totalRituals} completed
            </div>
          </div>
          <div className="w-full bg-[#2C2C2E] rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalRituals > 0 ? (completedRituals / totalRituals) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Rituals List */}
      <div className="flex-1 px-4 pb-20">
        {rituals.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#2C2C2E] rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-[#AEAEB2]" />
              </div>
              <h3 className="text-white font-medium text-ios-subhead mb-2">No Rituals Yet</h3>
              <p className="text-[#AEAEB2] text-ios-body mb-6">Add your first ritual to get started</p>
              <Button onClick={() => onNavigate("library")} className="bg-blue-500 hover:bg-blue-600 text-white">
                Browse Library
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {rituals.map((ritual, index) => {
              const { hasConflict, conflictingRituals } = detectTimeConflicts(ritual)

              return (
                <RitualCard
                  key={ritual.id}
                  ritual={ritual}
                  onStart={() => onStartRitual(index)}
                  onShowMetrics={onShowMetrics}
                  onShowChangelog={onShowChangelog}
                  onRemove={() => onRemoveRitual(ritual.id)}
                  onTimeChange={(time) => handleTimeChange(ritual.id, time)}
                  showTimeEditor={showTimeEditor}
                  hasTimeConflict={hasConflict}
                  conflictingRituals={conflictingRituals}
                />
              )
            })}
          </div>
        )}
      </div>

      <BottomNavigation currentFlow="home" onNavigate={onNavigate} />
    </div>
  )
}
